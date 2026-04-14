from typing import Optional, Any
from loguru import logger
from core.training.registry import WeightRegistry, CheckpointMetadata

class PersonaLoader:
    """
    Orchestrates the loading of fine-tuned personality weights (LoRA adapters).
    Silicon Valley Grade: Modular weight swapping for multi-persona support.
    """

    def __init__(self, registry: Optional[WeightRegistry] = None):
        self.registry = registry or WeightRegistry()

    def get_active_checkpoint(self) -> Optional[CheckpointMetadata]:
        """Returns the metadata for the currently active persona weights."""
        for cp in self.registry.checkpoints.values():
            if cp.is_active:
                return cp
        return self.registry.get_latest()

    def load_active_adapter(self, engine: Any):
        """
        Stub for loading the active LoRA adapter into the LLM engine.
        (In production, this calls peft.PeftModel.from_pretrained)
        """
        checkpoint = self.get_active_checkpoint()
        if not checkpoint:
            logger.info("No fine-tuned persona weights found. Running in Zero-shot Cognitive Mode.")
            return

        logger.success(f"Loading Persona Weights: {checkpoint.id} (Base: {checkpoint.base_model})")
        # In actual integration:
        # engine.load_adapter(checkpoint.path)
        return checkpoint
