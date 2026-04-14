"""Critical path tests for the PII redaction engine."""

import pytest
from core.privacy.redactor import Redactor
from core.config.settings import settings


@pytest.fixture
def redactor():
    return Redactor(mask_char="*")


def test_phone_redacted(redactor):
    text = "Call me at +1 (555) 867-5309"
    result, events = redactor.redact(text)
    assert "5309" not in result
    assert any(e["type"] == "phone" for e in events)


def test_email_redacted(redactor):
    text = "Email me at hello@example.com please"
    result, events = redactor.redact(text)
    assert "hello@example.com" not in result
    assert any(e["type"] == "email" for e in events)


def test_url_redacted(redactor):
    text = "Check https://secret.internal/path?token=abc"
    settings.ENABLE_URL_REDACTION = True
    result, events = redactor.redact(text)
    assert "secret.internal" not in result
    assert "********" in result
    assert len(events) == 1
    settings.ENABLE_URL_REDACTION = False


def test_crypto_wallet_redacted(redactor):
    text = "Send ETH to 0xAbCd1234567890AbCd1234567890AbCd12345678"
    result, events = redactor.redact(text)
    assert "0xAbCd" not in result
    assert any(e["type"] == "crypto_wallet" for e in events)


def test_clean_text_unchanged(redactor):
    text = "Hello, how are you doing today?"
    result, events = redactor.redact(text)
    assert result == text
    assert len(events) == 0


def test_multiple_pii_same_text(redactor):
    text = "phone: +15558675309, email: spy@cia.gov"
    result, events = redactor.redact(text)
    assert "+15558675309" not in result
    assert "spy@cia.gov" not in result
    assert len(events) >= 2


def test_mask_fixed_length(redactor):
    """Mask must not leak original content length."""
    text_short = "foo@bar.com"
    text_long = "averylongaddress@verylongdomain.org"
    r_short, _ = redactor.redact(text_short)
    r_long, _ = redactor.redact(text_long)
    # Both should use the same fixed 8-char mask
    assert "********" in r_short
    assert "********" in r_long


def test_event_contains_type_and_span(redactor):
    text = "reach me at user@domain.com"
    _, events = redactor.redact(text)
    assert len(events) == 1
    event = events[0]
    assert "type" in event
    assert "span" in event
    assert "original_hash" in event
