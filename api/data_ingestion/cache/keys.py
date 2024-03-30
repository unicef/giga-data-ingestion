KEY_PREFIX = "ingestion-portal"

SCHEMAS_KEY = f"{KEY_PREFIX}:schemas"


def get_schema_key(name: str) -> str:
    return f"{SCHEMAS_KEY}:{name}"
