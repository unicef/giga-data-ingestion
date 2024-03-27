from pydantic import UUID4
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class Schema(BaseModel):
    __tablename__ = "schemas"

    id: Mapped[UUID4] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    data_type: Mapped[str] = mapped_column()
    is_nullable: Mapped[bool] = mapped_column()
    is_important: Mapped[bool] = mapped_column()
    description: Mapped[str] = mapped_column(nullable=True)
    primary_key: Mapped[bool] = mapped_column(nullable=True)
    partition_order: Mapped[int] = mapped_column(nullable=True)
    license: Mapped[str] = mapped_column()
    units: Mapped[str] = mapped_column()
    hint: Mapped[str] = mapped_column()
