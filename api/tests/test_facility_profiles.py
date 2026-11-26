from pathlib import Path

import pytest
from data_ingestion.facility_profiles import (
    FacilityProfileError,
    get_facility_profile,
    load_facility_profiles,
    reset_facility_profiles_for_tests,
)

SEED_DIR = Path(__file__).resolve().parent / "fixtures" / "facility-profiles"


@pytest.fixture(autouse=True)
def _clear_profiles():
    reset_facility_profiles_for_tests()
    yield
    reset_facility_profiles_for_tests()


def test_load_seed_profiles_from_local_dir():
    profiles = load_facility_profiles(local_dir=SEED_DIR)
    assert set(profiles) == {"schools", "health_facilities"}
    schools = profiles["schools"]
    assert schools.facility_type == "school"
    assert schools.paths.dq_directory == "school-geolocation"
    assert schools.portal.approval_label == "School Geolocation"
    assert schools.dagster.enable_connectivity is True

    health = profiles["health_facilities"]
    assert health.facility_type == "health"
    assert health.paths.dq_directory == "health-facility-geolocation"
    assert health.staging_table_full_name.endswith(
        "health_facility_geolocation_staging"
    )


def test_unknown_schema_key_raises():
    load_facility_profiles(local_dir=SEED_DIR)
    # Populate cache via init path used by get_facility_profile
    from data_ingestion.facility_profiles import loader as loader_mod

    loader_mod._PROFILES = load_facility_profiles(local_dir=SEED_DIR)
    with pytest.raises(FacilityProfileError, match="No facility profile"):
        get_facility_profile("libraries")


def test_invalid_yaml_fails(tmp_path: Path):
    bad = tmp_path / "broken.yaml"
    bad.write_text("facility_type: school\npaths: not-a-mapping\n")
    with pytest.raises(FacilityProfileError, match="failed validation"):
        load_facility_profiles(local_dir=tmp_path)


def test_empty_dir_fails(tmp_path: Path):
    with pytest.raises(FacilityProfileError, match="No facility profile"):
        load_facility_profiles(local_dir=tmp_path)
