SCHEMAS_KEY = "schemas"


def get_schema_key(name: str) -> str:
    return f"{SCHEMAS_KEY}:{name}"
