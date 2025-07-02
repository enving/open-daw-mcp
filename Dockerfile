# Basis-Dockerfile für Open DAW MCP
FROM node:18-bullseye

# Systempakete installieren
RUN apt-get update && \
    apt-get install -y git ffmpeg sox build-essential python3 \
    # Optional: Synthesizer
    # zynaddsubfx fluidsynth \
    && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /app

# Projektdateien kopieren
COPY package*.json ./
COPY . .

# Node Dependencies installieren
RUN npm install

# Optional: Soundfonts/Samples in /app/soundfonts
# COPY soundfonts/ /app/soundfonts/

# Port (falls Webserver)
EXPOSE 3000

# Startkommando (anpassbar)
CMD ["node", "src/server/manual-mcp-server.js"] 