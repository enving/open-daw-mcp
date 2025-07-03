# Ardour MCP Integration - Fahrplan

## 🎯 Ziel

Integration von Ardour DAW über MCP Server für professionelle Song-Erstellung mit MPE/MIDI 2.0 Support.

## 🖥️ VM-Setup (87.106.81.49)

### Basis-System (Ubuntu 22.04 LTS)
- **OS**: Ubuntu 22.04.5 LTS
- **IP**: 87.106.81.49
- **User**: root (SSH-Key: `/home/ingimar/.ssh/vm_key`)
- **Speicher**: 48.27GB verfügbar
- **RAM**: 9% Auslastung

## 🚀 Phase 1: Basis-Setup (30 Minuten)

### 1.1 System aktualisieren
```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Entwicklungstools installieren
sudo apt install -y build-essential git curl wget
```

### 1.2 Audio-System installieren
```bash
# JACK Audio Server (professionelle Audio-Latenz)
sudo apt install -y jackd2 pulseaudio-module-jack qjackctl

# Audio-Gruppe hinzufügen
sudo usermod -a -G audio root

# Realtime-Priorität für Audio
echo '@audio - rtprio 95' | sudo tee -a /etc/security/limits.conf
echo '@audio - memlock unlimited' | sudo tee -a /etc/security/limits.conf
```

### 1.3 Rust installieren
```bash
# Rust für MCP Server
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

## 🎛️ Phase 2: Ardour Installation (20 Minuten)

### 2.1 Ardour 9.x installieren
```bash
# Über Flatpak (empfohlen)
sudo apt install -y flatpak
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install flathub org.ardour.Ardour

# Alternative: Über Package Manager
sudo apt install -y ardour9
```

### 2.2 MPE-fähige VSTs installieren
```bash
# Surge XT (MPE-fähig, FM-Synthese)
sudo apt install -y surge-xt

# Helm (MPE-fähig, modular)
sudo apt install -y helm

# ZynAddSubFX (bereits installiert)
sudo apt install -y zynaddsubfx

# Dexed (FM-Synthesizer)
sudo apt install -y dexed

# Carla (VST-Host)
sudo apt install -y carla
```

## 🔧 Phase 3: MCP Server Setup (15 Minuten)

### 3.1 Ardour MCP Server bauen
```bash
# Repository klonen
cd /opt
sudo git clone https://github.com/pyroqbit/ardour-mcp.git
cd ardour-mcp

# Server bauen
cargo build --release

# Binaries verfügbar machen
sudo cp target/release/ardour_mcp_server /usr/local/bin/
sudo cp target/release/stdio-client-tester /usr/local/bin/
```

### 3.2 MCP Server als Service einrichten
```bash
# Systemd Service erstellen
sudo tee /etc/systemd/system/ardour-mcp.service << EOF
[Unit]
Description=Ardour MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ardour-mcp
ExecStart=/usr/local/bin/ardour_mcp_server
Restart=always
RestartSec=10
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
EOF

# Service aktivieren
sudo systemctl enable ardour-mcp
sudo systemctl start ardour-mcp
```

## 🌐 Phase 4: Netzwerk & Services (10 Minuten)

### 4.1 Firewall konfigurieren
```bash
# Firewall konfigurieren
sudo ufw allow ssh
sudo ufw allow 3000  # OpenWebUI
sudo ufw allow 3001  # MCP Server
sudo ufw allow 3819  # OSC für Ardour
sudo ufw allow 19000 # JACK Audio (falls remote)
sudo ufw enable
```

### 4.2 Domain-Setup vorbereiten
```bash
# Nginx installieren (für Reverse Proxy)
sudo apt install -y nginx

# SSL-Zertifikate vorbereiten
sudo apt install -y certbot python3-certbot-nginx
```

## 🎛️ Phase 5: Ardour Konfiguration (15 Minuten)

### 5.1 JACK Audio Server konfigurieren
```bash
# JACK Audio Server starten
jackd -d alsa -r 44100 -p 1024 &

# Automatischer Start
echo 'jackd -d alsa -r 44100 -p 1024 &' >> ~/.bashrc
```

### 5.2 Ardour erste Session
```bash
# Ardour mit JACK starten
ardour --jack --new --name "OpenDAW_Project" --sample-rate 44100
```

### 5.3 OSC-Setup in Ardour
1. **Ardour starten**
2. **Edit > Preferences > Control Surfaces**
3. **OSC aktivieren**
4. **Listen Port: 3819**
5. **MCP Server verbinden**

## 🔗 Phase 6: Integration mit unserem Projekt (20 Minuten)

### 6.1 Remote Ardour Integration erstellen
```javascript
// src/audio/remote-ardour-integration.js
class RemoteArdourIntegration {
  constructor() {
    this.ardourHost = '87.106.81.49'
    this.ardourPort = 3819
    this.mcpHost = '87.106.81.49'
    this.mcpPort = 3001
  }
  
