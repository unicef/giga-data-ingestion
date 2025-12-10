"""
Idempotent migration:
- For each FileUpload with metadata_json_path IS NULL:
  - read Azure blob metadata
  - write sidecar JSON at <upload_path>.metadata.json
  - update DB metadata_json_path
  - set a small pointer on the original blob metadata (optional)
"""

import asyncio
import json

from data_ingestion.db.primary import get_db
from data_ingestion.internal.storage import storage_client
from data_ingestion.models.file_upload import FileUpload
from data_ingestion.utils.data_quality import get_metadata_path
from loguru import logger
from sqlalchemy import select, update


async def migrate(dry_run: bool = True):
    db_gen = get_db()
    session = await db_gen.__anext__()

    try:
        result = await session.execute(
            select(FileUpload).where(FileUpload.metadata_json_path is None)
        )
        rows = result.scalars().all()

        logger.info(f"Found {len(rows)} uploads to migrate")

        for upload in rows:
            upload_path = upload.upload_path
            metadata_file_path = get_metadata_path(upload_path)

            logger.info(f"Processing: {upload.id}  |  {upload_path}")

            blob_client = storage_client.get_blob_client(upload_path)

            props = blob_client.get_blob_properties()
            blob_meta = props.metadata or {}

            if not blob_meta:
                logger.warning(f"No metadata for {upload_path}, skipping")
                continue

            metadata_client = storage_client.get_blob_client(metadata_file_path)
            if metadata_client.exists():
                logger.info(
                    f"Sidecar already exists for {upload_path}; updating DB pointer only"
                )
                if not dry_run:
                    await session.execute(
                        update(FileUpload)
                        .where(FileUpload.id == upload.id)
                        .values(metadata_json_path=metadata_file_path)
                    )
                continue

            metadata_bytes = json.dumps(blob_meta, indent=2).encode()

            if dry_run:
                logger.info(f"[DRY RUN] Would upload sidecar to {metadata_file_path}")
            else:
                metadata_client.upload_blob(metadata_bytes, overwrite=True)

                await session.execute(
                    update(FileUpload)
                    .where(FileUpload.id == upload.id)
                    .values(metadata_json_path=metadata_file_path)
                )

                try:
                    blob_client.set_blob_metadata(
                        metadata={"metadata_json": metadata_file_path}
                    )
                except Exception as exc:
                    logger.warning(
                        f"Failed to set pointer on blob {upload_path}: {exc}"
                    )

        if not dry_run:
            await session.commit()

    finally:
        await db_gen.aclose()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    asyncio.run(migrate(dry_run=not args.apply))
