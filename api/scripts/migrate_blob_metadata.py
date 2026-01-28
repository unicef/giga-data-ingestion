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

        def check_exists():
            return metadata_client.exists()

        exists = await loop.run_in_executor(None, check_exists)

        if exists:
            logger.debug(f"Sidecar exists for {upload_path}")
            result["status"] = "already_exists"
            result["metadata_path"] = metadata_file_path
            return result

        # Get blob metadata
        blob_client = storage_client.get_blob_client(upload_path)

        def get_properties():
            return blob_client.get_blob_properties()

        props = await loop.run_in_executor(None, get_properties)
        blob_meta = props.metadata or {}

        if not blob_meta:
            logger.warning(f"No metadata for {upload_path}")
            result["status"] = "no_metadata"
            return result

        # Upload sidecar JSON
        metadata_bytes = json.dumps(blob_meta, indent=2).encode()

        if not dry_run:

            def upload_metadata():
                return metadata_client.upload_blob(metadata_bytes)

            await loop.run_in_executor(None, upload_metadata)
            logger.debug(f"Uploaded metadata to {metadata_file_path}")

            try:

                def set_metadata():
                    return blob_client.set_blob_metadata(
                        metadata={"metadata_json": metadata_file_path}
                    )

                await loop.run_in_executor(None, set_metadata)
                logger.debug(f"Set metadata pointer on {upload_path}")
            except Exception as exc:
                logger.warning(f"Failed to set pointer on {upload_path}: {exc}")

        result["metadata_path"] = metadata_file_path

    except Exception as exc:
        logger.error(f"Error processing {upload_path}: {exc}")
        result["status"] = "error"
        result["error"] = str(exc)

    return result


async def update_database_record(
    session: AsyncSession, upload_id: int, metadata_path: str
) -> bool:
    """Update a single database record. Returns True if successful."""
    try:
        await session.execute(
            update(FileUpload)
            .where(FileUpload.id == upload_id)
            .values(metadata_json_path=metadata_path)
        )
        return True
    except Exception as exc:
        logger.error(f"Failed to update database for {upload_id}: {exc}")
        return False


async def commit_batch_updates(
    session: AsyncSession, batch_num: int, success_count: int
) -> bool:
    """Commit batch updates. Returns True if successful."""
    try:
        await session.commit()
        logger.debug(f"Batch {batch_num}: Committed {success_count} database updates")
        return True
    except Exception as exc:
        logger.error(f"Batch {batch_num}: Failed to commit: {exc}")
        await session.rollback()
        return False


async def process_single_result(
    upload: FileUpload, result: dict, session: AsyncSession, dry_run: bool
) -> tuple[bool, bool, bool]:
    """
    Process a single result from upload processing.

    Returns: (success, error, skip) tuple of booleans
    """
    status = result.get("status")

    # Handle successful or already existing uploads
    if status in ("success", "already_exists"):
        if "metadata_path" in result and not dry_run:
            return (
                await update_database_record(
                    session, upload.id, result["metadata_path"]
                ),
                False,
                False,
            )
        return (True, False, False)  # Dry-run success

    # Handle no metadata case
    if status == "no_metadata":
        return (False, False, True)

    # Handle errors
    return (False, True, False)


async def process_batch(
    uploads: list[FileUpload], session: AsyncSession, dry_run: bool, batch_num: int
) -> dict:
    """Process a batch of uploads with concurrency control."""

    if not uploads:
        logger.warning(f"Batch {batch_num}: No uploads to process")
        return {"success": 0, "errors": 0, "skipped": 0, "total": 0}

    # Create semaphore to limit concurrency
    sem = asyncio.Semaphore(CONCURRENCY)

    async def process_with_limit(upload):
        async with sem:
            return await process_single_upload(upload, dry_run)

    # Process all uploads in batch concurrently
    results = await asyncio.gather(
        *[process_with_limit(u) for u in uploads], return_exceptions=True
    )

    # Count results
    success_count = 0
    error_count = 0
    skip_count = 0

    for upload, result in zip(uploads, results, strict=False):
        # Handle exceptions
        if isinstance(result, Exception):
            logger.error(f"Exception for upload {upload.id}: {result}")
            error_count += 1
            continue

        # Process the result
        success, error, skip = await process_single_result(
            upload, result, session, dry_run
        )

        if success:
            success_count += 1
        if error:
            error_count += 1
        if skip:
            skip_count += 1

    # Commit batch if needed
    if not dry_run and success_count > 0:
        if not await commit_batch_updates(session, batch_num, success_count):
            error_count += success_count
            success_count = 0

    return {
        "success": success_count,
        "errors": error_count,
        "skipped": skip_count,
        "total": len(uploads),
    }


async def get_total_count() -> int:
    """Get total count of records to migrate."""
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        result = await session.execute(
            select(FileUpload.id).where(FileUpload.metadata_json_path.is_(None))
        )
        return len(result.all())
    finally:
        await db_gen.aclose()


