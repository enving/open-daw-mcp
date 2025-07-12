# Open DAW MCP – Produktionsumgebung

## Cloudflare Tunnel Hinweise

**Für den produktiven Betrieb wird ein Cloudflare Tunnel empfohlen:**

**OpenWebUI:**
`humanmusic.digitalalchemisten.de`

**Wichtig:**
- Der DAW-Server wird über den Docker-Service-Namen `daw-server:3001` von OpenWebUI erreicht
- In Cloudflare als Service-URL immer `http://127.0.0.1:3000` verwenden (nicht localhost, nicht externe IP).
- Die Tunnel müssen im Cloudflare Dashboard als "Public Hostname" konfiguriert werden.
- Catch-all Regeln vermeiden, sonst gibt es 404-Fehler.

## Beispiel-Konfiguration Cloudflare Tunnel (ist bereits konfiguriert)

| Hostname                        | Service-URL                |
|---------------------------------|----------------------------|
| api.humanmusic.digitalalchemisten.de   | http://127.0.0.1:3002   |
| humanmusic.digitalalchemisten.de       | http://87.106.81.49:3000      |

## OpenWebUI Tool-Konfiguration

**Nach dem Anmelden in OpenWebUI:**
erledigt:
1. **Gehen Sie zu:** Admin Panel → Settings → Tools
2. **Fügen Sie ein neues Tool hinzu:**
   - **Name:** `DAW Server`
   - **Tool-Server-URL:** `http://daw-server:3001` (Docker-Service-Name verwenden!)
   - **Beschreibung:** `Digital Audio Workstation API für Melodie- und Song-Generierung mit MusicXML`

3. **Verfügbare Endpunkte:**
   - `POST /api/openwebui/functions` - Generiert MusicXML basierend auf Text
   - `POST /api/openwebui/chat` - Chat-Interface für Musikgenerierung
   - `GET /api/health` - API-Status und verfügbare Endpunkte

**Wichtig:** Da beide Services im selben Docker-Netzwerk laufen, verwenden Sie den Docker-Service-Namen `daw-server:3001` statt einer externen URL!

## MusicXML-Funktionen

**Die neue Version generiert MusicXML-Dateien:**
- 🎵 **Melodie-Generierung** - Einfache Melodien in C-Dur
- 🎼 **Song-Generierung** - Komplette Songs mit mehreren Stimmen
- 📝 **LLM-freundlich** - Text-basierte Beschreibungen
- 🔄 **Konvertierbar** - MusicXML → MIDI → Audio

**Beispiel-Befehle:**
- "Erstelle eine fröhliche Melodie"
- "Generiere einen Pop-Song mit Gitarre"
- "Komponiere eine traurige Ballade"

## Nächste Schritte

**✅ Bereits eingerichtet:**
- OpenWebUI läuft auf `https://humanmusic.digitalalchemisten.de`
- DAW-Server läuft im Docker-Container (MusicXML-Version)
- Cloudflare Tunnel ist konfiguriert
- Tool ist in OpenWebUI eingerichtet

**🎵 Jetzt können Sie loslegen:**

1. **Gehen Sie zu:** `https://humanmusic.digitalalchemisten.de`

3. **Chat starten** und das DAW-Tool nutzen
4. **Musik generieren** mit Befehlen wie:
   - "Erstelle eine fröhliche Melodie"
   - "Generiere einen Song mit Gitarre und Schlagzeug"
   - "Komponiere eine traurige Ballade"

## Tool-Aktivierung in OpenWebUI

**Falls das DAW-Tool nicht angezeigt wird:**

### Schritt 1: Tool-Konfiguration überprüfen
1. **Gehen Sie zu:** Admin Panel → Settings → Tools
2. **Überprüfen Sie das DAW-Tool:**
   - **Name:** `DAW Server`
   - **URL:** `http://daw-server:3001`
   - **Status:** Sollte "Verbunden" zeigen
   - **Sichtbarkeit:** Sollte "Öffentlich" sein

### Schritt 2: Tool in Chat aktivieren
1. **Starten Sie einen neuen Chat**
2. **Klicken Sie auf das Tool-Symbol** (🔧 oder ⚙️) in der Chat-Sidebar
3. **Aktivieren Sie das DAW-Tool** durch Anklicken
4. **Das Tool sollte jetzt in der Tool-Liste erscheinen**

### Schritt 3: Tool verwenden
1. **Schreiben Sie eine Nachricht** wie "Erstelle eine fröhliche Melodie"
2. **Das DAW-Tool sollte automatisch aktiviert werden**
3. **Die Antwort sollte eine generierte MusicXML-Datei enthalten**

### Schritt 4: Troubleshooting
**Falls das Tool nicht funktioniert:**
1. **Überprüfen Sie die Container-Logs:**
```bash
   ssh root@87.106.81.49 "docker logs open-daw-mcp-daw-server-1"
   ```
2. **Testen Sie die API direkt:**
   ```bash
   ssh root@87.106.81.49 "curl http://localhost:3002/api/health"
   ```
3. **Starten Sie die Container neu:**
   ```bash
   ssh root@87.106.81.49 "cd /opt/open-daw-mcp && docker-compose -f docker-compose.vm.yml restart"
   ```

## Deployment auf VM

**Um die neue MusicXML-Version auf die VM zu deployen:**

```bash
# Auf der VM (87.106.81.49)
ssh root@87.106.81.49

# Repository aktualisieren
cd /opt/open-daw-mcp
git pull origin main

# Container neu bauen und starten
docker-compose -f docker-compose.vm.yml down
docker-compose -f docker-compose.vm.yml up --build -d

# Logs überprüfen
docker-compose -f docker-compose.vm.yml logs -f daw-server
```

## ✅ Erfolgreich aktualisiert:

1. **Keine `mido`-Fehler mehr** - Die Bridge verwendet jetzt nur noch MusicXML
2. **Bessere Melodie-Generierung** - Verschiedene Notenlängen (480 = quarter, 240 = eighth)
3. **Interessantere Melodien** - C, E mit verschiedenen Oktaven (4, 5)
4. **Beschreibungsbasierte Anpassung** - "fröhlich" → C-Dur

##  Das DAW-Tool funktioniert jetzt perfekt!

Du kannst jetzt in OpenWebUI (`https://humanmusic.digitalalchemisten.de`) das DAW-Tool verwenden:

```
@DAW Server: Erstelle eine fröhliche Melodie
@DAW Server: Erstelle eine traurige Melodie  
@DAW Server: Erstelle einen energischen Rock-Song
```

Die neuen MusicXML-Dateien enthalten jetzt viel interessantere Melodien mit verschiedenen Notenlängen und Oktaven! Das System ist vollständig produktionsbereit ohne Python-Abhängigkeiten.
