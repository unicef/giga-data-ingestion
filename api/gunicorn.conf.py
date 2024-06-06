workers = 1
worker_class = "uvicorn.workers.UvicornWorker"

loglevel = "debug"
errorlog = "-"
accesslog = "-"
capture_output = True

logconfig_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "loggers": {
        "fastapi_azure_auth": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        }
    },
}
