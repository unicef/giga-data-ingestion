from loguru import logger
from starlette.responses import FileResponse, Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from data_ingestion.settings import settings


class StaticFilesMiddleware(StaticFiles):
    async def get_response(self, path: str, _: Scope) -> Response:
        static_file_path = settings.STATICFILES_DIR / path
        assets_file_path = settings.STATICFILES_DIR / "assets" / path
        logger.info(f"{path=}, {static_file_path=}, {assets_file_path=}")
        if path != ".":
            if static_file_path.exists():
                return FileResponse(static_file_path)
            if assets_file_path.exists():
                return FileResponse(assets_file_path)
            return FileResponse(settings.STATICFILES_DIR / "index.html")
        return FileResponse(settings.STATICFILES_DIR / "index.html")
