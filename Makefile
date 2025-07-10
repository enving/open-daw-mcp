# Open DAW MCP - Makefile

.PHONY: install build test clean run help

# Variables
PYTHON = python3
PIP = pip3
DAW_CORE = src/daw/core.py
CARLA_HOST = src/plugins/carla_host.py
AUDIO_ENGINE = src/audio/engine.py
MIDI_ENGINE = src/midi/engine.py
LLM_BRIDGE = src/llm/ionos_bridge.py
MCP_SERVER = src/mcp/server.py

# Default target
all: install build

# Install dependencies
install:
	@echo "Installing Python dependencies..."
	$(PIP) install -r requirements.txt
	@echo "Installing system dependencies..."
	sudo apt update
	sudo apt install -y jackd2 carla python3-pip build-essential
	@echo "Dependencies installed successfully!"

# Build the DAW core
build:
	@echo "Building Open DAW MCP..."
	@echo "Checking Python modules..."
	$(PYTHON) -c "import numpy, scipy, soundfile, mido, jack; print('All modules available')"
	@echo "Build completed successfully!"

# Run tests
test:
	@echo "Running tests..."
	$(PYTHON) -m pytest tests/ -v

# Run individual components
test-daw:
	@echo "Testing DAW Core..."
	$(PYTHON) $(DAW_CORE)

test-carla:
	@echo "Testing Carla Host..."
	$(PYTHON) $(CARLA_HOST)

test-audio:
	@echo "Testing Audio Engine..."
	$(PYTHON) $(AUDIO_ENGINE)

test-midi:
	@echo "Testing MIDI Engine..."
	$(PYTHON) $(MIDI_ENGINE)

test-llm:
	@echo "Testing LLM Bridge..."
	$(PYTHON) $(LLM_BRIDGE)

test-mcp:
	@echo "Testing MCP Server..."
	$(PYTHON) $(MCP_SERVER)

# Run the complete system
run:
	@echo "Starting Open DAW MCP..."
	$(PYTHON) -m src.mcp.server

# Development server
dev:
	@echo "Starting development server..."
	$(PYTHON) -m src.mcp.server --dev

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	@echo "Clean completed!"

# Install on VM
install-vm:
	@echo "Installing on VM..."
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && make install"

# Deploy to VM
deploy-vm:
	@echo "Deploying to VM..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'output/*' \
		-e "ssh -i ~/.ssh/vm_key" ./ root@87.106.81.49:/opt/open-daw-mcp/
	ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp && make build"

# Setup development environment
setup-dev:
	@echo "Setting up development environment..."
	$(PIP) install -r requirements.txt
	$(PIP) install black flake8 pytest pytest-asyncio
	@echo "Development environment ready!"

# Format code
format:
	@echo "Formatting code..."
	black src/ tests/
	@echo "Code formatted!"

# Lint code
lint:
	@echo "Linting code..."
	flake8 src/ tests/
	@echo "Linting completed!"

# Create output directory
setup-output:
	@echo "Creating output directory..."
	mkdir -p output/audio output/midi output/projects
	@echo "Output directory created!"

# Full setup
setup: setup-output install build
	@echo "Full setup completed!"

# Help
help:
	@echo "Open DAW MCP - Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  build        - Build the DAW core"
	@echo "  test         - Run all tests"
	@echo "  test-*       - Run specific component tests"
	@echo "  run          - Run the complete system"
	@echo "  dev          - Run development server"
	@echo "  clean        - Clean build artifacts"
	@echo "  install-vm   - Install on VM"
	@echo "  deploy-vm    - Deploy to VM"
	@echo "  setup-dev    - Setup development environment"
	@echo "  format       - Format code"
	@echo "  lint         - Lint code"
	@echo "  setup-output - Create output directory"
	@echo "  setup        - Full setup"
	@echo "  help         - Show this help" 