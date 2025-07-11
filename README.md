# Open DAW MCP - Headless Digital Audio Workstation

Eine sprachgesteuerte, headless Digital Audio Workstation für automatisierte Musikproduktion mit LLM-Integration.

## 🎯 Ziel

Eine minimale, effiziente Headless-DAW zu entwickeln, die:
- **Sprachgesteuert** ist über LLM-Integration (IONOS API)
- **Headless** läuft ohne GUI auf Servern/VMs
- **Plugin-Hosting** für VST2/3, LV2, LADSPA unterstützt
- **MIDI-Sequencing** und Audio-Verarbeitung bietet
- **Automatisierte Workflows** für Song-Erstellung ermöglicht

## 🚀 Production Deployment

### **✅ Erfolgreich Deployed:**
- **VM:** Ubuntu 22.04 auf `87.106.81.49`
- **Domain:** `https://humanmusic.digitalalchemisten.de`
- **SSL/TLS:** Let's Encrypt Zertifikat (automatische Erneuerung)
- **Cloudflare:** Proxy aktiv für Performance & Sicherheit
- **OpenWebUI:** Docker-Container auf Port 3000
- **nginx:** Reverse Proxy für SSL-Terminierung
- **DAW Components:** MIDI Engine, Audio Engine, Carla Host

### **🔧 Deployment-Konfiguration:**

#### **DNS Setup (Cloudflare):**
```
Type: A
Name: humanmusic
Target: 87.106.81.49
Proxy: Aktiviert (orange Wolke)
SSL/TLS: Full (Strict)
```

#### **nginx Konfiguration:**
```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name humanmusic.digitalalchemisten.de;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### **SSL-Zertifikat (Let's Encrypt):**
```bash
# Certbot installieren
apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
certbot --nginx -d humanmusic.digitalalchemisten.de --non-interactive --agree-tos --email admin@digitalalchemisten.de

# Automatische Erneuerung ist konfiguriert
```

#### **Docker Services:**
```bash
# OpenWebUI Container
docker run -d --name open-webui \
  -p 3000:8080 \
  ghcr.io/open-webui/open-webui:main
```

### **🔍 Monitoring & Status:**
```bash
# Services prüfen
systemctl status nginx
docker ps
curl -I https://humanmusic.digitalalchemisten.de

# SSL-Zertifikat Status
certbot certificates
```

### **🛡️ Sicherheit:**
- **SSL/TLS:** Let's Encrypt mit automatischer Erneuerung
- **Cloudflare:** DDoS-Schutz und Performance-Optimierung
- **Firewall:** UFW deaktiviert (Cloudflare schützt)
- **Updates:** Automatische Sicherheits-Updates aktiviert

## 🏗️ Neue Architektur: Eigene Headless-DAW

### **🎛️ Core Components:**
1. **Headless DAW Engine** (Python) - Projekt- und Track-Management
2. **Carla Plugin-Host** - Headless Plugin-Hosting
3. **Audio Engine** - Real-time Audio Processing
4. **MIDI Engine** - MIDI-Sequencing und MPE-Support
5. **LLM Bridge** - IONOS API Integration
6. **MCP Server** - Model Context Protocol für KI-Integration
7. **OpenWebUI** - Chat-Interface für Song-Erstellung

### **🔄 Workflow:**
```
OpenWebUI Chat → Sprachbeschreibung
      ↓
LLM Bridge → IONOS API
      ↓
MIDI Engine → Expressive MIDI-Daten
      ↓
Carla Plugin-Host → Audio-Processing
      ↓
Audio Engine → Real-time Audio
      ↓
