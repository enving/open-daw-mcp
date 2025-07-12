# Open DAW MCP Makefile

.PHONY: help dev build deploy logs clean

help: ## Zeige diese Hilfe
	@echo "Open DAW MCP - Verfügbare Befehle:"
	@echo ""
	@echo "Entwicklung:"
	@echo "  make dev          - Starte lokale Entwicklungsumgebung"
	@echo "  make build        - Baue Docker-Images"
	@echo "  make logs         - Zeige Container-Logs"
	@echo "  make clean        - Stoppe und entferne Container"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-vm    - Deploy auf VM (87.106.81.49)"
	@echo "  make logs-vm      - Zeige VM-Logs"
	@echo ""

dev: ## Starte lokale Entwicklungsumgebung
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "🚀 Entwicklungsumgebung gestartet auf http://localhost:3001"

build: ## Baue Docker-Images
	docker-compose -f docker-compose.dev.yml build
	@echo "🔨 Docker-Images gebaut"

logs: ## Zeige Container-Logs
	docker-compose -f docker-compose.dev.yml logs -f

clean: ## Stoppe und entferne Container
	docker-compose -f docker-compose.dev.yml down
	@echo "🧹 Container gestoppt und entfernt"

deploy-vm: ## Deploy auf VM (87.106.81.49)
	@echo "🚀 Deploy auf VM..."
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && git pull origin main"
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && docker-compose -f docker-compose.vm.yml down"
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && docker-compose -f docker-compose.vm.yml up --build -d"
	@echo "✅ Deployment abgeschlossen"

logs-vm: ## Zeige VM-Logs
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && docker-compose -f docker-compose.vm.yml logs -f daw-server"

test-api: ## Teste die API
	@echo "🧪 Teste API..."
	curl -s http://localhost:3001/api/health
	@echo ""
	curl -X POST http://localhost:3001/api/openwebui/functions \
		-H "Content-Type: application/json" \
		-d '{"function_name": "generate_melody", "parameters": {"description": "Test Melodie"}}'

test-vm: ## Teste VM-API
	@echo "🧪 Teste VM-API..."
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "curl -s http://localhost:3002/api/health" 