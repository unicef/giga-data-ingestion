#!/bin/bash

set -euxo pipefail

poetry install --no-root --with dev
poetry run alembic upgrade head

exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
