from jinja2 import Environment, PackageLoader, select_autoescape

env = Environment(
    loader=PackageLoader("data_ingestion"),
    autoescape=select_autoescape(),
)
