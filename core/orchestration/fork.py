import os
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from core.config.settings import settings

class MnemosForkManager:
    """
    Cognitive Sandbox & Fork Orchestrator.
    Manages isolated memory environments for scenario simulation.
    """

    def __init__(self, base_artifacts_dir: Optional[Path] = None):
        self.base_dir = base_artifacts_dir or settings.ARTIFACTS_DIR
        self.forks_dir = self.base_dir / "forks"
        self.forks_dir.mkdir(parents=True, exist_ok=True)

    def create_fork(self, fork_id: str, inherit: bool = True) -> Path:
        """Creates a new isolated memory fork."""
        target_path = self.forks_dir / fork_id
        if target_path.exists():
            logger.warning(f"Fork '{fork_id}' already exists. Skipping creation.")
            return target_path

        target_path.mkdir(parents=True, exist_ok=True)
        (target_path / "memory").mkdir(parents=True, exist_ok=True)
        
        if inherit:
            logger.info(f"Forking 'True Self' into '{fork_id}' sandbox...")
            source_mem = self.base_dir / "memory"
            if source_mem.exists():
                shutil.copytree(source_mem, target_path / "memory", dirs_exist_ok=True)
            
        logger.success(f"Cognitive Fork '{fork_id}' created at {target_path}")
        return target_path

    def list_forks(self) -> List[str]:
        """Returns all available cognitive forks."""
        if not self.forks_dir.exists():
            return []
        return [d.name for d in self.forks_dir.iterdir() if d.is_dir()]

    def delete_fork(self, fork_id: str):
        """Removes an isolated sandbox."""
        target_path = self.forks_dir / fork_id
        if target_path.exists():
            shutil.rmtree(target_path)
            logger.info(f"Fork '{fork_id}' dissolved.")
            
    def get_fork_path(self, fork_id: str) -> Path:
        """Returns the artifact root for a specific fork."""
        if not fork_id or fork_id == "main":
            return self.base_dir
        return self.forks_dir / fork_id
