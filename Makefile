# MNEMOS Cognitive Engine - Orchestration Layer

.PHONY: help setup test dashboard ingest bot clean verify

help:
	@echo "🧠 MNEMOS Command Center"
	@echo "------------------------"
	@echo "setup     : Install dependencies via uv"
	@echo "test      : Run full verification suite"
	@echo "dashboard : Launch Mnemonic Command Center (Web UI)"
	@echo "ingest    : Ingest Telegram chat export"
	@echo "bot       : Launch Telegram Bot"
	@echo "redact    : Run privacy redaction pipeline"
	@echo "verify    : Run industrial-grade project verification"

setup:
	uv sync

test:
	uv run python -m pytest tests/ -v

dashboard:
	uv run python -m apps.cli.main dashboard

ingest:
	@read -p "Path to export: " path; \
	uv run python -m apps.cli.main ingest $$path

bot:
	uv run python -m apps.cli.main bot

redact:
	uv run python -m apps.cli.main redact

verify: test
	@echo "💎 MNEMOS Industrial Grade Integrity Verified."

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
