import pytest
from core.orchestration.lattice import MnemosLattice
from core.plugins.handshake import HandshakePlugin

def test_cognitive_handshake_anchor_verification():
    plugin = HandshakePlugin(secret_salt="mnemos_test_salt")
    
    fact = "Emre is a Silicon Valley engineer"
    remote_anchor = plugin.generate_anchor(fact)
    
    # Verify that a matching local fact produces the same anchor
    assert plugin.verify_remote_anchor(fact, remote_anchor) is True
    
    # Verify that a non-matching fact fails
    assert plugin.verify_remote_anchor("Emre is a doctor", remote_anchor) is False

def test_lattice_swarm_task_dispatch():
    lattice = MnemosLattice(node_id="node_a")
    
    task_desc = "Verify if global temperature is rising"
    task_id = lattice.propose_swarm_task(task_desc)
    
    assert task_id.startswith("swarm_")
    status = lattice.get_lattice_status()
    assert status["pending_tasks"] == 1
    assert status["connectivity"] == "optimal"

def test_lattice_peer_discovery():
    lattice = MnemosLattice(node_id="node_a")
    peers = lattice.discover_peers()
    
    assert len(peers) >= 2
    assert peers[0]["reputation"] > 0.9
