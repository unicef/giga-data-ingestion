"""
Scalable idempotent migration with batching and parallelization.
MODEL IS NOT MODIFIED.
"""

import asyncio
import json
from datetime import datetime
from typing import Optional

from data_ingestion.db.primary import get_db
from data_ingestion.internal.storage import storage_client
from data_ingestion.models.file_upload import FileUpload
from data_ingestion.utils.data_quality import get_metadata_path
from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

BATCH_SIZE = 100
CONCURRENCY = 10


# ---------------------------------------------------------------------
# Blob processing
# ---------------------------------------------------------------------


async def process_single_upload(upload: FileUpload, dry_run: bool) -> dict:
    upload_path = upload.upload_path
    metadata_file_path = get_metadata_path(upload_path)

    result = {
        "id": upload.id,
        "path": upload_path,
        "status": "success",
        "error": None,
    }

    try:
        loop = asyncio.get_running_loop()

        metadata_client = storage_client.get_blob_client(metadata_file_path)

        exists = await loop.run_in_executor(None, metadata_client.exists)
        if exists:
            result["status"] = "already_exists"
            result["metadata_path"] = metadata_file_path
            return result

        blob_client = storage_client.get_blob_client(upload_path)
        props = await loop.run_in_executor(None, blob_client.get_blob_properties)

        blob_meta = props.metadata or {}
        if not blob_meta:
            result["status"] = "no_metadata"
            return result

        if not dry_run:
            metadata_bytes = json.dumps(blob_meta, indent=2).encode()
            await loop.run_in_executor(
                None,
                lambda: metadata_client.upload_blob(metadata_bytes),
            )

            try:
                await loop.run_in_executor(
                    None,
                    lambda: blob_client.set_blob_metadata(
                        {"metadata_json": metadata_file_path}
                    ),
                )
            except Exception as exc:
                logger.warning(f"Failed to set pointer on {upload_path}: {exc}")

        result["metadata_path"] = metadata_file_path

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)
        logger.error(f"Error processing {upload_path}: {exc}")

    return result


async def update_database_record(
    session: AsyncSession,
    upload_id: str,
    metadata_path: str,
) -> bool:
    try:
        await session.execute(
            update(FileUpload)
            .where(FileUpload.id == upload_id)
            .values(metadata_json_path=metadata_path)
        )
        return True
    except Exception as exc:
        logger.error(f"DB update failed for {upload_id}: {exc}")
        return False


async def commit_batch(session: AsyncSession, batch_num: int) -> bool:
    try:
        await session.commit()
        logger.debug(f"Batch {batch_num}: commit successful")
        return True
    except Exception as exc:
        logger.error(f"Batch {batch_num}: commit failed: {exc}")
        await session.rollback()
        return False


async def process_batch(
    uploads: list[FileUpload],
    session: AsyncSession,
    dry_run: bool,
    batch_num: int,
) -> dict:
    sem = asyncio.Semaphore(CONCURRENCY)

    async def _run(upload: FileUpload):
        async with sem:
            return await process_single_upload(upload, dry_run)

    results = await asyncio.gather(*[_run(u) for u in uploads])

    success = errors = skipped = 0

    for upload, result in zip(uploads, results, strict=False):
        status = result["status"]

        if status in ("success", "already_exists"):
            if not dry_run and "metadata_path" in result:
                if await update_database_record(
                    session,
                    upload.id,
                    result["metadata_path"],
                ):
                    success += 1
                else:
                    errors += 1
            else:
                success += 1

        elif status == "no_metadata":
            skipped += 1

        else:
            errors += 1

    if not dry_run and success > 0:
        if not await commit_batch(session, batch_num):
            errors += success
            success = 0

    return {
        "success": success,
        "errors": errors,
        "skipped": skipped,
        "total": len(uploads),
    }


async def fetch_batch(limit: int, last_id: Optional[str] = None) -> list[dict]:
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        query = (
            select(
                FileUpload.id,
                FileUpload.created,
                FileUpload.country,
                FileUpload.dataset,
                FileUpload.source,
                FileUpload.original_filename,
            )
            .where(FileUpload.metadata_json_path.is_(None))
            .order_by(FileUpload.id)
            .limit(limit)
        )

        if last_id:
            query = query.where(FileUpload.id > last_id)

        result = await session.execute(query)

        return [
            {
                "id": row.id,
                "created": row.created,
                "country": row.country,
                "dataset": row.dataset,
                "source": row.source,
                "original_filename": row.original_filename,
            }
            for row in result.all()
        ]

    finally:
        await db_gen.aclose()


async def get_total_count() -> int:
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        result = await session.execute(
            select(FileUpload.id).where(FileUpload.metadata_json_path.is_(None))
        )
        return len(result.all())
    finally:
        await db_gen.aclose()


# ---------------------------------------------------------------------
# Main migration
# ---------------------------------------------------------------------


async def migrate(dry_run: bool = True, limit: Optional[int] = None):
    start = datetime.now()

    total_success = total_errors = total_skipped = total_processed = 0

    last_id = None
    processed_count = 0

    while True:
        current_limit = BATCH_SIZE
        if limit and (processed_count + BATCH_SIZE > limit):
            current_limit = limit - processed_count

        if current_limit <= 0:
            break

        rows = await fetch_batch(current_limit, last_id)
        if not rows:
            break

        uploads = [
            FileUpload(
                id=row["id"],
                created=row["created"],
                country=row["country"],
                dataset=row["dataset"],
                source=row["source"],
                original_filename=row["original_filename"],
            )
            for row in rows
        ]

        # Update last_id for next batch
        last_id = rows[-1]["id"]

        db_gen = get_db()
        session = await db_gen.__anext__()

        try:
            stats = await process_batch(
                uploads,
                session,
                dry_run,
                (processed_count // BATCH_SIZE) + 1,
            )
        finally:
            await db_gen.aclose()

        total_success += stats["success"]
        total_errors += stats["errors"]
        total_skipped += stats["skipped"]
        # Update our local processed count
        processed_count += len(rows)
        total_processed += stats["total"]

    elapsed = (datetime.now() - start).total_seconds()

    logger.info(
        f"Processed {total_processed} in {elapsed:.1f}s | "
        f"success={total_success}, errors={total_errors}, skipped={total_skipped}"
    )


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--concurrency", type=int, default=10)
    args = parser.parse_args()

    BATCH_SIZE = args.batch_size
    CONCURRENCY = args.concurrency

    asyncio.run(migrate(dry_run=not args.apply, limit=args.limit))
