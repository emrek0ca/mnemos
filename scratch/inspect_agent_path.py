import sys
from core.cognition.agent import MnemosAgent
import inspect

print(f"Python path: {sys.path}")
print(f"MnemosAgent file: {inspect.getfile(MnemosAgent)}")
print(f"Process signature: {inspect.signature(MnemosAgent.process)}")
