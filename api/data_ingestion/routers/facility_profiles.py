from fastapi import APIRouter, HTTPException, Security, status

from data_ingestion.facility_profiles import (
    FacilityProfileError,
    get_facility_profile,
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


@router.get("/{schema_key}")
async def get_profile(schema_key: str):
    """Return one facility profile (portal section includes upload metadata form)."""
    try:
        profile = get_facility_profile(schema_key)
    except FacilityProfileError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return {
        "schema_key": profile.schema_key,
        "facility_type": profile.facility_type,
        "dataset_type": profile.dataset_type,
        "portal": profile.portal.model_dump(),
    }
