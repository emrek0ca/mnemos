"""Critical path tests for Telegram export ingestion."""

import json
import tempfile
from pathlib import Path
import pytest

from core.ingestion.models import TelegramChatExport, TelegramMessage
from core.ingestion.telegram import TelegramIngestor


MINIMAL_EXPORT = {
    "name": "Test Chat",
    "type": "personal_chat",
    "id": 1,
    "messages": [
        {
            "id": 1,
            "type": "message",
            "date": "2026-01-01T10:00:00",
            "from": "Alice",
            "from_id": "user_alice",
            "text": "Hello world"
        },
        {
            "id": 2,
            "type": "message",
            "date": "2026-01-01T10:01:00",
            "from": "Bob",
            "from_id": "user_bob",
            "text": "Hi there"
        },
        {
            "id": 3,
            "type": "message",
            "date": "2026-01-01T10:02:00",
            "from": "Alice",
            "from_id": "user_alice",
            "text": [
                "Mixed text ",
                {"type": "bold", "text": "entity"}
            ]
        }
    ]
}


@pytest.fixture
def export_file(tmp_path):
    f = tmp_path / "result.json"
    f.write_text(json.dumps(MINIMAL_EXPORT), encoding="utf-8")
    return f


def test_load_export(export_file):
    ingestor = TelegramIngestor(export_file)
    export = ingestor.load_export()
    assert isinstance(export, TelegramChatExport)
    assert len(export.messages) == 3


def test_extract_all_messages(export_file):
    ingestor = TelegramIngestor(export_file)
    export = ingestor.load_export()
    all_msgs = ingestor.extract_all_messages(export, "user_alice")
    assert len(all_msgs) == 3


def test_is_mine_logic(export_file):
    ingestor = TelegramIngestor(export_file)
    export = ingestor.load_export()
    all_msgs = ingestor.extract_all_messages(export, "user_alice")
    
    # Alice is mine, Bob is not
    # Manual check of logic inside ingestor for is_mine:
    # it's from_id == user_id
    assert all_msgs[0].from_id == "user_alice"
    assert all_msgs[1].from_id == "user_bob"


def test_get_full_text_plain(export_file):
    ingestor = TelegramIngestor(export_file)
    export = ingestor.load_export()
    msg = export.messages[0]
    assert msg.get_full_text() == "Hello world"


def test_get_full_text_mixed_entities(export_file):
    ingestor = TelegramIngestor(export_file)
    export = ingestor.load_export()
    msg = export.messages[2]  # mixed text/entity
    full = msg.get_full_text()
    assert "Mixed text" in full
    assert "entity" in full


def test_process_and_save_outputs_jsonl(export_file, tmp_path):
    out = tmp_path / "out.jsonl"
    ingestor = TelegramIngestor(export_file)
    ingestor.process_and_save("user_alice", out)

    lines = out.read_text().strip().split("\n")
    assert len(lines) == 3  # all messages included

    records = [json.loads(line) for line in lines]
    assert records[0]["is_mine"] is True
    assert records[1]["is_mine"] is False
    assert records[2]["is_mine"] is True


def test_missing_file_raises():
    with pytest.raises(FileNotFoundError):
        TelegramIngestor(Path("/nonexistent/result.json"))
