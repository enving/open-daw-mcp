# Open DAW MCP Server

Ein **Model Context Protocol (MCP) Server** für sprachgesteuerte Songerstellung und DAW-Steuerung, insbesondere für **Ardour**.

## 🎯 Zielbild

**"Erstelle mir einen Tame Impala ähnlichen Song"** → Vollständiger Song mit MIDI, Audio, Mixing und Effekten

## 🎵 Features

### ✅ Implementiert
- **Sprachgesteuerte Songerstellung** über natürliche Beschreibungen
- **MIDI-Generierung** für DAW-Integration
- **Audio-Generierung** mit erweitertem Fallback-System
- **Multi-Style Support**: Techno, House, Ambient, Trance, Drum & Bass, Psychedelic Rock
- **Künstler-Referenz-Erkennung**: Tame Impala, Daft Punk, Aphex Twin, etc.
- **JSON-RPC Kommunikation** ohne MCP SDK
- **Stil-spezifische Audio-Presets** mit verschiedenen Wellenformen und Effekten

### 🎛️ Audio-Engine Features
- **Verschiedene Wellenformen**: Sinus, Sägezahn, Rechteck, Dreieck
- **Multi-Track Audio**: Bass, Lead, Pad-Spuren
- **Effekte**: Reverb, Delay, Filter
- **Akkord-Progressionen** und Melodien
- **Stil-spezifische Presets** für jeden Musikstil
- **Fallback-System** für robuste Audio-Generierung

## 🚀 Schnellstart

### Installation
```bash
git clone https://github.com/your-username/open-daw-mcp.git
cd open-daw-mcp
npm install
```

### MCP Server starten
```bash
node src/server/manual-mcp-server.js
```

### Testen
```bash
node test-manual-mcp-server.js
```

## 🎼 Verfügbare Tools

### 1. `create_song_from_description`
Erstellt einen kompletten Song basierend auf einer natürlichen Sprachbeschreibung.

**Parameter:**
- `description` (required): Beschreibung des gewünschten Songs
- `style` (optional): Musikstil (techno, house, ambient, etc.)
- `bpm` (optional): Beats per Minute
- `key` (optional): Tonart

**Beispiel:**
```json
{
  "description": "\"Dreamy Psychedelic Journey\" - Ein psychedelischer Song im Stil von Tame Impala",
  "style": "psychedelic_rock",
  "bpm": 85,
  "key": "F#"
}
```

### 2. `analyze_song_description`
Analysiert eine Song-Beschreibung und schlägt Parameter vor.

### 3. `list_music_styles`
Zeigt alle verfügbaren Musikstile mit BPM-Bereichen und Charakteristika.

## 🎭 Unterstützte Musikstile

| Stil | BPM | Charakteristika | Referenz-Künstler |
|------|-----|-----------------|-------------------|
| **Techno** | 120-140 | Repetitive, Industrial | Carl Cox |
| **House** | 120-130 | Groovy, Soulful | Daft Punk |
| **Ambient** | 60-90 | Atmospheric, Ethereal | Aphex Twin |
| **Trance** | 130-150 | Euphoric, Uplifting | Deadmau5 |
| **Drum & Bass** | 160-180 | Fast, Complex | Pendulum |
| **Psychedelic Rock** | 80-95 | Dreamy, Reverb-heavy | Tame Impala |

## 📁 Output

Der Server erstellt zwei Dateitypen:

1. **MIDI-Dateien** (`.mid`) - Für DAW-Integration
2. **Audio-Dateien** (`.wav`) - Mit verbesserter Qualität

**Beispiel-Output:**
```
output/
├── Dreamy Psychedelic Journey_1751457511562.mid
├── audio_psychedelic_rock_1751457511566.wav
├── Industrial Techno Beat_1751457511966.mid
└── audio_techno_1751457511966.wav
```

## 🔧 Technische Details

### Audio-Engine
- **Primär**: Tone.js (Browser-basiert)
- **Fallback**: Native WAV-Generierung mit erweiterten Features
- **Kompatibilität**: Node.js mit Web Audio API Polyfill

### MCP Integration
- **Protokoll**: JSON-RPC 2.0
- **SDK**: Kein MCP SDK (manuelle Implementierung)
- **Kommunikation**: STDIN/STDOUT

### Architektur
```
src/
├── server/
│   └── manual-mcp-server.js    # Haupt-MCP Server
├── audio/
│   └── tone-audio-engine.js    # Audio-Engine mit Fallback
├── midi/                       # MIDI-Generierung
└── types/                      # TypeScript Definitionen
```

## 🧪 Tests

### Automatisierte Tests
```bash
# Vollständiger Test-Suite
node test-manual-mcp-server.js

# Einzelne Komponenten
node test-tone-audio-engine.js
```

### Test-Coverage
- ✅ Tools auflisten
- ✅ Musikstile auflisten  
- ✅ Song-Beschreibung analysieren
- ✅ Song erstellen (verschiedene Stile)
- ✅ MIDI-Generierung
- ✅ Audio-Generierung (Fallback)
- ✅ Fehlerbehandlung

## 🚧 Roadmap

### Phase 1: Grundfunktionen ✅
- [x] MCP Server ohne SDK
- [x] Sprachgesteuerte Songerstellung
- [x] MIDI-Generierung
- [x] Audio-Generierung (Fallback)
- [x] Multi-Style Support

### Phase 2: Erweiterte Features 🔄
- [ ] Ardour-Integration
- [ ] C++ Synthesizer (ZynAddSubFX, FluidSynth)
- [ ] Erweiterte Effekte
- [ ] Sample-Integration
- [ ] Mixing-Funktionen

### Phase 3: Cloud-Deployment 🚀
- [ ] Docker-Container
- [ ] IONOS Cloud-VM
- [ ] API-Endpoints
- [ ] Web-Interface

## 🐳 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/server/manual-mcp-server.js"]
```

## 🌐 Cloud-Deployment

### IONOS Cloud-VM Anforderungen
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB (für Audio-Verarbeitung)
- **Storage**: 20GB SSD
- **CPU**: 2 vCores
- **Netzwerk**: 100 Mbps

### Deployment-Steps
1. VM erstellen und konfigurieren
2. Node.js und Dependencies installieren
3. Docker-Container deployen
4. MCP Server als Service starten
5. Monitoring und Logging einrichten

## 🤝 Beitragen

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- **Tone.js** für die Audio-Engine
- **Ardour** für die DAW-Integration
- **MCP Community** für das Protokoll

---

**Status**: ✅ Funktionsfähig - MCP Server mit erweiterter Audio-Engine erfolgreich getestet! 