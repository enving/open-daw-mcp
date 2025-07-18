# Reaper Integration für Open DAW MCP

Diese Dokumentation beschreibt die Integration von Reaper mit ReaPy für die Verarbeitung von MusicXML-Dateien in unserem Open DAW MCP System.

## Übersicht

Die Reaper-Integration ermöglicht es, MusicXML-Dateien zu parsen und direkt in Reaper-Projekte zu importieren. Dies ist besonders nützlich für:

- Automatisierte Musikproduktion
- KI-generierte Kompositionen
- Batch-Verarbeitung von Noten
- Integration mit anderen DAW-Systemen

## Installation

### 1. Reaper Installation

Stelle sicher, dass Reaper installiert ist:
- [Reaper Download](https://www.reaper.fm/download.php)
- Mindestens Version 6.0 empfohlen

### 2. Python Dependencies

```bash
# Installiere alle Dependencies
make install

# Oder manuell
pip install -r requirements.txt
```

### 3. ReaPy Installation

```bash
# Installiere ReaPy
pip install python-reapy

# Teste Installation
python -c "import reapy; print('ReaPy verfügbar')"
```

### 4. Reaper ReaPy Setup

1. Starte Reaper
2. Gehe zu `Options` → `Preferences`
3. Unter `Plug-ins` → `ReaScript`, aktiviere "Enable ReaScript"
4. Unter `Control/OSC/web`, aktiviere "Enable web interface"
5. Notiere den Port (Standard: 8080)

## Verwendung

### 1. Kommandozeile

```bash
# Teste die Integration
make test-reaper

# Starte die API
make run-api

# Öffne Web Interface
make run-web
```

### 2. Python API

```python
from src.daw.core import get_daw

# DAW Instanz erstellen
daw = get_daw()

# MusicXML parsen
track_info = daw.parse_musicxml("output/musicxml/tame_impala_song.musicxml")

# In Reaper importieren
success = daw.import_musicxml_to_reaper("output/musicxml/tame_impala_song.musicxml", "Mein Projekt")

# Audio exportieren
daw.export_reaper_audio("output/mein_song.wav", "wav")

# Wiedergabe steuern
daw.play_reaper_project()
daw.stop_reaper_project()
```

### 3. Web API

Die Reaper API läuft auf Port 8001 und bietet folgende Endpunkte:

#### Health Check
```bash
curl http://localhost:8001/health
```

#### MusicXML parsen
```bash
curl -X POST http://localhost:8001/parse-musicxml \
  -F "file=@output/musicxml/tame_impala_song.musicxml"
```

#### In Reaper importieren
```bash
curl -X POST http://localhost:8001/import-to-reaper \
  -F "file=@output/musicxml/tame_impala_song.musicxml" \
  -F "project_name=Mein Projekt"
```

#### Audio exportieren
```bash
curl -X POST "http://localhost:8001/export-audio?output_filename=mein_song.wav&format=wav"
```

#### Wiedergabe steuern
```bash
curl -X POST http://localhost:8001/play
curl -X POST http://localhost:8001/stop
```

## Web Interface

Das Web Interface ist unter `web/reaper-interface.html` verfügbar und bietet:

- Drag & Drop Upload von MusicXML-Dateien
- Live-Preview der Track-Informationen
- Ein-Klick Import in Reaper
- Audio Export mit verschiedenen Formaten
- Wiedergabe-Steuerung

### Features

- **MusicXML Parsing**: Automatische Extraktion von Tracks und Noten
- **Reaper Integration**: Direkter Import in Reaper-Projekte
- **Audio Export**: Export in WAV, MP3, FLAC
- **Real-time Playback**: Wiedergabe-Steuerung über API
- **Web Interface**: Benutzerfreundliche Oberfläche

## MusicXML Format

Die Integration unterstützt das Standard MusicXML 3.1 Format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Track Name</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
```

## Troubleshooting

### ReaPy nicht verfügbar
```bash
# Prüfe Installation
python -c "import reapy"

# Falls nicht verfügbar
pip install python-reapy
```

### Reaper nicht erreichbar
1. Stelle sicher, dass Reaper läuft
2. Aktiviere Web Interface in Reaper Preferences
3. Prüfe Firewall-Einstellungen
4. Teste mit: `curl http://localhost:8080`

### MusicXML Parsing Fehler
- Prüfe XML-Syntax
- Stelle sicher, dass alle erforderlichen Elemente vorhanden sind
- Verwende MusicXML 3.1 Format

### Audio Export Fehler
- Stelle sicher, dass ein Projekt in Reaper geladen ist
- Prüfe Schreibrechte im Output-Verzeichnis
- Verwende gültige Dateinamen

## Entwicklung

### Tests ausführen
```bash
# Alle Tests
make test

# Nur Reaper Tests
make test-reaper

# Code Formatierung
make format

# Linting
make lint
```

### Neue Features hinzufügen

1. Erweitere `src/daw/reaper.py` um neue Funktionen
2. Füge entsprechende Methoden in `src/daw/core.py` hinzu
3. Erstelle API-Endpunkte in `src/server/reaper_api.py`
4. Aktualisiere das Web Interface
5. Schreibe Tests

### Debugging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

from src.daw.reaper import get_reaper_integration
reaper = get_reaper_integration()

# Debug-Informationen
print(reaper.get_project_info())
```

## Beispiele

### Tame Impala Song
Das System kommt mit einer Beispiel-MusicXML-Datei:
- `output/musicxml/tame_impala_song.musicxml`

Teste die Integration:
```bash
make test-reaper
```

### Eigene MusicXML erstellen
```python
from music21 import *

# Erstelle eine einfache Melodie
s = stream.Stream()
n = note.Note("C4")
s.append(n)
s.write('musicxml', fp='meine_melodie.musicxml')
```

## Lizenz

Diese Integration ist Teil des Open DAW MCP Projekts und unter der MIT-Lizenz verfügbar.

## Support

Bei Problemen oder Fragen:
1. Prüfe die Troubleshooting-Sektion
2. Schaue in die Logs: `tail -f logs/reaper.log`
3. Erstelle ein Issue auf GitHub
4. Kontaktiere das Entwicklungsteam 