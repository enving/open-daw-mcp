#!/bin/bash

echo "🔧 VM Konfiguration Setup für Open DAW MCP"
echo "=========================================="

VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

echo "📡 Verbinde mit VM: $VM_HOST"

# VM Konfiguration einrichten
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt/open-daw-mcp

# .env Datei erstellen
echo "🔑 Erstelle .env Konfiguration..."
cat > .env << 'ENV_CONFIG'
# IONOS API Konfiguration
IONOS_API_URL=https://openai.inference.de-txl.ionos.com/v1
IONOS_API_TOKEN=YOUR_IONOS_API_TOKEN_HERE

# Ardour OSC Konfiguration
ARDOUR_HOST=localhost
ARDOUR_PORT=3819
ARDOUR_SESSION_NAME=open_daw_session

# Audio Output Verzeichnis
AUDIO_OUTPUT_DIR=./output

# Cloudflare Tunnel Konfiguration
CLOUDFLARE_TUNNEL_NAME=open-daw-mcp
CLOUDFLARE_DOMAIN=open-daw-mcp.your-domain.com

# OpenWebUI Konfiguration
OPENWEBUI_PORT=3000
MCP_BRIDGE_PORT=3001
ENV_CONFIG

# Cloudflared installieren
echo "📦 Installiere Cloudflare Tunnel..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# Cloudflare Tunnel konfigurieren
echo "🔧 Konfiguriere Cloudflare Tunnel..."
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << 'TUNNEL_CONFIG'
tunnel: open-daw-mcp
credentials-file: /root/.cloudflared/open-daw-mcp.json

ingress:
  - hostname: open-daw-mcp.your-domain.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
  - hostname: open-daw-mcp-api.your-domain.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
  - service: http_status:404
TUNNEL_CONFIG

# Systemd Service erstellen
cat > /etc/systemd/system/cloudflared.service << 'SERVICE_CONFIG'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run open-daw-mcp
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_CONFIG

systemctl daemon-reload
systemctl enable cloudflared

echo "✅ Konfiguration erstellt!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Bearbeite .env: nano /opt/open-daw-mcp/.env"
echo "2. Setze IONOS_API_TOKEN"
echo "3. Gehe zu https://dash.cloudflare.com/access/tunnels"
echo "4. Erstelle Tunnel 'open-daw-mcp'"
echo "5. Lade Credentials herunter"
echo "6. Kopiere nach: /root/.cloudflared/open-daw-mcp.json"
echo "7. Starte Services:"
echo "   systemctl start cloudflared"
echo "   cd /opt/open-daw-mcp && npm start"
EOF

echo "✅ VM Konfiguration Setup abgeschlossen!"
echo ""
echo "🔑 IONOS API Token setzen:"
echo "ssh -i ~/.ssh/vm_key root@87.106.81.49 'nano /opt/open-daw-mcp/.env'"
echo ""
echo "🌐 Cloudflare Tunnel einrichten:"
echo "1. https://dash.cloudflare.com/access/tunnels"
echo "2. Tunnel 'open-daw-mcp' erstellen"
echo "3. Credentials herunterladen"
echo "4. scp -i ~/.ssh/vm_key open-daw-mcp.json root@87.106.81.49:/root/.cloudflared/" 