  async initialize() {
    // Verbindung zu Ardour MCP Server
    await this.connectToMCPServer()
    
    // Ardour-Session starten
    await this.startArdourSession()
  }
  
  async createMPESong(songData) {
    // 1. Ardour-Session erstellen
    await this.createSession(songData.title)
    
    // 2. MPE-Tracks erstellen
    await this.createMPETracks(songData)
    
    // 3. VSTs laden
    await this.loadVSTs(songData)
    
    // 4. MIDI-Daten importieren
    await this.importMIDI(songData.midi)
    
    // 5. Audio exportieren
    return await this.exportAudio()
  }
}
```

### 6.2 MCP Server Integration
```javascript
// src/server/ardour-mcp-server.js
class ArdourMCPServer {
  constructor() {
    this.ardourIntegration = new RemoteArdourIntegration()
  }
  
  async initialize() {
    await this.ardourIntegration.initialize()
  }
  
  async createSongWithArdour(songData) {
    return await this.ardourIntegration.createMPESong(songData)
  }
}
```

## 🧪 Phase 7: Testing (15 Minuten)

### 7.1 MCP Server testen
```bash
# MCP Server Status prüfen
sudo systemctl status ardour-mcp

# Logs anzeigen
sudo journalctl -u ardour-mcp -f

# Test-Client ausführen
cd /opt/ardour-mcp
cargo run --bin stdio-client-tester
```

### 7.2 Ardour Integration testen
```bash
# Ardour starten und OSC testen
ardour --jack --osc-port 3819

# MCP Server Verbindung testen
curl -X POST http://87.106.81.49:3001/api/ardour/status
```

### 7.3 VST Integration testen
```bash
# Surge XT testen
surge-xt --jack

# Helm testen
helm --jack

# ZynAddSubFX testen
zynaddsubfx --jack
```

## 🎯 Phase 8: Production Setup (10 Minuten)

### 8.1 Domain-Konfiguration
```bash
# SSL-Zertifikate
sudo certbot --nginx -d open-daw.ingimar.de -d mcp.ingimar.de

# Nginx Reverse Proxy
sudo tee /etc/nginx/sites-available/open-daw << EOF
server {
    listen 80;
    server_name open-daw.ingimar.de;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name open-daw.ingimar.de;
    
    ssl_certificate /etc/letsencrypt/live/open-daw.ingimar.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/open-daw.ingimar.de/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/open-daw /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8.2 Monitoring einrichten
```bash
# Log-Rotation
sudo tee /etc/logrotate.d/ardour-mcp << EOF
/var/log/ardour-mcp.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
```

## 📋 Checkliste

### ✅ Basis-System
- [ ] Ubuntu 22.04 LTS aktualisiert
- [ ] Audio-System installiert
- [ ] Rust installiert
- [ ] JACK Audio Server konfiguriert

### ✅ Ardour & VSTs
- [ ] Ardour 9.x installiert
- [ ] Surge XT installiert
- [ ] Helm installiert
- [ ] ZynAddSubFX installiert
- [ ] Dexed installiert

### ✅ MCP Server
- [ ] Ardour MCP Server gebaut
- [ ] Systemd Service eingerichtet
- [ ] Firewall konfiguriert
- [ ] OSC-Port 3819 geöffnet

### ✅ Integration
- [ ] Remote Ardour Integration erstellt
- [ ] MCP Server Integration implementiert
- [ ] Testing durchgeführt
- [ ] Production Setup abgeschlossen

## 🎵 Nächste Schritte

1. **VM-Setup durchführen** (Phase 1-4)
2. **Integration implementieren** (Phase 5-6)
3. **Testing durchführen** (Phase 7)
4. **Production deployen** (Phase 8)
5. **OpenWebUI Integration** erweitern
6. **MPE/MIDI 2.0 Features** implementieren

## 🔧 Troubleshooting

### Häufige Probleme:
- **JACK Audio nicht verfügbar**: `sudo usermod -a -G audio $USER`
- **Ardour startet nicht**: `flatpak run org.ardour.Ardour`
- **MCP Server Verbindungsfehler**: Port 3819 prüfen
- **VSTs nicht gefunden**: Carla als VST-Host verwenden

### Logs prüfen:
```bash
# MCP Server Logs
sudo journalctl -u ardour-mcp -f

# JACK Audio Logs
jackd -d alsa -r 44100 -p 1024 -v

# Ardour Logs
~/.config/ardour9/logs/
``` 