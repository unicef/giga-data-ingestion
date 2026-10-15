import asyncio
from types import SimpleNamespace

import pytest
from data_ingestion.internal import schema_registry
from data_ingestion.internal.schema_registry import (
    _build_apply_statement,
    _duplicate_column_names,
    _validate_placement_columns,
)
from data_ingestion.schemas.schema_registry import RegistryColumn
from fastapi import HTTPException


def _column(name: str) -> RegistryColumn:
    return RegistryColumn(name=name, data_type="string")


def test_duplicate_column_names_rejects_member_shadowing_core():
    duplicates = _duplicate_column_names(
        [_column("facility_id_giga"), _column("latitude")],
        [_column("school_id_govt"), _column("latitude")],
    )

    assert duplicates == ["latitude"]


def test_duplicate_column_names_allows_distinct_core_and_member_columns():
    duplicates = _duplicate_column_names(
        [_column("facility_id_giga"), _column("latitude")],
        [_column("school_id_govt"), _column("education_level_govt")],
    )

    assert duplicates == []


def test_add_statement_uses_whitelisted_proposal_state():
    statement, parameters = _build_apply_statement(
        "facility_core",
        "add",
        "facility_name",
        {"data_type": "string", "is_mandatory": True},
    )

    assert "INSERT INTO schemas.facility_core" in str(statement)
    assert parameters["name"] == "facility_name"
    assert parameters["data_type"] == "string"
    assert parameters["is_mandatory"] is True
    assert parameters["id"]


def test_member_placement_rejects_columns_owned_by_core(monkeypatch):
    core = SimpleNamespace(id="core-id", key="facility_core")

    class FakeDatabase:
        async def scalar(self, _query):
            return core

    columns = {
        "schools": [_column("school_id_govt"), _column("latitude")],
        "facility_core": [_column("facility_id_giga"), _column("latitude")],
    }
    monkeypatch.setattr(
        schema_registry,
        "get_registry_columns",
        lambda key, _trino_db: columns[key],
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            _validate_placement_columns(
                FakeDatabase(),
                object(),
                dataset_key="schools",
                group_id="facilities-id",
                role="member",
            )
        )

    assert error.value.status_code == 409
    assert "latitude" in error.value.detail


def test_core_placement_reports_each_conflicting_member(monkeypatch):
    members = [
        SimpleNamespace(id="schools-id", key="schools"),
        SimpleNamespace(id="health-id", key="health_facilities"),
    ]

    class FakeDatabase:
        async def scalars(self, _query):
            return members

    columns = {
        "facility_core": [
            _column("facility_id_giga"),
            _column("latitude"),
            _column("longitude"),
        ],
        "schools": [_column("school_id_govt"), _column("latitude")],
        "health_facilities": [_column("health_id"), _column("longitude")],
    }
    monkeypatch.setattr(
        schema_registry,
        "get_registry_columns",
        lambda key, _trino_db: columns[key],
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            _validate_placement_columns(
                FakeDatabase(),
                object(),
                dataset_key="facility_core",
                group_id="facilities-id",
                role="core",
            )
        )

    assert error.value.status_code == 409
    assert "schools: latitude" in error.value.detail
    assert "health_facilities: longitude" in error.value.detail
