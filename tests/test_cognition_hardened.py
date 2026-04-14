import pytest
from core.cognition.agent import MnemosAgent
from core.cognition.models import CognitivePacket, ReasoningChain

def test_agent_process_returns_string():
    agent = MnemosAgent(model_mode="baseline")
    response = agent.process("Hello twin!")
    assert isinstance(response, str)
    assert len(response) > 0

def test_cognitive_packet_validation():
    # Verify manual instantiation
    reasoning = ReasoningChain(
        observation="Input detected",
        thought="Processing",
        action="Generate"
    )
    packet = CognitivePacket(
        user_input="Test",
        agent_response="Response",
        context_used=["ctx1"],
        semantic_facts=["fact1"],
        reasoning=reasoning
    )
    assert packet.user_input == "Test"
    assert packet.reasoning.thought == "Processing"

def test_agent_turn_counting():
    agent = MnemosAgent(model_mode="baseline", consolidation_interval=2)
    assert agent.turn_count == 0
    agent.process("one")
    assert agent.turn_count == 1
    agent.process("two")
    assert agent.turn_count == 2
