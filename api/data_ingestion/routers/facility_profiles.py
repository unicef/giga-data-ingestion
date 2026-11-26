from fastapi import APIRouter, Security

from data_ingestion.facility_profiles import (
    get_facility_profiles,
    list_facility_schema_keys,
)
from data_ingestion.internal.auth import azure_scheme

router = APIRouter(
    prefix="/api/facility-profiles",
    tags=["facility-profiles"],
    dependencies=[Security(azure_scheme)],
)


@router.get("")
async def list_profiles():
    """Return loaded facility profile schema keys and portal labels."""
    profiles = get_facility_profiles()
    return [
        {
            "schema_key": key,
            "facility_type": profile.facility_type,
            "approval_label": profile.approval_label,
        }
        for key, profile in sorted(profiles.items())
    ]


@router.get("/keys")
async def list_keys() -> list[str]:
    """Return schema_keys that have a valid ADLS facility profile."""
    return list_facility_schema_keys()
