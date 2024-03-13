#!/bin/sh

set -eu

poetry install --no-root --no-interaction --no-ansi --with dev
poetry run alembic upgrade head
poetry run python -m scripts.load_fixtures qos_school_list qos_school_connectivity

exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
