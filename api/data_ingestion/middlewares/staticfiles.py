from starlette.responses import FileResponse, Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from data_ingestion.settings import settings


class StaticFilesMiddleware(StaticFiles):
    async def get_response(self, path: str, _: Scope) -> Response:
        static_file_path = settings.STATICFILES_DIR / path
        if path != "." and static_file_path.exists():
            return FileResponse(static_file_path)
        return FileResponse(settings.STATICFILES_DIR / "index.html")
