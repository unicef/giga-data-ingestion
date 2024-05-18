import json
from datetime import datetime
from json import JSONDecodeError
from pathlib import Path

import httpx
from country_converter import CountryConverter
from fastapi import (
    APIRouter,
    HTTPException,
    Security,
    status,
)
from fastapi.responses import StreamingResponse
from loguru import logger
from starlette.background import BackgroundTask

from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.schemas.core import B2CPolicyGroupRequest, B2CPolicyGroupResponse
from data_ingestion.schemas.util import (
    Country,
    ForwardRequestBody,
    ResponseWithDateKeyBody,
    ValidDateTimeFormat,
)

router = APIRouter(
    prefix="/api/utils",
    tags=["utils"],
)


@router.post(
    "/parse-group-displayname",
    response_model=B2CPolicyGroupResponse,
    include_in_schema=False,
)
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


@router.get("/countries", response_model=list[Country])
def list_countries():
    coco = CountryConverter()
    data = coco.data
    return data[["ISO3", "name_short"]].to_dict(orient="records")


@router.post("/is_valid_datetime_format_code", dependencies=[Security(azure_scheme)])
def is_valid_datetime_format_code(body: ValidDateTimeFormat) -> bool:
    datetime_str = body.datetime_str
    format_code = body.format_code

    try:
        datetime.strptime(datetime_str, format_code)
        return True
    except ValueError:
        return False


# simulates nic.br/GetMeasurementsByDayOfYear
@router.post("/test/response_with_date_key", dependencies=[Security(azure_scheme)])
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


@router.post("/forward_request")
async def forward_get_request(
    body: ForwardRequestBody,
):
    auth_tuple = (body.auth["username"], body.auth["password"]) if body.auth else None

    sharing_client = httpx.AsyncClient(
        timeout=300, auth=auth_tuple if auth_tuple else None
    )

    request_params = {
        k: v for k, v in body.model_dump().items() if v is not None and k != "auth"
    }

    sharing_req = sharing_client.build_request(**request_params)
    sharing_res = await sharing_client.send(sharing_req, stream=True)

    return StreamingResponse(
        sharing_res.aiter_raw(),
        headers=sharing_res.headers,
        status_code=sharing_res.status_code,
        media_type="application/json",
        background=BackgroundTask(sharing_res.aclose),
    )


@router.get("/data-privacy")
async def get_data_privacy_document():
    path = Path(constants.DATA_PRIVACY_DOCUMENT_PATH)
    blob = storage_client.get_blob_client(str(path))
    stream = blob.download_blob()
    headers = {"Content-Disposition": f"attachment; filename={path.name}"}
    return StreamingResponse(
        stream.chunks(),
        media_type="application/pdf",
        headers=headers,
    )
