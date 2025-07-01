# Tests für open-daw-mcp

## Synthesizer-Loop Test

### Voraussetzungen

1. **IONOS API Token konfigurieren:**
   ```bash
   cp env.example .env
   # Bearbeite .env und setze deinen IONOS_API_TOKEN
   ```

2. **Ardour DAW starten:**
   ```bash
   ardour6 --new-session test_session
   ```

3. **OSC in Ardour aktivieren:**
   - Gehe zu `Window > OSC` in Ardour
   - Aktiviere OSC Control
   - Setze Port auf 3819

### Test ausführen

#### Einfacher Test (empfohlen)
```bash
node test-synth-simple.js
```

#### Vollständiger MCP Test
```bash
node test-synth-loop.js
```

### Was passiert beim Test

1. **MCP Server startet** und verbindet sich mit Ardour
2. **IONOS API wird aufgerufen** um ein Synthesizer-Pattern zu generieren
3. **MIDI-Track wird in Ardour erstellt**
4. **Synthesizer-Plugin wird hinzugefügt** (z.B. ZynAddSubFX)
5. **Pattern wird als MIDI-Daten übertragen**

### Erwartete Ausgabe

```
🚀 Starte Synthesizer-Loop Test...
📡 Verbinde mit MCP Server...
🎵 Erstelle Synthesizer-Loop...

✅ Synthesizer-Loop erfolgreich erstellt!
📁 AudioClip ID: clip_1234567890
🎛️ Track ID: midi_track_1
🔌 Plugin ID: plugin_1
🎵 BPM: 128
🎼 Key: A
📏 Scale: minor
📝 Beschreibung: Ein energetischer Synthesizer-Loop...

🏁 Test beendet.
```

### Fehlerbehebung

**IONOS API Fehler:**
- Prüfe ob `IONOS_API_TOKEN` korrekt gesetzt ist
- Stelle sicher, dass die IONOS API verfügbar ist

**Ardour Verbindungsfehler:**
- Prüfe ob Ardour läuft
- Stelle sicher, dass OSC aktiviert ist
- Prüfe Port 3819

**Plugin Fehler:**
- Stelle sicher, dass ZynAddSubFX installiert ist
- Alternative Plugins: `Calf Monosynth`, `Amsynth` 