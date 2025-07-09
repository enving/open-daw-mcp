# Open DAW MCP Server

Ein **Model Context Protocol (MCP) Server** für sprachgesteuerte Songerstellung mit professioneller DAW-Integration über OpenWebUI

## 🎯 Zielbild

**"Erstelle mir einen Tame Impala ähnlichen Song"** → Vollständiger Song mit MIDI, Audio, Mixing und Effekten über professionelle DAW-Integration

## 🎵 Features

### ✅ Implementiert
- **IONOS LLM Integration** - Sprachgesteuerte Songerstellung über IONOS AI Model Hub
- **Sprachgesteuerte Songerstellung** über natürliche Beschreibungen
- **Erweiterte MIDI-Generierung** mit strukturierten Song-Sektionen (Intro, Verse, Chorus, etc.)
- **Tone.js Audio-Engine** mit Fallback-System
- **Multi-Style Support**: Techno, House, Ambient, Trance, Drum & Bass, Psychedelic Rock
- **Künstler-Referenz-Erkennung**: Tame Impala, Daft Punk, Aphex Twin, etc.
- **JSON-RPC Kommunikation** ohne MCP SDK
- **Stil-spezifische Audio-Presets** mit verschiedenen Wellenformen und Effekten
- **Robuste Fehlerbehandlung** mit Fallback-Systemen
- **Advanced DAW Engine** mit natürlicher Sprachsteuerung
- **Multi-Track MIDI** mit separaten Spuren für Bass, Drums, Lead, Pad
- **Datei-Management System** - Song-Registry mit Überschreibungsfunktion
- **Audio-Streaming** - Direkte Audio-Bereitstellung im Chat über HTTP-Endpunkte
- **Grafische Oberfläche** - Ubuntu Desktop mit Audacity für visuelle Kontrolle

### 🎛️ Audio-Engine Features
- **Verschiedene Wellenformen**: Sinus, Sägezahn, Rechteck, Dreieck
- **Multi-Track Audio**: Bass, Lead, Pad-Spuren
- **Effekte**: Reverb, Delay, Filter, Distortion, Chorus
- **Stil-spezifische Presets** für alle Musikstile
- **Tone.js Integration** mit Node.js Fallback

### 🎼 MIDI-Engine Features
- **Strukturierte Song-Sektionen**: Intro, Verse, Chorus, Bridge, Outro
- **Multi-Track MIDI**: Separate Spuren für verschiedene Instrumente
- **Stil-spezifische Patterns**: Verschiedene Rhythmen und Melodien je nach Genre
- **Akkord-Progressions**: Automatische Akkord-Generierung basierend auf Tonart
- **Drum-Patterns**: Genre-spezifische Schlagzeug-Patterns

### 🤖 IONOS LLM Integration
- **IONOS AI Model Hub** für intelligente Song-Generierung
- **Strukturierte Song-Daten**: Titel, Stil, Tempo, Tonart, Struktur, Instrumente
- **JSON-Response-Parsing** mit Fallback-Logik
- **Daten-Normalisierung** für Audio-Engine-Kompatibilität

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

## 🖥️ Grafische Oberfläche & Remote-Zugriff

Das System läuft auf einer Ubuntu VM mit vollständiger Desktop-Umgebung. Sie können die grafische Oberfläche über verschiedene Methoden erreichen:

### 🌐 XRDP Remote Desktop (Empfohlen)

**Voraussetzung:** VPN-Verbindung zur VM (IP: 87.106.81.49)

1. **VPN-Verbindung herstellen** zu Ihrer Ubuntu VM
2. **Remote Desktop Client öffnen** (Windows: Remote Desktop, macOS: Microsoft Remote Desktop, Linux: Remmina)
3. **Verbindung konfigurieren:**
   - **Server:** `87.106.81.49`
   - **Port:** `3389` (Standard RDP-Port)
   - **Benutzer:** `root`
   - **Passwort:** Ihr VM-Passwort

4. **Nach der Anmeldung:**
   - Ubuntu Desktop-Umgebung öffnet sich
   - **Audacity** ist bereits installiert für Audio-Bearbeitung
   - **Terminal** öffnen für Server-Management
   - **Datei-Manager** für Zugriff auf generierte Audio/MIDI-Dateien

### 🔧 Alternative: SSH mit X11-Forwarding

```bash
# Von Ihrem lokalen System aus:
ssh -X root@87.106.81.49

# Grafische Anwendungen starten:
audacity &
gnome-terminal &
```

