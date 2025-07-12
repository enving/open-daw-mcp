.PHONY: help local staging vm build clean logs

help: ## Zeige diese Hilfe
	@echo "Verfügbare Befehle:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

local: ## Starte lokale Entwicklungsumgebung
	docker-compose -f docker-compose.local.yml --env-file env.local up -d

local-down: ## Stoppe lokale Entwicklungsumgebung
	docker-compose -f docker-compose.local.yml down

staging: ## Starte Staging-Umgebung
	docker-compose -f docker-compose.staging.yml --env-file env.staging up -d

staging-down: ## Stoppe Staging-Umgebung
	docker-compose -f docker-compose.staging.yml down

vm: ## Starte VM-Produktionsumgebung mit Cloudflare Tunnel
	docker-compose -f docker-compose.vm.yml --env-file env.vm up -d

vm-down: ## Stoppe VM-Produktionsumgebung
	docker-compose -f docker-compose.vm.yml down

build: ## Baue alle Docker-Images
	docker-compose -f docker-compose.local.yml build
	docker-compose -f docker-compose.staging.yml build
	docker-compose -f docker-compose.vm.yml build

clean: ## Bereinige alle Container und Volumes
	docker-compose -f docker-compose.local.yml down -v
	docker-compose -f docker-compose.staging.yml down -v
	docker-compose -f docker-compose.vm.yml down -v
	docker system prune -f

logs: ## Zeige Logs aller Services
	docker-compose -f docker-compose.local.yml logs -f

logs-staging: ## Zeige Staging-Logs
	docker-compose -f docker-compose.staging.yml logs -f

logs-vm: ## Zeige VM-Logs
	docker-compose -f docker-compose.vm.yml logs -f

logs-cloudflared: ## Zeige Cloudflare Tunnel Logs
	docker-compose -f docker-compose.vm.yml logs cloudflared -f 