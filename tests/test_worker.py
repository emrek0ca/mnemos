import time
import pytest
from core.orchestration.worker import MnemosWorker

def test_worker_task_execution():
    worker = MnemosWorker(interval_sec=1)
    
    # Mock task
    execution_flag = {"done": False}
    def mock_task():
        execution_flag["done"] = True

    worker.add_task(mock_task)
    worker.start()
    
    # Wait for interval
    time.sleep(1.5)
    
    status = worker.get_status()
    assert status["tasks_processed"] >= 1
    assert execution_flag["done"] is True
    
    worker.stop()

def test_worker_failure_resilience():
    worker = MnemosWorker(interval_sec=1)
    
    def failing_task():
        raise ValueError("Simulated Task Failure")
        
    worker.add_task(failing_task)
    worker.start()
    
    time.sleep(1.5)
    
    status = worker.get_status()
    assert status["failed_tasks"] >= 1
    assert status["active"] is True
    
    worker.stop()
