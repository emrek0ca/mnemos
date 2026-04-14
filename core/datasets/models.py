from typing import List, Optional
from pydantic import BaseModel, Field


class SFTExample(BaseModel):
    """
    Standard Supervised Fine-Tuning example format.
    Adaptable to ChatML or Alpaca.
    """
    instruction: str = Field(..., description="The system or task instruction")
    context: List[str] = Field(default_factory=list, description="Previous conversation turns")
    response: str = Field(..., description="The target response from the user")

    def to_chatml(self, system_prompt: str = "You are a digital twin of a human user.") -> List[dict]:
        """Converts to OpenAI/ChatML format."""
        messages = [{"role": "system", "content": system_prompt}]
        
        for i, turn in enumerate(self.context):
            role = "user" if i % 2 == 0 else "assistant"
            messages.append({"role": role, "content": turn})
            
        messages.append({"role": "assistant", "content": self.response})
        return messages


class DatasetMetadata(BaseModel):
    source_file: str
    total_samples: int
    min_context_window: int
    max_context_window: int
    pruned_samples: int