Export → WAV/MIDI-Dateien
```

## 📁 Projektstruktur

```
open-daw-mcp/
├── src/
│   ├── daw/              # Headless DAW Core ✅
│   ├── plugins/          # Carla Plugin Host ✅
│   ├── audio/            # Audio Engine ✅
│   ├── midi/             # MIDI Engine ✅
│   ├── llm/              # IONOS API Bridge ✅
│   └── mcp/              # MCP Server ✅
├── openwebui/            # OpenWebUI Integration 🔄
├── tests/                # Test Suite 📋
├── docs/                 # Dokumentation 📋
├── output/               # Generierte Audio/MIDI 📋
├── requirements.txt      # Python Dependencies ✅
└── Makefile             # Build System ✅
```

## ✅ Aktueller Status

### **Phase 1: Core DAW Engine** ✅ ABGESCHLOSSEN
- ✅ **Headless DAW Core** - Projekt- und Track-Management
- ✅ **Carla Plugin-Host Integration** - VST2/3, LV2, LADSPA Support
- ✅ **Audio Engine** - Real-time Audio Processing mit JACK
- ✅ **MIDI Engine** - MIDI-Sequencing und MPE-Support
- ✅ **LLM Bridge** - IONOS API Integration
- ✅ **MCP Server** - Model Context Protocol Implementation
- ✅ **Build System** - Makefile und Dependencies

### **Phase 2: Integration & Testing** 🔄 IN ARBEIT
- 🔄 **Component Testing** - Einzelne Module testen
- 🔄 **Carla Headless Setup** - Plugin-Host auf VM
- 🔄 **JACK Audio Server** - Audio-System konfigurieren
- 🔄 **MIDI Clock Sync** - Timing-Synchronisation
- 🔄 **Plugin Discovery** - Automatische Plugin-Erkennung

### **Phase 3: OpenWebUI Integration** 📋 NÄCHSTE SCHRITTE
- 📋 **OpenWebUI Setup** - Chat-Interface installieren
- 📋 **MCP Tool Registration** - Tools in OpenWebUI registrieren
- 📋 **Function Calling** - Sprach-zu-Song Konvertierung
- 📋 **Real-time Feedback** - Live-Song-Generierung
- 📋 **Audio Preview** - Sofortige Audio-Vorschau

### **Phase 4: Production Features** 📋 ZUKÜNFTIG
- 📋 **Multi-Track Recording** - Verschiedene Instrument-Spuren
- 📋 **Plugin Parameter Automation** - Automatische Plugin-Steuerung
- 📋 **Export Functions** - WAV, MP3, MIDI Export
- 📋 **Cloud Deployment** - VM/Server Deployment
- 📋 **Performance Optimization** - Real-time Performance

## 🚀 Nächste Schritte

### **SOFORT (Diese Woche):**
1. **DAW-Komponenten auf VM installieren**
   ```bash
   # Auf VM (87.106.81.49)
   cd /opt/open-daw-mcp
   make install
   make build
   ```

2. **Component Testing**
   ```bash
   make test-daw      # DAW Core testen
   make test-carla    # Carla Host testen
   make test-audio    # Audio Engine testen
   make test-midi     # MIDI Engine testen
   make test-llm      # LLM Bridge testen
   make test-mcp      # MCP Server testen
   ```

3. **Carla Headless Setup**
   ```bash
   # JACK Audio Server starten
   jackd -d alsa -r 44100 -p 512 -n 2 &
   
   # Carla im Headless-Modus
   carla --no-gui --engine=jack --osc-port=22752
   ```

### **NÄCHSTE WOCHE:**
1. **OpenWebUI MCP-Integration**
   - MCP Tools in OpenWebUI registrieren
   - Function Calling für Song-Erstellung implementieren
   - Sprach-zu-Song Konvertierung testen

2. **IONOS LLM-Integration**
   - IONOS API für Song-Beschreibungen nutzen
   - MIDI-Generierung basierend auf LLM-Output
   - Real-time Song-Generierung

3. **End-to-End Testing**
   - Vollständige Song-Generierung testen
   - Audio-Export testen
   - Performance optimieren

### **PHASE 3: Production Features**
1. **Plugin-Integration**
   - VST2/3, LV2, LADSPA Support
   - Automatische Plugin-Erkennung
   - Plugin-Parameter-Automation

2. **Multi-Track Recording**
   - Verschiedene Instrument-Spuren
   - Real-time Audio-Processing
   - Export-Funktionen (WAV, MP3, MIDI)

3. **Advanced Features**
   - Real-time Audio-Preview
   - Song-Templates und Styles
   - Collaboration-Features

## 🛠️ Setup

### **Lokale Entwicklung:**
```bash
# Repository klonen
git clone https://github.com/your-repo/open-daw-mcp.git
cd open-daw-mcp

# Setup ausführen
make setup

# Tests ausführen
make test

# System starten
make run
```

### **VM Deployment:**
```bash
# Auf VM deployen
make deploy-vm

