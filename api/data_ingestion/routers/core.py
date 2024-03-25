import json
from http import HTTPStatus

from fastapi import APIRouter, status
from fastapi.openapi.models import Response
from loguru import logger

from data_ingestion.settings import settings

router = APIRouter(tags=["core"])


@router.get(
    "/api",
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: Response(
            description=HTTPStatus.INTERNAL_SERVER_ERROR.phrase
        ).model_dump(),
    },
)
async def api_health_check():
    logger.info(json.dumps(settings.model_dump(mode="json"), indent=2))
    return {"status": "ok"}
