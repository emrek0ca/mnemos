"""
Inference engine with pluggable LLM backends.

Supported backends (set INFERENCE_BACKEND in .env or environment):
  anthropic  — Anthropic Claude API (requires ANTHROPIC_API_KEY)
  openai     — OpenAI-compatible API (requires OPENAI_API_KEY)
  ollama     — Local Ollama server (requires running `ollama serve`)
  stub       — Returns placeholder text; useful for offline testing
"""

from typing import List, Optional
from loguru import logger

from core.adaptation.baseline import BaselineGenerator
from core.config.settings import settings


class InferenceEngine:
    """
    Generates responses for the MNEMOS digital twin.
    Delegates to the configured backend; mode controls prompt construction.
    """

    def __init__(self, mode: str = "baseline", model_path: Optional[str] = None):
        self.mode = mode
        self.model_path = model_path
        self.baseline_gen: Optional[BaselineGenerator] = None

    def setup_baseline(self, stats: dict) -> None:
        """Initialises the baseline generator with computed style statistics."""
        self.baseline_gen = BaselineGenerator(stats)

    def generate(self, context: List[str], system_prompt: Optional[str] = None) -> str:
        """
        Generates a response given a conversation context list.

        Args:
            context: Ordered list of conversation turns (alternating user/assistant).
            system_prompt: Override system prompt. If None, baseline prompt is used.
        """
        if self.mode == "baseline":
            if system_prompt is None:
                if not self.baseline_gen:
                    raise ValueError(
                        "No system_prompt provided and baseline_gen not initialised. "
                        "Call setup_baseline() first or provide a prompt."
                    )
                system_prompt = self.baseline_gen.create_system_prompt()

        elif self.mode == "finetuned":
            if not self.model_path:
                raise ValueError("model_path required for finetuned mode.")
            logger.info(f"Fine-tuned mode — model: {self.model_path}")
            system_prompt = system_prompt or f"You are a digital twin of {settings.USER_NAME}."

        else:
            raise ValueError(f"Unknown inference mode: {self.mode}")

        return self._call_backend(context, system_prompt)

    # ------------------------------------------------------------------
    # Backend routing
    # ------------------------------------------------------------------

    def _call_backend(self, context: List[str], system_prompt: str) -> str:
        backend = settings.INFERENCE_BACKEND
        logger.debug(f"Inference backend: {backend}")

        if backend == "anthropic":
            return self._anthropic(context, system_prompt)
        elif backend == "openai":
            return self._openai(context, system_prompt)
        elif backend == "ollama":
            return self._ollama(context, system_prompt)
        else:  # stub
            logger.warning("Using stub backend. Set INFERENCE_BACKEND in .env to enable real LLM.")
            preview = context[-1][:60] if context else ""
            return f"[STUB] Would respond to: '{preview}...'"

    # ------------------------------------------------------------------
    # Anthropic backend
    # ------------------------------------------------------------------

    def _anthropic(self, context: List[str], system_prompt: str) -> str:
        try:
            import anthropic
        except ImportError:
            raise RuntimeError(
                "anthropic package not installed. Run: uv add anthropic"
            )

        api_key = settings.ANTHROPIC_API_KEY
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY not set. Add it to .env or environment."
            )

        client = anthropic.Anthropic(api_key=api_key)
        messages = _build_chatml_messages(context)

        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=settings.MAX_TOKENS,
            temperature=settings.TEMPERATURE,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

    # ------------------------------------------------------------------
    # OpenAI-compatible backend (also works with local LM Studio, etc.)
    # ------------------------------------------------------------------

    def _openai(self, context: List[str], system_prompt: str) -> str:
        try:
            from openai import OpenAI
        except ImportError:
            raise RuntimeError(
                "openai package not installed. Run: uv add openai"
            )

        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set.")

        client = OpenAI(api_key=api_key)
        messages = [{"role": "system", "content": system_prompt}] + _build_chatml_messages(context)

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=settings.MAX_TOKENS,
            temperature=settings.TEMPERATURE,
        )
        return response.choices[0].message.content

    # ------------------------------------------------------------------
    # Ollama backend (local, privacy-first)
    # ------------------------------------------------------------------

    def _ollama(self, context: List[str], system_prompt: str) -> str:
        try:
            import httpx
        except ImportError:
            raise RuntimeError(
                "httpx package not installed. Run: uv add httpx"
            )

        messages = [{"role": "system", "content": system_prompt}] + _build_chatml_messages(context)
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": settings.TEMPERATURE,
                "num_predict": settings.MAX_TOKENS,
            },
        }

        try:
            resp = httpx.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
                timeout=120.0,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]
        except httpx.ConnectError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                "Ensure `ollama serve` is running."
            )


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _build_chatml_messages(context: List[str]) -> List[dict]:
    """
    Converts a flat list of turns into alternating user/assistant messages.
    Index 0, 2, 4 … → user; index 1, 3, 5 … → assistant.
    """
    messages = []
    for i, turn in enumerate(context):
        role = "user" if i % 2 == 0 else "assistant"
        messages.append({"role": role, "content": turn})
    return messages
