import re
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger

from core.plugins.base import BaseIngestor
from core.memory.models import EpisodicMemory

class WhatsAppIngestor(BaseIngestor):
    """
    Plugin for ingesting WhatsApp chat exports (.txt format).
    Standard Format: [Date, Time] Sender: Message
    """

    @property
    def plugin_id(self) -> str:
        return "whatsapp"

    @property
    def source_label(self) -> str:
        return "WhatsApp (Text Export)"

    def ingest(self, file_path: Path) -> List[Dict[str, Any]]:
        raw_lines = []
        if not file_path.name.endswith(".txt"):
            logger.warning(f"File {file_path.name} does not look like a WhatsApp export.")
            return []

        # Regex to match: [12.04.2024, 14:30:15] Sender: Message
        pattern = re.compile(r"\[(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}),\s(\d{1,2}:\d{2}:\d{2})\]\s([^:]+):\s(.*)")

        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                match = pattern.match(line.strip())
                if match:
                    raw_lines.append({
                        "date": match.group(1),
                        "time": match.group(2),
                        "sender": match.group(3),
                        "content": match.group(4)
                    })
        return raw_lines

    def transform(self, raw_data: List[Dict[str, Any]]) -> List[EpisodicMemory]:
        memories = []
        for rd in raw_data:
            memories.append(EpisodicMemory(
                id=f"wa_{int(datetime.now().timestamp() * 1000)}",
                content=rd["content"],
                sender_id=rd["sender"],
                importance=1.0,
                metadata={"source": "whatsapp", "original_ts": f"{rd['date']} {rd['time']}"}
            ))
        return memories
