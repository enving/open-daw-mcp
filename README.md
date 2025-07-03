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

### VM-Setup (87.106.81.49)
- **Ubuntu 22.04 LTS** - Stabile Audio-Plattform
- **JACK Audio Server** - Professionelle Audio-Latenz
- **Ardour 9.x** - Neueste DAW-Version
- **MPE-fähige VSTs** - Surge XT, Helm, ZynAddSubFX

### Integration Workflow
1. **Sprachbeschreibung** → IONOS LLM
2. **Song-Struktur** → MIDI-Generierung
3. **Ardour-Session** → MCP Server
4. **MPE-Daten** → VST-Integration
5. **Audio-Export** → Studio-Qualität

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Teste gründlich
5. Erstelle einen Pull Request

