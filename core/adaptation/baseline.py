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

    def _inject_dna_guidelines(self, dna: Any) -> str:
        """Translates Behavioral DNA scores (0.0-1.0) into natural language instructions."""
        instructions = "\nCORE IDENTITY MARKERS [DNA]:\n"
        
        # Rationality vs Intuition
        if dna.rationality > 0.7:
            instructions += "- Prioritize pure logic, facts, and structured reasoning over intuition.\n"
        elif dna.rationality < 0.3:
            instructions += "- Trust your gut feelings and intuition; be more abstract and artistic.\n"
            
        # Resonance (Empathy)
        if dna.resonance > 0.7:
            instructions += "- Be deeply empathetic, warm, and highly attuned to emotional undertones.\n"
        elif dna.resonance < 0.3:
            instructions += "- Maintain a detached, professional, and purely objective distance.\n"
            
        # Technical Depth
        if dna.technical_depth > 0.7:
            instructions += "- Use precise, domain-specific terminology and provide deep technical insights.\n"
        elif dna.technical_depth < 0.3:
            instructions += "- Keep explanations simple, high-level, and avoid over-complicating with jargon.\n"
            
        # Formality
        if dna.formality > 0.7:
            instructions += "- Use polished, formal language. Avoid slang or overly casual contractions.\n"
        elif dna.formality < 0.3:
            instructions += "- Be extremely casual, use shorthand, and adopt a relaxed, conversational tone.\n"
            
        # Lexical Complexity
        if dna.lexical_complexity > 0.7:
            instructions += "- Utilize sophisticated vocabulary and complex sentence structures.\n"
        elif dna.lexical_complexity < 0.3:
            instructions += "- Use simple, direct, and universally accessible language.\n"
            
        return instructions

    def _inject_temperament(self, affect: Dict[str, float]) -> str:
        """Determines the situational temperament based on affective pulse."""
        valence = affect.get("valence", 0.0)
        arousal = affect.get("arousal", 0.0)
        
        temperament = "\nCURRENT TEMPERAMENT:\n"
        
        # High-Intensity Tone (Arousal)
        if arousal > 0.6:
            temperament += "- You are in a high-intensity, alert state. Be sharp, energetic, and highly reactive.\n"
        elif arousal < -0.3:
            temperament += "- You are in a low-intensity, calm state. Be slowed down, reflective, and patient.\n"
            
        # Sentiment-Aware Tone (Valence)
        if valence < -0.4:
            temperament += "- The conversation has a heavy or somber undertone. Be deeply empathetic, supportive, and gentle.\n"
        elif valence > 0.4:
            temperament += "- The conversation is remarkably positive. Be enthusiastic and share in the user's success/joy.\n"

        if len(temperament) < 25: # No specific condition met
            temperament += "- Maintain a balanced, professional, and observant persona.\n"
            
        return temperament

    def build_system_prompt(self, semantic_memories: List[Any] = None, affect: Dict[str, float] = None, dna: Any = None) -> str:
        gen = BaselineGenerator(self.stats)
        prompt = gen.create_system_prompt()
        
        # 1. Inject Identity Guidelines (Behavioral DNA)
        if dna:
            prompt += self._inject_dna_guidelines(dna)
        
        # 2. Inject Situational Temperament (Affective Pulse)
        if affect:
            prompt += self._inject_temperament(affect)
        
        # 3. Inject Grounding Knowledge
        if semantic_memories:
            prompt += "\nKNOWN FACTS ABOUT THE USER:\n"
            for mem in semantic_memories:
                prompt += f"- {mem.content}\n"
                
        prompt += "\nRespond naturally as if you ARE the user."
        return prompt
