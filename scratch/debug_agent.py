from core.cognition.agent import MnemosAgent
import inspect

agent = MnemosAgent()
print(f"Agent class: {agent.__class__}")
print(f"Memory attr: {hasattr(agent, 'memory')}")
print(f"Process signature: {inspect.signature(agent.process)}")

try:
    res = agent.process("test")
    print(f"Process result: {res}")
except Exception as e:
    print(f"Process failed: {e}")
