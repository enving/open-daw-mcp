#!/bin/bash

echo "🌐 Cloudflare Tunnel Setup für Open DAW MCP VM"
echo "=============================================="

VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

echo "📡 Verbinde mit VM: $VM_HOST"

# Cloudflare Tunnel in der VM installieren und konfigurieren
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt

# Cloudflared installieren
echo "📦 Installiere Cloudflare Tunnel..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# Cloudflare Tunnel konfigurieren
echo "🔧 Konfiguriere Cloudflare Tunnel..."
mkdir -p ~/.cloudflared

# Erstelle Tunnel-Konfiguration
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
echo "🔧 Erstelle Systemd Service..."
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

echo "✅ Cloudflare Tunnel Service erstellt!"
echo "🚀 Starte mit: systemctl start cloudflared"
EOF

echo "✅ Cloudflare Tunnel Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Gehe zu https://dash.cloudflare.com/access/tunnels"
echo "2. Erstelle Tunnel 'open-daw-mcp'"
echo "3. Lade Credentials herunter"
echo "4. Kopiere nach VM: scp -i ~/.ssh/vm_key open-daw-mcp.json root@87.106.81.49:/root/.cloudflared/"
echo "5. Starte Tunnel: ssh -i ~/.ssh/vm_key root@87.106.81.49 'systemctl start cloudflared'"
echo ""
echo "🌐 Nach Setup:"
echo "OpenWebUI: https://open-daw-mcp.your-domain.com"
echo "API: https://open-daw-mcp-api.your-domain.com" 