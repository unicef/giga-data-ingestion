FROM python:3.11-alpine3.19

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONFAULTHANDLER 1
ENV PYTHONHASHSEED random
ENV PIP_NO_CACHE_DIR off
ENV PIP_DISABLE_PIP_VERSION_CHECK on
ENV PIP_DEFAULT_TIMEOUT 120
ENV POETRY_NO_INTERACTION 1
ENV POETRY_CACHE_DIR "/var/cache/pypoetry"
ENV POETRY_HOME /etc/poetry
ENV PATH "$POETRY_HOME/bin:$PATH"

# Only libmagic is needed for x86 (e.g. Windows/WSL)
# The others are needed for building on ARM (e.g. Apple Silicon)
RUN apk add --no-cache curl libmagic gcc musl-dev libffi-dev

ARG POETRY_VERSION=1.6.1

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]
RUN curl -sSL https://install.python-poetry.org | python - --version "$POETRY_VERSION"

RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true

WORKDIR /app

CMD [ "./docker-entrypoint.dev.sh" ]
