# Reaper Headless Setup für Open DAW MCP

## Das Problem
Reaper ist normalerweise ein Desktop-Programm mit GUI. Für Server-Betrieb brauchen wir Headless-Modus.

## Lösung: Reaper Headless Installation

### 1. Reaper Headless auf Server installieren

```bash
# Ubuntu/Debian
wget https://www.reaper.fm/files/6.x/reaper640_linux_x86_64.tar.xz
tar -xf reaper640_linux_x86_64.tar.xz
sudo mv reaper_linux_x86_64 /opt/reaper

# Erstelle Symlink
sudo ln -s /opt/reaper/reaper /usr/local/bin/reaper
```

### 2. ReaPy Installation korrigieren

```bash
# Aktuelle Version installieren
pip install python-reapy==0.10.0

# Oder aus Git
pip install git+https://github.com/RomeoDespres/reapy.git
```

### 3. Headless Reaper Konfiguration

```bash
# Erstelle Reaper Konfiguration
mkdir -p ~/.config/REAPER
cat > ~/.config/REAPER/reaper.ini << EOF
[REAPER]
enable_web_interface=1
web_interface_port=8080
web_interface_allow_control=1
EOF
```

### 4. Reaper als Service starten

```bash
# Erstelle Systemd Service
sudo tee /etc/systemd/system/reaper.service << EOF
[Unit]
Description=Reaper DAW Headless
After=network.target

[Service]
Type=simple
User=reaper
Group=reaper
WorkingDirectory=/opt/reaper
ExecStart=/opt/reaper/reaper -nosplash -renderproject
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Erstelle User
sudo useradd -r -s /bin/false reaper
sudo chown -R reaper:reaper /opt/reaper

# Starte Service
sudo systemctl enable reaper
sudo systemctl start reaper
```

## Alternative: Docker-basierte Lösung

```dockerfile
# Dockerfile für Reaper Headless
FROM ubuntu:20.04

# Installiere Dependencies
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Installiere Reaper
RUN wget https://www.reaper.fm/files/6.x/reaper640_linux_x86_64.tar.xz \
    && tar -xf reaper640_linux_x86_64.tar.xz \
    && mv reaper_linux_x86_64 /opt/reaper \
    && rm reaper640_linux_x86_64.tar.xz

# Installiere ReaPy
RUN pip3 install python-reapy==0.10.0

# Konfiguriere Headless Mode
RUN mkdir -p /root/.config/REAPER
COPY reaper.ini /root/.config/REAPER/

# Expose Ports
EXPOSE 8080 8001

# Start Script
COPY start-reaper.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start-reaper.sh

CMD ["/usr/local/bin/start-reaper.sh"]
```

## Aktualisierte requirements.txt

```txt
# Open DAW MCP Dependencies

# Core Audio/MIDI
mido>=1.2.10
numpy>=1.21.0
python-rtmidi>=1.4.0

# Reaper Integration (korrigierte Version)
python-reapy==0.10.0

# XML Processing
lxml>=4.6.0

# Audio Processing
librosa>=0.9.0
soundfile>=0.10.0

# Web Framework
fastapi>=0.68.0
uvicorn>=0.15.0

# Utilities
python-dotenv>=0.19.0
pydantic>=1.8.0
```

## Docker Compose Setup

```yaml
# docker-compose.reaper.yml
version: '3.8'

services:
  reaper:
    build: .
    ports:
      - "8080:8080"  # Reaper Web Interface
      - "8001:8001"  # Our API
    volumes:
      - ./output:/app/output
      - ./projects:/app/projects
    environment:
      - REAPER_WEB_PORT=8080
      - REAPER_WEB_ALLOW_CONTROL=1
    restart: unless-stopped

  reaper-api:
    build: .
    command: python3 src/server/reaper_api.py
    ports:
      - "8001:8001"
    volumes:
      - ./output:/app/output
      - ./projects:/app/projects
    depends_on:
      - reaper
    restart: unless-stopped
```

## Start Script

```bash
#!/bin/bash
# start-reaper.sh

# Starte Reaper Headless
/opt/reaper/reaper -nosplash -renderproject &

# Warte bis Reaper läuft
sleep 10

# Starte API Server
python3 src/server/reaper_api.py
```

## Test der Headless Installation

```bash
# Teste Reaper Verbindung
curl http://localhost:8080

# Teste unsere API
curl http://localhost:8001/health

# Teste MusicXML Import
curl -X POST http://localhost:8001/test-musicxml
```

## Vorteile der Headless-Lösung:

1. **Server-basiert**: Läuft ohne GUI auf dem Server
2. **Skalierbar**: Kann mehrere Projekte parallel verarbeiten
3. **Automatisiert**: Vollständig über API steuerbar
4. **Docker-kompatibel**: Einfach zu deployen
5. **Ressourceneffizient**: Weniger RAM/CPU als GUI-Version

## Nächste Schritte:

1. Korrigiere die requirements.txt
2. Erstelle Docker-Setup
3. Teste Headless-Modus
4. Integriere in bestehende MCP-Architektur 