from datetime import timedelta

from celery import Celery

from data_ingestion.settings import settings

celery = Celery(
    "data_ingestion",
    broker=settings.REDIS_QUEUE_URL,
    backend="rpc://",
    include=["data_ingestion.tasks"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    broker_connection_retry_on_startup=True,
    enable_utc=True,
    beat_schedule={
        "update-schemas-list": {
            "task": "data_ingestion.tasks.update_schemas_list",
            "schedule": timedelta(minutes=10),
        },
        "update-schemas": {
            "task": "data_ingestion.tasks.update_schemas",
            "schedule": timedelta(minutes=10),
        },
    },
)


@celery.on_after_finalize.connect
def setup_periodic_tasks(_, **__):
    celery.autodiscover_tasks(["data_ingestion.tasks"], force=True)


if __name__ == "__main__":
    celery.start()
