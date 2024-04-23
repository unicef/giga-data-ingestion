from base64 import b64encode
from datetime import timedelta
from random import SystemRandom

import yaml
from data_ingestion.models.ingest_api_qos import (
    AuthorizationTypeEnum,
    PaginationTypeEnum,
    RequestMethodEnum,
    SendQueryInEnum,
)
from data_ingestion.schemas.qos import (
    ApiConfiguration,
    SchoolConnectivitySchema,
    SchoolListSchema,
)
from data_ingestion.settings import settings
from faker import Faker
from fastapi.encoders import jsonable_encoder

random = SystemRandom()
random.seed(1)

Faker.seed(1)
fake = Faker()


def main(number: int = 5):
    school_lists: list[dict] = []
    school_connectivities: list[dict] = []

    for _ in range(number):
        date_created = fake.date_time_this_year()
        date_modified = date_created + timedelta(hours=random.randint(1, 72))
        school_connectivity_id = fake.uuid4()
        school_list_id = fake.uuid4()

        base_config = ApiConfiguration(
            id=fake.uuid4(),
            api_auth_api_key=random.choice(["X-Api-Key", "X-API-Key", "X-API-KEY"]),
            api_auth_api_value=b64encode(fake.password(16).encode()).decode(),
            api_endpoint=fake.url(),
            authorization_type=AuthorizationTypeEnum[
                random.choice([a.name for a in AuthorizationTypeEnum])
            ],
            basic_auth_password=fake.password(16),
            basic_auth_username=fake.user_name(),
            bearer_auth_bearer_token=b64encode(fake.password(16).encode()).decode(),
            data_key=random.choice(["data", "results", "result"]),
            date_created=date_created,
            date_modified=date_modified,
            date_last_ingested=date_modified
            + timedelta(hours=random.randint(1, 72), minutes=random.randint(1, 59)),
            date_last_successfully_ingested=date_modified
            + timedelta(hours=random.randint(1, 72), minutes=random.randint(1, 59)),
            enabled=fake.boolean(chance_of_getting_true=70),
            error_message=random.choice([None, f"HTTP Error 500: {fake.sentence()}"]),
            page_number_key=random.choice(["page", "page_number", "pageNumber"]),
            page_offset_key=random.choice(["offset", "page_offset", "pageOffset"]),
            page_send_query_in=SendQueryInEnum[
                random.choice([s.name for s in SendQueryInEnum])
            ],
            page_size_key=random.choice(["size", "page_size", "pageSize"]),
            page_starts_with=random.randint(1, 50),
            pagination_type=PaginationTypeEnum[
                random.choice([p.name for p in PaginationTypeEnum])
            ],
            query_parameters=fake.json(
                data_columns={
                    "school_id": "uuid4",
                    "country_id": "pystr",
                    "page": "pyint",
                },
                num_rows=1,
            ),
            request_body=fake.json(
                data_columns={
                    "school_id": "uuid4",
                    "country_id": "pystr",
                },
                num_rows=1,
            ),
            request_method=RequestMethodEnum[
                random.choice([r.name for r in RequestMethodEnum])
            ],
            school_id_key=random.choice(["school_id", "schoolId", "schoolID"]),
            size=random.randint(1, 50),
        )

        school_connectivity_config = {
            **base_config.model_dump(),
            "id": school_connectivity_id,
            "ingestion_frequency": "*/30 * * * *",
            "schema_url": fake.url(),
            "school_list_id": school_list_id,
            "date_key": random.choice(["data", "results", "result"]),
            "date_format": random.choice(["timestamp", "unix"]),
            "school_id_send_query_in": SendQueryInEnum[
                random.choice([s.name for s in SendQueryInEnum])
            ],
            "send_date_in": SendQueryInEnum[
                random.choice([s.name for s in SendQueryInEnum if s.name != "NONE"])
            ],
            "response_date_key": random.choice(["data", "results", "result"]),
            "response_date_format": random.choice(["timestamp", "unix"]),
        }

        school_connectivity = SchoolConnectivitySchema(
            **school_connectivity_config,
        )

        school_list = SchoolListSchema(
            **{
                **base_config.model_dump(),
                "id": school_list_id,
                "column_to_schema_mapping": {
                    random.choice(
                        [
                            "school_id_giga",
                            "school_giga_id",
                            "giga_school_id",
                            "school_id",
                        ]
                    ): "school_id_giga",
                    random.choice(
                        ["lat", "latitude", "Latitude", "LATITUDE"]
                    ): "latitude",
                    random.choice(
                        ["lon", "lng", "long", "latitude", "Longitude", "Longitude"]
                    ): "longitude",
                    random.choice(
                        ["name", "school_name", "schoolName", "school_name"]
                    ): "school_name",
                    random.choice(
                        ["download_speed", "downloadSpeed", "DownloadSpeed"]
                    ): "speed_download",
                    random.choice(
                        ["upload_speed", "uploadSpeed", "UploadSpeed"]
                    ): "speed_upload",
                    random.choice(
                        ["ping", "RTT", "RoundtripTime", "rtt"]
                    ): "roundtrip_time",
                },
                "name": fake.nic_handle(),
                "user_email": fake.safe_email(),
                "user_id": fake.uuid4(),
                "school_connectivity": school_connectivity_config,
            },
        )

        school_lists.append(
            {
                "model": "SchoolList",
                "id": school_list.id,
                "fields": {
                    k: v
                    for k, v in jsonable_encoder(school_list).items()
                    if k not in ["id", "school_connectivity"]
                },
            }
        )
        school_connectivities.append(
            {
                "model": "SchoolConnectivity",
                "id": school_connectivity.id,
                "fields": {
                    k: v
                    for k, v in jsonable_encoder(
                        school_connectivity.model_dump()
                    ).items()
                    if k != "id"
                },
            }
        )

    with open(
        settings.BASE_DIR / "data_ingestion" / "fixtures" / "qos_school_list.yaml", "w+"
    ) as f:
        yaml.safe_dump(school_lists, f, indent=2)

    with open(
        settings.BASE_DIR
        / "data_ingestion"
        / "fixtures"
        / "qos_school_connectivity.yaml",
        "w+",
    ) as f:
        yaml.safe_dump(school_connectivities, f, indent=2)


if __name__ == "__main__":
    main()
