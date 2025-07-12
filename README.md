# Open DAW MCP – Produktionsumgebung

## Cloudflare Tunnel Hinweise

**Für den produktiven Betrieb wird ein Cloudflare Tunnel empfohlen:**

**OpenWebUI:**
`humanmusic.digitalalchemisten.de`


**Wichtig:**
- Der DAW-Server wird über den Docker-Service-Namen `daw-server:3002` von OpenWebUI erreicht
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
   - **Tool-Server-URL:** `http://daw-server:3002` (Docker-Service-Name verwenden!)
   - **Beschreibung:** `Digital Audio Workstation API für Melodie- und Song-Generierung`

3. **Verfügbare Endpunkte:**
   - `POST /generate-melody` - Generiert eine Melodie basierend auf Text
   - `POST /generate-song` - Generiert einen kompletten Song
   - `GET /` - API-Status und verfügbare Endpunkte

**Wichtig:** Da beide Services im selben Docker-Netzwerk laufen, verwenden Sie den Docker-Service-Namen `daw-server:3002` statt einer externen URL!

## Nächste Schritte

**✅ Bereits eingerichtet:**
- OpenWebUI läuft auf `https://humanmusic.digitalalchemisten.de`
- DAW-Server läuft im Docker-Container
- Cloudflare Tunnel ist konfiguriert
- Tool ist in OpenWebUI eingerichtet

**🎵 Jetzt können Sie loslegen:**

1. **Gehen Sie zu:** `https://humanmusic.digitalalchemisten.de`
2. **Anmelden** mit:
   - **Username:** `admin`
   - **Password:** `admin123`
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
   - **URL:** `http://daw-server:3002`
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
3. **Die Antwort sollte eine generierte Melodie enthalten**

### Schritt 4: Troubleshooting
**Falls das Tool nicht funktioniert:**
1. **Überprüfen Sie die Container-Logs:**
   ```bash
   ssh root@87.106.81.49 "docker logs open-daw-mcp-daw-server-1"
   ```
2. **Testen Sie die API direkt:**
   ```bash
   ssh root@87.106.81.49 "curl http://localhost:3002/"
   ```
3. **Starten Sie die Container neu:**
   ```bash
   ssh root@87.106.81.49 "cd /opt/open-daw-mcp && docker-compose -f docker-compose.vm.yml restart"
   ```

**🔧 Weitere Möglichkeiten:**
- **Neue Benutzer registrieren** (falls gewünscht)
- **Weitere Tools hinzufügen** (z.B. für andere APIs)
- **Modelle konfigurieren** (Ollama, OpenAI, etc.)
- **Chats und Konversationen verwalten**

**📊 Monitoring:**
- **Logs anzeigen:** `make logs-vm`
- **Container-Status:** `docker ps`
- **OpenWebUI-Admin:** Einstellungen im Web-Interface 