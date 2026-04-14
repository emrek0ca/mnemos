import json
import random
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger

from core.datasets.models import SFTExample
from core.config.settings import settings


class DatasetBuilder:
    def __init__(
        self, 
        context_window: int = 5, 
        min_response_length: int = 5,
        val_split: float = 0.1
    ):
        self.context_window = context_window
        self.min_response_length = min_response_length
        self.val_split = val_split

    def is_valid_response(self, text: str) -> bool:
        """Filters out short or low-value messages."""
        if len(text.strip()) < self.min_response_length:
            return False
        # Filter out common low-value patterns
        low_value_phrases = ["ok", "tamam", "nice", "yes", "no", "valla", "aynen"]
        if text.lower().strip() in low_value_phrases:
            return False
        return True

    def build_examples(self, input_path: Path) -> List[SFTExample]:
        """
        Converts sequence of messages into SFT examples using sliding windows.
        Now context-aware: context includes peer messages, response is always user.
        """
        logger.info(f"Building dataset from {input_path}")
        
        with open(input_path, "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f]
        
        examples = []
        # messages are in chronological order
        for i in range(len(lines)):
            current_msg = lines[i]
            
            # Predict only messages sent by the target user
            if not current_msg.get("is_mine", False):
                continue
            
            text = current_msg.get("text", "")
            if not self.is_valid_response(text):
                continue
                
            # Get previous messages as context (up to context_window)
            start_idx = max(0, i - self.context_window)
            context_messages = lines[start_idx:i]
            
            # Format context with sender indicators
            # "Mine: ..." or "Peer: ..."
            context_texts = []
            for m in context_messages:
                prefix = "Mine: " if m.get("is_mine") else "Peer: "
                context_texts.append(f"{prefix}{m.get('text', '')}")
            
            example = SFTExample(
                instruction=f"Respond in the style of {settings.USER_NAME}.",
                context=context_texts,
                response=text
            )
            examples.append(example)
            
        logger.info(f"Created {len(examples)} context-aware examples.")
        return examples

    def save_split(self, examples: List[SFTExample], output_dir: Path):
        """Saves examples into train/val JSONL files."""
        random.shuffle(examples)
        split_idx = int(len(examples) * (1 - self.val_split))
        
        train_set = examples[:split_idx]
        val_set = examples[split_idx:]
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        self._write_jsonl(train_set, output_dir / "train.jsonl")
        self._write_jsonl(val_set, output_dir / "val.jsonl")
        
        logger.success(f"Saved {len(train_set)} training samples and {len(val_set)} validation samples.")

    def _write_jsonl(self, examples: List[SFTExample], path: Path):
        with open(path, "w", encoding="utf-8") as f:
            for ex in examples:
                # We save in ChatML-style ready dictionary for common trainers
                f.write(json.dumps(ex.model_dump(), ensure_ascii=False) + "\n")


if __name__ == "__main__":
    builder = DatasetBuilder()
    redacted_file = settings.PROCESSED_DIR / "redacted.jsonl"
    if redacted_file.exists():
        examples = builder.build_examples(redacted_file)
        builder.save_split(examples, settings.DATASETS_DIR)
