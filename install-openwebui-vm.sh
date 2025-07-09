#!/bin/bash

echo "🚀 Installiere OpenWebUI in der VM..."

VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

echo "📡 Verbinde mit VM: $VM_HOST"

# OpenWebUI in der VM installieren
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt

# OpenWebUI installieren (falls nicht vorhanden)
if [ ! -d "open-webui" ]; then
    echo "📦 Installiere OpenWebUI..."
    git clone https://github.com/open-webui/open-webui.git
    cd open-webui
    docker-compose up -d
else
    echo "✅ OpenWebUI bereits installiert"
    cd open-webui
    docker-compose up -d
fi

# Port 3000 für OpenWebUI freigeben
echo "🔧 Konfiguriere Firewall..."
ufw allow 3000/tcp

echo "✅ OpenWebUI läuft auf Port 3000"
EOF

echo "🌐 OpenWebUI: http://$VM_HOST:3000"
echo "🔧 MCP Bridge: http://$VM_HOST:3001" 