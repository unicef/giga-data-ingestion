import json

from fastapi import APIRouter
from loguru import logger

from data_ingestion.schemas.core import B2CPolicyGroupRequest, B2CPolicyGroupResponse

router = APIRouter(tags=["utils"])


@router.post("/utils/parse-group-displayname", response_model=B2CPolicyGroupResponse)
def parse_group_display_names(body: B2CPolicyGroupRequest):
    logger.info(f"{body.model_dump()=}")
    parsed = [json.loads(g) for g in body.rawGroups]
    ret = [b["displayName"] for b in parsed if b.get("displayName") is not None]

    out = B2CPolicyGroupResponse(value=ret)
    logger.info(f"{out.model_dump()=}")
    return out
