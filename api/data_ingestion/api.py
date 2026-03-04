import logging
import sys
from datetime import timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, ORJSONResponse
from starlette.middleware.sessions import SessionMiddleware

from data_ingestion.constants import __version__
from data_ingestion.db.primary import get_db_context
from data_ingestion.internal.auth import azure_scheme, local_auth_bypass
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
    if settings.IN_PRODUCTION:
        await azure_scheme.openid_config.load_config()
    else:
        try:
            await azure_scheme.openid_config.load_config()
        except Exception as exc:
            logger.warning(
                "Azure B2C OIDC config could not be loaded (running locally): %s", exc
            )
        await _ensure_local_dev_user()


async def _ensure_local_dev_user():
    """Create the local dev user with Admin role if it doesn't already have it."""
    from uuid import uuid4

    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from data_ingestion.models import Role, User

    local_email = "dev@example.com"

    async with get_db_context() as db:
        user = await db.scalar(
            select(User)
            .where(User.email == local_email)
            .options(selectinload(User.roles))
        )
        admin_role = await db.scalar(select(Role).where(Role.name == "Admin"))

        if admin_role is None:
            logger.warning(
                "Admin role not found in DB — run migrations/fixtures first."
            )
            return

        if user is None:
            user = User(
                id=str(uuid4()),
                email=local_email,
                given_name="Local",
                surname="Dev",
            )
            user.roles = {admin_role}
            db.add(user)
            await db.commit()
            logger.info("Local dev user '%s' created with Admin role.", local_email)
        elif admin_role not in user.roles:
            user.roles.add(admin_role)
            await db.commit()
            logger.info("Local dev user '%s' updated with Admin role.", local_email)
        else:
            logger.info("Local dev user '%s' already has Admin role.", local_email)


if not settings.IN_PRODUCTION:
    app.dependency_overrides[azure_scheme] = local_auth_bypass

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
