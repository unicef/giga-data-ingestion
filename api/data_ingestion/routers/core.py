from http import HTTPStatus

from fastapi import APIRouter, status
from fastapi.openapi.models import Response

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
    return {"status": "ok"}
