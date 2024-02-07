import json
from http import HTTPStatus

from fastapi import APIRouter, status
from fastapi.openapi.models import Response
from fastapi.responses import PlainTextResponse
from loguru import logger

from data_ingestion.schemas.core import B2CPolicyGroupRequest, B2CPolicyGroupResponse

router = APIRouter(tags=["core"])


@router.get(
    "/",
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: Response(
            description=HTTPStatus.INTERNAL_SERVER_ERROR.phrase
        ).model_dump(),
    },
    response_class=PlainTextResponse,
)
async def health_check():
    return "ok"


@router.get(
    "/api",
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: Response(
            description=HTTPStatus.INTERNAL_SERVER_ERROR.phrase
        ).model_dump(),
    },
)
async def api_health_check():
    return {"status": "ok"}


@router.post("/utils/parse-group-displayname", response_model=B2CPolicyGroupResponse)
def parse_group_display_names(body: B2CPolicyGroupRequest):
    logger.info(f"{body.model_dump()=}")
    parsed = [json.loads(g) for g in body.rawGroups]
    ret = [b["displayName"] for b in parsed if b.get("displayName") is not None]

    out = B2CPolicyGroupResponse(value=ret)
    logger.info(f"{out.model_dump()=}")
    return out
