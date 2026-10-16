import asyncio
from types import SimpleNamespace

import pytest
from data_ingestion.internal import schema_registry
from data_ingestion.internal.schema_registry import (
    _duplicate_column_names,
    _validate_placement_columns,
    apply_column_change,
    parse_csv_import,
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


def test_apply_column_change_adds_column_to_snapshot():
    columns = apply_column_change(
        [_column("facility_id_giga")],
        "add",
        "facility_name",
        {"data_type": "string", "is_mandatory": True},
    )

    assert [column.name for column in columns] == [
        "facility_id_giga",
        "facility_name",
    ]
    assert columns[1].is_mandatory is True


def test_csv_import_builds_complete_snapshot_and_accepts_int_alias():
    columns, result = parse_csv_import(
        (
            b"name,data_type,is_nullable,is_mandatory\n"
            b"school_id_govt,string,false,true\n"
            b"school_count,int,true,false\n"
        ),
        [],
        {},
    )

    assert result.created == 2
    assert result.errors == []
    assert columns[1].data_type == "integer"


def test_csv_import_reports_inherited_and_duplicate_columns():
    _, result = parse_csv_import(
        (
            b"name,data_type\n"
            b"latitude,double\n"
            b"school_name,string\n"
            b"school_name,string\n"
        ),
        [],
        {"latitude": "facility_core"},
    )

    assert len(result.errors) == 2
    assert "facility_core" in result.errors[0].detail
    assert "more than once" in result.errors[1].detail


def test_member_placement_rejects_columns_owned_by_core(monkeypatch):
    core = SimpleNamespace(id="core-id", key="facility_core")

    class FakeDatabase:
        async def scalar(self, _query):
            return core

    columns = {
        "schools": [_column("school_id_govt"), _column("latitude")],
        "facility_core": [_column("facility_id_giga"), _column("latitude")],
    }

    async def get_columns(_db, key):
        return columns[key]

    monkeypatch.setattr(schema_registry, "get_registry_columns", get_columns)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            _validate_placement_columns(
                FakeDatabase(),
                dataset=SimpleNamespace(key="schools"),
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

    async def get_columns(_db, key):
        return columns[key]

    monkeypatch.setattr(schema_registry, "get_registry_columns", get_columns)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            _validate_placement_columns(
                FakeDatabase(),
                dataset=SimpleNamespace(key="facility_core"),
                group_id="facilities-id",
                role="core",
            )
        )

    assert error.value.status_code == 409
    assert "schools: latitude" in error.value.detail
    assert "health_facilities: longitude" in error.value.detail
