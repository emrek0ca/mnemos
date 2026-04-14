import pytest
import json
from core.orchestration.ledger import MnemosLedger

def test_ledger_chain_integrity(tmp_path):
    ledger_file = tmp_path / "ledger.json"
    ledger = MnemosLedger(ledger_path=str(ledger_file))
    
    # 1. Anchor two facts
    h1 = ledger.anchor_fact("f1", "Truth A")
    h2 = ledger.anchor_fact("f2", "Truth B")
    
    # Verify initial integrity
    assert ledger.verify_chain_integrity() is True
    assert ledger._chain[1]["previous_hash"] == h1
    
    # 2. TAMPER: Manually modify the first block's content in the file
    with open(ledger_file, "r") as f:
        data = json.load(f)
    
    data[0]["content"] = "Corrupted Truth"
    
    with open(ledger_file, "w") as f:
        json.dump(data, f)
        
    # Reload and verify failure
    corrupt_ledger = MnemosLedger(ledger_path=str(ledger_file))
    assert corrupt_ledger.verify_chain_integrity() is False

def test_ledger_genesis():
    ledger = MnemosLedger(ledger_path="non_existent.json")
    h = ledger.anchor_fact("gen", "Genesis Fact")
    assert len(ledger._chain) == 1
    assert ledger._chain[0]["previous_hash"] == "GENESIS"