# Auf VM installieren
make install-vm
```

## 🎵 Verfügbare Features

### **✅ Implementiert:**
- **Headless DAW Core** - Vollständige DAW-Architektur
- **Carla Plugin-Host** - VST2/3, LV2, LADSPA Support
- **Real-time Audio** - JACK Audio Processing
- **MIDI Sequencing** - Multi-Track MIDI Support
- **MPE Support** - Expressive MIDI Controller
- **LLM Integration** - IONOS API Bridge
- **MCP Server** - Model Context Protocol
- **Build System** - Makefile und Dependencies

### **🔄 In Entwicklung:**
- **Component Integration** - Module zusammenführen
- **Plugin Discovery** - Automatische Plugin-Erkennung
- **Audio Export** - WAV/MIDI Export-Funktionen

### **📋 Geplant:**
- **OpenWebUI Integration** - Chat-Interface
- **Real-time Song Generation** - Live-Audio-Generierung
- **Multi-Track Recording** - Verschiedene Instrument-Spuren
- **Cloud Deployment** - Automatisierte VM-Setup

## 🧪 Testing

### **Component Tests:**
```bash
make test-daw      # DAW Core
make test-carla    # Carla Host
make test-audio    # Audio Engine
make test-midi     # MIDI Engine
make test-llm      # LLM Bridge
make test-mcp      # MCP Server
```

### **Integration Tests:**
```bash
# Vollständige Song-Generierung
python3 -c "
from src.mcp.server import get_mcp_server
import asyncio

async def test_song_creation():
    server = get_mcp_server()
    result = await server.execute_tool('create_song_from_description', {
        'description': 'Erstelle einen psychedelischen Song im Stil von Tame Impala',
        'style': 'tame_impala',
        'duration': 30.0
    })
    print(f'Song erstellt: {result}')

asyncio.run(test_song_creation())
"
```

## 📝 Changelog

### **v2.0.0 - Neue Headless-DAW Architektur** ✅
- ✅ **Komplette Neuentwicklung** - Eigene Headless-DAW statt Ardour
- ✅ **Modulare Architektur** - Saubere Komponenten-Trennung
- ✅ **Carla Integration** - Plugin-Host für VST2/3, LV2, LADSPA
- ✅ **Real-time Audio** - JACK Audio Processing
- ✅ **MIDI Engine** - Multi-Track MIDI mit MPE-Support
- ✅ **LLM Bridge** - IONOS API Integration
- ✅ **MCP Server** - Model Context Protocol Implementation
- ✅ **Build System** - Makefile und Dependencies

### **v1.0.0 - Ardour DAW Integration** (Veraltet)
- ❌ **Ardour MCP Server** - Git Submodule Integration
- ❌ **OSC Bridge** - Ardour-Kommunikation
- ❌ **GUI-Probleme** - Headless-Betrieb schwierig

## 🤝 Contributing

### **Entwicklungsschritte:**
1. **Fork** das Repository
2. **Feature Branch** erstellen (`git checkout -b feature/amazing-feature`)
3. **Tests schreiben** für neue Features
4. **Code formatieren** (`make format`)
5. **Tests ausführen** (`make test`)
6. **Commit** deine Änderungen (`git commit -m 'Add amazing feature'`)
7. **Push** zum Branch (`git push origin feature/amazing-feature`)
8. **Pull Request** erstellen

### **Code Standards:**
- **Python** - PEP 8, Type Hints, Docstrings
- **Tests** - pytest für alle neuen Features
- **Formatting** - black für Code-Formatierung
- **Linting** - flake8 für Code-Qualität

## 📄 License

MIT License - siehe LICENSE Datei für Details.

## 🎯 Roadmap

### **Q1 2024:**
- ✅ Core DAW Engine (ABGESCHLOSSEN)
- 🔄 Component Integration (IN ARBEIT)
- 📋 OpenWebUI Integration

### **Q2 2024:**
- 📋 Production Features
- 📋 Cloud Deployment
- 📋 Performance Optimization

### **Q3 2024:**
- 📋 Advanced Plugin Support
- 📋 Multi-User Support
- 📋 API Documentation

---

**Status:** Repository aufgeräumt, neue Architektur implementiert, nächste Schritte klar definiert! 🚀 