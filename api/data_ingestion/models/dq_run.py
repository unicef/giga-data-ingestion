from enum import Enum

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class DQModeEnum(str, Enum):
    uploaded = "uploaded"
    master = "master"


class DQRun(BaseModel):
    __tablename__ = "dq_runs"

    id: Mapped[int] = mapped_column(primary_key=True)

    upload_id: Mapped[int] = mapped_column(
        ForeignKey("file_uploads.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    dq_mode: Mapped[DQModeEnum] = mapped_column(
        SQLEnum(DQModeEnum, name="dq_mode"),
        nullable=False,
        default=DQModeEnum.uploaded,
    )

    status: Mapped[str] = mapped_column(nullable=False)

    dagster_run_id: Mapped[str | None] = mapped_column(nullable=True)

    result_path: Mapped[str | None] = mapped_column(nullable=True)
