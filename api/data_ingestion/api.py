from datetime import timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.middlewares.staticfiles import StaticFilesMiddleware
from data_ingestion.routers import roles, upload, users
from data_ingestion.settings import settings

app = FastAPI(
    title="Giga Data Ingestion Portal",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=False,
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

app.include_router(upload.router)
app.include_router(users.router)
app.include_router(roles.router)


@app.on_event("startup")
async def load_config():
    await azure_scheme.openid_config.load_config()


@app.get("/api")
async def health():
    return {"status": "ok"}


if settings.IN_PRODUCTION:

    @app.exception_handler(404)
    async def send_to_frontend(*_, **__):
        return FileResponse(settings.STATICFILES_DIR / "index.html")

    app.mount(
        "/{catch_all}",
        StaticFilesMiddleware(directory=settings.STATICFILES_DIR),
        name="static",
    )
