import asyncio
import sys
from datetime import datetime

import yaml
from data_ingestion import models
from data_ingestion.db import get_db_context
from data_ingestion.models import BaseModel
from data_ingestion.settings import settings
from loguru import logger
from sqlalchemy.dialects.postgresql import insert


async def main(fixtures: list[str]):
    sum_data = 0
    for fixture in fixtures:
        fixture_file = (
            settings.BASE_DIR / "data_ingestion" / "fixtures" / f"{fixture}.yaml"
        )
        if not fixture_file.exists():
            raise FileNotFoundError(f"Fixture `{fixture}` could not be found.")

        with open(fixture_file) as f:
            data = yaml.safe_load(f)

        try:
            model: BaseModel = getattr(models, data[0]["model"])
        except AttributeError as err:
            raise AttributeError(
                f"Model `{data['model']}` could not be found."
            ) from err

        for d in data:
            for k, v in d["fields"].items():
                if k.startswith("date_"):
                    d["fields"][k] = datetime.fromisoformat(v)

        async with get_db_context() as session:
            await session.execute(
                insert(model)
                .values([{**d["fields"], "id": d["id"]} for d in data])
                .on_conflict_do_nothing()
            )
            await session.commit()

        sum_data += len(data)

    logger.info(f"Installed {sum_data} rows from {len(fixtures)} fixtures.")


if __name__ == "__main__":
    if len(args := sys.argv[1:]) == 0:
        raise ValueError("At least one fixture must be specified.")

    asyncio.run(main(args))
