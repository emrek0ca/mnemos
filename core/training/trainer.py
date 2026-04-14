import os
from pathlib import Path
from loguru import logger
from typing import Optional, Dict, Any

from core.config.settings import settings


class TrainingManager:
    """
    Manages the fine-tuning process for MNEMOS.
    Prepares configurations and handles training script execution.
    """

    def __init__(self, model_id: str = "meta-llama/Llama-2-7b-hf"):
        self.model_id = model_id
        self.output_dir = settings.ARTIFACTS_DIR / "checkpoints"

    def generate_training_command(
        self, 
        dataset_path: Path,
        batch_size: int = 4,
        epochs: int = 3,
        learning_rate: float = 2e-4
    ) -> str:
        """
        Generates a shell command to execute the training script.
        This allows the user to run it in a specialized environment (Colab/GPU).
        """
        cmd = (
            f"python -m core.training.train_script "
            f"--model_id {self.model_id} "
            f"--dataset_path {dataset_path} "
            f"--output_dir {self.output_dir} "
            f"--batch_size {batch_size} "
            f"--epochs {epochs} "
            f"--lr {learning_rate}"
        )
        return cmd

    def run_training_local(self, dataset_path: Path) -> bool:
        """
        Attempt to run training locally if resources are available.
        Returns True if process started successfully.
        """
        logger.warning("Local training requested. Ensure you have sufficient VRAM (12GB+ for 7B models).")
        
        # Check for dependencies
        try:
            import trl
            import peft
            logger.debug("Training dependencies verified.")
        except ImportError:
            logger.error("Missing dependencies. Run: uv add trl peft transformers accelerate")
            return False

        cmd = self.generate_training_command(dataset_path)
        logger.info(f"Executing: {cmd}")
        
        import subprocess
        try:
            # We run it as a broad subprocess call to allow the environment's python to run
            # In a production app, we might use a task queue like Celery.
            process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logger.info(f"Training process started (PID: {process.pid})")
            return True
        except Exception as e:
            logger.error(f"Failed to start training: {e}")
            return False
