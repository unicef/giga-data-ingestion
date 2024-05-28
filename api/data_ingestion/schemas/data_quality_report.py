from datetime import datetime

from pydantic import BaseModel


class Check(BaseModel):
    assertion: str
    column: str
    count_failed: int
    count_overall: int
    count_passed: int
    description: str
    percent_failed: int
    percent_passed: int


class SummaryCheck(BaseModel):
    columns: int
    rows: int
    timestamp: datetime


class DataQualityCheck(BaseModel):
    completeness_checks: list[Check]
    critical_error_check: list[Check]
    domain_checks: list[Check]
    duplicate_rows_checks: list[Check]
    format_validation_checks: list[Check]
    geospatial_checks: list[Check]
    range_checks: list[Check]
    summary: SummaryCheck


class BasicCheck(BaseModel):
    assertion: str
    column: str
    description: str


class BasicDataQualityCheck(BaseModel):
    completeness_checks: list[BasicCheck]
    critical_error_check: list[BasicCheck]
    domain_checks: list[BasicCheck]
    duplicate_rows_checks: list[BasicCheck]
    format_validation_checks: list[BasicCheck]
    geospatial_checks: list[BasicCheck]
    range_checks: list[BasicCheck]
