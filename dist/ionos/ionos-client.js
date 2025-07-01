export class IONOSClient {
    constructor() {
        this.apiUrl = process.env.IONOS_API_URL || 'https://api.ionos.com/v1/ai/chat/completions';
        this.apiToken = process.env.IONOS_API_TOKEN || '';
        if (!this.apiToken) {
            throw new Error('IONOS_API_TOKEN ist nicht in der .env Datei konfiguriert');
        }
    }
    async generateSynthPattern(description, bpm = 120, key = 'C', scale = 'major') {
        const systemPrompt = `Du bist ein Musikproduzent und Synthesizer-Experte. Erstelle einen Synthesizer-Loop basierend auf der Beschreibung des Benutzers.

Wichtige Regeln:
- Antworte NUR mit einem JSON-Objekt
- Verwende die angegebene Tonart und Skala
- Erstelle einen Loop, der sich gut wiederholt
- Verwende realistische MIDI-Noten und Timing
- Berücksichtige, dass dies für Ardour DAW ist

JSON-Format:
{
  "pattern": [
    {
      "note": "C4",
      "velocity": 80,
      "duration": 0.5,
      "startTime": 0
    }
  ],
  "bpm": 120,
  "key": "C",
  "scale": "major",
  "description": "Kurze Beschreibung des Loops",
  "suggested_plugin": "ZynAddSubFX",
  "plugin_preset": "Analog Lead"
}

Beschreibung: ${description}
BPM: ${bpm}
Tonart: ${key} ${scale}`;
        const request = {
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Erstelle einen Synthesizer-Loop für Ardour DAW: "${description}"`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        };
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                throw new Error(`IONOS API Fehler: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        }
        catch (error) {
            console.error('IONOS API Fehler:', error);
            throw error;
        }
    }
    async generateArdourCommand(description) {
        const systemPrompt = `Du bist ein Ardour DAW Experte. Übersetze die Beschreibung des Benutzers in Ardour-spezifische Befehle.

Verfügbare Ardour-Funktionen:
- Track erstellen (Audio/MIDI)
- Aufnahme starten/stoppen
- Transport steuern (Play/Stop/Record)
- Plugins hinzufügen
- Parameter setzen

Antworte NUR mit einem JSON-Objekt:
{
  "commands": [
    {
      "type": "create_track",
      "track_type": "midi",
      "name": "Synthesizer Track"
    },
    {
      "type": "add_plugin",
      "plugin_name": "ZynAddSubFX",
      "track_id": "midi_track_1"
    }
  ],
  "description": "Was wird ausgeführt"
}

Beschreibung: ${description}`;
        const request = {
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Übersetze in Ardour-Befehle: "${description}"`
                }
            ],
            temperature: 0.5,
            max_tokens: 800
        };
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                throw new Error(`IONOS API Fehler: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        }
        catch (error) {
            console.error('IONOS API Fehler:', error);
            throw error;
        }
    }
    async parseSynthPattern(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Kein gültiges JSON in der Antwort gefunden');
        }
        catch (error) {
            console.error('Fehler beim Parsen der Synthesizer-Pattern:', error);
            throw error;
        }
    }
    async parseArdourCommands(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Kein gültiges JSON in der Antwort gefunden');
        }
        catch (error) {
            console.error('Fehler beim Parsen der Ardour-Befehle:', error);
            throw error;
        }
    }
}
