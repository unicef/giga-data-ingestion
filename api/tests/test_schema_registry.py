import asyncio
from types import SimpleNamespace

import pytest
from data_ingestion.internal import schema_registry
from data_ingestion.internal.schema_registry import (
    _duplicate_column_names,
    _validate_placement_columns,
    apply_column_change,
    get_dataset_lifecycle_preview,
    get_promotion_preview,
    get_proposal_diff,
    get_registry_columns,
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


def test_apply_column_change_accepts_complete_promoted_column_state():
    promoted_column = _column("facility_name").model_dump()

    columns = apply_column_change(
        [_column("facility_id_giga")],
        "add",
        "facility_name",
        promoted_column,
    )

    assert [column.name for column in columns] == [
        "facility_id_giga",
        "facility_name",
    ]


def test_proposal_diff_builds_complete_added_column_from_partial_state():
    proposal = SimpleNamespace(
        column_name="facility_name",
        before_state=None,
        after_state={"data_type": "string", "is_mandatory": True},
    )

    changes = asyncio.run(get_proposal_diff(proposal))

    assert {change.field: change.after for change in changes} == {
        "name": "facility_name",
        "data_type": "string",
        "is_mandatory": True,
    }


def test_proposal_diff_merges_partial_edit_with_existing_column():
    proposal = SimpleNamespace(
        column_name="facility_name",
        before_state=_column("facility_name").model_dump(),
        after_state={"description": "Updated description"},
    )

    changes = asyncio.run(get_proposal_diff(proposal))

    assert len(changes) == 1
    assert changes[0].field == "description"
    assert changes[0].before is None
    assert changes[0].after == "Updated description"


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


def test_promotion_preview_coordinates_identical_owners(monkeypatch):
    source = SimpleNamespace(
        id="schools-id",
        key="schools",
        name="Schools",
        role="member",
        group_id="facilities-id",
    )
    health = SimpleNamespace(
        id="health-id",
        key="health",
        name="Health facilities",
        role="member",
        group_id="facilities-id",
    )
    core = SimpleNamespace(id="core-id", key="facility_core")
    promoted_column = RegistryColumn(
        name="latitude",
        data_type="double",
        is_mandatory=True,
    )

    class FakeDatabase:
        async def scalars(self, _query):
            return [health, source]

        async def scalar(self, _query):
            return None

    async def get_dataset(_db, key):
        assert key == source.key
        return source

    async def get_core(_db, _dataset):
        return core

    async def get_column(_db, dataset_key, column_name):
        assert column_name == promoted_column.name
        if dataset_key == core.key:
            return None
        return promoted_column

    async def get_version(_db, _dataset):
        return 2

    monkeypatch.setattr(schema_registry, "get_dataset_by_key", get_dataset)
    monkeypatch.setattr(schema_registry, "get_group_core", get_core)
    monkeypatch.setattr(schema_registry, "get_registry_column", get_column)
    monkeypatch.setattr(schema_registry, "get_current_version_number", get_version)

    preview = asyncio.run(
        get_promotion_preview(
            FakeDatabase(),
            source.key,
            promoted_column.name,
        )
    )

    assert preview.can_promote is True
    assert preview.blockers == []
    assert [owner.key for owner in preview.owners] == ["health", "schools"]
    assert all(owner.definition_matches for owner in preview.owners)
    assert preview.affected_member_keys == ["health", "schools"]


def test_promotion_preview_blocks_divergent_owner(monkeypatch):
    source = SimpleNamespace(
        id="schools-id",
        key="schools",
        name="Schools",
        role="member",
        group_id="facilities-id",
    )
    health = SimpleNamespace(
        id="health-id",
        key="health",
        name="Health facilities",
        role="member",
        group_id="facilities-id",
    )
    core = SimpleNamespace(id="core-id", key="facility_core")

    class FakeDatabase:
        async def scalars(self, _query):
            return [health, source]

        async def scalar(self, _query):
            return None

    async def get_dataset(_db, _key):
        return source

    async def get_core(_db, _dataset):
        return core

    async def get_column(_db, dataset_key, _column_name):
        if dataset_key == core.key:
            return None
        if dataset_key == health.key:
            return RegistryColumn(name="latitude", data_type="float")
        return RegistryColumn(name="latitude", data_type="double")

    async def get_version(_db, _dataset):
        return 1

    monkeypatch.setattr(schema_registry, "get_dataset_by_key", get_dataset)
    monkeypatch.setattr(schema_registry, "get_group_core", get_core)
    monkeypatch.setattr(schema_registry, "get_registry_column", get_column)
    monkeypatch.setattr(schema_registry, "get_current_version_number", get_version)

    preview = asyncio.run(get_promotion_preview(FakeDatabase(), source.key, "latitude"))

    assert preview.can_promote is False
    assert preview.owners[0].definition_matches is False
    assert preview.owners[0].differences[0].field == "data_type"
    assert "defines latitude differently" in preview.blockers[0]


@pytest.mark.parametrize(
    ("scalar_results", "can_archive", "can_delete"),
    [
        ([0, 0, 0, 0, 0, 0, 0], True, True),
        ([0, 1, 0, 1, 0, 0, 0], False, False),
    ],
)
def test_dataset_lifecycle_eligibility(
    monkeypatch, scalar_results, can_archive, can_delete
):
    dataset = SimpleNamespace(
        id="dataset-id",
        key="draft",
        role="member",
        group_id=None,
        archived_at=None,
    )

    class FakeDatabase:
        def __init__(self):
            self.results = iter(scalar_results)

        async def scalar(self, _query):
            return next(self.results)

    async def get_dataset(_db, _key, *, include_archived):
        assert include_archived is True
        return dataset

    monkeypatch.setattr(schema_registry, "get_dataset_by_key", get_dataset)

    preview = asyncio.run(get_dataset_lifecycle_preview(FakeDatabase(), dataset.key))

    assert preview.can_archive is can_archive
    assert preview.can_delete is can_delete


def test_archived_schema_version_remains_available_for_historical_resolution(
    monkeypatch,
):
    archived_dataset = SimpleNamespace(
        id="dataset-id",
        key="archived-schema",
        archived_at=object(),
    )
    stored_column = SimpleNamespace(
        **{
            field: getattr(_column("facility_id"), field)
            for field in schema_registry.REGISTRY_COLUMN_FIELDS
        }
    )

    async def get_dataset(_db, key, *, include_archived):
        assert key == archived_dataset.key
        assert include_archived is True
        return archived_dataset

    async def get_version(_db, dataset, *, version):
        assert dataset is archived_dataset
        assert version == 1
        return SimpleNamespace(columns=[stored_column])

    monkeypatch.setattr(schema_registry, "get_dataset_by_key", get_dataset)
    monkeypatch.setattr(schema_registry, "get_schema_version", get_version)

    columns = asyncio.run(
        get_registry_columns(
            object(),
            archived_dataset.key,
            as_of_version=1,
        )
    )

    assert [column.name for column in columns] == ["facility_id"]
