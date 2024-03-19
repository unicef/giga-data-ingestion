import json
from itertools import product

from country_converter import CountryConverter

from data_ingestion.settings import settings


def main():
    coco = CountryConverter()
    df = coco.data
    countries = df["name_short"].to_list()
    datasets = ["School Geolocation", "School Coverage", "School QoS"]
    roles = [
        f"{country}-{dataset}" for country, dataset in product(countries, datasets)
    ]
    with open(settings.BASE_DIR / "scripts" / "roles.json", "w+") as f:
        json.dump(roles, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
