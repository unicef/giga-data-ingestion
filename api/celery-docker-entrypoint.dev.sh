#!/bin/sh

set -eu

exec poetry run watchmedo auto-restart --directory=./ --pattern="data_ingestion/celery.py;data_ingestion/tasks/*.py" --recursive -- celery -- -A data_ingestion.celery worker --loglevel=DEBUG --concurrency=1 --hostname=celery@%n
