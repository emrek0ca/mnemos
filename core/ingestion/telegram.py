import json
from pathlib import Path
from typing import List, Generator
from loguru import logger

from core.ingestion.models import TelegramChatExport, TelegramMessage
from core.config.settings import settings


class TelegramIngestor:
    def __init__(self, source_path: Path):
        self.source_path = source_path
        if not self.source_path.exists():
            raise FileNotFoundError(f"Source file not found: {self.source_path}")

    def load_export(self) -> TelegramChatExport:
        """Loads and validates the entire Telegram export."""
        logger.info(f"Loading Telegram export from {self.source_path}")
        with open(self.source_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return TelegramChatExport(**data)

    def extract_all_messages(self, export: TelegramChatExport, user_id: str) -> List[TelegramMessage]:
        """Collects all messages and tags them by user_id comparison."""
        logger.debug(f"Processing all messages, targeting user_id: {user_id}")
        return [msg for msg in export.messages if msg.type == "message"]

    def process_and_save(self, user_id: str, output_path: Path):
        """High-level flow: load, extract, and save to ingested format with is_mine flag."""
        export = self.load_export()
        messages = self.extract_all_messages(export, user_id)
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            for msg in messages:
                # Basic normalization for processing
                record = {
                    "id": msg.id,
                    "date": msg.date.isoformat(),
                    "text": msg.get_full_text(),
                    "reply_to": msg.reply_to_message_id,
                    "from_id": msg.from_id,
                    "is_mine": msg.from_id == user_id,
                    "has_photo": msg.photo is not None,
                    "has_file": msg.file is not None,
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        
        logger.success(f"Ingested {len(messages)} total messages to {output_path}")


if __name__ == "__main__":
    # Example usage for testing
    import sys
    if len(sys.argv) > 2:
        ingestor = TelegramIngestor(Path(sys.argv[1]))
        ingestor.process_and_save(sys.argv[2], settings.PROCESSED_DIR / "ingested.jsonl")
