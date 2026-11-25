import asyncio
from types import SimpleNamespace

import pytest
from data_ingestion.internal import schema_registry
from data_ingestion.internal.schema_registry import (
    _duplicate_column_names,
    _primary_key_names,
    _validate_placement_columns,
    apply_column_change,
    get_dataset_lifecycle_preview,
    get_promotion_preview,
    get_proposal_diff,
    get_registry_columns,
    parse_csv_import,
    plan_primary_key_change,
    plan_primary_key_snapshot,
)
from data_ingestion.schemas.schema_registry import RegistryColumn
from fastapi import HTTPException


def _column(name: str) -> RegistryColumn:
    return RegistryColumn(name=name, data_type="string")


def _pk(name: str) -> RegistryColumn:
    return RegistryColumn(name=name, data_type="string", primary_key=True)


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


def test_apply_column_change_moves_the_primary_key():
    columns = apply_column_change(
        [
            RegistryColumn(
                name="facility_id_govt", data_type="string", primary_key=True
            ),
            _column("facility_id_giga"),
        ],
        "edit",
        "facility_id_giga",
        {"primary_key": True},
    )

    assert columns[0].primary_key is False
    assert columns[1].primary_key is True


def _group_columns() -> dict[str, list[RegistryColumn]]:
    return {
        "facility_core": [_pk("facility_id_giga"), _column("latitude")],
        "schools": [_column("school_id_govt"), _column("education_level")],
        "health_facilities": [_column("facility_type")],
    }


def test_core_primary_key_is_the_only_key_for_every_member():
    plan = plan_primary_key_change(
        dataset_key="facility_core",
        core_key="facility_core",
        columns_by_key={
            "facility_core": [_column("facility_id_giga")],
            "schools": [_pk("school_id_govt")],
            "health_facilities": [_pk("facility_type")],
        },
        proposal_type="edit",
        column_name="facility_id_giga",
        after_state={"primary_key": True},
        replacements={},
    )

    assert plan.valid
    assert _primary_key_names(plan.snapshots["facility_core"]) == ["facility_id_giga"]
    assert _primary_key_names(plan.snapshots["schools"]) == []
    assert _primary_key_names(plan.snapshots["health_facilities"]) == []


def test_member_primary_key_clears_the_core_and_asks_for_the_other_member():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="school_id_govt",
        after_state={"primary_key": True},
        replacements={},
    )

    assert not plan.valid
    assert plan.core_choice is None
    assert [choice.dataset_key for choice in plan.schema_choices] == [
        "health_facilities"
    ]
    assert "health_facilities" in (plan.message or "")


def test_replacement_on_the_other_member_leaves_one_key_each():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="school_id_govt",
        after_state={"primary_key": True},
        replacements={"health_facilities": "facility_type"},
    )

    assert plan.valid
    assert _primary_key_names(plan.snapshots["facility_core"]) == []
    assert _primary_key_names(plan.snapshots["schools"]) == ["school_id_govt"]
    assert _primary_key_names(plan.snapshots["health_facilities"]) == ["facility_type"]


def test_clearing_the_core_key_offers_a_core_column_or_one_per_member():
    plan = plan_primary_key_change(
        dataset_key="facility_core",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="facility_id_giga",
        after_state={"primary_key": False},
        replacements={},
    )

    assert not plan.valid
    assert plan.core_choice is not None
    assert plan.core_choice.columns == ("latitude",)
    assert {choice.dataset_key for choice in plan.schema_choices} == {
        "schools",
        "health_facilities",
    }


def test_replacement_on_the_core_covers_every_member():
    plan = plan_primary_key_change(
        dataset_key="facility_core",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="facility_id_giga",
        after_state={"primary_key": False},
        replacements={"facility_core": "latitude"},
    )

    assert plan.valid
    assert _primary_key_names(plan.snapshots["facility_core"]) == ["latitude"]
    assert _primary_key_names(plan.snapshots["schools"]) == []
    assert _primary_key_names(plan.snapshots["health_facilities"]) == []


def test_core_and_member_cannot_both_gain_a_primary_key():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="school_id_govt",
        after_state={"primary_key": True},
        replacements={"facility_core": "latitude"},
    )

    assert not plan.valid
    assert plan.schema_choices == ()
    assert plan.core_choice is None


def test_standalone_schema_keeps_one_primary_key():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key=None,
        columns_by_key={"schools": [_pk("school_id"), _column("school_name")]},
        proposal_type="edit",
        column_name="school_id",
        after_state={"primary_key": False},
        replacements={},
    )

    assert not plan.valid
    assert plan.schema_choices[0].columns == ("school_name",)

    moved = plan_primary_key_change(
        dataset_key="schools",
        core_key=None,
        columns_by_key={"schools": [_pk("school_id"), _column("school_name")]},
        proposal_type="edit",
        column_name="school_id",
        after_state={"primary_key": False},
        replacements={"schools": "school_name"},
    )

    assert moved.valid
    assert _primary_key_names(moved.snapshots["schools"]) == ["school_name"]


def test_members_without_a_core_do_not_share_a_primary_key():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key=None,
        columns_by_key={
            "schools": [_pk("school_id"), _column("school_name")],
            "health_facilities": [_column("facility_type")],
        },
        proposal_type="edit",
        column_name="school_name",
        after_state={"description": "Name"},
        replacements={},
    )

    assert plan.valid


def test_import_rejects_two_primary_keys_on_one_schema():
    plan = plan_primary_key_snapshot(
        dataset_key="schools",
        core_key=None,
        columns_by_key={"schools": [_column("school_id")]},
        imported_columns=[_pk("school_id"), _pk("school_name")],
    )

    assert not plan.valid
    assert "more than one primary key" in (plan.message or "")


def test_importing_a_member_key_leaves_the_other_member_without_one():
    plan = plan_primary_key_snapshot(
        dataset_key="schools",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        imported_columns=[_pk("school_id_govt"), _column("education_level")],
    )

    assert not plan.valid
    assert "health_facilities" in (plan.message or "")


def test_a_core_key_already_in_place_allows_an_unrelated_edit():
    plan = plan_primary_key_change(
        dataset_key="schools",
        core_key="facility_core",
        columns_by_key=_group_columns(),
        proposal_type="edit",
        column_name="school_id_govt",
        after_state={"description": "Government id"},
        replacements={},
    )

    assert plan.valid
    assert _primary_key_names(plan.snapshots["facility_core"]) == ["facility_id_giga"]


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
        proposal_type="add",
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
        proposal_type="edit",
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