### 📁 Datei-Zugriff

Generierte Dateien finden Sie in der VM unter:
- **Audio-Dateien:** `/opt/open-daw-mcp/output/`
- **MIDI-Dateien:** `/opt/open-daw-mcp/output/`
- **Server-Logs:** `/var/log/open-daw-mcp.log`

### 🎵 Audacity für Audio-Bearbeitung

Audacity ist bereits installiert und ermöglicht:
- **Audio-Dateien öffnen** und bearbeiten
- **Effekte anwenden** (Reverb, Echo, etc.)
- **Mehrspur-Bearbeitung** für komplexe Arrangements
- **Export** in verschiedene Formate

### 🖥️ Desktop-Umgebung Features

- **Ubuntu 22.04 Desktop** mit GNOME
- **Vollständige Audio-Unterstützung** mit PulseAudio
- **Datei-Manager** für einfache Navigation
- **Terminal** für Server-Management
- **Web-Browser** für OpenWebUI-Zugriff

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

### Alternative: Nur MCP Server
```bash
# Nur MCP Server ohne OpenWebUI Integration
node src/server/manual-mcp-server.js
```

### OpenWebUI Integration
Der `start-http-server.js` startet automatisch:
- MCP Server für Song-Erstellung
- OpenWebUI Bridge für Chat-Integration
- HTTP-Endpunkte für Audio-Dateien
- WebSocket-Verbindung für Echtzeit-Kommunikation

### 🎛️ Ardour DAW Integration
Das Projekt integriert das [Ardour MCP Server Repository](https://github.com/pyroqbit/ardour-mcp) als Git Submodule:

```bash
# Ardour MCP Server kompiliert automatisch beim ersten Start
# Falls manuell kompiliert werden soll:
cd external/ardour-mcp
cargo build --release

# Ardour DAW Engine verwenden
import ArdourDAWEngine from './src/audio/ardour-daw-engine.js'

const dawEngine = new ArdourDAWEngine()
await dawEngine.initialize()
await dawEngine.createSongProject(songData)
await dawEngine.addMIDIToTracks(midiData)
await dawEngine.playProject()
```

**Ardour Setup erforderlich:**
- Ardour 6.x, 7.x, 8.x oder 9.x installiert
- OSC aktiviert in Ardour (Edit > Preferences > Control Surfaces)
- Listen Port auf 3819 gesetzt

### Tests ausführen
```bash
# IONOS LLM Integration testen
node test-ionos-mcp-integration.js

# OpenWebUI Audio im Chat testen
node test-openwebui-audio.js

# Einzelne Komponenten testen
node test-tone-audio-engine.js
node ionos-llm-test.js
```

### Verfügbare Tools
1. **`create_song_from_description`** - Erstellt Songs aus natürlichen Sprachbeschreibungen
2. **`list_available_tools`** - Listet alle verfügbaren Tools auf
3. **`list_music_styles`** - Zeigt unterstützte Musikstile
4. **`list_songs`** - Listet alle erstellten Songs auf
5. **`get_song`** - Holt Details eines spezifischen Songs
6. **`delete_song`** - Löscht einen Song und seine Dateien

### Beispiel-Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_song_from_description",
    "arguments": {
      "description": "Ein psychedelischer Techno-Track im Stil von Tame Impala",
      "style": "Techno",
      "artist": "Tame Impala"
    }
  }
}
```

## 📁 Projektstruktur

```
open-daw-mcp/
├── start-http-server.js            # Hauptserver (empfohlen)
├── src/
│   ├── server/
│   │   ├── manual-mcp-server.js    # MCP Server mit IONOS Integration
│   │   └── index.js                # OpenWebUI Bridge
│   ├── audio/
│   │   ├── ardour-daw-engine.js    # Ardour DAW Integration
│   │   ├── dexed-integration.js    # Dexed FM Synth Integration
│   │   ├── open-daw-integration.js # Open DAW Integration
│   │   ├── tone-audio-engine.js    # Audio-Engine mit Fallback
│   │   ├── midi-generator.js       # MIDI-Generator
│   │   ├── advanced-daw-engine.js  # Advanced DAW Engine
│   │   └── enhanced-audio-engine.js # Erweiterte Audio Engine
│   ├── integration/
│   │   ├── ardour-mcp-bridge.js    # Ardour MCP Bridge
│   │   └── openwebui-mcp-bridge.js # OpenWebUI Bridge
│   ├── ionos/
│   │   └── ionos-client.js         # IONOS LLM Client
│   └── web/
│       └── openwebui-integration.js # OpenWebUI Integration
├── external/
│   └── ardour-mcp/                 # Ardour MCP Server (Git Submodule)
├── output/                         # Generierte MIDI/Audio-Dateien
├── docs/                           # Dokumentation
└── env.example                     # Umgebungsvariablen Template
```

## 🎵 OpenWebUI Integration

Die OpenWebUI-MCP-Bridge ermöglicht es, Songs über das OpenWebUI Chat-Interface zu erstellen. Alle Funktionen sind als OpenWebUI-Funktionen verfügbar und ermöglichen eine interaktive Song-Entwicklung **mit direkter Audio-Wiedergabe im Chat**.

### 🎧 Audio im Chat

**Ja, du bekommst die Audio-Datei direkt im Chatfenster!** 

- Audio-Vorschauen werden als klickbare Links im Chat angezeigt
- Finale Audio-Dateien können direkt im Chat abgespielt werden
- Alle Audio-Dateien werden als WAV-Dateien generiert und über HTTP bereitgestellt
- OpenWebUI unterstützt das direkte Abspielen von Audio-Dateien im Chat

### Verfügbare OpenWebUI Funktionen

- `start_song_session` - Startet eine neue Song-Entwicklungssession
- `develop_song_structure` - Entwickelt die Song-Struktur
- `develop_chord_progressions` - Entwickelt Akkord-Progressions
- `develop_melodies` - Entwickelt Melodien
- `develop_instrumentation` - Entwickelt die Instrumentierung
- `finalize_song` - Finalisiert den Song
- `get_session_status` - Zeigt den Session-Status
- `list_active_sessions` - Listet aktive Sessions
- `generate_audio_preview` - Generiert Audio-Vorschau (im Chat abspielbar)
- `generate_final_audio` - Generiert finale Audio-Datei (im Chat abspielbar)

### OpenWebUI Setup

**Schnellstart:**
```bash
# 1. HTTP Server starten
node start-http-server.js

