#!/bin/sh

set -eu

poetry install --no-root --no-interaction --no-ansi --with dev
poetry run alembic upgrade head
poetry run python -m scripts.load_fixtures roles approval_requests
poetry run python -m scripts.migrate_blob_metadata --apply

exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 --reload
