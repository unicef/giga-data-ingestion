"""One-time backfill: register every existing `schemas.<dataset>` Delta table
in the schema registry, and merge in the DQ-config facts that today live
outside Delta, so they land on the (already `extend_schema_tables.py`-widened)
Delta row instead of a second Postgres copy.

Confirmed sources (checked against the giga-dagster codebase directly, not
just the handoff doc, which mis-described a couple of these):

- is_mandatory / is_unique / domain_values / range_min / range_max /
  precision_min come from `giga-dagster/dagster/src/spark/config_expectations.py`
  (a hardcoded, per-dataset-type Python config: NONEMPTY_COLUMNS_<TYPE>,
  UNIQUE_COLUMNS_<TYPE>, VALUES_DOMAIN_<TYPE>, VALUES_RANGE_<TYPE>,
  PRECISION) — NOT a NocoDB "ColumnChecksConfig" table; no such table exists
  in this codebase.
- dynamic_max: two VALUES_RANGE_MASTER columns (`school_establishment_year`,
  `school_data_collection_year`) use `self.current_year` as their max instead
  of a fixed number — those get `dynamic_max="current_year"` and a null
  range_max, rather than baking in this run's current year as a literal.
- critical_for comes from NocoDB table `SchoolGeolocationMasterDQChecks`,
  column "Critical For" (values "always"/"create_only"), matched against
  "DQ Table Column Name" entries of the form `dq_is_null_mandatory-<column>`
  (see giga-dagster's data_quality_checks/critical.py) — only meaningful for
  master/geolocation datasets.

OPEN ITEMS before running this for real:
  1. `dataset_type` inference below (`_infer_dataset_type`) is a best-effort
     guess from the dataset key and needs review against the actual set of
     `schemas.*` tables before this is trusted.
  2. This script imports `config_expectations` from a sibling giga-dagster
     checkout (via --dagster-path / GIGA_DAGSTER_PATH) — that module is a
     pydantic BaseSettings instantiated at import time, so it may need
     giga-dagster's own env vars available to import cleanly. If it doesn't
     import standalone, export the four dicts + PRECISION by hand instead.

Usage: python -m scripts.backfill_dataset_registry [--dagster-path PATH]
"""

import argparse
import asyncio
import os
import re
import sys
from pathlib import Path

from data_ingestion.db.primary import get_db_context
from data_ingestion.db.trino import get_db_context as get_trino_db_context
from data_ingestion.internal.schema import get_schemas
from data_ingestion.internal.schema_registry import create_dataset
from data_ingestion.utils.nocodb import (
    get_nocodb_table_as_pandas_dataframe,
    get_nocodb_table_id_from_name,
)
from loguru import logger
from sqlalchemy import text

# Real `schemas.*` tables only — not the is_qos/is_update pseudo-variants
# get_schemas() adds for the upload-flow overlay (see routers/schema.py).
_PSEUDO_VARIANTS = {"school_geolocation_qos", "school_geolocation_update"}

_CRITICAL_COLUMN_RE = re.compile(r"^dq_is_null_mandatory-(?P<column>.+)$")


def _infer_dataset_type(dataset_key: str) -> str:
    # TODO: review against the real set of schemas.* tables — this is a guess.
    if dataset_key == "school_geolocation":
        return "geolocation"
    if dataset_key.startswith("coverage_fb"):
        return "coverage_fb"
    if dataset_key.startswith("coverage_itu"):
        return "coverage_itu"
    if dataset_key.startswith("coverage"):
        return "coverage"
    if dataset_key.startswith("qos"):
        return "qos"
    if dataset_key.startswith("reference"):
        return "reference"
    return "master"


def _load_config_expectations(dagster_path: str):
    sys.path.insert(0, str(Path(dagster_path) / "dagster"))
    from src.spark.config_expectations import config  # noqa: PLC0415

    return config


def _build_dq_config(config, dataset_type: str) -> dict[str, dict]:
    unique_cols = getattr(config, f"UNIQUE_COLUMNS_{dataset_type.upper()}", [])
    nonempty_cols = getattr(config, f"NONEMPTY_COLUMNS_{dataset_type.upper()}", [])
    domain = getattr(config, f"VALUES_DOMAIN_{dataset_type.upper()}", {})
    value_range = getattr(config, f"VALUES_RANGE_{dataset_type.upper()}", {})
    precision = getattr(config, "PRECISION", {})
    current_year = getattr(config, "current_year", object())

    per_column: dict[str, dict] = {}

    def col(name: str) -> dict:
        return per_column.setdefault(name, {})

    for name in unique_cols:
        col(name)["is_unique"] = True
    for name in nonempty_cols:
        col(name)["is_mandatory"] = True
    for name, values in domain.items():
        col(name)["domain_values"] = "|".join(str(v) for v in values)
    for name, bounds in value_range.items():
        col(name)["range_min"] = bounds.get("min")
        if bounds.get("max") == current_year:
            col(name)["dynamic_max"] = "current_year"
        else:
            col(name)["range_max"] = bounds.get("max")
    for name, bounds in precision.items():
        col(name)["precision_min"] = bounds.get("min")

    return per_column


def _load_critical_for_mapping() -> dict[str, str]:
    table_id = get_nocodb_table_id_from_name("SchoolGeolocationMasterDQChecks")
    df = get_nocodb_table_as_pandas_dataframe(table_id=table_id)
    mapping = {}
    for _, row in df.iterrows():
        critical_for = row.get("Critical For")
        if critical_for not in ("always", "create_only"):
            continue
        match = _CRITICAL_COLUMN_RE.match(str(row.get("DQ Table Column Name", "")))
        if match:
            mapping[match.group("column")] = critical_for
    return mapping


async def main(dagster_path: str):
    config = _load_config_expectations(dagster_path)
    critical_for_mapping = _load_critical_for_mapping()

    with get_trino_db_context() as trino_db:
        schema_names = await get_schemas(trino_db)
        dataset_keys = [n for n in schema_names if n not in _PSEUDO_VARIANTS]

        async with get_db_context() as db:
            for dataset_key in dataset_keys:
                try:
                    await create_dataset(db, key=dataset_key, group_id=None)
                    logger.info(f"Registered dataset {dataset_key}")
                except Exception:  # noqa: BLE001 - already registered, keep going
                    logger.info(f"Dataset {dataset_key} already registered, skipping")

                dataset_type = _infer_dataset_type(dataset_key)
                dq_config = _build_dq_config(config, dataset_type)

                column_names = (
                    trino_db.execute(
                        text(f"SELECT name FROM schemas.{dataset_key}")  # nosec B608
                    )
                    .scalars()
                    .all()
                )

                for column_name in column_names:
                    updates = dict(dq_config.get(column_name, {}))
                    if dataset_type in ("master", "geolocation"):
                        critical_for = critical_for_mapping.get(column_name)
                        if critical_for:
                            updates["critical_for"] = critical_for
                    if not updates:
                        continue

                    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
                    trino_db.execute(
                        text(
                            f"UPDATE schemas.{dataset_key} SET {set_clause} "  # nosec B608
                            f"WHERE name = :name"
                        ),
                        {**updates, "name": column_name},
                    )
                trino_db.commit()
                logger.info(f"Backfilled DQ config for schemas.{dataset_key}")

    logger.info("Backfill complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dagster-path",
        default=os.environ.get("GIGA_DAGSTER_PATH", "../giga-dagster"),
    )
    args = parser.parse_args()
    asyncio.run(main(args.dagster_path))
