#!/bin/sh

set -eu

poetry install --no-root --no-interaction --no-ansi --with dev
poetry run alembic upgrade head

exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