# 2. OpenWebUI starten (falls Docker verfügbar)
docker start openwebui
# Oder OpenWebUI lokal installieren

# 3. OpenWebUI konfigurieren
# localhost:3000 → Admin Settings → Konfigurationsdatei importieren
```

**Manueller Setup:**
1. **HTTP Server starten**:
   ```bash
   node start-http-server.js
   ```

2. **OpenWebUI konfigurieren**:
   - Function Calling aktivieren
   - Custom Function Endpoint: `http://localhost:3001/api/openwebui/functions`
   - CORS für `http://localhost:3001` erlauben

3. **Im Chat verwenden**:
   ```
   "Erstelle einen Techno-Song im Stil von Daft Punk"
   "Erstelle einen psychedelischen Rocksong"
   ```

## 🎵 Unterstützte Musikstile

- **Techno** - Industrielle Beats, hypnotische Loops
- **House** - Groove-basierte Rhythmen, Soul-Elemente
- **Ambient** - Atmosphärische Klanglandschaften
- **Trance** - Euphorische Melodien, ansteigende Energie
- **Drum & Bass** - Schnelle Breakbeats, Bass-Lines
- **Psychedelic Rock** - Experimentelle Klänge, Reverb-Effekte
- **Electronic** - Moderne elektronische Musik
- **Synthwave** - Retro-Futuristische Klänge
- **Downtempo** - Entspannte, langsame Rhythmen
- **Experimental** - Avantgarde-Kompositionen

## 🔄 Workflow

1. **Sprachbeschreibung** → IONOS LLM API
2. **Strukturierte Song-Daten** → Normalisierung
3. **MIDI-Generierung** → DAW-Integration
4. **Audio-Generierung** → Fallback-System
5. **Dateien speichern** → Output-Verzeichnis

## 🛠️ Technische Details

### Audio-Engine
- **Tone.js** für Browser-kompatible Audio-Synthese
- **Web Audio API Polyfill** für Node.js
- **Fallback-System** für robuste Audio-Generierung
- **Stil-spezifische Presets** mit verschiedenen Wellenformen

### IONOS Integration
- **OpenAI-kompatible API** für einfache Integration
- **JSON-Response-Parsing** mit Fehlerbehandlung
- **Daten-Normalisierung** für Audio-Engine-Kompatibilität
- **Fallback-Logik** für nicht-JSON Antworten

### MCP Server
- **JSON-RPC 2.0** ohne SDK-Abhängigkeiten
- **Robuste Fehlerbehandlung** mit detaillierten Logs
- **Modulare Tool-Architektur** für einfache Erweiterungen

