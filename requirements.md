# Systemanforderungen & Abhängigkeiten für Open DAW MCP

## Systempakete (Linux)
- nodejs (>=18)
- npm (>=9)
- git
- ffmpeg (optional, für Audio-Konvertierung)
- sox (optional, für Audio-Manipulation)
- build-essential (für native Module)
- python3 (für node-gyp, falls benötigt)

## Node.js Dependencies (package.json)
- tone (Audio-Synthese)
- web-audio-api (Node.js Polyfill für Tone.js)
- osc (Open Sound Control)
- node-osc (OSC für Node.js)
- commander (CLI-Tools)
- dotenv (Umgebungsvariablen)
- node-fetch (HTTP-Requests)

## Synthesizer & Tools (optional, für spätere Phasen)
- zynaddsubfx (z.B. apt install zynaddsubfx)
- fluidsynth (z.B. apt install fluidsynth)
- soundfonts (z.B. FluidR3_GM.sf2)

## Cloud-VM Anforderungen

### Minimale VM-Spezifikationen
- **CPU**: 2 vCores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS (empfohlen)

### Empfohlene VM-Spezifikationen
- **CPU**: 4 vCores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Netzwerk**: 100 Mbps (für Audio-Upload/Download)

### Docker-Anforderungen
- Docker Engine >= 20.10
- Docker Compose >= 2.0 (optional)
- Portainer (optional, für Web-Interface)

### Netzwerk-Ports
- **3000**: MCP Server (HTTP/WebSocket)
- **22**: SSH (für Administration)
- **80/443**: HTTP/HTTPS (falls Web-Interface)

## Deployment-Optionen

### Option 1: Docker (Empfohlen)
```bash
# Alle Abhängigkeiten im Container
docker build -t open-daw-mcp .
docker run -d --name open-daw-mcp -p 3000:3000 open-daw-mcp
```

### Option 2: Native Installation
```bash
# System-Dependencies
sudo apt update
sudo apt install nodejs npm git ffmpeg sox build-essential python3

# Node-Dependencies
npm install

# Optional: Synthesizer
sudo apt install zynaddsubfx fluidsynth
```

### Option 3: Hybrid (Docker + Native Synths)
```bash
# Docker für Node.js App
docker run -d --name open-daw-mcp -p 3000:3000 open-daw-mcp

# Native Synths auf Host
sudo apt install zynaddsubfx fluidsynth
# OSC-Kommunikation zwischen Container und Host
```

## Performance-Optimierungen

### Audio-Verarbeitung
- **CPU-Priorität**: Audio-Prozesse mit höherer Priorität
- **RAM-Optimierung**: Audio-Buffer-Größe anpassen
- **Storage**: SSD für schnelle Audio-I/O

### Netzwerk-Optimierung
- **CDN**: Für Audio-Datei-Downloads
- **Caching**: Audio-Files cachen
- **Compression**: Audio-Kompression für Uploads

## Monitoring & Logging

### System-Monitoring
- **CPU**: Audio-Verarbeitung überwachen
- **RAM**: Memory-Usage für Audio-Buffer
- **Storage**: Audio-File-Speicherplatz
- **Network**: Upload/Download-Bandbreite

### Application-Logging
- **MCP Server**: JSON-RPC Requests/Responses
- **Audio-Engine**: Synthesizer-Performance
- **Error-Logging**: Fehler und Fallbacks

## Sicherheit

### Netzwerk-Sicherheit
- **Firewall**: Nur notwendige Ports öffnen
- **SSL/TLS**: HTTPS für Web-Interface
- **VPN**: Für sicheren Zugang

### Application-Security
- **Input-Validation**: Song-Beschreibungen validieren
- **File-Upload**: Audio-Files scannen
- **Rate-Limiting**: API-Requests begrenzen

## Backup & Recovery

### Daten-Backup
- **Audio-Files**: Regelmäßige Backups
- **Configuration**: MCP-Server-Konfiguration
- **Samples**: Sample-Bibliothek

### Disaster Recovery
- **Docker-Images**: Backup der Images
- **Configuration**: Infrastructure as Code
- **Documentation**: Deployment-Dokumentation

## Hinweise
- Für die Dockerisierung werden alle Systempakete im Dockerfile installiert.
- Die Synthesizer können im Container oder auf der VM laufen (je nach Architektur).
- Für Tone.js reicht Node.js, für ZynAddSubFX/FluidSynth werden die nativen Binaries benötigt.
- Cloud-VM sollte für Audio-Verarbeitung optimiert sein (CPU, RAM, Storage).
- Monitoring ist wichtig für Performance und Stabilität. 