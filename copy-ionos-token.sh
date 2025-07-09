#!/bin/bash

echo "🔑 IONOS API Token Setup"
echo "========================"

VM_HOST="87.106.81.49"
VM_USER="root"
SSH_KEY="~/.ssh/vm_key"

# Prüfe ob .env lokal existiert
if [ ! -f ".env" ]; then
    echo "❌ Lokale .env Datei nicht gefunden!"
    echo "📝 Erstelle lokale .env aus env.example..."
    cp env.example .env
    echo "🔑 Bitte bearbeite .env und setze IONOS_API_TOKEN"
    echo "💡 Dann führe dieses Skript erneut aus"
    exit 1
fi

# Extrahiere IONOS Token aus lokaler .env
IONOS_TOKEN=$(grep IONOS_API_TOKEN .env | cut -d'=' -f2)

if [ "$IONOS_TOKEN" = "your_ionos_api_token_here" ] || [ -z "$IONOS_TOKEN" ]; then
    echo "❌ IONOS_API_TOKEN nicht in .env gesetzt!"
    echo "🔑 Bitte bearbeite .env und setze IONOS_API_TOKEN"
    exit 1
fi

echo "✅ IONOS Token gefunden"
echo "📡 Kopiere Token in VM..."

# Token in VM kopieren
ssh -i $SSH_KEY $VM_USER@$VM_HOST "sed -i 's/YOUR_IONOS_API_TOKEN_HERE/$IONOS_TOKEN/' /opt/open-daw-mcp/.env"

echo "✅ IONOS Token in VM kopiert!"
echo "🌐 Teste API-Verbindung..."

# Teste API-Verbindung
ssh -i $SSH_KEY $VM_USER@$VM_HOST << 'EOF'
cd /opt/open-daw-mcp
source .env
curl -s -H "Authorization: Bearer $IONOS_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"meta-llama/Meta-Llama-3.1-8B-Instruct","messages":[{"role":"user","content":"Test"}]}' \
     "$IONOS_API_URL/chat/completions" | head -c 100
echo "..."
EOF

echo "✅ Setup abgeschlossen!" 