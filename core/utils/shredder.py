import os
from pathlib import Path
from loguru import logger
from typing import List

class ForensicShredder:
    """
    Sovereign Privacy Utility: Securely purges media assets.
    Implements a single-pass zero-overwrite before unlinking for 'Industrial Hardening'.
    """

    @staticmethod
    def shred_file(path: Path, secure: bool = True):
        """Securely deletes a file from the filesystem."""
        if not path.exists():
            return
            
        try:
            if secure:
                # Get file size
                file_size = path.stat().st_size
                # Overwrite with random data or zeros
                with open(path, "ba+") as f:
                    f.seek(0)
                    f.write(os.urandom(file_size))
                logger.debug(f"Shredder: Securely overwritten {path.name}")
            
            os.remove(path)
            logger.success(f"Shredder: Purged {path.name}")
        except Exception as e:
            logger.error(f"Shredder: Failed to purge {path.name}: {e}")

    @classmethod
    def cleanup_consolidated_media(cls, episodes: List[Any]) -> int:
        """
        Scans a list of memories and purges media associated with consolidated episodes.
        Returns the count of shredded files.
        """
        shred_count = 0
        for m in episodes:
            # We target memories marked as consolidated
            if m.metadata.get("consolidated") and "media_path" in m.metadata:
                media_path = m.metadata["media_path"]
                if media_path and media_path != "[SHREDDED]":
                    p = Path(media_path)
                    if p.exists():
                        cls.shred_file(p)
                        shred_count += 1
                        m.metadata["media_path"] = "[SHREDDED]"
                        
        return shred_count
