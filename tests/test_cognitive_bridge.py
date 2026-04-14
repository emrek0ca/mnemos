import pytest
from core.memory.controller import MemoryController
from core.orchestration.bridge import MnemosBridge

def test_bridge_privacy_isolation(tmp_path):
    storage = tmp_path / "semantic.jsonl"
    mem = MemoryController()
    mem.semantic.storage_path = storage
    mem.semantic.knowledge = {}
    
    # Add a private fact
    mem.semantic.add_fact("My password is 123", category="secret", visibility="private", status="verified")
    
    # Add a public fact
    mem.semantic.add_fact("The sky is blue", category="physics", visibility="public", status="verified")
    
    bridge = MnemosBridge(mem)
    graph = bridge.get_public_knowledge_graph()
    
    # Verify isolation
    facts = [f["fact"] for f in graph]
    assert "The sky is blue" in facts
    assert "My password is 123" not in facts

def test_bridge_knowledge_sync(tmp_path):
    storage = tmp_path / "receiver.jsonl"
    # Setup receiver
    mem_receiver = MemoryController()
    mem_receiver.semantic.storage_path = storage
    mem_receiver.semantic.knowledge = {}
    
    bridge_receiver = MnemosBridge(mem_receiver)
    
    # Peer knowledge to sync
    peer_facts = [
        {"id": "sem_1", "fact": "Earth is round", "category": "geography", "confidence": 1.0, "status": "verified", "visibility": "public"}
    ]
    
    count = bridge_receiver.sync_from_peer(peer_facts)
    assert count == 1
    
    # Verify it entered the review queue as PRIVATE
    synced = mem_receiver.semantic.lookup("Earth is round")
    assert synced.status == "pending_review"
    assert synced.visibility == "private"
    assert synced.metadata["imported_from_peer"] is True
