#!/bin/bash

echo "🚀 Starte Open DAW MCP System in der VM..."

# VM Verbindung herstellen
VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

echo "📡 Verbinde mit VM: $VM_HOST"

# SSH-Tunnel für Ardour (falls noch nicht läuft)
if ! pgrep -f "ssh.*$VM_HOST.*9099" > /dev/null; then
    echo "🔗 Erstelle SSH-Tunnel für Ardour..."
    ssh -i $SSH_KEY -L 9099:localhost:3819 -N -T $VM_USER@$VM_HOST &
    sleep 2
fi

# Code in die VM kopieren
echo "📁 Kopiere Code in die VM..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'output' \
    -e "ssh -i $SSH_KEY" \
    ./ $VM_USER@$VM_HOST:/opt/open-daw-mcp/

# In der VM: Dependencies installieren und Server starten
echo "🔧 Installiere Dependencies und starte Server in der VM..."
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt/open-daw-mcp

# Node.js und npm installieren (falls nicht vorhanden)
if ! command -v node &> /dev/null; then
    echo "📦 Installiere Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Dependencies installieren
echo "📦 Installiere npm Dependencies..."
npm install

# Ardour starten (falls nicht läuft)
if ! pgrep ardour > /dev/null; then
    echo "🎵 Starte Ardour..."
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 &
    sleep 2
    ardour6 --no-splash --new-session /tmp/test_session &
    sleep 5
fi

# HTTP-Server in der VM starten
echo "🌐 Starte HTTP-Server in der VM..."
export PORT=3001
export ARDOUR_HOST=localhost
export ARDOUR_PORT=3819
node start-http-server.js
EOF

echo "✅ System läuft in der VM!"
echo "🌐 OpenWebUI: http://$VM_HOST:3001"
echo "🎵 Ardour: Port 9099 (über Tunnel)" 