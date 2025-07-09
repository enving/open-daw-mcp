#!/bin/bash

echo "🎵 Open DAW MCP - VM System Starter"
echo "=================================="

VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

# 1. Prüfe VM-Verbindung
echo "🔍 Prüfe VM-Verbindung..."
if ! ssh -i $SSH_KEY -o ConnectTimeout=5 $VM_USER@$VM_HOST "echo 'VM erreichbar'" > /dev/null 2>&1; then
    echo "❌ VM nicht erreichbar: $VM_HOST"
    exit 1
fi
echo "✅ VM erreichbar"

# 2. Code in VM kopieren
echo "📁 Kopiere Code in VM..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'output' \
    -e "ssh -i $SSH_KEY" \
    ./ $VM_USER@$VM_HOST:/opt/open-daw-mcp/

# 3. System in VM starten
echo "🚀 Starte System in VM..."
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt/open-daw-mcp

# Node.js installieren (falls nicht vorhanden)
if ! command -v node &> /dev/null; then
    echo "📦 Installiere Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Dependencies installieren
echo "📦 Installiere npm Dependencies..."
npm install

# Docker installieren (für OpenWebUI)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installiere Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# Docker Compose installieren
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installiere Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# OpenWebUI installieren
cd /opt
if [ ! -d "open-webui" ]; then
    echo "🌐 Installiere OpenWebUI..."
    git clone https://github.com/open-webui/open-webui.git
fi

cd open-webui
echo "🚀 Starte OpenWebUI..."
docker-compose up -d

# Ardour starten
cd /opt/open-daw-mcp
echo "🎵 Starte Ardour..."
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 &
sleep 2
ardour6 --no-splash --new-session /tmp/open_daw_session &
sleep 5

# HTTP-Server starten
echo "🌐 Starte HTTP-Server..."
export PORT=3001
export ARDOUR_HOST=localhost
export ARDOUR_PORT=3819
nohup node start-http-server.js > /tmp/mcp-server.log 2>&1 &

# Firewall konfigurieren
echo "🔧 Konfiguriere Firewall..."
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 3819/tcp

echo "✅ System gestartet!"
echo "🌐 OpenWebUI: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 MCP Bridge: http://$(hostname -I | awk '{print $1}'):3001"
echo "🎵 Ardour: Port 3819"
EOF

# 4. SSH-Tunnel für lokalen Zugriff
echo "🔗 Erstelle SSH-Tunnel..."
ssh -i $SSH_KEY -L 3000:localhost:3000 -L 3001:localhost:3001 -L 9099:localhost:3819 -N -T $VM_USER@$VM_HOST &

echo "✅ System läuft in der VM!"
echo "🌐 OpenWebUI: http://localhost:3000"
echo "🔧 MCP Bridge: http://localhost:3001"
echo "🎵 Ardour: Port 9099 (über Tunnel)"
echo ""
echo "📋 Logs anzeigen:"
echo "  ssh -i $SSH_KEY $VM_USER@$VM_HOST 'tail -f /tmp/mcp-server.log'" 