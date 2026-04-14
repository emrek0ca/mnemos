import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger

from core.plugins.base import BaseIngestor
from core.memory.models import EpisodicMemory

class AudioPerceptionPlugin(BaseIngestor):
    """
    Plugin for ingesting Audio file metadata.
    Grounds voice notes and recordings into episodic memory.
    """

    @property
    def plugin_id(self) -> str:
        return "audio"

    @property
    def source_label(self) -> str:
        return "Audio Perception (WAV/MP3)"

    def ingest(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extracts metadata from the audio file."""
        if not file_path.suffix.lower() in [".wav", ".mp3", ".ogg", ".m4a"]:
            logger.warning(f"File {file_path.name} is not a supported audio format.")
            return []

        # Simulated metadata extraction (In production, use mutagen/pydub)
        file_stats = file_path.stat()
        
        return [{
            "filename": file_path.name,
            "extension": file_path.suffix.lower(),
            "size_kb": file_stats.st_size / 1024,
            "timestamp": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
            "duration_est_sec": file_stats.st_size / (128 * 1024) * 8 # Very rough est
        }]

    def transform(self, raw_data: List[Dict[str, Any]]) -> List[EpisodicMemory]:
        memories = []
        for rd in raw_data:
            memories.append(EpisodicMemory(
                id=f"aud_{int(datetime.now().timestamp() * 1000)}",
                content=f"[AUDIO SENSORY Perception] File: {rd['filename']} ({rd['duration_est_sec']:.1f}s)",
                sender_id="system",
                importance=0.6,
                metadata={
                    "type": "audio",
                    "filename": rd["filename"],
                    "audio_duration": rd["duration_est_sec"],
                    "perceived_at": rd["timestamp"]
                }
            ))
        return memories
