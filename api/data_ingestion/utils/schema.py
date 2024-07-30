from data_ingestion.schemas.schema import Schema


def sort_schema_columns_key(schema: Schema):
    return -schema.primary_key, schema.is_nullable, -schema.is_important, schema.name
