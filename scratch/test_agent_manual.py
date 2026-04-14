import sys
import os
sys.path.insert(0, os.getcwd())

from core.cognition.agent import MnemosAgent

print("Creating Agent...")
agent = MnemosAgent(model_mode="baseline")
print("Agent created.")
print(f"Memory: {agent.memory}")

print("Calling process...")
try:
    res = agent.process("Hello twin!")
    print(f"Result: {res}")
except Exception as e:
    import traceback
    traceback.print_exc()
