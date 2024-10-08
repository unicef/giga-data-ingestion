import logging
import sys
from datetime import timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, ORJSONResponse
from starlette.middleware.sessions import SessionMiddleware

from data_ingestion.constants import __version__
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.middlewares.staticfiles import StaticFilesMiddleware
from data_ingestion.routers import (
    approval_requests,
    core,
    deletion_requests,
    email,
    groups,
    qos,
    roles,
    schema,
    upload,
    users,
    utils,
)
from data_ingestion.settings import DeploymentEnvironment, initialize_sentry, settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
stream_handler = logging.StreamHandler(sys.stdout)
log_formatter = logging.Formatter(
    "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
stream_handler.setFormatter(log_formatter)
logger.addHandler(stream_handler)

initialize_sentry()

app = FastAPI(
    title="Giga Sync API",
    version=__version__,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=False,
    default_response_class=ORJSONResponse,
    swagger_ui_oauth2_redirect_url="/api/auth/oauth2-redirect",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": settings.AZURE_CLIENT_ID,
        "scopes": "openid profile offline_access",
    },
    swagger_ui_parameters={
        "persistAuthorization": True,
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


app.include_router(approval_requests.router)
app.include_router(core.router)
app.include_router(deletion_requests.router)
app.include_router(email.router)
app.include_router(groups.router)
app.include_router(qos.router)
app.include_router(roles.router)
app.include_router(schema.router)
app.include_router(upload.router)
app.include_router(users.router)
app.include_router(utils.router)

if settings.IN_PRODUCTION:

    @app.exception_handler(404)
    async def send_to_frontend(*_, **__):
        headers = {}
        if settings.DEPLOY_ENV != DeploymentEnvironment.PRD:
            headers = {
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            }

        return FileResponse(settings.STATICFILES_DIR / "index.html", headers=headers)

    app.mount(
        "/{catch_all}",
        StaticFilesMiddleware(directory=settings.STATICFILES_DIR),
        name="static",
    )
