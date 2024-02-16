from http import HTTPStatus

from fastapi import APIRouter, status
from fastapi.openapi.models import Response
from fastapi.responses import PlainTextResponse

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
