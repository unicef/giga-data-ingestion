import json
from datetime import datetime
from json import JSONDecodeError

from fastapi import APIRouter, HTTPException, Security, status
from loguru import logger

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.core import B2CPolicyGroupRequest, B2CPolicyGroupResponse
from data_ingestion.schemas.util import ResponseWithDateKeyBody, ValidDateTimeFormat

router = APIRouter(
    prefix="/api/utils", tags=["utils"], dependencies=[Security(azure_scheme)]
)


@router.post("/parse-group-displayname", response_model=B2CPolicyGroupResponse)
def parse_group_display_names(body: B2CPolicyGroupRequest):
    logger.info(f"{body.model_dump()=}")
    try:
        parsed = [json.loads(g) for g in body.rawGroups]
    except JSONDecodeError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON"
        ) from err

    ret = [b["displayName"] for b in parsed if b.get("displayName") is not None]

    out = B2CPolicyGroupResponse(value=ret)
    logger.info(f"{out.model_dump()=}")
    return out


@router.post("/is_valid_datetime_format_code", dependencies=[Security(IsPrivileged())])
def is_valid_datetime_format_code(body: ValidDateTimeFormat) -> bool:
    datetime_str = body.datetime_str
    format_code = body.format_code

    try:
        datetime.strptime(datetime_str, format_code)
        return True
    except ValueError:
        return False


# simulates nic.br/GetMeasurementsByDayOfYear
@router.post("/test/response_with_date_key", dependencies=[Security(IsPrivileged())])
async def response_with_date_key(body: ResponseWithDateKeyBody):
    day_of_year = body.dayofyear

    try:
        datetime.strptime(day_of_year, "%Y-%m-%d")
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(err)
        ) from err

    times = ["2023-12-04 15:50:24", "2023-12-04 16:17:36", "2023-12-04 20:04:57"]

    return [{"time": item, "sample_data": "sample_data"} for item in times]
