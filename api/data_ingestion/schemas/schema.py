from pydantic import BaseModel, ConfigDict


class Schema(BaseModel):
    name: str
    data_type: str
    is_nullable: bool
    description: str | None
    primary_key: bool | None
    partition_order: int | None

    model_config = ConfigDict(from_attributes=True)
