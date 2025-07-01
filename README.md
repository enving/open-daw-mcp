# Open DAW MCP

Ein Model Context Protocol (MCP) Server für die Steuerung von Ardour DAW über Sprachmodelle.

## Über das Projekt

Open DAW MCP ist ein MCP-Server, der [Ardour](https://github.com/Ardour/ardour) DAW über das Model Context Protocol steuert. Der Server nutzt die IONOS Sprachmodell-API, um natürliche Sprachbefehle in Ardour-Aktionen zu übersetzen und automatisch Synthesizer-Loops zu erstellen.

## Features

- 🎵 Ardour DAW Integration über OSC
- 🎛️ Automatische Synthesizer-Loop-Generierung
- 🤖 Sprachgesteuerte DAW-Kontrolle über IONOS API
- 🔧 MIDI und Audio-Track-Management
- 📊 Plugin-Integration und Effekt-Steuerung
- 🔌 MCP-Protokoll für erweiterte KI-Integration

## Technologie-Stack

- **DAW**: [Ardour](https://github.com/Ardour/ardour) - Open Source DAW
- **MCP Integration**: Model Context Protocol
- **OSC Communication**: Open Sound Control für Ardour-Steuerung
- **Backend**: Node.js/TypeScript
- **AI Integration**: IONOS Sprachmodell-API
- **Synthesizer**: LV2/VST Plugins über Ardour

## Voraussetzungen

- [Ardour](https://ardour.org/) DAW installiert
- Node.js (Version 18 oder höher)
- IONOS API Token

## Installation

```bash
# Repository klonen
git clone https://github.com/enving/open-daw-mcp.git
cd open-daw-mcp

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env
# Bearbeite .env mit deinen IONOS API Daten

# MCP-Server starten
npm run dev
```

## Ardour Konfiguration

1. **Ardour starten** und eine neue Session erstellen
2. **OSC aktivieren** in Ardour:
   - Preferences → Control Surfaces → OSC
   - OSC aktivieren und Port konfigurieren (Standard: 3819)
3. **MCP-Server verbinden** mit Ardour über OSC

## MCP-Funktionen

Der Server stellt folgende MCP-Funktionen bereit:

### Synthesizer-Loop Erstellung
- `create_synth_loop(description, bpm, key, scale)` - Erstellt automatisch einen Synthesizer-Loop
- `generate_midi_pattern(description)` - Generiert MIDI-Pattern über IONOS API
- `apply_synth_preset(preset_name)` - Wendet Synthesizer-Presets an

### Ardour-Steuerung
- `create_audio_track()` - Erstellt neuen Audio-Track
- `create_midi_track()` - Erstellt neuen MIDI-Track
- `record_track(track_id)` - Startet Aufnahme auf Track
- `stop_recording()` - Stoppt Aufnahme
- `play_session()` - Spielt Session ab
- `stop_session()` - Stoppt Session

### Plugin-Management
- `add_plugin(track_id, plugin_name)` - Fügt Plugin zu Track hinzu
- `set_plugin_parameter(plugin_id, parameter, value)` - Setzt Plugin-Parameter
- `load_preset(plugin_id, preset_name)` - Lädt Plugin-Preset

## Sprachgesteuerte Steuerung

Der Server kann über natürliche Sprache gesteuert werden:

```
"Erstelle einen Synthesizer-Loop mit 120 BPM in C-Dur"
"Füge einen neuen Audio-Track hinzu"
"Starte Aufnahme auf Track 1"
"Spiele die Session ab"
"Füge Reverb-Effekt zu Track 2 hinzu"
"Lade das Piano-Preset für den Synthesizer"
```

## Projektstruktur

```
open-daw-mcp/
├── src/
│   ├── server/          # MCP-Server Implementierung
│   ├── ardour/          # Ardour OSC Integration
│   ├── ionos/           # IONOS API Client
│   ├── synthesizer/     # Synthesizer-Loop Generator
│   ├── types/           # TypeScript Typen
│   └── utils/           # Hilfsfunktionen
├── config/              # Ardour und MCP Konfiguration
├── docs/               # Dokumentation
└── tests/              # Tests
```

## Inspiriert von

- [Ardour DAW](https://github.com/Ardour/ardour) - Open Source Digital Audio Workstation
- [ardour-mcp](https://github.com/pyroqbit/ardour-mcp) - MCP Server für Ardour Integration

## Beitragen

Beiträge sind willkommen! Bitte lesen Sie unsere Contributing Guidelines bevor Sie einen Pull Request erstellen.

## Lizenz

Dieses Projekt steht unter der MIT Lizenz - siehe [LICENSE](LICENSE) Datei für Details.

## Status

🚧 **In Entwicklung** - Ardour MCP Integration läuft. 