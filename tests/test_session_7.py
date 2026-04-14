import pytest
from core.memory.procedural import ProceduralMemoryController
from core.utils.telemetry import telemetry

def test_procedural_habit_capture():
    controller = ProceduralMemoryController()
    controller.capture_habit("test_habit", "Testing", {"key": "val"})
    assert len(controller.patterns) > 0
    assert controller.patterns[-1].pattern_name == "test_habit"

def test_telemetry_recording():
    initial_turns = telemetry.total_turns
    telemetry.record_turn(100.0, 5)
    assert telemetry.total_turns == initial_turns + 1
    report = telemetry.get_health_report()
    assert report["avg_latency_ms"] > 0
    assert report["memory_hit_rate"] >= 0

def test_procedural_analysis_concise():
    controller = ProceduralMemoryController()
    # Mock some short messages
    short_messages = ["hi", "ok", "yes", "no", "sure", "thanks"]
    controller.analyze_recent_batch(short_messages)
    # Check if a 'verbosity' habit was captured
    verbosity_habits = [p for p in controller.patterns if p.pattern_name == "verbosity"]
    assert len(verbosity_habits) > 0
    assert verbosity_habits[-1].parameters["mode"] == "laconic"
