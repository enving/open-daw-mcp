# Open DAW MCP - Architektur

## 🏗️ System-Architektur

### **Core Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OpenWebUI     │    │   LLM Bridge    │    │   MCP Server    │
│   (Chat UI)     │◄──►│  (IONOS API)    │◄──►│  (Protocol)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MIDI Engine   │    │   Audio Engine  │    │  Carla Host     │
│  (Sequencing)   │◄──►│  (Processing)   │◄──►│  (Plugin Host)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DAW Core      │    │   JACK Audio    │    │   Export        │
│  (Management)   │◄──►│   (Real-time)   │◄──►│  (WAV/MIDI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Komponenten-Details

### **1. Headless DAW Core** (`src/daw/core.py`)
- **Zweck:** Zentrale DAW-Verwaltung
- **Features:**
  - Projekt-Management (Erstellen, Laden, Speichern)
  - Track-Management (Audio/MIDI Tracks)
  - Playback Control (Play, Stop, Pause)
  - Plugin-Management (Plugin-Chains)
  - Export-Funktionen (WAV, MIDI)

### **2. Carla Plugin Host** (`src/plugins/carla_host.py`)
- **Zweck:** Headless Plugin-Hosting
- **Features:**
  - VST2/3 Plugin Support
  - LV2 Plugin Support
  - LADSPA Plugin Support
  - OSC Communication
  - Parameter Automation
  - Plugin Discovery

### **3. Audio Engine** (`src/audio/engine.py`)
- **Zweck:** Real-time Audio Processing
- **Features:**
  - JACK Audio Integration
  - Audio Buffer Management
  - Sample Rate Conversion
  - Effects Processing
  - Audio Import/Export
  - Real-time Performance

### **4. MIDI Engine** (`src/midi/engine.py`)
- **Zweck:** MIDI Sequencing und Processing
- **Features:**
  - Multi-Track MIDI Support
  - MPE Support (Expressive MIDI)
  - MIDI Clock Synchronization
  - MIDI Import/Export
  - Real-time MIDI Processing
  - MIDI Event Management

### **5. LLM Bridge** (`src/llm/ionos_bridge.py`)
- **Zweck:** IONOS API Integration
- **Features:**
  - Sprach-zu-MIDI Konvertierung
  - Stil-spezifische Song-Generierung
  - Artist-Referenz-Erkennung
  - Batch Processing
  - Error Handling

### **6. MCP Server** (`src/mcp/server.py`)
- **Zweck:** Model Context Protocol Implementation
- **Features:**
  - Tool Registration
  - Function Calling
  - OpenWebUI Integration
  - Song Management
  - Export Functions

## 🔄 Datenfluss

### **Song-Erstellung Workflow:**

1. **OpenWebUI Chat** → Benutzer gibt Sprachbeschreibung ein
2. **MCP Server** → Empfängt Tool-Call
3. **LLM Bridge** → Sendet Anfrage an IONOS API
4. **IONOS API** → Generiert MIDI-Daten basierend auf Beschreibung
5. **MIDI Engine** → Verarbeitet MIDI-Daten
6. **Carla Host** → Lädt Plugins und verarbeitet Audio
7. **Audio Engine** → Real-time Audio Processing
8. **DAW Core** → Koordiniert alle Komponenten
9. **Export** → WAV/MIDI-Dateien werden erstellt

### **Real-time Audio Pipeline:**

```
MIDI Events → MIDI Engine → Carla Host → Audio Engine → JACK Audio → Output
     ↑              ↓              ↓              ↓              ↓
  LLM Bridge → MCP Server → DAW Core → Plugin Chain → Effects → Export
```

## 🎛️ Plugin-Architektur

### **Plugin-Typen:**
- **VST2/3 Plugins** - Steinberg Virtual Studio Technology
- **LV2 Plugins** - Linux Audio Developer's Simple Plugin API
- **LADSPA Plugins** - Linux Audio Developer's Simple Plugin API

### **Plugin-Hosting:**
```
Carla Host
├── VST2 Plugins
│   ├── Synthesizer
│   ├── Effects
│   └── Instruments
├── LV2 Plugins
│   ├── FluidSynth
│   ├── ReasonableSynth
│   └── Effects
└── LADSPA Plugins
    ├── Filters
    ├── Delays
    └── Reverbs
```

## 🔧 Technologie-Stack

### **Backend:**
- **Python 3.10+** - Hauptprogrammiersprache
- **JACK Audio** - Real-time Audio System
- **ALSA MIDI** - MIDI Subsystem
- **OSC Protocol** - Open Sound Control

### **Audio Processing:**
- **NumPy** - Numerische Berechnungen
- **SciPy** - Wissenschaftliche Berechnungen
- **SoundFile** - Audio I/O
- **Librosa** - Audio Analysis

### **MIDI Processing:**
- **Mido** - MIDI I/O
- **Python-RTMIDI** - Real-time MIDI

### **Communication:**
- **AIOHTTP** - Async HTTP Client
- **Python-OSC** - OSC Communication
- **LibLO** - OSC Library

### **Development:**
- **Pytest** - Testing Framework
- **Black** - Code Formatting
- **Flake8** - Code Linting

## 🚀 Performance-Optimierungen

### **Real-time Audio:**
- **JACK Audio Server** - Low-latency Audio
- **Buffer Size Optimization** - 512 Samples
- **Sample Rate** - 44.1 kHz
- **Multi-threading** - Async Processing

### **MIDI Processing:**
- **Event-based Processing** - Effiziente MIDI-Verarbeitung
- **Clock Synchronization** - Präzise Timing
- **MPE Support** - Expressive MIDI Controller

### **Plugin Hosting:**
- **OSC Communication** - Schnelle Plugin-Steuerung
- **Parameter Caching** - Reduzierte API-Calls
- **Batch Processing** - Effiziente Plugin-Operationen

## 🔒 Sicherheit

### **VM-Isolation:**
- **Containerized Environment** - Isolierte Ausführung
- **Network Security** - Firewall-Regeln
- **Resource Limits** - CPU/Memory Limits

### **API Security:**
- **IONOS API Token** - Sichere Authentifizierung
- **HTTPS Communication** - Verschlüsselte Kommunikation
- **Error Handling** - Robuste Fehlerbehandlung

## 📊 Monitoring

### **Logging:**
- **Structured Logging** - JSON-Format
- **Log Levels** - DEBUG, INFO, WARNING, ERROR
- **Performance Metrics** - CPU, Memory, Latency

### **Health Checks:**
- **Component Status** - Alle Module überwachen
- **Audio Pipeline** - Real-time Audio Monitoring
- **Plugin Status** - Plugin-Gesundheit prüfen

## 🔄 Deployment

### **VM Setup:**
```bash
# Ubuntu 22.04 LTS
sudo apt update
sudo apt install -y jackd2 carla python3-pip build-essential

# Python Dependencies
pip3 install -r requirements.txt

# Build System
make build
```

### **Service Management:**
```bash
# JACK Audio Server
jackd -d alsa -r 44100 -p 512 -n 2 &

# Carla Headless
carla --no-gui --engine=jack --osc-port=22752 &

# MCP Server
python3 -m src.mcp.server
```

## 🎯 Skalierbarkeit

### **Horizontal Scaling:**
- **Multiple VMs** - Load Balancing
- **Microservices** - Komponenten-Trennung
- **Message Queues** - Asynchrone Verarbeitung

### **Vertical Scaling:**
- **CPU Optimization** - Multi-core Processing
- **Memory Management** - Effiziente Buffer-Verwaltung
- **Storage Optimization** - SSD für Audio-Files

---

**Status:** Architektur vollständig definiert, alle Komponenten implementiert! 🚀 