## 🚧 Roadmap & TODOs

### Phase 1: Grundfunktionen ✅
- [x] MCP Server ohne SDK
- [x] IONOS LLM Integration
- [x] Audio-Engine mit Fallback
- [x] Erweiterte MIDI-Generierung mit Song-Strukturen
- [x] Multi-Style Support
- [x] Advanced DAW Engine mit natürlicher Sprachsteuerung

### Phase 2: Ardour DAW Integration 🎯
- [x] **Ardour MCP Server Integration** - Git Submodule Integration ✅
- [x] **Ardour MCP Bridge** - Node.js ↔ Rust Bridge ✅
- [x] **Ardour DAW Engine** - High-Level DAW Interface ✅
- [x] **VM Setup & Installation** - Ubuntu 22.04 + Ardour 6.9.0 ✅
- [x] **JACK Audio Server** - Professionelle Audio-Latenz ✅
- [x] **Audio-Komponenten** - FluidSynth, FFmpeg, QJackCtl ✅
- [ ] **MPE (MIDI Polyphonic Expression) Support** - Echte MPE-Integration
- [ ] **MIDI 2.0 Support** - Moderne MIDI-Features
- [ ] **VST/AU Plugin Integration** - Professionelle Synthesizer
- [ ] **Real-time Audio Processing** - Live-Audio-Verarbeitung
- [ ] **Studio-Qualität Audio** - Professionelle Audio-Exporte

### Phase 3: Erweiterte Features
- [ ] **Web-basierte DAW-Features** - Browser-basierte Song-Editierung
- [ ] **Multi-User Collaboration** - Gemeinsame Song-Entwicklung
- [ ] **Version Control** - Song-Versionen verwalten
- [ ] **Cloud-VM Deployment** - IONOS VM Integration
- [ ] **Docker-Containerisierung** - Einfache Deployment

### Phase 4: Professionelle Features
- [ ] **C++ Synthesizer Integration** - Native Audio-Performance
- [ ] **Web-Interface** - Vollständige Web-DAW
- [ ] **AI-basierte Song-Optimierung** - Machine Learning Integration
- [ ] **Genre-übergreifende Fusion** - Experimentelle Musik

## 🎛️ Ardour DAW Integration ✅

