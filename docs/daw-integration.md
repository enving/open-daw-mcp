# DAW Integration & Natürliche Sprachsteuerung

## Übersicht

Das Open DAW MCP System wurde um erweiterte DAW-Funktionen mit natürlicher Sprachsteuerung erweitert. Nutzer können jetzt Musikproduktion über natürliche Sprache steuern, ähnlich wie bei professionellen DAWs.

## Verfügbare DAW-Funktionen

### 1. Natürliche Sprachbefehle (`daw_command`)

Führt DAW-Befehle in natürlicher Sprache aus:

**Beispiele:**
- "BPM auf 120 setzen"
- "Tonart auf C major ändern"
- "Reverb zu Bass hinzufügen"
- "Delay zu Lead hinzufügen"
- "Distortion zu Gitarre hinzufügen"
- "Chorus zu Pad hinzufügen"
- "Track 'Bass' erstellen"
- "Sequenz für Drums erstellen"
- "Song abspielen"
- "Song stoppen"
- "Song als WAV exportieren"

### 2. DAW-Status abrufen (`daw_status`)

Zeigt den aktuellen DAW-Status an:
- BPM
- Tonart
- Aktive Tracks
- Effekte
- Wiedergabestatus

### 3. Track erstellen (`create_track`)

Erstellt einen neuen Track:

**Parameter:**
- `name`: Name des Tracks
- `type`: Track-Typ (bass, lead, pad, drum, synth)

### 4. Effekte hinzufügen (`add_effect`)

Fügt einen Effekt zu einem Track hinzu:

**Parameter:**
- `track_name`: Name des Tracks
- `effect_type`: Effekt-Typ (reverb, delay, distortion, chorus)

## OpenWebUI Integration

### API-Endpunkte

#### DAW-Befehle ausführen
```http
POST /api/daw/command
Content-Type: application/json

{
  "command": "BPM auf 120 setzen"
}
```

#### DAW-Status abrufen
```http
GET /api/daw/status
```

#### Track erstellen
```http
POST /api/daw/track
Content-Type: application/json

{
  "name": "Bass",
  "type": "bass"
}
```

#### Effekt hinzufügen
```http
POST /api/daw/effect
Content-Type: application/json

{
  "track_name": "Bass",
  "effect_type": "reverb"
}
```

### OpenWebUI Functions

Das System unterstützt automatisches Mapping von OpenWebUI Tool-Aufrufen:

**Erkannte Tool-Namen:**
- `daw_command`, `daw_befehl`, `daw`
- `create_track`, `track_erstellen`, `neuer_track`
- `add_effect`, `effekt_hinzufügen`, `effekt`

**Automatisches Fallback:**
- Unbekannte Tool-Namen werden automatisch als DAW-Befehle interpretiert
- BPM/Tempo-bezogene Befehle werden als DAW-Befehle erkannt
- Effekt-bezogene Befehle werden als DAW-Befehle erkannt

## Technische Details

### Advanced DAW Engine

Die `AdvancedDAWEngine` basiert auf Tone.js und bietet:

- **Multi-Track Recording**: Mehrere Tracks mit verschiedenen Synth-Typen
- **Effekt-Kette**: Reverb, Delay, Distortion, Chorus
- **Mastering**: Compressor, EQ, Limiter
- **Transport-Kontrolle**: Play, Stop, BPM, Tonart
- **Natürliche Sprachverarbeitung**: Intelligente Befehlsinterpretation

### Synth-Typen

1. **Bass**: Sawtooth-Oszillator mit tiefen Frequenzen
2. **Lead**: Square-Oszillator mit schnellen Envelopes
3. **Pad**: Polyphonic Sine-Oszillator mit langen Envelopes
4. **Drum**: Player für Drum-Samples
5. **Synth**: Standard Triangle-Oszillator

### Effekte

1. **Reverb**: Hall-Effekt mit einstellbarer Decay-Zeit
2. **Delay**: Echo-Effekt mit Feedback
3. **Distortion**: Verzerrung für aggressiven Sound
4. **Chorus**: Chor-Effekt für mehrdimensionalen Sound

## Verwendung in OpenWebUI

### Beispiel-Befehle

```
"Erstelle einen Bass-Track und füge Reverb hinzu"
"Setze BPM auf 128 und Tonart auf D minor"
"Füge Delay zum Lead-Track hinzu"
"Erstelle einen Pad-Track mit Chorus"
"Spiele den Song ab"
"Exportiere als WAV"
```

### Workflow

1. **Track erstellen**: "Erstelle einen Bass-Track"
2. **Effekte hinzufügen**: "Füge Reverb zum Bass hinzu"
3. **Parameter anpassen**: "Setze BPM auf 120"
4. **Sequenzen erstellen**: "Erstelle eine Bass-Sequenz"
5. **Abspielen**: "Spiele den Song ab"
6. **Exportieren**: "Exportiere als WAV"

## Erweiterte Funktionen

### Automatische Tonart-Erkennung
Das System erkennt automatisch Tonarten aus natürlicher Sprache:
- "C major", "D minor", "F# major", etc.

### Intelligente BPM-Erkennung
BPM-Werte werden aus verschiedenen Formaten erkannt:
- "120 BPM", "Tempo 128", "128 BPM", etc.

### Effekt-Parameter
Effekte werden mit optimalen Standard-Parametern konfiguriert:
- Reverb: 2s Decay, 30% Wet
- Delay: 8th Note, 30% Feedback, 20% Wet
- Distortion: 40% Distortion, 30% Wet
- Chorus: 2Hz, 3.5ms Delay, 70% Depth, 30% Wet

## Zukünftige Erweiterungen

- **MIDI-Import/Export**: Vollständige MIDI-Unterstützung
- **Sample-Library**: Integrierte Sample-Bibliothek
- **Automation**: Automatische Parameter-Animation
- **VST-Integration**: Externe Plugin-Unterstützung
- **Ardour-Integration**: Direkte Verbindung zu Ardour DAW
- **OSC-Protokoll**: Open Sound Control für externe DAWs 