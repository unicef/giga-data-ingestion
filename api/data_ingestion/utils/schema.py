from data_ingestion.schemas.schema_column import SchemaColumn


def sort_schema_columns_key(schema: SchemaColumn):
    return -schema.primary_key, schema.is_nullable, -schema.is_important, schema.name