### Git Submodule Integration
Das Projekt integriert das [Ardour MCP Server Repository](https://github.com/pyroqbit/ardour-mcp) als Git Submodule:

```bash
# Submodule Status prüfen
git submodule status

# Submodule Updates holen
git submodule update --remote

# Submodule initialisieren (nach Clone)
git submodule init
git submodule update
```

### Ardour MCP Bridge
- **Node.js ↔ Rust Bridge** - Kommunikation zwischen JavaScript und Rust
- **Automatische Kompilierung** - Cargo Build beim ersten Start
- **JSON-RPC 2.0** - Standardisierte Kommunikation
- **Event-System** - Echtzeit-Status-Updates

### Ardour DAW Engine
- **High-Level Interface** - Einfache DAW-Steuerung
- **Song-Projekt-Management** - Automatische Projekt-Erstellung
- **Track-Management** - MIDI-Tracks und Audio-Tracks
- **Plugin-Integration** - VST/AU Plugin-Steuerung
- **Export-Funktionen** - Studio-Qualität Audio-Export

### VM-Setup (87.106.81.49) ✅
- **Ubuntu 22.04.5 LTS** - Stabile Audio-Plattform ✅
- **JACK Audio Server 1.9.20** - Professionelle Audio-Latenz ✅
- **Ardour 6.9.0** - Professionelle DAW-Version ✅
- **QJackCtl 0.9.6** - JACK Audio Connection Kit GUI ✅
- **FFmpeg 4.4.2** - Video/Audio-Verarbeitung ✅
- **PulseAudio mit JACK-Modul** - Audio-Routing ✅
- **FluidSynth 2.2.5** - Software-Synthesizer ✅
- **TimGM6mb Soundfont** - GM-Soundbank ✅

**Installierte Audio-Komponenten:**
- JACK Audio Server (jackd2)
- QJackCtl (GUI für JACK)
- PulseAudio mit JACK-Integration
- FluidSynth mit GM-Soundfont
- FFmpeg für Audio/Video-Export
- Ardour LV2-Plugins
- Video-Timeline Support

**Verfügbare DAW-Features:**
- MIDI-Sequencing
- Audio-Recording
- Plugin-Hosting (LV2)
- Video-Synchronisation
- OSC-Steuerung (Port 3819)
- JACK-Audio-Routing
- Export in verschiedene Formate

### Integration Workflow
1. **Sprachbeschreibung** → IONOS LLM
2. **Song-Struktur** → MIDI-Generierung
3. **Ardour-Session** → MCP Server (OSC Port 3819)
4. **JACK Audio Routing** → Real-time Audio-Verarbeitung
5. **LV2 Plugin Integration** → Synthesizer und Effekte
6. **Audio-Export** → Studio-Qualität (WAV, MP3, etc.)

### VM-Verbindung für Kollegen
**Option 1: Private Key weitergeben (Einfachste)**
```bash
# Für dich: Kopiere den Private Key an deinen Kollegen
scp ~/.ssh/vm_key kollege@seine-ip:~/.ssh/
scp ~/.ssh/vm_key.pub kollege@seine-ip:~/.ssh/

# Für deinen Kollegen:
chmod 600 ~/.ssh/vm_key
ssh -i ~/.ssh/vm_key root@87.106.81.49
```

**Option 2: Neuen SSH Key für Kollegen erstellen (Sicherer)**
```bash
# Für deinen Kollegen:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ardour_vm_key
cat ~/.ssh/ardour_vm_key.pub  # Public Key an dich senden

# Für dich (in der VM):
echo "PUBLIC_KEY_DES_KOLLEGEN" >> ~/.ssh/authorized_keys

# Für deinen Kollegen:
ssh -i ~/.ssh/ardour_vm_key root@87.106.81.49
```

### 🖥️ Ardour Headless auf der VM (Xvfb)

Um Ardour auf einer VM ohne grafische Oberfläche (Headless) zu betreiben, wird Xvfb als virtueller X-Server verwendet. Das Skript `start-ardour-vm.sh` automatisiert die komplette Einrichtung und den Start:

```bash
# Ardour auf der VM headless starten (mit OSC)
./start-ardour-vm.sh
```

Das Skript erledigt:
- Installation und Start von Xvfb (virtueller X-Server)
- Erstellung der Ardour-Konfiguration mit aktiviertem OSC (Port 3819)
- Start von Ardour in einer Xvfb-Session
- Log-Ausgabe und Statusprüfung

**Voraussetzungen:**
- SSH-Zugang zur VM (Schlüssel in ~/.ssh/vm_key)
- Ardour und Xvfb sind auf der VM installiert (wird automatisch geprüft)

**Tipp:**
Nach dem Start kannst du wie gewohnt per SSH-Tunnel auf den OSC-Port zugreifen:

```bash
ssh -i ~/.ssh/vm_key -L 9099:localhost:3819 root@87.106.81.49
```

Damit ist Ardour auf der VM für OSC- und MCP-Kommandos erreichbar.

### 🔧 VM Integration Status

**✅ Funktioniert:**
- SSH-Tunnel zur VM
- Ardour Headless-Start mit Xvfb
- **Direkte OSC-Bridge zur VM** (neue Lösung!)
- Transport-Controls (Play/Stop)
- Navigation (Goto Start/End)
- Track-Controls (Mute/Solo/Gain)
- Utility-Funktionen (Toggle Click/Loop)
- Aktionen über access_action

**⚠️ In Entwicklung:**
- MCP-Protokoll-Handshake (Initialisierung)
- Vollständige Tool-Integration über MCP
- Projekt-Management über MCP

**Verfügbare Test-Skripte:**
```bash
# Direkte OSC-Bridge Test (empfohlen)
node test-ardour-osc-vm.js

# MCP-Bridge Test (experimentell)
node test-ardour-vm-simple.js

# Vollständiger MCP-Integrationstest
node test-ardour-vm-integration.js
```

**Neue OSC-Bridge Features:**
- Direkte OSC-Kommunikation ohne MCP-Protokoll
- Robuste SSH-Tunnel-Verbindung
- Vollständige Transport-Steuerung
- Track-Management (Mute, Solo, Gain)
- Utility-Funktionen (Click, Loop)
- Aktionen über Ardour-Menüs

**Troubleshooting:**
- Falls Port 9099 belegt ist: `pkill -f "ssh.*9099"`
- Falls MCP-Server hängt: `pkill -f "ardour_mcp_server"`
- Ardour-Logs auf VM: `ssh -i ~/.ssh/vm_key root@87.106.81.49 "tail -f /tmp/ardour.log"`

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Teste gründlich
5. Erstelle einen Pull Request

