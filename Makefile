.PHONY: setup run test lint clean dashboard push

setup:
	uv sync

run:
	uv run python main.py

test:
	uv run python -m pytest tests/ -v

lint:
	uv run ruff check .
	uv run mypy .

clean:
	rm -rf artifacts/memory/*.json
	rm -rf artifacts/logs/*.log

dashboard:
	uv run python -m core.api.server

push:
	git add .
	git commit -m "evolution: mnemos core v3.0.0 | Hive Intelligence (Session 30) 💎🚀🧠" || true
	git remote add origin https://github.com/emrek0ca/mnemos.git || true
	git push -u origin main
