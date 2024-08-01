from pydantic import BaseModel, ConfigDict


class SchemaColumn(BaseModel):
    id: str
    name: str
    data_type: str
    is_nullable: bool
    is_important: bool | None
    is_system_generated: bool | None
    description: str | None
    primary_key: bool | None
    partition_order: int | None
    license: str | None
    units: str | None
    hint: str | None

    model_config = ConfigDict(from_attributes=True)
