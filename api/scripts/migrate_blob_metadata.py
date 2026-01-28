"""
Scalable idempotent migration with batching and parallelization.
"""

import asyncio
import json
from datetime import datetime

from data_ingestion.db.primary import get_db
from data_ingestion.internal.storage import storage_client
from data_ingestion.models.file_upload import FileUpload
from data_ingestion.utils.data_quality import get_metadata_path
from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

BATCH_SIZE = 100  # Process 100 records at a time
CONCURRENCY = 10  # Process 10 blobs in parallel


async def process_single_upload(upload: FileUpload, dry_run: bool) -> dict:
    """Process a single upload and return result."""
    upload_path = upload.upload_path
    metadata_file_path = get_metadata_path(upload_path)

    result = {
        "id": upload.id,
        "path": upload_path,
        "status": "success",
        "error": None,
    }

    try:
        # Use asyncio to prevent blocking
        loop = asyncio.get_event_loop()

        # Check if sidecar already exists
        metadata_client = storage_client.get_blob_client(metadata_file_path)
        exists = await loop.run_in_executor(None, metadata_client.exists)

        if exists:
            logger.debug(f"Sidecar exists for {upload_path}")
            result["status"] = "already_exists"
            result["metadata_path"] = metadata_file_path
            return result

        # Get blob metadata
        blob_client = storage_client.get_blob_client(upload_path)
        props = await loop.run_in_executor(None, blob_client.get_blob_properties)
        blob_meta = props.metadata or {}

        if not blob_meta:
            logger.warning(f"No metadata for {upload_path}")
            result["status"] = "no_metadata"
            return result

        # Upload sidecar JSON
        metadata_bytes = json.dumps(blob_meta, indent=2).encode()

        if not dry_run:
            # Define a wrapper function for upload_blob
            def upload_metadata():
                return metadata_client.upload_blob(data=metadata_bytes, overwrite=True)

            await loop.run_in_executor(None, upload_metadata)

            # Set pointer on original blob (best effort)
            try:

                def set_metadata():
                    return blob_client.set_blob_metadata(
                        metadata={"metadata_json": metadata_file_path}
                    )

                await loop.run_in_executor(None, set_metadata)
            except Exception as exc:
                logger.warning(f"Failed to set pointer on {upload_path}: {exc}")

        result["metadata_path"] = metadata_file_path

    except Exception as exc:
        logger.error(f"Error processing {upload_path}: {exc}")
        result["status"] = "error"
        result["error"] = str(exc)

    return result


async def process_batch(
    uploads: list[FileUpload], session: AsyncSession, dry_run: bool
) -> dict:
    """Process a batch of uploads with concurrency control."""

    # Create semaphore to limit concurrency
    sem = asyncio.Semaphore(CONCURRENCY)

    async def process_with_limit(upload):
        async with sem:
            return await process_single_upload(upload, dry_run)

    # Process all uploads in batch concurrently
    results = await asyncio.gather(
        *[process_with_limit(u) for u in uploads], return_exceptions=True
    )

    # Update database for successful uploads
    success_count = 0
    error_count = 0
    skip_count = 0

    for upload, result in zip(uploads, results, strict=False):
        if isinstance(result, Exception):
            logger.error(f"Exception for {upload.id}: {result}")
            error_count += 1
            continue

        if result["status"] in ("success", "already_exists"):
            if "metadata_path" in result and not dry_run:
                await session.execute(
                    update(FileUpload)
                    .where(FileUpload.id == upload.id)
                    .values(metadata_json_path=result["metadata_path"])
                )
            success_count += 1
        elif result["status"] == "no_metadata":
            skip_count += 1
        else:
            error_count += 1

    # Commit batch
    if not dry_run:
        await session.commit()

    return {
        "success": success_count,
        "errors": error_count,
        "skipped": skip_count,
        "total": len(uploads),
    }


async def migrate(dry_run: bool = True, offset: int = 0):
    """
    Migrate metadata in batches.

    Args:
        dry_run: If True, don't make changes
        offset: Skip this many records (for resuming)
    """
    start_time = datetime.now()
    total_success = 0
    total_errors = 0
    total_skipped = 0
    total_processed = 0

    logger.info(f"Starting migration (dry_run={dry_run}, offset={offset})")

    # Get total count first
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        count_result = await session.execute(
            select(FileUpload.id).where(FileUpload.metadata_json_path.is_(None))
        )
        total_count = len(count_result.all())
        logger.info(f"Found {total_count:,} uploads to migrate")

    finally:
        await db_gen.aclose()

    # Process in batches using OFFSET
    current_offset = offset

    while True:
        db_gen = get_db()
        session = await db_gen.__anext__()

        try:
            # Fetch next batch using OFFSET/LIMIT
            # Note: In dry_run mode, records won't be updated so offset works
            # In apply mode, we always use offset=0 since processed records
            # will have metadata_json_path set and be excluded from WHERE clause
            actual_offset = current_offset if dry_run else 0

            result = await session.execute(
                select(FileUpload)
                .where(FileUpload.metadata_json_path.is_(None))
                .order_by(FileUpload.id)
                .offset(actual_offset)
                .limit(BATCH_SIZE)
            )
            batch = result.scalars().all()

            if not batch:
                logger.info("No more records to process")
                break

            logger.info(
                f"Processing batch: offset {actual_offset} "
                f"({total_processed}/{total_count})"
            )

            # Process batch
            batch_stats = await process_batch(batch, session, dry_run)

            total_success += batch_stats["success"]
            total_errors += batch_stats["errors"]
            total_skipped += batch_stats["skipped"]
            total_processed += batch_stats["total"]

            logger.info(
                f"Batch complete: {batch_stats['success']} success, "
                f"{batch_stats['errors']} errors, {batch_stats['skipped']} skipped"
            )

            # Update offset for next batch (only matters in dry_run mode)
            if dry_run:
                current_offset += BATCH_SIZE

        finally:
            await db_gen.aclose()

    # Final stats
    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"\nMigration complete in {elapsed:.1f}s:\n"
        f"  Processed: {total_processed:,}\n"
        f"  Success:   {total_success:,}\n"
        f"  Errors:    {total_errors:,}\n"
        f"  Skipped:   {total_skipped:,}\n"
        f"  Rate:      {total_processed / elapsed:.1f} records/sec"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply", action="store_true", help="Apply changes (default is dry-run)"
    )
    parser.add_argument(
        "--offset", type=int, default=0, help="Skip N records (for resuming dry-runs)"
    )
    parser.add_argument("--batch-size", type=int, default=100, help="Records per batch")
    parser.add_argument(
        "--concurrency", type=int, default=10, help="Parallel blob operations"
    )
    args = parser.parse_args()

    # Update globals
    BATCH_SIZE = args.batch_size
    CONCURRENCY = args.concurrency

    asyncio.run(migrate(dry_run=not args.apply, offset=args.offset))
