from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.internal import schema_registry
from data_ingestion.models import SchemaDataset
from data_ingestion.schemas.schema_column import SchemaColumn
from data_ingestion.utils.schema import sort_schema_columns_key


async def get_schemas(
    db: AsyncSession,
    background_tasks: BackgroundTasks = None,
    *,
    bypass_cache: bool = False,
) -> list[str] | None:
    del background_tasks, bypass_cache
    return list(
        await db.scalars(
            select(SchemaDataset.key)
            .where(
                SchemaDataset.role != "core",
                SchemaDataset.current_version_id.is_not(None),
            )
            .order_by(SchemaDataset.key)
        )
    )


async def get_schema(
    name: str,
    db: AsyncSession,
    background_tasks: BackgroundTasks = None,
    *,
    is_update: bool = False,
    is_qos: bool = False,
) -> list[SchemaColumn]:
    del background_tasks
    dataset = await schema_registry.get_dataset_by_key(db, name)
    if dataset.role == "member":
        registry_columns = (await schema_registry.get_resolved_schema(db, name)).columns
    else:
        registry_columns = await schema_registry.get_registry_columns(db, name)

    schema: list[SchemaColumn] = []
    for registry_column in registry_columns:
        if registry_column.is_system_generated and not registry_column.primary_key:
            continue
        column_values = registry_column.model_dump()
        column_values["is_nullable"] = registry_column.is_nullable is not False
        schema_column = SchemaColumn(
            id=f"{name}:{registry_column.name}",
            **column_values,
        )
        if "geolocation" in name and schema_column.name == "school_id_giga":
            continue
        if schema_column.is_important is None:
            schema_column.is_important = False
        if schema_column.primary_key is None:
            schema_column.primary_key = False
        if is_qos and schema_column.name == "education_level_govt":
            schema_column.is_nullable = True
        if is_update and schema_column.name != "school_id_govt":
            schema_column.is_nullable = True
        schema.append(schema_column)

    return sorted(schema, key=sort_schema_columns_key)
