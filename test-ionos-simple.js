#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade .env Datei
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const env = {}
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        env[key.trim()] = value.trim()
      }
    })
    
    return env
  } catch (error) {
    console.error('Fehler beim Laden der .env Datei:', error.message)
    return {}
  }
}

// IONOS API Client
class SimpleIONOSClient {
  constructor(apiToken) {
    this.apiUrl = 'https://openai.inference.de-txl.ionos.com/v1/chat/completions'
    this.apiToken = apiToken
    
    if (!this.apiToken) {
      throw new Error('IONOS_API_TOKEN ist nicht konfiguriert')
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
Tonart: ${key} ${scale}`

    const request = {
      model: 'llama-3.1-8b',
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
    }

    try {
      console.log('📤 Sende API Request:')
      console.log('URL:', this.apiUrl)
      console.log('Request Body:', JSON.stringify(request, null, 2))
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify(request)
      })

      console.log('📥 Response Status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('📥 Error Response Body:', errorText)
        throw new Error(`IONOS API Fehler: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📥 Success Response:', JSON.stringify(data, null, 2))
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('IONOS API Fehler:', error)
      throw error
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

Beschreibung: ${description}`

    const request = {
      model: 'llama-3.1-8b',
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
    }

    try {
      console.log('📤 Sende API Request:')
      console.log('URL:', this.apiUrl)
      console.log('Request Body:', JSON.stringify(request, null, 2))
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify(request)
      })

      console.log('📥 Response Status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('📥 Error Response Body:', errorText)
        throw new Error(`IONOS API Fehler: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📥 Success Response:', JSON.stringify(data, null, 2))
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('IONOS API Fehler:', error)
      throw error
    }
  }

  parseSynthPattern(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('Kein gültiges JSON in der Antwort gefunden')
    } catch (error) {
      console.error('Fehler beim Parsen der Synthesizer-Pattern:', error)
      throw error
    }
  }

  parseArdourCommands(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('Kein gültiges JSON in der Antwort gefunden')
    } catch (error) {
      console.error('Fehler beim Parsen der Ardour-Befehle:', error)
      throw error
    }
  }
}

async function testIONOSAPI() {
  console.log('🚀 Starte IONOS API Test...')
  
  try {
    // Lade Umgebungsvariablen
    const env = loadEnv()
    const apiToken = env.IONOS_API_TOKEN
    
    if (!apiToken) {
      throw new Error('IONOS_API_TOKEN nicht in .env gefunden')
    }
    
    // IONOS Client erstellen
    const ionosClient = new SimpleIONOSClient(apiToken)
    console.log('📡 IONOS Client initialisiert')
    
    // Test: Synthesizer-Pattern generieren
    console.log('\n🎵 Generiere Synthesizer-Pattern mit IONOS API...')
    
    const patternResponse = await ionosClient.generateSynthPattern(
      'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien und atmosphärischen Pad-Sounds',
      128,
      'A',
      'minor'
    )
    
    console.log('\n📥 Rohe IONOS Antwort erhalten:')
    console.log('Länge:', patternResponse.length, 'Zeichen')
    console.log('Antwort:', patternResponse)
    
    // Pattern parsen
    console.log('\n🔍 Parse Pattern...')
    const patternData = ionosClient.parseSynthPattern(patternResponse)
    
    console.log('\n✅ Pattern erfolgreich geparst!')
    console.log('📊 Pattern Details:')
    console.log('- BPM:', patternData.bpm)
    console.log('- Key:', patternData.key)
    console.log('- Scale:', patternData.scale)
    console.log('- Beschreibung:', patternData.description)
    console.log('- Vorgeschlagenes Plugin:', patternData.suggested_plugin)
    console.log('- Plugin Preset:', patternData.plugin_preset)
    
    if (patternData.pattern && Array.isArray(patternData.pattern)) {
      console.log('- Anzahl MIDI-Noten:', patternData.pattern.length)
      console.log('- Erste 3 Noten:')
      patternData.pattern.slice(0, 3).forEach((note, index) => {
        console.log(`  ${index + 1}. Note: ${note.note}, Velocity: ${note.velocity}, Duration: ${note.duration}s, Start: ${note.startTime}s`)
      })
    }
    
    // Test: Ardour-Befehle generieren
    console.log('\n🎛️ Teste Ardour-Befehle Generierung...')
    
    const commandResponse = await ionosClient.generateArdourCommand(
      'Erstelle einen MIDI-Track und füge einen Synthesizer hinzu'
    )
    
    console.log('\n📥 Ardour-Befehle Antwort:')
    console.log('Länge:', commandResponse.length, 'Zeichen')
    console.log('Antwort:', commandResponse)
    
    // Befehle parsen
    const commandsData = ionosClient.parseArdourCommands(commandResponse)
    
    console.log('\n✅ Ardour-Befehle erfolgreich geparst!')
    console.log('📋 Befehle:')
    if (commandsData.commands && Array.isArray(commandsData.commands)) {
      commandsData.commands.forEach((cmd, index) => {
        console.log(`  ${index + 1}. ${cmd.type}: ${JSON.stringify(cmd)}`)
      })
    }
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
    
    // Zeige spezifische Fehlerinformationen
    if (error.message?.includes('IONOS_API_TOKEN')) {
      console.log('\n🔧 Konfiguration prüfen:')
      console.log('1. Kopiere env.example zu .env: cp env.example .env')
      console.log('2. Setze deinen IONOS API Token in .env')
      console.log('3. Führe den Test erneut aus')
    } else if (error.message?.includes('IONOS API')) {
      console.log('\n🌐 API Fehler - mögliche Ursachen:')
      console.log('1. Internetverbindung prüfen')
      console.log('2. IONOS API Verfügbarkeit prüfen')
      console.log('3. API Token Gültigkeit prüfen')
    }
  }
  
  console.log('\n🏁 IONOS API Test beendet.')
  process.exit(0)
}

// Test ausführen
testIONOSAPI() 