async def fetch_batch(offset: int, limit: int) -> list[dict]:
    """
    Fetch a single batch of records as dictionaries to avoid session issues.

    Returns list of dicts with id and upload_path to avoid detached instance issues.
    """
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        result = await session.execute(
            select(FileUpload.id, FileUpload.upload_path)
            .where(FileUpload.metadata_json_path.is_(None))
            .order_by(FileUpload.id)
            .offset(offset)
            .limit(limit)
        )
        rows = result.all()

        # Convert to list of dicts to avoid session detachment issues
        return [{"id": row[0], "upload_path": row[1]} for row in rows]

    finally:
        await db_gen.aclose()


async def migrate(dry_run: bool = True, limit: int = None):
    """
    Migrate metadata in batches.

    Args:
        dry_run: If True, don't make changes
        limit: Maximum number of records to process (None = all)
    """
    start_time = datetime.now()
    total_success = 0
    total_errors = 0
    total_skipped = 0
    total_processed = 0

    logger.info(f"Starting migration (dry_run={dry_run}, limit={limit})")

    # Get total count
    logger.info("Counting records to migrate...")
    total_count = await get_total_count()

    if limit is not None and limit < total_count:
        total_count = limit

    logger.info(f"Found {total_count:,} uploads to migrate")

    if total_count == 0:
        logger.info("No records to process. Exiting.")
        return

    # Calculate number of batches
    num_batches = (total_count + BATCH_SIZE - 1) // BATCH_SIZE
    logger.info(
        f"Will process {num_batches} batch(es) of up to {BATCH_SIZE} records each"
    )

    # Process each batch with offset/limit
    for batch_num in range(num_batches):
        offset = batch_num * BATCH_SIZE
        batch_limit = min(BATCH_SIZE, total_count - offset)

        logger.info(
            f"Fetching batch {batch_num + 1}/{num_batches}: "
            f"records {offset + 1}-{offset + batch_limit} of {total_count}"
        )

        # Fetch batch data as dicts (avoids session issues)
        try:
            batch_data = await fetch_batch(offset, batch_limit)
        except Exception as exc:
            logger.error(f"Failed to fetch batch {batch_num + 1}: {exc}")
            continue

        if not batch_data:
            logger.warning(f"Batch {batch_num + 1}: No records fetched, stopping")
            break

        # Convert dicts back to FileUpload objects for processing
        batch_uploads = [
            FileUpload(id=row["id"], upload_path=row["upload_path"])
            for row in batch_data
        ]

        logger.info(
            f"Processing batch {batch_num + 1}/{num_batches}: {len(batch_uploads)} records"
        )

        # Get a fresh session for this batch
        db_gen = get_db()
        session = await db_gen.__anext__()

        try:
            # Process batch
            batch_stats = await process_batch(
                batch_uploads, session, dry_run, batch_num + 1
            )

            total_success += batch_stats["success"]
            total_errors += batch_stats["errors"]
            total_skipped += batch_stats["skipped"]
            total_processed += batch_stats["total"]

            logger.info(
                f"Batch {batch_num + 1}/{num_batches} complete: "
                f"{batch_stats['success']} success, "
                f"{batch_stats['errors']} errors, "
                f"{batch_stats['skipped']} skipped"
            )

        except Exception as exc:
            logger.error(
                f"Error processing batch {batch_num + 1}: {exc}", exc_info=True
            )
            # Count all records in this batch as errors
            total_errors += len(batch_uploads)
            total_processed += len(batch_uploads)
            continue

        finally:
            await db_gen.aclose()

    # Final stats
    elapsed = (datetime.now() - start_time).total_seconds()
    success_rate = (total_success / total_processed * 100) if total_processed > 0 else 0

    logger.info(
        f"\n{'='*60}\n"
        f"Migration Summary:\n"
        f"{'='*60}\n"
        f"  Duration:        {elapsed:.1f}s\n"
        f"  Batches:         {num_batches}\n"
        f"  Total processed: {total_processed:,}\n"
        f"  Success:         {total_success:,} ({success_rate:.1f}%)\n"
        f"  Errors:          {total_errors:,}\n"
        f"  Skipped:         {total_skipped:,}\n"
        f"  Rate:            {total_processed/elapsed:.1f} records/sec\n"
        f"{'='*60}"
    )

    if total_errors > 0:
        logger.warning(
            f"\n⚠️  {total_errors} records failed during migration.\n"
            f"Failed records still have NULL metadata_json_path and can be retried.\n"
            f"Review the error logs above for details."
        )

    if total_success > 0 and not dry_run:
        logger.info(f"✓ Successfully migrated {total_success:,} records")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Migrate blob metadata to sidecar JSON files"
    )
    parser.add_argument(
        "--apply", action="store_true", help="Apply changes (default is dry-run mode)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of records to process (useful for testing)",
    )
    parser.add_argument(
        "--batch-size", type=int, default=100, help="Number of records per batch"
    )
    parser.add_argument(
        "--concurrency", type=int, default=10, help="Number of parallel blob operations"
    )
    args = parser.parse_args()

    # Update globals
    BATCH_SIZE = args.batch_size
    CONCURRENCY = args.concurrency

    asyncio.run(migrate(dry_run=not args.apply, limit=args.limit))
