# Open DAW MCP Server

Ein **Model Context Protocol (MCP) Server** für sprachgesteuerte Songerstellung und DAW-Steuerung, insbesondere für **Ardour**.

## 🎯 Zielbild

**"Erstelle mir einen Tame Impala ähnlichen Song"** → Vollständiger Song mit MIDI, Audio, Mixing und Effekten

## 🎵 Features

### ✅ Implementiert
- **IONOS LLM Integration** - Sprachgesteuerte Songerstellung über IONOS AI Model Hub
- **Sprachgesteuerte Songerstellung** über natürliche Beschreibungen
- **MIDI-Generierung** für DAW-Integration
- **Audio-Generierung** mit erweitertem Fallback-System
- **Multi-Style Support**: Techno, House, Ambient, Trance, Drum & Bass, Psychedelic Rock
- **Künstler-Referenz-Erkennung**: Tame Impala, Daft Punk, Aphex Twin, etc.
- **JSON-RPC Kommunikation** ohne MCP SDK
- **Stil-spezifische Audio-Presets** mit verschiedenen Wellenformen und Effekten
- **Robuste Fehlerbehandlung** mit Fallback-Systemen

### 🎛️ Audio-Engine Features
- **Verschiedene Wellenformen**: Sinus, Sägezahn, Rechteck, Dreieck
- **Multi-Track Audio**: Bass, Lead, Pad-Spuren
- **Effekte**: Reverb, Delay, Filter, Distortion, Chorus
- **Stil-spezifische Presets** für alle Musikstile
- **Tone.js Integration** mit Node.js Fallback

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

### Tests ausführen
```bash
# IONOS LLM Integration testen
node test-ionos-mcp-integration.js

# Einzelne Komponenten testen
node test-tone-audio-engine.js
node ionos-llm-test.js
```

### Verfügbare Tools
1. **`create_song_from_description`** - Erstellt Songs aus natürlichen Sprachbeschreibungen
2. **`list_available_tools`** - Listet alle verfügbaren Tools auf
3. **`list_music_styles`** - Zeigt unterstützte Musikstile

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

## 🚧 Roadmap

### Phase 1: Grundfunktionen ✅
- [x] MCP Server ohne SDK
- [x] IONOS LLM Integration
- [x] Audio-Engine mit Fallback
- [x] MIDI-Generierung
- [x] Multi-Style Support

### Phase 2: Erweiterte Komposition 🎯
- [ ] **Iterative Song-Entwicklung** mit Benutzer-Interaktion
- [ ] **Vollständige Song-Strukturen** (Chords, Progression, Komposition)
- [ ] **Multi-Track Audio** mit verschiedenen Instrumenten
- [ ] **Längere Song-Dauer** (3-5 Minuten)
- [ ] **Ardour DAW Integration**

### Phase 3: Professionelle Features
- [ ] **C++ Synthesizer Integration** (ZynAddSubFX, FluidSynth)
- [ ] **Cloud-VM Deployment** (IONOS)
- [ ] **Docker-Containerisierung**
- [ ] **Web-Interface** für Song-Erstellung

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