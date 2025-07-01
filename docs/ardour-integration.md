# Ardour Integration

Diese Dokumentation beschreibt die Integration von Open DAW MCP mit Ardour DAW basierend auf dem [ardour-mcp](https://github.com/pyroqbit/ardour-mcp) Projekt.

## Übersicht

Open DAW MCP nutzt das Open Sound Control (OSC) Protokoll, um mit Ardour DAW zu kommunizieren. Die Integration basiert auf den Erkenntnissen und OSC-Adressen aus dem ardour-mcp Projekt.

## Ardour Konfiguration

### 1. OSC in Ardour aktivieren

1. Öffnen Sie Ardour DAW
2. Gehen Sie zu **Preferences** → **Control Surfaces**
3. Aktivieren Sie **OSC**
4. Konfigurieren Sie die Ports:
   - **Send Port**: 3818 (Standard)
   - **Receive Port**: 3819 (Standard)

### 2. OSC-Feedback aktivieren

Für vollständige Funktionalität sollten Sie in Ardour folgende OSC-Feedback-Nachrichten aktivieren:

- `/transport_state` - Transport-Status
- `/transport_frame` - Aktuelle Position
- `/strip/name/<id>` - Track-Namen
- `/strip/type/<id>` - Track-Typen

## OSC-Adressen

### Transport-Steuerung

| Funktion | OSC-Adresse | Parameter | Beschreibung |
|----------|-------------|-----------|--------------|
| Play | `/transport_play` | - | Startet Wiedergabe |
| Stop | `/transport_stop` | - | Stoppt Wiedergabe |
| Record | `/transport_record` | - | Startet Aufnahme |
| Stop Record | `/transport_record_stop` | - | Stoppt Aufnahme |
| Speed | `/transport_speed` | float (0.1-4.0) | Setzt Wiedergabegeschwindigkeit |

### Track-Management

| Funktion | OSC-Adresse | Parameter | Beschreibung |
|----------|-------------|-----------|--------------|
| Audio Track erstellen | `/add_audio_track` | string | Erstellt Audio-Track |
| MIDI Track erstellen | `/add_midi_track` | string | Erstellt MIDI-Track |
| Track Mute | `/strip/mute` | int, int | Track-ID, Mute-Status (0/1) |
| Track Solo | `/strip/solo` | int, int | Track-ID, Solo-Status (0/1) |
| Track Record | `/strip/recenable` | int, int | Track-ID, Record-Status (0/1) |
| Track Gain | `/strip/fader` | int, float | Track-ID, Fader-Position (0.0-1.0) |
| Track Gain DB | `/strip/gain` | int, float | Track-ID, Gain in dB (-400.0-6.0) |
| Track Pan | `/strip/pan_stereo_position` | int, float | Track-ID, Pan-Position (0.0-1.0) |
| Track Select | `/strip/select` | int, int | Track-ID, Select-Status (1) |

### Plugin-Management

| Funktion | OSC-Adresse | Parameter | Beschreibung |
|----------|-------------|-----------|--------------|
| Plugin hinzufügen | `/strip/plugin/insert` | int, string | Track-ID, Plugin-Name |
| Plugin aktivieren | `/strip/plugin/activate` | int, int | Track-ID, Plugin-Slot |
| Plugin deaktivieren | `/strip/plugin/deactivate` | int, int | Track-ID, Plugin-Slot |
| Plugin Parameter | `/strip/plugin/parameter` | int, int, int, float | Track-ID, Slot, Param-ID, Wert (0.0-1.0) |

### Session-Management

| Funktion | OSC-Adresse | Parameter | Beschreibung |
|----------|-------------|-----------|--------------|
| Session laden | `/session/load` | string | Session-Pfad |
| Session speichern | `/session/save` | - | Speichert aktuelle Session |
| Action ausführen | `/access_action` | string | Ardour-Menü-Aktion |

## Feedback-Nachrichten

Ardour sendet folgende Feedback-Nachrichten zurück:

### Transport-Feedback

- `/transport_state` - [state, speed]
  - state: 0=Stopped, 1=Playing, 2=Looping
  - speed: Wiedergabegeschwindigkeit

- `/transport_frame` - [frame]
  - frame: Aktuelle Position in Samples

### Track-Feedback

- `/strip/name/<id>` - [name]
  - name: Name des Tracks

- `/strip/type/<id>` - [type]
  - type: Track-Typ (audio, midi, bus, master)

- `/strip/play` - [status]
  - status: 0=Stopped, 1=Playing

## Implementierung

### ArdourClient Klasse

Die `ArdourClient` Klasse verwaltet die OSC-Kommunikation:

```typescript
import { ArdourClient } from './ardour/ardour-client.js'

const client = new ArdourClient()

// Verbindung herstellen
await client.connect()

// Transport steuern
await client.play()
await client.stop()

// Track erstellen
const trackId = await client.createAudioTrack('My Track')

// Plugin hinzufügen
const pluginId = await client.addPluginToTrack(trackId, 'ZynAddSubFX')
```

### Event-Handler

Der Client emittiert Events für Status-Änderungen:

```typescript
client.on('connected', () => {
  console.log('Ardour verbunden')
})

client.on('transportStateChanged', (state) => {
  console.log('Transport Status:', state)
})

client.on('trackUpdated', (track) => {
  console.log('Track aktualisiert:', track)
})
```

## Fehlerbehandlung

### Verbindungsfehler

Wenn Ardour nicht erreichbar ist:

```typescript
try {
  await client.connect()
} catch (error) {
  console.warn('Ardour nicht verfügbar, Server läuft ohne DAW-Verbindung')
}
```

### Parameter-Validierung

Alle Funktionen validieren ihre Parameter:

```typescript
// Gain muss zwischen 0.0 und 2.0 sein
await client.setTrackGain(trackId, 1.5)

// Pan muss zwischen 0.0 und 1.0 sein
await client.setTrackPan(trackId, 0.5)
```

## Bekannte Plugins

### Synthesizer

- **ZynAddSubFX** - Open Source Synthesizer
- **Yoshimi** - ZynAddSubFX Fork
- **Helm** - Modularer Synthesizer
- **Dexed** - DX7 Emulator

### Effekte

- **Calf Studio Gear** - Effekt-Suite
- **LSP Plugins** - Linux Studio Plugins
- **Invada Studio** - Effekt-Plugins

## Troubleshooting

### Ardour reagiert nicht

1. Überprüfen Sie die OSC-Port-Konfiguration
2. Stellen Sie sicher, dass OSC in Ardour aktiviert ist
3. Prüfen Sie die Firewall-Einstellungen

### Feedback funktioniert nicht

1. Aktivieren Sie OSC-Feedback in Ardour
2. Überprüfen Sie die OSC-Adressen
3. Prüfen Sie die Logs auf Fehler

### Plugin-Probleme

1. Stellen Sie sicher, dass das Plugin installiert ist
2. Überprüfen Sie den Plugin-Namen (exakte Schreibweise)
3. Prüfen Sie die LV2/VST-Pfade in Ardour

## Weiterführende Links

- [Ardour OSC Dokumentation](https://manual.ardour.org/using-ardour/control-surfaces/osc/)
- [ardour-mcp Projekt](https://github.com/pyroqbit/ardour-mcp)
- [OSC Protokoll Spezifikation](https://opensoundcontrol.stanford.edu/) 