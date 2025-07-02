# MPE MIDI 2.0 Integration

## Übersicht

Das Open DAW MCP System unterstützt jetzt MPE (MIDI Polyphonic Expression) und MIDI 2.0 für dynamischere und ausdrucksstärkere Sounds. MPE ermöglicht es, jeden Ton individuell mit verschiedenen Expression-Parametern zu steuern.

## MPE-Features

- **MIDI 2.0 Support**: Höhere Auflösung (960 Ticks pro Beat)
- **Polyphonic Expression**: Jeder Ton kann individuell gesteuert werden
- **Pressure Control**: Dynamischer Druck für jeden Ton
- **Timbre Control**: Timbre-Variation pro Ton
- **Pitch Bend**: Individuelle Pitch-Bends pro Ton
- **Channel Mapping**: Separate Kanäle für verschiedene Instrumente

## Unterstützte MPE-fähige Synthesizer

### 1. Surge XT
**Beschreibung**: Quelloffener MPE-fähiger Synthesizer mit umfangreichen Features

**Installation (Ubuntu/Debian)**:
```bash
# Über Package Manager
sudo apt update
sudo apt install surge-xt

# Oder über Flatpak
flatpak install flathub org.surge-synthesizer.surge-xt
```

**Installation (Arch Linux)**:
```bash
sudo pacman -S surge-xt
```

**Installation (macOS)**:
```bash
brew install --cask surge-xt
```

### 2. Vital
**Beschreibung**: Wavetable Synthesizer mit MPE-Unterstützung

**Installation**:
```bash
# Download von https://vital.audio/
# Oder über Package Manager (falls verfügbar)
```

### 3. Helm
**Beschreibung**: Modularer Synthesizer mit MPE

**Installation (Ubuntu/Debian)**:
```bash
sudo apt install helm
```

**Installation (Arch Linux)**:
```bash
sudo pacman -S helm
```

### 4. ZynAddSubFX
**Beschreibung**: Advanced Additive/Subtractive Synthesizer

**Installation (Ubuntu/Debian)**:
```bash
sudo apt install zynaddsubfx
```

**Installation (Arch Linux)**:
```bash
sudo pacman -S zynaddsubfx
```

## MPE-Channel Mapping

Das System verwendet folgende MPE-Channel-Zuordnung:

- **Channel 1**: Lead (Gitarre, Synth)
- **Channel 2**: Bass
- **Channel 3**: Pad (Piano, Keyboards)
- **Channel 4**: Arpeggiator
- **Channel 5**: FX-Effekte

## MPE-Expression Parameter

### Pressure (Aftertouch)
- **Range**: 0-127
- **Verwendung**: Dynamischer Druck für jeden Ton
- **Effekte**: Filter-Cutoff, Amplitude, Modulation

### Timbre
- **Range**: 0-127
- **Verwendung**: Timbre-Variation pro Ton
- **Effekte**: Filter-Resonance, Waveform-Morphing

### Pitch Bend
- **Range**: -8192 bis +8192 (14-bit)
- **Verwendung**: Individuelle Pitch-Bends
- **Effekte**: Glissando, Vibrato, Slide-Effekte

## MPE-Presets für verschiedene Stile

### Psychedelic Rock
```javascript
{
  lead: {
    pressure: { range: [40, 100], curve: 'exponential' },
    timbre: { range: [20, 80], curve: 'sine' },
    pitchBend: { range: [-200, 200], curve: 'smooth' }
  },
  bass: {
    pressure: { range: [60, 120], curve: 'linear' },
    timbre: { range: [10, 50], curve: 'warm' },
    pitchBend: { range: [-100, 100], curve: 'slide' }
  }
}
```

### Techno
```javascript
{
  lead: {
    pressure: { range: [50, 90], curve: 'sharp' },
    timbre: { range: [40, 80], curve: 'industrial' },
    pitchBend: { range: [-150, 150], curve: 'staccato' }
  },
  bass: {
    pressure: { range: [70, 110], curve: 'punch' },
    timbre: { range: [20, 60], curve: 'deep' },
    pitchBend: { range: [-80, 80], curve: 'tight' }
  }
}
```

## Verwendung

### MPE Song erstellen
```bash
# Über MCP Server
{
  "method": "tools/call",
  "params": {
    "name": "create_mpe_song",
    "arguments": {
      "description": "Ein psychedelischer Rocksong im Stil von Tame Impala",
      "style": "psychedelic_rock",
      "artist": "Tame Impala",
      "useMPE": true
    }
  }
}
```

### MPE Status abfragen
```bash
# Prüfe verfügbare MPE-Synths
{
  "method": "tools/call",
  "params": {
    "name": "mpe_status",
    "arguments": {}
  }
}
```

## Audio-System Integration

### JACK Audio Server
Für beste MPE-Performance wird JACK empfohlen:

```bash
# JACK installieren
sudo apt install jackd2

# JACK starten
jackd -d alsa -r 44100 &

# Synth mit JACK verbinden
surge-xt --jack
```

### ALSA Fallback
Falls JACK nicht verfügbar ist, wird ALSA verwendet:

```bash
# ALSA Tools installieren
sudo apt install alsa-utils

# Audio-Geräte auflisten
aplay -l
```

## Troubleshooting

### Synth nicht gefunden
```bash
# Prüfe Installation
which surge-xt
which helm
which zynaddsubfx

# Prüfe PATH
echo $PATH
```

### Audio-Ausgabe Probleme
```bash
# JACK Status prüfen
jack_control status

# ALSA Status prüfen
amixer scontrols
```

### MPE MIDI Probleme
```bash
# MIDI-Geräte auflisten
aconnect -l

# MIDI-Verbindungen prüfen
aconnect -o
```

## Performance Optimierung

### Buffer-Größe anpassen
```bash
# Für niedrige Latenz
jackd -d alsa -r 44100 -p 256

# Für hohe Stabilität
jackd -d alsa -r 44100 -p 1024
```

### CPU-Priorität erhöhen
```bash
# JACK mit hoher Priorität starten
sudo nice -n -10 jackd -d alsa -r 44100
```

## Zukünftige Features

- **MPE-Learning**: Automatische Anpassung basierend auf Stil
- **Expression-Mapping**: Benutzerdefinierte Expression-Zuordnung
- **MPE-Presets**: Vorgefertigte MPE-Konfigurationen
- **Real-time MPE**: Live MPE-Steuerung über Web-Interface
- **MPE-Visualisierung**: Grafische Darstellung der Expression-Daten

## Links

- [Surge XT Documentation](https://surge-synthesizer.github.io/)
- [MPE Specification](https://www.midi.org/midi-articles/midi-polyphonic-expression-mpe)
- [MIDI 2.0 Specification](https://www.midi.org/midi-articles/midi-2-0-specification)
- [JACK Audio Server](https://jackaudio.org/)
- [ALSA Documentation](https://alsa-project.org/) 