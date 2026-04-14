# MNEMOS — Industrial Lifecycle Management
# Version: 3.2.0 (Resilient Heart)

.PHONY: help init test dashboard bot push lint clean

# Intelligent Tool Detection
UV := $(shell which uv 2> /dev/null || echo "/opt/homebrew/bin/uv")
PYTHON := $(UV) run python

help:
	@echo "🧠 MNEMOS Lifecycle commands:"
	@echo "  make init      - Initialize the environment (uv sync)"
	@echo "  make test      - Run industrial verification suite (81+ tests)"
	@echo "  make dashboard - Launch the Mnemonic Command Center"
	@echo "  make bot       - Start the Mnemos Telegram Bot"
	@echo "  make push      - Synchronize to GitHub (emrek0ca/mnemos)"
	@echo "  make clean     - Shred ephemeral artifacts and cache"

init:
	$(UV) sync

test:
	$(PYTHON) -m pytest tests/ -v

dashboard:
	$(PYTHON) -m apps.cli.main dashboard

bot:
	$(PYTHON) -m apps.cli.main bot

push:
	git add .
	git commit -m "evolution: mnemos core v$(shell python3 -c 'from core.api.server import app; print("3.2.0" if hasattr(app, "version") else "3.2.0")') | Architectural Purity 💎🚀🧠" || true
	git push origin main
	git push origin --tags

lint:
	$(PYTHON) -m ruff check . --fix
	$(PYTHON) -m black .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .ruff_cache
	@echo "✨ Environment shredded."
