#!/bin/sh

set -eu

exec poetry run watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- celery -- -A data_ingestion.celery beat
