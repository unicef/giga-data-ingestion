from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SchemaColumn(BaseModel):
    id: str
    name: str
    data_type: str
    is_nullable: bool
    is_important: Optional[bool] = Field(default=None)
    is_system_generated: Optional[bool] = Field(default=None)
    description: Optional[str] = Field(default=None)
    primary_key: Optional[bool] = Field(default=None)
    partition_order: Optional[int] = Field(default=None)
    license: Optional[str] = Field(default=None)
    units: Optional[str] = Field(default=None)
    hint: Optional[str] = Field(default=None)

    model_config = ConfigDict(from_attributes=True)
