# Open DAW MCP Makefile

.PHONY: help install install-dev test run run-api run-web clean docker-build docker-run

help:
	@echo "Open DAW MCP - Verfügbare Befehle:"
	@echo ""
	@echo "Installation:"
	@echo "  install      - Installiert alle Dependencies"
	@echo "  install-dev  - Installiert Development Dependencies"
	@echo ""
	@echo "Tests:"
	@echo "  test         - Führt alle Tests aus"
	@echo "  test-reaper  - Testet Reaper Integration"
	@echo ""
	@echo "Ausführung:"
	@echo "  run          - Startet den MCP Server"
	@echo "  run-api      - Startet die Reaper API"
	@echo "  run-web      - Öffnet das Web Interface"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build - Baut Docker Image"
	@echo "  docker-run   - Startet Docker Container"
	@echo ""
	@echo "Utilities:"
	@echo "  clean        - Bereinigt temporäre Dateien"

install:
	@echo "Installiere Python Dependencies..."
	pip install -r requirements.txt
	@echo "Installiere Node.js Dependencies..."
	npm install
	@echo "Installation abgeschlossen!"

install-dev:
	@echo "Installiere Development Dependencies..."
	pip install -r requirements.txt
	pip install pytest pytest-asyncio black flake8
	npm install
	@echo "Development Installation abgeschlossen!"

test:
	@echo "Führe Python Tests aus..."
	python -m pytest tests/ -v
	@echo "Führe Node.js Tests aus..."
	npm test

test-reaper:
	@echo "Teste Reaper Integration..."
	python test_reaper_integration.py

run:
	@echo "Starte MCP Server..."
	npm run dev

run-api:
	@echo "Starte Reaper API Server..."
	cd src/server && python reaper_api.py

run-web:
	@echo "Öffne Web Interface..."
	xdg-open web/reaper-interface.html || open web/reaper-interface.html || echo "Bitte öffne web/reaper-interface.html manuell"

docker-build:
	@echo "Baue Docker Image..."
	docker build -t open-daw-mcp .

docker-run:
	@echo "Starte Docker Container..."
	docker run -p 8000:8000 -p 8001:8001 open-daw-mcp

clean:
	@echo "Bereinige temporäre Dateien..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	rm -rf dist/
	rm -rf output/audio/
	@echo "Bereinigung abgeschlossen!"

# Reaper-spezifische Befehle
setup-reaper:
	@echo "Setup für Reaper Integration..."
	@echo "1. Stelle sicher, dass Reaper installiert ist"
	@echo "2. Installiere ReaPy: pip install python-reapy"
	@echo "3. Starte Reaper und aktiviere ReaPy"
	@echo "4. Teste die Integration: make test-reaper"

check-reaper:
	@echo "Prüfe Reaper Installation..."
	python -c "import reapy; print('ReaPy verfügbar')" || echo "ReaPy nicht verfügbar - führe 'make setup-reaper' aus"

# Development Befehle
format:
	@echo "Formatiere Python Code..."
	black src/ tests/
	@echo "Formatiere JavaScript Code..."
	npm run lint:fix

lint:
	@echo "Prüfe Python Code..."
	flake8 src/ tests/
	@echo "Prüfe JavaScript Code..."
	npm run lint

# Vollständiger Setup
setup: install check-reaper
	@echo "Setup abgeschlossen!"
	@echo "Starte mit: make run-api" 