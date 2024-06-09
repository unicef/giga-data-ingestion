from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

user_role_association_table = Table(
    "user_role_association_table",
    BaseModel.metadata,
    Column("user_id", ForeignKey("users.id")),
    Column("role_id", ForeignKey("roles.id")),
)


class User(BaseModel):
    __tablename__ = "users"

    sub: Mapped[str] = mapped_column(nullable=False, index=True, unique=True)
    email: Mapped[str] = mapped_column(nullable=False, index=True, unique=True)
    enabled: Mapped[bool] = mapped_column(default=True)
    roles: Mapped[list["Role"]] = relationship(
        secondary=user_role_association_table, back_populates="users"
    )


class Role(BaseModel):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(nullable=False, index=True, unique=True)
    users: Mapped[list[User]] = relationship(
        secondary=user_role_association_table, back_populates="roles"
    )
