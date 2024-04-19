from itertools import product
from random import SystemRandom

import yaml
from country_converter import CountryConverter
from data_ingestion.schemas.approval_requests import ApprovalRequestSchema
from data_ingestion.settings import settings
from faker import Faker
from fastapi.encoders import jsonable_encoder

random = SystemRandom()
random.seed(1)

Faker.seed(1)
fake = Faker()


def main(number: int = 5):
    approval_requests: list[dict] = []

    coco = CountryConverter()
    df = coco.data
    countries = df["ISO3"].to_list()
    datasets = ["School Geolocation", "School Coverage", "School QoS"]

    for country, dataset in product(countries, datasets):
        approval_request_id = fake.uuid4()

        approval_request = ApprovalRequestSchema(
            id=fake.uuid4(), country=country, dataset=dataset, enabled=False
        )

        approval_requests.append(
            {
                "model": "ApprovalRequest",
                "id": approval_request_id,
                "fields": {
                    k: v
                    for k, v in jsonable_encoder(approval_request).items()
                    if k not in ["id", "school_connectivity"]
                },
            }
        )
    with open(
        settings.BASE_DIR / "data_ingestion" / "fixtures" / "approval_requests.yaml",
        "w+",
    ) as f:
        yaml.safe_dump(approval_requests, f, indent=2)


if __name__ == "__main__":
    main()
