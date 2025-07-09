# Open DAW MCP Server

Ein **Model Context Protocol (MCP) Server** für sprachgesteuerte Songerstellung mit **Carla + Python + MPE Integration**

## 🎯 Zielbild

**"Erstelle mir einen Tame Impala ähnlichen Song"** → **LLM → MPE-Daten → Carla Plugins → Audio-Export**

## 🏗️ Neue Architektur: Carla + Python + MPE

### **🎛️ Komponenten:**

1. **LLM (IONOS API)** - Sprachgesteuerte Song-Beschreibungen
2. **MPE-Generator (Python)** - LLM → MPE-Daten Konvertierung  
3. **Carla Plugin-Host** - Headless Audio-Processing
4. **Python MPE-Controller** - Steuert Carla Plugins
5. **Audio-Aufnahme** - Export der generierten Sounds

### **🔄 Workflow:**
```
LLM (IONOS) → Song-Beschreibung
     ↓
MPE-Generator → Expressive MIDI-Daten
     ↓
Python-Controller → Carla LV2 Plugins
     ↓
Audio-Aufnahme → WAV-Export
     ↓
OpenWebUI → Chat-Integration
```

## 🎵 Features

### ✅ Implementiert
- **IONOS LLM Integration** - Sprachgesteuerte Songerstellung
- **Carla Plugin-Host** - Headless Audio-Processing
- **Python MPE-Controller** - Expressive MIDI-Steuerung
- **Multi-Style Support**: Techno, House, Ambient, Trance, Drum & Bass, Psychedelic Rock
- **Künstler-Referenz-Erkennung**: Tame Impala, Daft Punk, Aphex Twin, etc.
- **JSON-RPC Kommunikation** ohne MCP SDK
- **Robuste Fehlerbehandlung** mit Fallback-Systemen
- **VM-Integration** - Alles zentral in der VM (87.106.81.49)
- **OpenWebUI Integration** - Chat-Interface für Song-Erstellung

### 🎛️ Carla + MPE Features
- **Headless Carla** - Keine GUI-Probleme
- **LV2 Plugin-Support** - FluidSynth, ReasonableSynth, etc.
- **MPE-Controller** - Expressive MIDI-Steuerung
- **Python-API** - Programmierbare Automatisierung
- **Audio-Aufnahme** - ALSA, JACK, PulseAudio

### 🤖 LLM MPE Generator Features
- **Stil-spezifische MPE-Daten** - Tame Impala, Ambient, Techno
- **Expressive Parameter** - Pressure, Timbre, Pitch Bend
- **Multi-Channel Support** - Verschiedene Instrument-Spuren
- **Real-time Generation** - Sofortige Audio-Erstellung

## 🚀 Installation

```bash
# Repository klonen
git clone https://github.com/your-username/open-daw-mcp.git
cd open-daw-mcp

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env
# IONOS_API_TOKEN und IONOS_API_URL in .env setzen
```

## 🖥️ VM Setup (87.106.81.49)

### **Audio-System:**
- ✅ **Carla 2.4.2** - Plugin-Host
- ✅ **JACK Audio Server** - Audio-Routing
- ✅ **ALSA/PulseAudio** - Audio-Subsystem
- ✅ **LV2 Plugins** - FluidSynth, ReasonableSynth
- ✅ **Python 3.10** - MPE-Controller

### **Remote-Zugriff:**
```bash
# SSH mit X11-Forwarding
ssh -X root@87.106.81.49

# Grafische Anwendungen
carla &
gnome-terminal &
```

## 🔧 Konfiguration

### IONOS AI Model Hub Setup
1. **API-Token generieren** im IONOS Data Center Designer (DCD)
2. **Modell auswählen** (z.B. `meta-llama/Meta-Llama-3.1-8B-Instruct`)
3. **Umgebungsvariablen setzen**:
   ```env
   IONOS_API_TOKEN=dein_token_hier
   IONOS_API_URL=https://openai.inference.de-txl.ionos.com/v1
   ```

## 🎼 Verwendung

### HTTP Server starten (Empfohlen)
```bash
# Hauptserver mit OpenWebUI Integration starten
node start-http-server.js

# Server läuft auf http://localhost:3001
# Audio-Dateien: http://localhost:3001/api/audio/
# Function Endpoint: http://localhost:3001/api/openwebui/functions
```

### Carla + MPE Integration
```bash
# MPE-Skripte erstellen
node create-mpe-scripts.js

# Carla mit MPE-Controller testen
node test-carla-mpe-python.js

# LLM-MPE-Generator testen
ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 llm_mpe_generator.py"
```

### Tests ausführen
```bash
# IONOS LLM Integration testen
node test-ionos-mcp-integration.js

# Carla MPE Integration testen
node test-carla-mpe-python.js

# Einzelne Komponenten testen
node test-tone-audio-engine.js
node ionos-llm-test.js
```

## 📁 Repository-Struktur

