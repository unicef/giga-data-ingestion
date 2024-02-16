import json
from datetime import timedelta
from http import HTTPStatus

import sentry_sdk
from fastapi import FastAPI, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import Response
from fastapi.responses import FileResponse, ORJSONResponse
from loguru import logger
from starlette.middleware.sessions import SessionMiddleware

from data_ingestion.constants import __version__
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.middlewares.staticfiles import StaticFilesMiddleware
from data_ingestion.routers import groups, upload, users
from data_ingestion.settings import settings

if settings.IN_PRODUCTION and settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=settings.PYTHON_ENV,
    )

app = FastAPI(
    title="GigaSync Data Ingestion Portal",
    version=__version__,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=False,
    default_response_class=ORJSONResponse,
    swagger_ui_oauth2_redirect_url="/api/auth/oauth2-redirect",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": settings.AZURE_CLIENT_ID,
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session",
    max_age=int(timedelta(days=7).total_seconds()),
    same_site="lax",
)


@app.on_event("startup")
async def load_config():
    await azure_scheme.openid_config.load_config()


@app.get(
    "/api",
    tags=["core"],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: Response(
            description=HTTPStatus.INTERNAL_SERVER_ERROR.phrase
        ).model_dump(),
    },
)
async def api_health_check():
    logger.info(
        json.dumps(
            jsonable_encoder(settings.model_dump()),
            indent=2,
        )
    )
    return {"status": "ok"}


app.include_router(upload.router)
app.include_router(users.router)
app.include_router(groups.router)


if settings.IN_PRODUCTION:

    @app.exception_handler(404)
    async def send_to_frontend(*_, **__):
        return FileResponse(settings.STATICFILES_DIR / "index.html")

    app.mount(
        "/{catch_all}",
        StaticFilesMiddleware(directory=settings.STATICFILES_DIR),
        name="static",
    )
