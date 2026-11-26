"""Load facility profiles from ADLS (or a local directory for tests)."""

from __future__ import annotations

from pathlib import Path

import yaml
from loguru import logger
from pydantic import ValidationError

from data_ingestion.facility_profiles.schema import FacilityProfile

_PROFILES: dict[str, FacilityProfile] | None = None


class FacilityProfileError(RuntimeError):
    """Raised when facility profiles cannot be loaded or validated."""


def _parse_profile(schema_key: str, raw: str | bytes) -> FacilityProfile:
    try:
        data = yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        raise FacilityProfileError(
            f"Invalid YAML in facility profile '{schema_key}': {exc}"
        ) from exc
    if not isinstance(data, dict):
        raise FacilityProfileError(
            f"Facility profile '{schema_key}' must be a YAML mapping"
        )
    try:
        return FacilityProfile(schema_key=schema_key, **data)
    except ValidationError as exc:
        raise FacilityProfileError(
            f"Facility profile '{schema_key}' failed validation:\n{exc}"
        ) from exc


def _load_from_local_dir(directory: Path) -> dict[str, FacilityProfile]:
    if not directory.is_dir():
        raise FacilityProfileError(
            f"Facility profiles local directory does not exist: {directory}"
        )
    profiles: dict[str, FacilityProfile] = {}
    for path in sorted(directory.glob("*.yaml")):
        schema_key = path.stem
        if schema_key in profiles:
            raise FacilityProfileError(
                f"Duplicate facility profile schema_key '{schema_key}'"
            )
        profiles[schema_key] = _parse_profile(schema_key, path.read_text())
    if not profiles:
        raise FacilityProfileError(
            f"No facility profile YAML files found under {directory}"
        )
    return profiles


def _load_from_adls(prefix: str) -> dict[str, FacilityProfile]:
    from data_ingestion.internal.storage import storage_client

    normalized = prefix.strip("/")
    if normalized and not normalized.endswith("/"):
        list_prefix = f"{normalized}/"
    else:
        list_prefix = normalized

    profiles: dict[str, FacilityProfile] = {}
    found_any = False
    for blob in storage_client.list_blobs(name_starts_with=list_prefix):
        name = blob.name
        if not name.endswith(".yaml"):
            continue
        # Only direct children of the prefix (not nested folders).
        relative = name[len(list_prefix) :] if list_prefix else name
        if "/" in relative:
            continue
        found_any = True
        schema_key = Path(relative).stem
        if schema_key in profiles:
            raise FacilityProfileError(
                f"Duplicate facility profile schema_key '{schema_key}'"
            )
        raw = storage_client.get_blob_client(name).download_blob().readall()
        profiles[schema_key] = _parse_profile(schema_key, raw)

    if not found_any or not profiles:
        raise FacilityProfileError(
            f"No facility profile YAML files found under ADLS path "
            f"'{list_prefix or '/'}'. Upload profiles before starting the API."
        )
    return profiles


def load_facility_profiles(
    *,
    local_dir: Path | None = None,
    adls_prefix: str | None = None,
) -> dict[str, FacilityProfile]:
    """Load and validate all facility profiles. Raises on any error."""
    directory = local_dir
    if directory is None:
        from data_ingestion.settings import settings

        if settings.FACILITY_PROFILES_LOCAL_DIR:
            directory = Path(settings.FACILITY_PROFILES_LOCAL_DIR)
    if directory is not None:
        logger.info(f"Loading facility profiles from local directory {directory}")
        return _load_from_local_dir(directory)

    from data_ingestion.settings import settings

    prefix = adls_prefix or settings.FACILITY_PROFILES_ADLS_PREFIX
    logger.info(f"Loading facility profiles from ADLS prefix '{prefix}'")
    return _load_from_adls(prefix)


def init_facility_profiles() -> dict[str, FacilityProfile]:
    """Load profiles into the process cache. Call once at API startup."""
    global _PROFILES
    _PROFILES = load_facility_profiles()
    logger.info("Loaded facility profiles: " + ", ".join(sorted(_PROFILES)))
    return _PROFILES


def get_facility_profiles() -> dict[str, FacilityProfile]:
    if _PROFILES is None:
        raise FacilityProfileError(
            "Facility profiles have not been loaded. "
            "Call init_facility_profiles() at startup."
        )
    return _PROFILES


def get_facility_profile(schema_key: str) -> FacilityProfile:
    profiles = get_facility_profiles()
    try:
        return profiles[schema_key]
    except KeyError as exc:
        raise FacilityProfileError(
            f"No facility profile for schema_key '{schema_key}'. "
            f"Known keys: {sorted(profiles)}"
        ) from exc


def has_facility_profile(schema_key: str) -> bool:
    return schema_key in get_facility_profiles()


def list_facility_schema_keys() -> list[str]:
    return sorted(get_facility_profiles())


def reset_facility_profiles_for_tests() -> None:
    """Clear the process cache (unit tests only)."""
    global _PROFILES
    _PROFILES = None
