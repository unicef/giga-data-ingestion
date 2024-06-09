from itertools import product
from uuid import uuid4

import yaml
from country_converter import CountryConverter
from data_ingestion.settings import settings


def main():
    countries = CountryConverter().data["name_short"].to_list()
    datasets = ["School Geolocation", "School Coverage", "School QoS"]
    special_roles = ["Admin", "Developer", "QA", "Regular"]

    roles = [
        {
            "id": str(uuid4()),
            "model": "Role",
            "fields": {
                "name": s,
            },
        }
        for s in special_roles
    ]

    roles.extend(
        [
            {
                "id": str(uuid4()),
                "model": "Role",
                "fields": {
                    "name": f"{c}-{d}",
                },
            }
            for c, d in product(countries, datasets)
        ]
    )

    with open(
        settings.BASE_DIR / "data_ingestion" / "fixtures" / "roles.yaml", "w"
    ) as f:
        yaml.safe_dump(roles, f, indent=2, allow_unicode=True)


if __name__ == "__main__":
    main()
