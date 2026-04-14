from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Any
from core.memory.models import EpisodicMemory

class BaseIngestor(ABC):
    """
    Abstract base class for all MNEMOS memory plugins.
    Allows easy expansion of the digital twin's memory sources.
    """

    @property
    @abstractmethod
    def plugin_id(self) -> str:
        """Unique identifier for the plugin (e.g., 'whatsapp')."""
        pass

    @property
    @abstractmethod
    def source_label(self) -> str:
        """Human-readable label for the UI (e.g., 'WhatsApp Desktop')."""
        pass

    @abstractmethod
    def ingest(self, file_path: Path) -> List[Dict[str, Any]]:
        """Reads raw data from the file and returns a list of raw messages."""
        pass

    @abstractmethod
    def transform(self, raw_data: List[Dict[str, Any]]) -> List[EpisodicMemory]:
        """Transforms platform-specific raw data into standard EpisodicMemory objects."""
        pass

    def validate(self, file_path: Path) -> bool:
        """Basic check if the file format matches this plugin."""
        return file_path.exists()
