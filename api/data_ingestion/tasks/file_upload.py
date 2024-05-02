from datetime import timedelta

from sqlalchemy import update
from sqlalchemy.sql.functions import current_timestamp

from data_ingestion.celery import celery
from data_ingestion.db.primary import sync_get_db_context
from data_ingestion.models import FileUpload
from data_ingestion.models.file_upload import DQStatusEnum


@celery.task(name="data_ingestion.tasks.file_upload_dq_checks_timeout")
def file_upload_dq_checks_timeout():
    with sync_get_db_context() as db:
        db.execute(
            update(FileUpload)
            .values({FileUpload.dq_status: DQStatusEnum.TIMEOUT})
            .where(
                (FileUpload.created < current_timestamp() - timedelta(hours=1))
                & (FileUpload.dataset != "unstructured")
                & (FileUpload.dq_status == DQStatusEnum.IN_PROGRESS)
                & (FileUpload.dq_report_path.is_(None))
            )
        )