```
open-daw-mcp/
├── src/
│   ├── audio/           # Audio-Engines (Tone.js, Carla)
│   ├── integration/     # MCP Bridges
│   ├── server/          # HTTP/MCP Server
│   └── web/            # OpenWebUI Integration
├── output/              # Generierte Audio/MIDI-Dateien
├── external/            # Git Submodules (Ardour MCP)
├── docs/               # Dokumentation
└── tests/              # Test-Skripte
```

## 🎯 Nächste Entwicklungsschritte

### **Phase 1: MVP-Komponenten** ✅
- [x] **Carla Installation** - Plugin-Host auf VM
- [x] **Python MPE-Controller** - Grundlegende MPE-Steuerung
- [x] **LLM-MPE-Generator** - Stil-spezifische MPE-Daten
- [x] **Audio-Aufnahme** - ALSA/JACK/PulseAudio Tests

### **Phase 2: Integration** 🔄
- [ ] **Carla + MPE-Controller** - Vollständige Integration
- [ ] **LLM → MPE Pipeline** - End-to-End Test
- [ ] **Audio-Export** - WAV-Dateien aus Carla
- [ ] **OpenWebUI Integration** - Chat-Interface

### **Phase 3: Erweiterte Features** 📋
- [ ] **Multi-Track MPE** - Verschiedene Instrument-Spuren
- [ ] **LV2 Plugin-Management** - Automatische Plugin-Auswahl
- [ ] **Real-time Audio-Streaming** - Live-Audio im Chat
- [ ] **Stil-spezifische Presets** - Tame Impala, Ambient, etc.

### **Phase 4: Produktionsreife** 🚀
- [ ] **Fehlerbehandlung** - Robuste Error-Handling
- [ ] **Performance-Optimierung** - Schnelle Audio-Generierung
- [ ] **Dokumentation** - Vollständige API-Docs
- [ ] **Deployment** - Automatisierte VM-Setup

## 🧪 MVP-Tests

### **1. Carla MPE-Controller Test**
```bash
# Erstelle MPE-Skripte
node create-mpe-scripts.js

# Teste MPE-Controller
ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 mpe_controller.py"
```

### **2. LLM-MPE-Generator Test**
```bash
# Teste LLM-MPE-Generator
ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 llm_mpe_generator.py"
```

### **3. Carla + Python Integration Test**
```bash
# Vollständige Carla + MPE Integration
node test-carla-mpe-python.js
```

### **4. OpenWebUI Chat Test**
```bash
# Starte HTTP Server
node start-http-server.js

# Teste Chat-Integration
curl -X POST http://localhost:3001/api/openwebui/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Erstelle einen psychedelischen Song im Stil von Tame Impala", "user": "user1"}'
```

## 🎛️ Verfügbare Tools

1. **`create_song_from_description`** - Erstellt Songs aus natürlichen Sprachbeschreibungen
2. **`list_available_tools`** - Listet alle verfügbaren Tools auf
3. **`list_music_styles`** - Zeigt unterstützte Musikstile
4. **`list_songs`** - Listet alle erstellten Songs auf
5. **`get_song`** - Holt Details eines spezifischen Songs
6. **`delete_song`** - Löscht einen Song und seine Dateien

## 🔧 Troubleshooting

### **Carla Probleme:**
```bash
# JACK Audio Server starten
jackd -d alsa -r 44100 -p 512 -n 2 &

# Carla im Headless-Modus
carla --no-gui --engine=jack
```

### **MPE-Controller Probleme:**
```bash
# Python-Dependencies prüfen
python3 -c "import liblo; print('liblo OK')"
python3 -c "from pythonosc import udp_client; print('python-osc OK')"
```

### **Audio-Aufnahme Probleme:**
```bash
# ALSA Audio-System prüfen
aplay -l
arecord -f S16_LE -r 44100 -c 2 test.wav
```

## 📝 Changelog

### **v2.0.0 - Carla + Python + MPE Integration**
- ✅ **Neue Architektur** - Carla + Python + MPE statt Ardour
- ✅ **Headless-Design** - Keine GUI-Probleme mehr
- ✅ **LLM-optimiert** - Direkte MPE-Daten-Generierung
- ✅ **Modular** - Einzelne Komponenten testbar
- ✅ **Effizient** - Weniger Overhead als DAW

### **v1.0.0 - Ardour DAW Integration**
- ✅ **Ardour MCP Server** - Git Submodule Integration
- ✅ **OSC Bridge** - Ardour-Kommunikation
- ✅ **VM Setup** - Ubuntu mit Audio-System
- ✅ **OpenWebUI Integration** - Chat-Interface

## 🤝 Beitragen

1. **Fork** das Repository
2. **Feature Branch** erstellen (`git checkout -b feature/amazing-feature`)
3. **Commit** deine Änderungen (`git commit -m 'Add amazing feature'`)
4. **Push** zum Branch (`git push origin feature/amazing-feature`)
5. **Pull Request** erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- **IONOS AI Model Hub** für LLM-Integration
- **Carla Plugin-Host** für Audio-Processing
- **OpenWebUI** für Chat-Interface
- **Ubuntu VM** für zentrale Entwicklungsumgebung

