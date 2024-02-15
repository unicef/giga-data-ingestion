FROM python:3.11

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV POETRY_HOME /etc/poetry
ENV PATH "$POETRY_HOME/bin:$PATH"

ARG POETRY_VERSION=1.6.1

RUN curl -sSL https://install.python-poetry.org | python - --version "$POETRY_VERSION"

RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true

WORKDIR /app

CMD [ "./docker-entrypoint.dev.sh" ]
