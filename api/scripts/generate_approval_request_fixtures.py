from itertools import chain, product
from random import SystemRandom

import yaml
from country_converter import CountryConverter
from data_ingestion.constants import FACILITY_APPROVAL_DATASETS
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
    # IDs are seeded and loaded as primary keys with ON CONFLICT DO NOTHING, so new
    # datasets go after the original pairs to keep the IDs of existing rows stable.
    original_datasets = ["School Geolocation", "School Coverage"]
    added_datasets = [
        dataset
        for dataset in FACILITY_APPROVAL_DATASETS
        if dataset not in original_datasets
    ]
    pairs = chain(
        product(countries, original_datasets),
        product(countries, added_datasets),
    )

    for country, dataset in pairs:
        approval_request_id = fake.uuid4()

        approval_request = ApprovalRequestSchema(
            id=fake.uuid4(),
            country=country,
            dataset=dataset,
            enabled=False,
            is_merge_processing=False,
        )

        approval_requests.append(
            {
                "model": "ApprovalRequest",
                "id": approval_request_id,
                "fields": {
                    k: v
                    for k, v in jsonable_encoder(approval_request).items()
                    if k not in ["id", "school_connectivity", "audit_logs"]
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
