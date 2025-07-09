# User Stories - Open DAW MCP System

## User 1: Tame Impala Style Song Creation

**Anforderung:**
"ich möchte über openwebui einen song zb nach art tame impala kreieren. hilf mir dabei interessante grundstruktur des songs aufzubauen. shcick mir eine audio datei die eine interessante synth spur enthält und schon alle kompnenten des songs berücksichgt also chrous etc."

**Lösung:**
- ✅ **IONOS API Integration**: Externe KI für Song-Generierung
- ✅ **MPE/MIDI 2.0 Support**: Expressive Synth-Spuren
- ✅ **Vollständige Song-Struktur**: Intro, Verse, Chorus, Bridge, Outro
- ✅ **Audio-Export**: WAV-Dateien für OpenWebUI
- ✅ **VM-Integration**: Alles zentral in der VM
- ✅ **OpenWebUI Integration**: Chat-Interface für Song-Erstellung

**System-Architektur:**
```
🌐 IONOS API (Cloud) → 🖥️ VM (87.106.81.49)
                        ├── 🎵 Ardour (Port 3819)
                        ├── 🌐 OpenWebUI (Port 3000)
                        ├── 🔧 MCP Bridge (Port 3001)
                        └── 📁 Audio/MIDI Output
```

**Verfügbare Endpoints:**
- `http://87.106.81.49:3000` - OpenWebUI Interface
- `http://87.106.81.49:3001/api/openwebui/chat` - Chat API
- `http://87.106.81.49:3001/api/audio/` - Audio-Download
- `http://87.106.81.49:3001/api/midi/` - MIDI-Download

**Start-Skript:**
```bash
./start-vm-system.sh
```

**Test-Command:**
```bash
curl -X POST http://87.106.81.49:3001/api/openwebui/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Erstelle einen psychedelischen Song im Stil von Tame Impala mit interessanten Synth-Spuren", "user": "user1"}'
```