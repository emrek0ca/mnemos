import json
import shutil
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from datetime import datetime

from core.config.settings import settings

class SoulPacker:
    """
    Cognitive State Archiver.
    Bundles the digital twin's mnemonic layers into a portable '.brain' package.
    """

    def __init__(self, artifacts_dir: Optional[Path] = None):
        self.artifacts_dir = artifacts_dir or settings.ARTIFACTS_DIR
        self.export_dir = self.artifacts_dir / "exports"
        self.export_dir.mkdir(parents=True, exist_ok=True)

    def pack(self, archive_name: str) -> Path:
        """Packages the triple memory layers + model registry."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        if not archive_name.endswith(".brain"):
            archive_name += ".brain"
            
        target_path = self.export_dir / archive_name
        
        # Files to include
        files_to_pack = {
            "episodic": self.artifacts_dir / "memory" / "episodic.jsonl",
            "semantic": self.artifacts_dir / "memory" / "semantic.jsonl",
            "procedural": self.artifacts_dir / "memory" / "procedural.jsonl",
            "registry": self.artifacts_dir / "training" / "model_registry.json"
        }

        logger.info(f"Initiating Soul Export: {archive_name}")
        
        with zipfile.ZipFile(target_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for key, path in files_to_pack.items():
                if path.exists():
                    zipf.write(path, arcname=f"{key}.jsonl" if key != "registry" else "registry.json")
                    logger.debug(f"Archived {key} layer.")
                else:
                    logger.warning(f"Memory layer {key} missing during export.")

        logger.success(f"Digital Soul Exported: {target_path}")
        return target_path

    def unpack(self, archive_path: Path):
        """Restores a cognitive state from a '.brain' package."""
        if not archive_path.exists():
            raise FileNotFoundError(f"Archive {archive_path} not found.")

        logger.info(f"Initiating Soul Restoration: {archive_path.name}")
        
        with zipfile.ZipFile(archive_path, 'r') as zipf:
            # Map of archive names to target artifact paths
            mapping = {
                "episodic.jsonl": self.artifacts_dir / "memory" / "episodic.jsonl",
                "semantic.jsonl": self.artifacts_dir / "memory" / "semantic.jsonl",
                "procedural.jsonl": self.artifacts_dir / "memory" / "procedural.jsonl",
                "registry.json": self.artifacts_dir / "training" / "model_registry.json"
            }
            
            for arc_name, target_path in mapping.items():
                if arc_name in zipf.namelist():
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with zipf.open(arc_name) as source, open(target_path, "wb") as target:
                        shutil.copyfileobj(source, target)
                    logger.debug(f"Restored {arc_name}.")

        logger.success("Digital Soul Restored. Re-launch the engine to apply state.")
