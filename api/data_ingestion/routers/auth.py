from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

oauth = OAuth()


@router.get("/login")
async def login(request: Request):
    pass


@router.get("/callback")
async def callback(request: Request):
    pass
