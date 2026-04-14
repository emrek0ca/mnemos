import pytest
from core.privacy.redactor import Redactor
from core.config.settings import settings

def test_url_redaction_toggle():
    text = "Check this out: https://google.com"
    
    # Test with URL redaction disabled (default)
    settings.ENABLE_URL_REDACTION = False
    redactor = Redactor()
    redacted, _ = redactor.redact(text)
    assert "https://google.com" in redacted
    
    # Test with URL redaction enabled
    settings.ENABLE_URL_REDACTION = True
    redactor = Redactor()
    redacted, _ = redactor.redact(text)
    assert "https://google.com" not in redacted
    assert "********" in redacted
    
    # Reset settings
    settings.ENABLE_URL_REDACTION = False

def test_blocklist():
    text = "Secret project name is ProjectZeus."
    redactor = Redactor(blocklist=["ProjectZeus"])
    redacted, events = redactor.redact(text)
    assert "ProjectZeus" not in redacted
    assert "********" in redacted
    assert events[0]["type"] == "blocklist"

def test_allowlist():
    text = "Contact me at test@example.com"
    # test@example.com would normally be redacted as email
    redactor = Redactor(allowlist=["test@example.com"])
    redacted, events = redactor.redact(text)
    assert "test@example.com" in redacted
    assert not events

def test_multiline_redaction():
    text = "Line 1: 555-123-4567\nLine 2: test@example.com\nLine 3: https://google.com"
    settings.ENABLE_URL_REDACTION = True
    redactor = Redactor()
    redacted, events = redactor.redact(text)
    assert "555-123-4567" not in redacted
    assert "test@example.com" not in redacted
    assert "https://google.com" not in redacted
    assert redacted.count("********") == 3
    settings.ENABLE_URL_REDACTION = False

def test_overlapping_fixed_redactor():
    # Test case where a pattern might overlap
    text = "My email is test@example.com-extra"
    redactor = Redactor()
    redacted, _ = redactor.redact(text)
    # email should be redacted, leaving '-extra'
    assert "********-extra" in redacted
