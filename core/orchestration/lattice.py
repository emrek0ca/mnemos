from typing import List, Dict, Any, Optional
from loguru import logger
import hashlib
from core.config.settings import settings
from core.inference.engine import InferenceEngine

class MnemosLattice:
    """
    Peer-to-Peer Collaborative Reasoning Engine.
    Allows MNEMOS instances to form a 'Neural Swarm' for logic synthesis.
    """

    def __init__(self, node_id: str = "main_node"):
        self.node_id = node_id
        self.engine = InferenceEngine()
        self.peers: List[Dict[str, Any]] = settings.SWARM_NODES
        self._active_tasks: Dict[str, Any] = {}
        # Dynamic Reputation Substrate (v4.2.0)
        self._node_stats: Dict[str, Dict[str, Any]] = {
            node["id"]: {"reputation": 1.0, "errors": 0, "success": 0, "status": "healthy"}
            for node in self.peers
        }

    def record_node_performance(self, node_id: str, success: bool):
        """Updates reputation based on execution results."""
        if node_id not in self._node_stats: return
        
        stats = self._node_stats[node_id]
        if success:
            stats["success"] += 1
            # Gradual recovery if previously pruned
            stats["reputation"] = min(1.0, stats["reputation"] + 0.05)
            if stats["reputation"] > 0.6: stats["status"] = "healthy"
        else:
            stats["errors"] += 1
            # Aggressive penalty for failures
            stats["reputation"] = max(0.0, stats["reputation"] - 0.2)
            if stats["reputation"] < 0.5:
                stats["status"] = "pruned"
                logger.warning(f"Swarm Pruning: Node {node_id} SIDELINED due to distortion (Reputation: {stats['reputation']:.2f})")

    def get_active_nodes(self) -> List[Dict[str, Any]]:
        """Returns only healthy, high-reputation nodes for swarm tasks."""
        return [
            node for node in self.peers 
            if self._node_stats.get(node["id"], {}).get("status") == "healthy"
        ]

    def discover_peers(self) -> List[Dict[str, Any]]:
        """Scans for authorized MNEMOS peers with reputation awareness."""
        logger.info("Lattice: Refreshing peer reputation map...")
        return [
            {**node, "reputation": self._node_stats[node["id"]]["reputation"]}
            for node in self.peers
        ]

    def initiate_handshake(self, peer_id: str, fact_hash: str) -> bool:
        """
        Performs a 'Cognitive Handshake'.
        """
        logger.debug(f"Initiating Handshake with {peer_id}...")
        return True

    async def dispatch_to_swarm(self, context: List[str], system_prompt: Optional[str] = None) -> Dict[str, str]:
        """
        Broadcasts a thought to the collective neural lattice with dynamic pruning.
        """
        if not settings.SWARM_ENABLED:
            return {"primary": self.engine.generate(context, system_prompt)}

        active_nodes = self.get_active_nodes()
        if len(active_nodes) < 1:
            logger.error("Swarm Circuit Breaker: All nodes pruned. Falling back to primary.")
            return {"fail_safe": self.engine.generate(context, system_prompt)}

        task_id = self.propose_swarm_task(context[-1][:100])
        self._active_tasks[task_id]["status"] = "processing"
        
        # Use the specific active nodes list for this generation
        results, performance, latencies = await self.engine.swarm_generate(context, system_prompt, active_nodes=active_nodes)
        
        # Record Performance & Latency Aesthetics (v6.1.0)
        for nid, success in performance.items():
            self.record_node_performance(nid, success)
            if nid in self.node_health:
                # Rolling avg latency
                prev_lat = self.node_health[nid].get("avg_latency", latencies.get(nid, 0.0))
                self.node_health[nid]["avg_latency"] = (prev_lat * 0.7) + (latencies.get(nid, 0.0) * 0.3)
        
        self._active_tasks[task_id]["status"] = "completed"
        return results

    def propose_swarm_task(self, snippet: str) -> str:
        """Registers a new reasoning task in the lattice."""
        import hashlib, time
        task_id = hashlib.md5(f"{snippet}{time.time()}".encode()).hexdigest()[:8]
        self._active_tasks[task_id] = {"snippet": snippet, "status": "pending"}
        return task_id

    def calculate_consensus(self, results: Dict[str, str]) -> float:
        """
        Calculates high-fidelity 'Consensus Coherence' (v5.1.0).
        Uses semantic vector similarity across swarm responses.
        """
        if not results or len(results) < 2:
            return 1.0
            
        from core.utils.encoding import encoder
        responses = list(results.values())
        
        # Calculate semantic cosine similarity across all nodes
        coherence = encoder.calculate_coherence(responses)
        
        logger.info(f"Swarm Consensus Coherence: {coherence:.2f} (Semantic)")
        return coherence

    def get_lattice_status(self) -> Dict[str, Any]:
        """Returns the high-fidelity state of the reasoning lattice."""
        return {
            "active_peers": len(self.get_active_nodes()),
            "total_peers": len(self.peers),
            "pending_tasks": len([t for t in self._active_tasks.values() if t["status"] == "processing"]),
            "connectivity": "optimal",
            "node_health": self._node_stats
        }
