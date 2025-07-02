# Open DAW MCP Server

Ein **Model Context Protocol (MCP) Server** für sprachgesteuerte Songerstellung und DAW-Steuerung, insbesondere für **Ardour**.

## 🎯 Zielbild

**"Erstelle mir einen Tame Impala ähnlichen Song"** → Vollständiger Song mit MIDI, Audio, Mixing und Effekten

## 🎵 Features

### ✅ Implementiert
- **IONOS LLM Integration** - Sprachgesteuerte Songerstellung über IONOS AI Model Hub
- **Sprachgesteuerte Songerstellung** über natürliche Beschreibungen
- **Erweiterte MIDI-Generierung** mit strukturierten Song-Sektionen (Intro, Verse, Chorus, etc.)
- **Audio-Generierung** mit erweitertem Fallback-System
- **Multi-Style Support**: Techno, House, Ambient, Trance, Drum & Bass, Psychedelic Rock
- **Künstler-Referenz-Erkennung**: Tame Impala, Daft Punk, Aphex Twin, etc.
- **JSON-RPC Kommunikation** ohne MCP SDK
- **Stil-spezifische Audio-Presets** mit verschiedenen Wellenformen und Effekten
- **Robuste Fehlerbehandlung** mit Fallback-Systemen
- **Advanced DAW Engine** mit natürlicher Sprachsteuerung
- **Multi-Track MIDI** mit separaten Spuren für Bass, Drums, Lead, Pad
- **MPE MIDI 2.0 Support** - Polyphonic Expression für dynamischere Sounds
- **MPE-Synth-Integration** - Quelloffene MPE-fähige Synthesizer (Surge XT, Vital, Helm, ZynAddSubFX)
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

### MCP Server starten
```bash
node src/server/manual-mcp-server.js
```

### OpenWebUI Integration starten
```bash
# OpenWebUI Bridge Server starten
node src/server/index.ts

# Server läuft auf http://localhost:3001
# Audio-Dateien: http://localhost:3001/api/audio/
# Function Endpoint: http://localhost:3001/api/openwebui/functions
```

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
2. **`create_mpe_song`** - Erstellt Songs mit MPE MIDI 2.0 für dynamischere Sounds
3. **`list_available_tools`** - Listet alle verfügbaren Tools auf
4. **`list_music_styles`** - Zeigt unterstützte Musikstile
5. **`list_songs`** - Listet alle erstellten Songs auf
6. **`get_song`** - Holt Details eines spezifischen Songs
7. **`delete_song`** - Löscht einen Song und seine Dateien

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
├── src/
│   ├── server/
│   │   └── manual-mcp-server.js    # MCP Server mit IONOS Integration
│   ├── audio/
│   │   └── tone-audio-engine.js    # Audio-Engine mit Fallback
│   ├── ionos/
│   │   └── ionos-client.js         # IONOS LLM Client
│   └── types/
│       └── index.ts                # TypeScript Definitionen
├── output/                         # Generierte MIDI/Audio-Dateien
├── tests/                          # Test-Dateien
└── docs/                           # Dokumentation
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


Abkürzung:
docker start openwebui
localhost:3000 --> Admin Settings --> Konfigurationedatei importieren (ist im repo unter openwebui Ordner zu finden)

1. **Bridge Server starten**:
   ```bash
   node src/server/index.ts
   ```

2. **OpenWebUI konfigurieren**:
   - Function Calling aktivieren
   - Custom Function Endpoint: `http://localhost:3001/api/openwebui/functions`
   - CORS für `http://localhost:3001` erlauben

3. **Im Chat verwenden**:
   ```
   "Erstelle einen Techno-Song im Stil von Daft Punk"
   "Erstelle einen MPE Song mit dynamischen Effekten"
   ```

### 🎹 MPE MIDI 2.0 Integration

Das System unterstützt jetzt MPE (MIDI Polyphonic Expression) und MIDI 2.0 für ausdrucksstärkere Sounds:

- **Polyphonic Expression**: Jeder Ton kann individuell gesteuert werden
- **Pressure Control**: Dynamischer Druck für jeden Ton
- **Timbre Control**: Timbre-Variation pro Ton
- **Pitch Bend**: Individuelle Pitch-Bends pro Ton

**Unterstützte MPE-Synths**:
- Surge XT (quelloffen)
- Vital (Wavetable)
- Helm (modular)
- ZynAddSubFX (additiv/subtraktiv)

**Installation**:
```bash
# Surge XT (empfohlen)
sudo apt install surge-xt

# Helm
sudo apt install helm

# ZynAddSubFX
sudo apt install zynaddsubfx
```

Siehe [MPE-Integration Dokumentation](docs/mpe-integration.md) für Details.

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

### Phase 2: MIDI & Audio Manipulation 🎯
- [ ] **MIDI-Sektionen bearbeiten**: Chorus, Verse, Bridge einzeln manipulieren
- [ ] **MPE (MIDI Polyphonic Expression) Support** für erweiterte MIDI-Kontrolle
- [ ] **MIDI-Import/Export** für externe DAWs
- [ ] **Audio-Manipulation**: EQ, Kompressor, Limiter, Gate
- [ ] **Erweiterte Audio-Effekte**: Phaser, Flanger, Auto-Filter, Bitcrusher
- [ ] **Sample-Library Integration** für realistische Instrumente
- [ ] **Automation**: Automatische Parameter-Animation über Zeit

### Phase 3: DAW-Integration & Erweiterte Features
- [ ] **Ardour DAW Integration** über OSC (Open Sound Control)
- [ ] **VST-Plugin Support** für externe Effekte
- [ ] **Quelloffene DAW Integration**: LMMS, Ardour, Reaper
- [ ] **Real-time Audio Processing** mit WebRTC
- [ ] **Multi-User Collaboration** für gemeinsame Song-Entwicklung
- [ ] **Version Control** für Song-Versionen

### Phase 4: Professionelle Features
- [ ] **C++ Synthesizer Integration** (ZynAddSubFX, FluidSynth)
- [ ] **Cloud-VM Deployment** (IONOS)
- [ ] **Docker-Containerisierung**
- [ ] **Web-Interface** für Song-Erstellung
- [ ] **AI-basierte Song-Optimierung** mit Machine Learning
- [ ] **Genre-übergreifende Fusion** für experimentelle Musik

### 🎛️ DAW-Funktionen (Nicht echte DAW, sondern erweiterte MIDI/Audio-Manipulation)
- [ ] **Strukturierte MIDI-Editierung**: Sektionen einzeln bearbeiten
- [ ] **Akkord-Progressions-Editor**: Visueller Akkord-Editor
- [ ] **Melodie-Generator**: AI-basierte Melodie-Generierung
- [ ] **Rhythm-Pattern-Editor**: Drum-Pattern-Erstellung
- [ ] **Audio-Slicing**: Audio in Sektionen aufteilen
- [ ] **Crossfade-Editor**: Übergänge zwischen Sektionen
- [ ] **Mastering-Tools**: Finale Audio-Optimierung

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Teste gründlich
5. Erstelle einen Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei.

## 🙏 Danksagungen

- **IONOS** für die AI Model Hub API
- **Tone.js** für die Audio-Synthese
- **Ardour** für die DAW-Integration
- **MCP Community** für das Protokoll

---

**🎵 Erstelle deine eigenen Songs mit natürlicher Sprache!** 