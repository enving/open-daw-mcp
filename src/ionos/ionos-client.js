import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

class IONOSClient {
  constructor() {
    this.config = {
      apiUrl: process.env.IONOS_API_URL || 'https://openai.inference.de-txl.ionos.com/v1',
      apiToken: process.env.IONOS_API_TOKEN || '',
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct'
    };
  }

  async generateResponse(prompt) {
    try {
      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`IONOS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Keine Antwort von IONOS API erhalten');
      }

      return content;

    } catch (error) {
      console.error('IONOS API Fehler:', error);
      throw error;
    }
  }

  async generateSongFromDescription(request) {
    try {
      const prompt = this.buildSongPrompt(request);
      
      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `Du bist ein professioneller Musikproduzent und Songwriter. 
              Erstelle detaillierte Song-Beschreibungen basierend auf natürlichen Sprachbeschreibungen.
              Antworte immer im folgenden JSON-Format:
              {
                "title": "Song-Titel",
                "style": "Musikstil",
                "tempo": 120,
                "key": "C",
                "structure": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Outro"],
                "instruments": ["Bass", "Drums", "Synth", "Guitar"],
                "description": "Detaillierte Beschreibung des Songs"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`IONOS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Keine Antwort von IONOS API erhalten');
      }

      // Versuche JSON aus der Antwort zu extrahieren
      const songData = this.extractJSONFromResponse(content);
      
      return {
        success: true,
        songData
      };

    } catch (error) {
      console.error('IONOS API Fehler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  }

  buildSongPrompt(request) {
    let prompt = `Erstelle einen Song basierend auf dieser Beschreibung: "${request.description}"`;
    
    if (request.style) {
      prompt += `\nStil: ${request.style}`;
    }
    
    if (request.artist) {
      prompt += `\nInspiriert von: ${request.artist}`;
    }
    
    if (request.tempo) {
      prompt += `\nTempo: ${request.tempo} BPM`;
    }
    
    if (request.key) {
      prompt += `\nTonart: ${request.key}`;
    }
    
    prompt += `\n\nErstelle eine detaillierte Song-Beschreibung mit Titel, Stil, Tempo, Tonart, Struktur und Instrumenten.`;
    
    return prompt;
  }

  extractJSONFromResponse(content) {
    try {
      // Versuche direktes JSON-Parsing
      return JSON.parse(content);
    } catch {
      // Versuche JSON aus dem Text zu extrahieren
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fallback: Erstelle strukturierte Daten aus dem Text
          return this.parseStructuredResponse(content);
        }
      }
      
      // Fallback: Erstelle strukturierte Daten aus dem Text
      return this.parseStructuredResponse(content);
    }
  }

  parseStructuredResponse(content) {
    // Fallback-Parser für nicht-JSON Antworten
    const lines = content.split('\n');
    const result = {
      title: 'Generierter Song',
      style: 'Electronic',
      tempo: 120,
      key: 'C',
      structure: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Outro'],
      instruments: ['Bass', 'Drums', 'Synth'],
      description: content
    };

    // Versuche Informationen aus dem Text zu extrahieren
    for (const line of lines) {
      if (line.toLowerCase().includes('tempo') || line.includes('bpm')) {
        const tempoMatch = line.match(/(\d+)/);
        if (tempoMatch) result.tempo = parseInt(tempoMatch[1]);
      }
      if (line.toLowerCase().includes('key') || line.toLowerCase().includes('tonart')) {
        const keyMatch = line.match(/[A-G][#b]?/);
        if (keyMatch) result.key = keyMatch[0];
      }
    }

    return result;
  }
}

export { IONOSClient }; 