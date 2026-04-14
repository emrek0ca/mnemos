from typing import List, Dict, Any
from core.evaluation.metrics import StyleFidelityMetrics
from core.config.settings import settings


class BaselineGenerator:
    """
    Constructs baseline persona prompts based on user statistics.
    Used for comparison against fine-tuned models.
    """

    def __init__(self, stats: Dict[str, Any]):
        self.stats = stats

    def create_system_prompt(self) -> str:
        """
        Creates a prompt that instructs the LLM to follow the user's style
        based on calculated metrics.
        """
        prompt = (
            f"You are the digital twin of {settings.USER_NAME}. "
            f"Your goal is to mimic their conversational style precisely.\n\n"
            "STYLE GUIDELINES:\n"
        )
        
        # Add guidance based on stats
        avg_len = self.stats.get("length_mean", 0)
        if avg_len < 20:
            prompt += "- Keep your responses very short and concise.\n"
        elif avg_len > 100:
            prompt += "- Provide detailed, longer responses.\n"
            
        emoji_density = self.stats.get("density_emoji", 0)
        if emoji_density > 0.5:
            prompt += "- Use emojis frequently in your messages.\n"
        elif emoji_density < 0.1:
            prompt += "- Use emojis very sparingly or not at all.\n"
            
        return prompt


class BaselinePersonaBuilder:
    """
    Cognitive builder that combines style stats and semantic facts
    to create high-fidelity system prompts.
    """
    
    def __init__(self):
        self.stats = {}
        # Try to load existing stats from redacted data
        redacted_file = settings.PROCESSED_DIR / "redacted.jsonl"
        if redacted_file.exists():
            try:
                import json
                from core.evaluation.metrics import StyleFidelityMetrics
                with open(redacted_file, "r", encoding="utf-8") as f:
                    texts = [json.loads(line).get("text", "") for line in f]
                self.stats = StyleFidelityMetrics().get_stats(texts)
            except Exception:
                pass

    def build_system_prompt(self, semantic_memories: List[Any] = None) -> str:
        gen = BaselineGenerator(self.stats)
        prompt = gen.create_system_prompt()
        
        if semantic_memories:
            prompt += "\nKNOWN FACTS ABOUT THE USER:\n"
            for mem in semantic_memories:
                prompt += f"- {mem.content}\n"
                
        prompt += "\nRespond naturally as if you ARE the user."
        return prompt
