"""
Inference engine with pluggable LLM backends.

Supported backends (set INFERENCE_BACKEND in .env or environment):
  anthropic  — Anthropic Claude API (requires ANTHROPIC_API_KEY)
  openai     — OpenAI-compatible API (requires OPENAI_API_KEY)
  ollama     — Local Ollama server (requires running `ollama serve`)
  stub       — Returns placeholder text; useful for offline testing
"""

from typing import List, Optional, Any
from loguru import logger
from core.config.settings import settings

import threading
import asyncio
import base64
from core.cognition.models import ConsolidatedMemory, SemanticFact

_global_engine = None

class InferenceEngine:
    """
    Generates responses for the MNEMOS digital twin.
    Delegates to the configured backend; mode controls prompt construction.
    Now evolved with System 2 Reflection (Consolidation) and Singleton Pattern.
    """

    def __new__(cls, *args, **kwargs):
        global _global_engine
        if _global_engine is None:
            _global_engine = super(InferenceEngine, cls).__new__(cls)
            _global_engine._initialized = False
        return _global_engine

    def __init__(self, mode: str = "baseline", model_path: Optional[str] = None):
        if self._initialized: return
        self.mode = mode
        self.model_path = model_path
        self.baseline_gen = None
        self._lock = threading.Lock()
        self._initialized = True

    def consolidate(self, episodes: List[Any], user_id: Optional[str] = None) -> ConsolidatedMemory:
        """
        Extracts structured semantic facts from a batch of episodic memories.
        Now enhanced with Multi-Modal Vision Anchoring.
        """
        logger.info(f"Initiating System 2 Reflection on {len(episodes)} episodes...")
        
        # 1. Inspect for Visual Stimuli
        vision_insights = []
        media_mapping = {} # Map extracted facts to media
        
        for ep in episodes:
            media_uri = ep.metadata.get("media_uri")
            if media_uri and user_id:
                # Resolve physical path
                filename = media_uri.split('/')[-1]
                path = settings.ARTIFACTS_DIR / "users" / user_id / "media" / filename
                
                if path.exists():
                    try:
                        with open(path, "rb") as image_file:
                            b64 = base64.b64encode(image_file.read()).decode('utf-8')
                        insight = self.generate_with_vision(
                            "Extract 1-3 core semantic facts from this image accurately.",
                            b64,
                            system_prompt="You are a meticulous visual analyst for MNEMOS."
                        )
                        vision_insights.append(f"[Visual Anchor {media_uri}]: {insight}")
                        media_mapping[insight] = media_uri
                    except Exception as ve:
                        logger.error(f"Perceptual failure on {media_uri}: {ve}")
        
        # 2. Build the extraction prompt
        history_text = "\n".join([f"[{e.sender_id}]: {e.content}" for e in episodes])
        vision_text = "\n".join(vision_insights)
        
        prompt = f"""
        Analyze the conversation history and the provided Visual Insights.
        Extract NEW semantic facts, preferences, or visual truths.
        Return ONLY a JSON object in this format:
        {{
            "new_facts": [
                {{
                    "fact": "The user's favorite color is blue", 
                    "confidence": 0.9, 
                    "category": "preference",
                    "visual_provenance": null
                }},
                {{
                    "fact": "The user has a blueprint for a reactor", 
                    "confidence": 0.95, 
                    "category": "knowledge",
                    "visual_provenance": "/media/users/..."
                }}
            ]
        }}
        
        History:
        {history_text}
        
        Visual Insights:
        {vision_text}
        """
        
        # 3. Call backend
        try:
            with self._lock:
                raw_response = self._call_backend([prompt], system_prompt="You are a meticulous forensic memory analyst.")
            
            import json, re
            match = re.search(r"\{.*\}", raw_response, re.DOTALL)
            if match:
                data = json.loads(match.group())
                facts = []
                for f in data.get("new_facts", []):
                    # Link media provenance if extracted from vision_insights or explicitly mentioned
                    media_uri = f.get("visual_provenance")
                    
                    facts.append(SemanticFact(
                        fact=f["fact"],
                        confidence=f["confidence"],
                        category=f.get("category", "general"),
                        source_ids=[e.id for e in episodes],
                        original_media_uri=media_uri
                    ))
                return ConsolidatedMemory(new_facts=facts)
        except Exception as e:
            logger.error(f"Inference Consolidation Failed: {e}")
            
        return ConsolidatedMemory(new_facts=[])

    def synthesize_behavioral_dna(self, episodes: List[Any]) -> Dict[str, float]:
        """
        Analyzes the conversational tone, logic, and warmth to synthesize 
        behavioral DNA markers. High-fidelity identity distilling.
        """
        logger.info(f"Synthesizing Behavioral DNA from {len(episodes)} episodes...")
        
        history_text = "\n".join([f"[{e.sender_id}]: {e.content}" for e in episodes])
        prompt = f"""
        Analyze the conversation history and characterize the USER'S personality markers.
        Return a JSON object with scores from 0.0 to 1.0 for:
        - rationality (Logic/Fact-driven vs Emotion/Intuition-driven)
        - resonance (Warmth/Empathy vs Professional/Detached)
        - technical_depth (Detailed/Domain-specific vs General/Surface-level)
        - formality (Polite/Structured vs Casual/Slang)
        - lexical_complexity (Sophisticated vocabulary vs Simple/Direct)
        
        Return ONLY the JSON.
        
        History:
        {history_text}
        """
        
        try:
            with self._lock:
                raw_response = self._call_backend([prompt], system_prompt="You are a meticulous behavioral psychologist and identity analyst.")
            
            import json, re
            match = re.search(r"\{.*\}", raw_response, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return {
                    "rationality": float(data.get("rationality", 0.5)),
                    "resonance": float(data.get("resonance", 0.5)),
                    "technical_depth": float(data.get("technical_depth", 0.5)),
                    "formality": float(data.get("formality", 0.5)),
                    "lexical_complexity": float(data.get("lexical_complexity", 0.5))
                }
        except Exception as e:
            logger.error(f"DNA Synthesis Failed: {e}")
            
        return {}

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

        with self._lock:
            return self._call_backend(context, system_prompt)

    def generate_with_vision(self, prompt: str, base64_image: str, system_prompt: Optional[str] = None) -> str:
        """
        Specialized visual reasoning path.
        """
        if settings.INFERENCE_BACKEND != "groq":
            return "Vision currently only supported via Groq back-end."
        
        with self._lock:
            return self._groq_vision(prompt, base64_image, system_prompt)

    def analyze_visual_resonance(self, base64_image: str) -> Dict[str, float]:
        """
        Specialized vision path to extract 'vibe' and emotional markers.
        Used to feed the Visual Affect Bridge.
        """
        prompt = """
        Describe the 'emotional atmosphere' and 'visual energy' of this image.
        Focus on mood, intensity, and valence.
        Return ONLY a JSON object: {"description": "...", "tags": ["serene", "intense", etc]}
        """
        try:
            raw = self.generate_with_vision(prompt, base64_image, system_prompt="You are a meticulous visual psychologist.")
            import json, re
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                data = json.loads(match.group())
                # Note: The mapping to scores happens in MnemosAffect.analyze_image_pulse
                return data
        except Exception as e:
            logger.error(f"Visual Resonance Failure: {e}")
        return {"description": "neutral grey", "tags": []}

    def mediate_swarm(self, contributions: Dict[str, str]) -> str:
        """
        High-fidelity synthesis of conflicting swarm contributions.
        Acts as the final arbiter for the Consensus Engine 2.0.
        """
        nodes_text = "\n".join([f"Node [{nid}]: {resp}" for nid, resp in contributions.items()])
        
        prompt = f"""
        You are the Supreme Arbiter of the MNEMOS Neural Swarm.
        Below are multiple proposed responses from peer cognitive nodes.
        Your task is to SYNTHESIZE them into a single, unified, high-fidelity response.
        
        GUIDELINES:
        1. Resolve any factual contradictions by choosing the most logical path.
        2. Merge stylistic elements into a cohesive tone.
        3. Eliminate redundancy.
        4. Do NOT mention that you are a swarm or that there were multiple responses.
        
        SWARM CONTRIBUTIONS:
        {nodes_text}
        
        SYNTHESIZED RESPONSE:
        """
        
        try:
            # We use the primary reasoning node (highest weight) for mediation
            with self._lock:
                return self._call_backend([prompt], system_prompt="You are a meticulous synthesis specialist and high-fidelity mediator.")
        except Exception as e:
            logger.error(f"Swarm Mediation Failed: {e}")
            # Fallback to the highest reputation response
            return list(contributions.values())[0]

    async def swarm_generate(self, context: List[str], system_prompt: Optional[str] = None, active_nodes: Optional[List[Dict[str, Any]]] = None) -> Tuple[Dict[str, str], Dict[str, bool], Dict[str, float]]:
        """
        Parallel dispatch to active swarm nodes with Spinal Resilience & Health Reporting.
        Returns Tuple[contributions, performance_map, latency_map].
        """
        import asyncio
        nodes = active_nodes if active_nodes is not None else settings.SWARM_NODES
        logger.info(f"Broadcasting to Neural Swarm ({len(nodes)} nodes)...")
        
        tasks = [self._safe_node_generate(node, context, system_prompt) for node in nodes]
        results = await asyncio.gather(*tasks)
        
        # Filter for successful responses
        swarm_results = {nid: resp for nid, resp, success, lat in results if success}
        performance_map = {nid: success for nid, resp, success, lat in results}
        latency_map = {nid: lat for nid, resp, success, lat in results}
        
        if not swarm_results:
            logger.error("Swarm Parity Critical: All nodes distorted.")
            primary_res = self.generate(context, system_prompt)
            return {"fail-safe": primary_res}, {"fail-safe": True}, {"fail-safe": 0.0}
            
        return swarm_results, performance_map, latency_map

    async def _safe_node_generate(self, node: Dict[str, Any], context: List[str], system_prompt: Optional[str]) -> Tuple[str, str, bool, float]:
        """Dispatches to a node and returns (node_id, response, success_flag, latency_ms)."""
        import asyncio
        import time
        node_id = node["id"]
        backend = node["backend"]
        timeout = 3.0 if node.get("role") == "velocity" else 12.0
        
        start_time = time.time()
        try:
            async def task():
                return await asyncio.to_thread(self._call_specific_backend, backend, context, system_prompt or "")
                
            response = await asyncio.wait_for(task(), timeout=timeout)
            latency = (time.time() - start_time) * 1000
            return node_id, response, True, latency
        except asyncio.TimeoutError:
            latency = (time.time() - start_time) * 1000
            logger.warning(f"Swarm Pruning: Node {node_id} ({backend}) timed out.")
            return node_id, "[Timeout] Unresponsive", False, latency
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Swarm Distortion: Node {node_id} ({backend}) failed: {e}")
            return node_id, f"[Error] {str(e)}", False, latency

    def _call_specific_backend(self, backend: str, context: List[str], system_prompt: str) -> str:
        """Isolated backend routing for swarm nodes."""
        if backend == "anthropic": return self._anthropic(context, system_prompt)
        if backend == "openai": return self._openai(context, system_prompt)
        if backend == "ollama": return self._ollama(context, system_prompt)
        if backend == "groq": return self._groq(context, system_prompt)
        return "[Unknown Backend]"

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
        elif backend == "groq":
            return self._groq(context, system_prompt)
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
    # Groq backend (Hyper-fast, OpenAI-compatible)
    # ------------------------------------------------------------------

    def _groq(self, context: List[str], system_prompt: str) -> str:
        try:
            from openai import OpenAI
        except ImportError:
            raise RuntimeError("openai package not installed (used for Groq). Run: uv add openai")

        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set.")

        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )
        messages = [{"role": "system", "content": system_prompt}] + _build_chatml_messages(context)

        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            max_tokens=settings.MAX_TOKENS,
            temperature=settings.TEMPERATURE,
        )
        return response.choices[0].message.content

    def _groq_vision(self, prompt: str, base64_image: str, system_prompt: str) -> str:
        from openai import OpenAI
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=settings.GROQ_API_KEY)
        
        messages = [
            {"role": "system", "content": system_prompt or "You are a digital twin with visual perception."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    }
                ]
            }
        ]
        
        response = client.chat.completions.create(
            model=settings.GROQ_VISION_MODEL,
            messages=messages,
            max_tokens=settings.MAX_TOKENS
        )
        return response.choices[0].message.content


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
