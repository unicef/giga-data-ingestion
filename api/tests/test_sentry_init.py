import pytest
from data_ingestion import settings as settings_module
from data_ingestion.settings import _valid_sentry_dsn, initialize_sentry, settings

BACKEND_DSN = "https://backendkey@sentry.example.org/12"
WORKER_DSN = "https://workerkey@sentry.example.org/45"
PLACEHOLDER = "$(SENTRY_DSN_WORKER)"


def test_valid_dsn_passes_through():
    assert _valid_sentry_dsn(BACKEND_DSN, "SENTRY_DSN") == BACKEND_DSN


def test_empty_dsn_is_ignored():
    assert _valid_sentry_dsn("", "SENTRY_DSN") == ""


def test_unexpanded_ci_placeholder_is_rejected():
    assert _valid_sentry_dsn(PLACEHOLDER, "SENTRY_DSN_WORKER") == ""


@pytest.mark.parametrize("dsn", ["sentry.example.org/12", "https://", "not a url"])
def test_malformed_dsn_is_rejected(dsn):
    assert _valid_sentry_dsn(dsn, "SENTRY_DSN") == ""


@pytest.fixture
def captured_init(monkeypatch):
    calls = []
    monkeypatch.setattr(
        settings_module.sentry_sdk, "init", lambda **kwargs: calls.append(kwargs)
    )
    monkeypatch.setattr(settings_module.sentry_sdk, "set_tag", lambda *a, **k: None)
    monkeypatch.setattr(settings, "SENTRY_ENABLE_IN_LOCAL", True)
    return calls


def test_worker_uses_its_own_dsn_when_valid(monkeypatch, captured_init):
    monkeypatch.setattr(settings, "SENTRY_DSN", BACKEND_DSN)
    monkeypatch.setattr(settings, "SENTRY_DSN_WORKER", WORKER_DSN)

    initialize_sentry("worker")

    assert [call["dsn"] for call in captured_init] == [WORKER_DSN]


def test_worker_falls_back_to_backend_dsn_when_worker_dsn_is_invalid(
    monkeypatch, captured_init
):
    monkeypatch.setattr(settings, "SENTRY_DSN", BACKEND_DSN)
    monkeypatch.setattr(settings, "SENTRY_DSN_WORKER", PLACEHOLDER)

    initialize_sentry("worker")

    assert [call["dsn"] for call in captured_init] == [BACKEND_DSN]


def test_worker_skips_sentry_when_no_dsn_is_usable(monkeypatch, captured_init):
    monkeypatch.setattr(settings, "SENTRY_DSN", PLACEHOLDER)
    monkeypatch.setattr(settings, "SENTRY_DSN_WORKER", PLACEHOLDER)

    initialize_sentry("worker")

    assert captured_init == []


def test_sentry_init_failure_does_not_propagate(monkeypatch):
    def boom(**kwargs):
        raise ValueError("boom")

    monkeypatch.setattr(settings, "SENTRY_ENABLE_IN_LOCAL", True)
    monkeypatch.setattr(settings, "SENTRY_DSN", BACKEND_DSN)
    monkeypatch.setattr(settings, "SENTRY_DSN_WORKER", "")
    monkeypatch.setattr(settings_module.sentry_sdk, "init", boom)

    initialize_sentry("worker")
