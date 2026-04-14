import json
import hashlib
from typing import List, Dict, Any, Optional
from loguru import logger
from datetime import datetime

class MnemosLedger:
    """
    Immutable Truth Anchor.
    Maintains a hash-chained log of verified semantic updates to prevent corruption.
    """

    def __init__(self, ledger_path: str = "artifacts/ledger.json"):
        self.ledger_path = ledger_path
        self._chain: List[Dict[str, Any]] = self._load()

    def _load(self) -> List[Dict[str, Any]]:
        """Loads the ledger chain from disk."""
        try:
            with open(self.ledger_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return [] # New chain

    def _save(self):
        """Persists the ledger chain."""
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            json.dump(self._chain, f, indent=2, default=str)

    def anchor_fact(self, fact_id: str, fact_content: str) -> str:
        """
        Anchors a fact into the immutable chain.
        Each block contains the hash of the preceding block.
        """
        previous_hash = self._chain[-1]["current_hash"] if self._chain else "GENESIS"
        
        block_data = {
            "fact_id": fact_id,
            "content": fact_content,
            "timestamp": datetime.now().isoformat(),
            "previous_hash": previous_hash
        }
        
        # Calculate current hash
        block_str = json.dumps(block_data, sort_keys=True)
        current_hash = hashlib.sha256(block_str.encode()).hexdigest()
        
        block_data["current_hash"] = current_hash
        self._chain.append(block_data)
        self._save()
        
        logger.success(f"Ledger: Fact {fact_id} anchored. Hash: {current_hash[:8]}")
        return current_hash

    def verify_chain_integrity(self) -> bool:
        """Verifies the integrity of the entire hash chain."""
        if not self._chain:
            return True
            
        for i in range(1, len(self._chain)):
            prev = self._chain[i-1]
            curr = self._chain[i]
            
            # Recalculate prev hash to check if metadata changed
            block_copy = prev.copy()
            block_copy.pop("current_hash")
            recalc_prev = hashlib.sha256(json.dumps(block_copy, sort_keys=True).encode()).hexdigest()
            
            if recalc_prev != prev["current_hash"]:
                logger.error(f"Ledger Corruption: Block {i-1} hash mismatch!")
                return False
                
            if curr["previous_hash"] != prev["current_hash"]:
                logger.error(f"Ledger Corruption: Integrity break at block {i}!")
                return False
                
        return True
