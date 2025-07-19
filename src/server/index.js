import express from 'express'
import cors from 'cors'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { OpenWebUIMCPBridge } from './openwebui-bridge.js'

const app = express()
const PORT = process.env.PORT || 3002

// CORS für OpenWebUI
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}))

app.use(express.json())

// OpenWebUI MCP Bridge
const bridge = new OpenWebUIMCPBridge()

// Root OpenAPI Endpoint (für OpenWebUI)
app.get('/openapi.json', (req, res) => {
  try {
    const functions = bridge.getFunctionDefinitions()
    
    // Einfacheres OpenAPI-Schema
    const openapiSchema = {
      openapi: "3.0.0",
      info: {
        title: "OpenWebUI MCP Bridge",
        version: "1.0.0",
        description: "MCP Bridge für Song-Erstellung und Audio-Generierung"
      },
      servers: [
        {
          url: "http://daw-server:3002",
          description: "Docker Service (internal)"
        },
        {
          url: "http://localhost:3002",
          description: "Local development server"
        }
      ],
      paths: {
        "/api/openwebui/functions": {
          post: {
            summary: "Execute function call",
            operationId: "executeFunction",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      function_name: {
                        type: "string",
                        description: "Name of the function to call",
                        enum: functions.map(f => f.name)
                      },
                      parameters: {
                        type: "object",
                        description: "Function parameters"
                      }
                    },
                    required: ["function_name"]
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "Function executed successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        result: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {}
      }
    }
    
    res.json(openapiSchema)
  } catch (error) {
    console.error('❌ Fehler beim Generieren des OpenAPI Schemas:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Audio-Dateien bereitstellen
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params
  const audioPath = join(process.cwd(), 'output', 'audio', filename)
  
  if (!existsSync(audioPath)) {
    return res.status(404).json({ error: 'Audio-Datei nicht gefunden' })
  }
  
  try {
    const audioBuffer = readFileSync(audioPath)
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Content-Length', audioBuffer.length)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.send(audioBuffer)
  } catch (error) {
    console.error('❌ Fehler beim Bereitstellen der Audio-Datei:', error)
    res.status(500).json({ error: 'Fehler beim Laden der Audio-Datei' })
  }
})

// OpenWebUI Function Calling Endpoint
app.post('/api/openwebui/functions', async (req, res) => {
  try {
    const { function_name, parameters } = req.body
    
    if (!function_name) {
      return res.status(400).json({ error: 'function_name ist erforderlich' })
    }
    
    console.log('🎵 OpenWebUI Function Call:', function_name, parameters)
    
    // Parameter korrekt extrahieren
    let functionParams = parameters || {}
    
    // Falls parameters ein String ist, versuche es zu parsen
    if (typeof parameters === 'string') {
      try {
        functionParams = JSON.parse(parameters)
      } catch (e) {
        // Fallback: Verwende leeres Objekt
        functionParams = {}
      }
    }
    
    const result = await bridge.handleFunctionCall(function_name, functionParams)
    
    res.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error('❌ Fehler bei Function Call:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Chat Endpoint für OpenWebUI
app.post('/api/openwebui/chat', async (req, res) => {
  try {
    const { message, user, context } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'message ist erforderlich' })
    }
    
    console.log('🎵 OpenWebUI Chat Anfrage:', { message, user })
    
    // Verwende die natürliche Sprachverarbeitung der Bridge
    const result = await bridge.handleFunctionCall(message, context || {})
    
    // Formatiere die Antwort für OpenWebUI Chat
    let responseText = 'Ich habe deine Anfrage verarbeitet!'
    let audioUrl = null
    let midiUrl = null
    
    if (result.song) {
      responseText = `🎵 **${result.song.title}** wurde erstellt!\n\n`
      responseText += `**Stil:** ${result.song.style}\n`
      responseText += `**Tempo:** ${result.song.tempo} BPM\n`
      responseText += `**Tonart:** ${result.song.key}\n\n`
      responseText += `**Struktur:** ${result.song.structure.join(' → ')}\n\n`
      responseText += `**Beschreibung:** ${result.song.description}\n\n`
      
      if (result.files && result.files.audio) {
        audioUrl = `http://daw-server:3002/api/audio/${result.files.audio}`
        responseText += `🎧 [Audio anhören](${audioUrl})\n\n`
      }
      
      if (result.files && result.files.midi) {
        midiUrl = `http://daw-server:3002/api/midi/${result.files.midi}`
        responseText += `🎼 [MIDI-Datei herunterladen](${midiUrl})\n\n`
      }
    }
    
    res.json({
      success: true,
      response: responseText,
      audioUrl: audioUrl,
      midiUrl: midiUrl,
      result: result
    })
  } catch (error) {
    console.error('❌ Fehler bei Chat-Anfrage:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Natürliche Sprachverarbeitung Endpoint
app.post('/api/openwebui/natural-language', async (req, res) => {
  try {
    const { message, context } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'message ist erforderlich' })
    }
    
    console.log('🎵 Natürliche Sprachanfrage:', message)
    
    // Verwende die natürliche Sprachverarbeitung der Bridge
    const result = await bridge.handleFunctionCall(message, context || {})
    
    res.json({
      success: true,
      result: result,
      interpretedFunction: result.functionResponse || 'Anfrage verarbeitet'
    })
  } catch (error) {
    console.error('❌ Fehler bei natürlicher Sprachverarbeitung:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Function Definitions Endpoint
app.get('/api/openwebui/functions', (req, res) => {
  try {
    const functions = bridge.getFunctionDefinitions()
    
    // OpenWebUI erwartet möglicherweise ein anderes Format
    const openwebuiFunctions = functions.map(func => ({
      name: func.name,
      description: func.description,
      parameters: func.parameters
    }))
    
    res.json({
      success: true,
      functions: openwebuiFunctions,
      // Alternative Format für OpenWebUI
      tools: openwebuiFunctions
    })
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Function Definitions:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// OpenAPI Schema Endpoint (für OpenWebUI)
app.get('/api/openwebui/functions/openapi.json', (req, res) => {
  try {
    const functions = bridge.getFunctionDefinitions()
    
    // Einfacheres OpenAPI-Schema
    const openapiSchema = {
      openapi: "3.0.0",
      info: {
        title: "OpenWebUI MCP Bridge",
        version: "1.0.0",
        description: "MCP Bridge für Song-Erstellung und Audio-Generierung"
      },
      servers: [
        {
          url: "http://localhost:3001",
          description: "Local development server"
        }
      ],
      paths: {
        "/api/openwebui/functions": {
          post: {
            summary: "Execute function call",
            operationId: "executeFunction",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      function_name: {
                        type: "string",
                        description: "Name of the function to call",
                        enum: functions.map(f => f.name)
                      },
                      parameters: {
                        type: "object",
                        description: "Function parameters"
                      }
                    },
                    required: ["function_name"]
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "Function executed successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        result: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {}
      }
    }
    
    res.json(openapiSchema)
  } catch (error) {
    console.error('❌ Fehler beim Generieren des OpenAPI Schemas:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpenWebUI MCP Bridge',
    timestamp: new Date().toISOString()
  })
})

// WildFX Plugin Integration Endpoints
app.get('/api/wildfx/plugins', (req, res) => {
  try {
    // Simuliere verfügbare WildFX-Plugins
    const plugins = [
      '3_Band_EQ_DISTRHO',
      'ZamCompX2_Damien_Zammit', 
      'Samurai_Delay_discoDSP',
      'Schroeder_discoDSP',
      '3-Band_Splitter_Unknown'
    ]
    
    res.json({
      success: true,
      plugins: plugins,
      count: plugins.length,
      message: 'WildFX-Plugins verfügbar'
    })
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der WildFX-Plugins:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.get('/api/wildfx/styles', (req, res) => {
  try {
    const styles = [
      {
        name: 'pop',
        description: 'Pop-Musik mit EQ und Kompression',
        plugins: ['3_Band_EQ_DISTRHO', 'ZamCompX2_Damien_Zammit']
      },
      {
        name: 'rock', 
        description: 'Rock-Musik mit verstärktem Bass',
        plugins: ['3_Band_EQ_DISTRHO', 'ZamCompX2_Damien_Zammit']
      },
      {
        name: 'electronic',
        description: 'Elektronische Musik mit Delay-Effekten', 
        plugins: ['3_Band_EQ_DISTRHO', 'Samurai_Delay_discoDSP']
      },
      {
        name: 'jazz',
        description: 'Jazz-Musik mit Reverb-Effekten',
        plugins: ['3_Band_EQ_DISTRHO', 'Schroeder_discoDSP']
      }
    ]
    
    res.json({
      success: true,
      styles: styles,
      count: styles.length,
      message: 'WildFX-Musikstile verfügbar'
    })
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der WildFX-Styles:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/wildfx/apply-effects', async (req, res) => {
  try {
    const { audioFile, style, outputFilename } = req.body
    
    if (!audioFile || !style) {
      return res.status(400).json({ 
        error: 'audioFile und style sind erforderlich' 
      })
    }
    
    console.log('🎵 WildFX Effekte anwenden:', { audioFile, style })
    
    // Simuliere WildFX-Effekt-Anwendung
    const processedAudio = `processed_${outputFilename || 'audio'}_wildfx_${style}.wav`
    
    // Hier würde die echte WildFX-Integration stehen
    // Für jetzt simulieren wir die Verarbeitung
    
    res.json({
      success: true,
      message: `WildFX-Effekte angewendet für Stil: ${style}`,
      originalFile: audioFile,
      processedFile: processedAudio,
      style: style,
      plugins: ['3_Band_EQ_DISTRHO', 'ZamCompX2_Damien_Zammit']
    })
  } catch (error) {
    console.error('❌ Fehler bei WildFX-Effekten:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/wildfx/export-audio', async (req, res) => {
  try {
    const { musicxmlFile, style, outputFilename, format } = req.body
    
    if (!musicxmlFile) {
      return res.status(400).json({ 
        error: 'musicxmlFile ist erforderlich' 
      })
    }
    
    console.log('🎵 WildFX Audio-Export:', { musicxmlFile, style, format })
    
    // Erstelle Output-Verzeichnis
    const outputDir = '/app/output/audio'
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    
    // Generiere Audio-Datei basierend auf Stil
    const outputFile = outputFilename || `wildfx_export_${Date.now()}.${format || 'wav'}`
    const outputPath = `${outputDir}/${outputFile}`
    
    // Simuliere Audio-Generierung basierend auf Stil
    const audioData = generateAudioForStyle(style || 'pop')
    
    // Schreibe Audio-Datei
    writeFileSync(outputPath, audioData)
    
    console.log(`✅ WildFX Audio generiert: ${outputPath}`)
    
    res.json({
      success: true,
      message: `Audio exportiert mit WildFX-Style: ${style || 'pop'}`,
      inputFile: musicxmlFile,
      outputFile: outputFile,
      outputPath: outputPath,
      style: style || 'pop',
      format: format || 'wav',
      plugins: getPluginsForStyle(style || 'pop'),
      fileSize: audioData.length
    })
  } catch (error) {
    console.error('❌ Fehler bei WildFX Audio-Export:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Dexed FM-Synth API Endpunkte - Echte Integration
app.post('/api/dexed/create-patch', async (req, res) => {
  try {
    const { name = 'Custom Patch', algorithm = 1 } = req.body
    
    // Rufe echten Dexed-Server auf
    const response = await fetch('http://dexed-engine:8081/api/dexed/create-patch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, algorithm })
    })
    
    const data = await response.json()
    
    if (data.success) {
      res.json(data)
    } else {
      res.status(500).json(data)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Patches',
      error: error.message
    })
  }
})

app.post('/api/dexed/generate-audio', async (req, res) => {
  try {
    const { patch, note = 60, velocity = 100, duration = 2.0 } = req.body
    
    if (!patch) {
      return res.status(400).json({
        success: false,
        message: 'Patch ist erforderlich'
      })
    }
    
    // Rufe echten Dexed-Server auf
    const response = await fetch('http://dexed-engine:8081/api/dexed/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ patch, note, velocity, duration })
    })
    
    const data = await response.json()
    
    if (data.success) {
      res.json(data)
    } else {
      res.status(500).json(data)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des Audios',
      error: error.message
    })
  }
})

app.get('/api/dexed/algorithms', async (req, res) => {
  try {
    // Rufe echten Dexed-Server auf
    const response = await fetch('http://dexed-engine:8081/api/dexed/algorithms')
    const data = await response.json()
    
    if (data.success) {
      res.json(data)
    } else {
      res.status(500).json(data)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Algorithmen',
      error: error.message
    })
  }
})

app.get('/api/dexed/health', async (req, res) => {
  try {
    // Rufe echten Dexed-Server auf
    const response = await fetch('http://dexed-engine:8081/health')
    const data = await response.json()
    
    res.json({
      success: true,
      message: 'Dexed Engine Status',
      dexed_available: data.dexed_available,
      status: data.status
    })
  } catch (error) {
    res.json({
      success: false,
      message: 'Dexed Engine nicht erreichbar',
      dexed_available: false,
      error: error.message
    })
  }
})

// Hilfsfunktionen für Audio-Generierung
function generateAudioForStyle(style) {
  // Echte Instrumenten-Engine
  const sampleRate = 44100
  const duration = 3.0 // 3 Sekunden
  const samples = Math.floor(sampleRate * duration)
  
  // Wähle Instrument basierend auf Stil
  const instrument = getInstrumentForStyle(style)
  
  // Generiere Melodie basierend auf Stil
  const melody = generateMelodyForStyle(style)
  
  // Erstelle Audio-Samples mit echtem Instrument
  const audioSamples = []
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate
    const sample = generateInstrumentSample(instrument, melody, time)
    audioSamples.push(sample)
  }
  
  // Erstelle WAV-Header
  const wavHeader = createWAVHeader(samples, sampleRate)
  
  // Konvertiere Samples zu 16-bit PCM
  const pcmData = new Int16Array(samples)
  for (let i = 0; i < samples; i++) {
    pcmData[i] = Math.floor(audioSamples[i] * 32767)
  }
  
  // Kombiniere Header und PCM-Daten
  const wavBuffer = Buffer.concat([
    Buffer.from(wavHeader),
    Buffer.from(pcmData.buffer)
  ])
  
  return wavBuffer
}

function getInstrumentForStyle(style) {
  const instruments = {
    'pop': {
      name: 'Electric Piano',
      type: 'rhodes',
      attack: 0.1,
      decay: 0.3,
      sustain: 0.7,
      release: 0.5
    },
    'rock': {
      name: 'Electric Guitar',
      type: 'guitar',
      attack: 0.05,
      decay: 0.2,
      sustain: 0.8,
      release: 0.3,
      distortion: 0.3
    },
    'electronic': {
      name: 'Synthesizer',
      type: 'synth',
      attack: 0.02,
      decay: 0.1,
      sustain: 0.9,
      release: 0.4,
      filter: 0.6
    },
    'jazz': {
      name: 'Saxophone',
      type: 'sax',
      attack: 0.2,
      decay: 0.4,
      sustain: 0.6,
      release: 0.8
    }
  }
  
  return instruments[style] || instruments['pop']
}

function generateMelodyForStyle(style) {
  const melodies = {
    'pop': [
      { note: 'C4', duration: 0.5, velocity: 0.8 },
      { note: 'E4', duration: 0.5, velocity: 0.8 },
      { note: 'G4', duration: 0.5, velocity: 0.8 },
      { note: 'C5', duration: 0.5, velocity: 0.8 },
      { note: 'G4', duration: 0.5, velocity: 0.8 },
      { note: 'E4', duration: 0.5, velocity: 0.8 }
    ],
    'rock': [
      { note: 'E2', duration: 0.3, velocity: 0.9 },
      { note: 'A2', duration: 0.3, velocity: 0.9 },
      { note: 'D3', duration: 0.3, velocity: 0.9 },
      { note: 'G3', duration: 0.3, velocity: 0.9 },
      { note: 'B3', duration: 0.3, velocity: 0.9 },
      { note: 'E4', duration: 0.3, velocity: 0.9 }
    ],
    'electronic': [
      { note: 'C5', duration: 0.2, velocity: 0.7 },
      { note: 'F5', duration: 0.2, velocity: 0.7 },
      { note: 'A5', duration: 0.2, velocity: 0.7 },
      { note: 'C6', duration: 0.2, velocity: 0.7 },
      { note: 'A5', duration: 0.2, velocity: 0.7 },
      { note: 'F5', duration: 0.2, velocity: 0.7 }
    ],
    'jazz': [
      { note: 'F3', duration: 0.8, velocity: 0.6 },
      { note: 'A3', duration: 0.8, velocity: 0.6 },
      { note: 'C4', duration: 0.8, velocity: 0.6 },
      { note: 'F4', duration: 0.8, velocity: 0.6 },
      { note: 'A4', duration: 0.8, velocity: 0.6 }
    ]
  }
  
  return melodies[style] || melodies['pop']
}

function generateInstrumentSample(instrument, melody, time) {
  let sample = 0
  
  // Berechne aktuelle Note basierend auf Zeit
  const noteIndex = Math.floor(time / 0.5) % melody.length
  const note = melody[noteIndex]
  const noteTime = time % 0.5
  
  if (noteTime < note.duration) {
    // Konvertiere Note zu Frequenz
    const frequency = noteToFrequency(note.note)
    
    // Generiere Instrument-Sound basierend auf Typ
    switch (instrument.type) {
      case 'rhodes':
        sample = generateRhodesSound(frequency, noteTime, note.velocity, instrument)
        break
      case 'guitar':
        sample = generateGuitarSound(frequency, noteTime, note.velocity, instrument)
        break
      case 'synth':
        sample = generateSynthSound(frequency, noteTime, note.velocity, instrument)
        break
      case 'sax':
        sample = generateSaxSound(frequency, noteTime, note.velocity, instrument)
        break
      default:
        sample = generateBasicSound(frequency, noteTime, note.velocity)
    }
  }
  
  return sample
}

function noteToFrequency(note) {
  const noteMap = {
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
  }
  
  return noteMap[note] || 440
}

function generateRhodesSound(frequency, time, velocity, instrument) {
  // Rhodes Electric Piano Sound
  const fundamental = Math.sin(2 * Math.PI * frequency * time)
  const harmonic1 = 0.5 * Math.sin(2 * Math.PI * frequency * 2 * time)
  const harmonic2 = 0.3 * Math.sin(2 * Math.PI * frequency * 3 * time)
  
  // ADSR Envelope
  const envelope = calculateADSR(time, instrument.attack, instrument.decay, instrument.sustain, instrument.release)
  
  return (fundamental + harmonic1 + harmonic2) * envelope * velocity
}

function generateGuitarSound(frequency, time, velocity, instrument) {
  // Electric Guitar Sound mit Distortion
  const fundamental = Math.sin(2 * Math.PI * frequency * time)
  const harmonic1 = 0.7 * Math.sin(2 * Math.PI * frequency * 2 * time)
  const harmonic2 = 0.5 * Math.sin(2 * Math.PI * frequency * 3 * time)
  
  // Distortion
  let distorted = fundamental + harmonic1 + harmonic2
  if (instrument.distortion) {
    distorted = Math.tanh(distorted * (1 + instrument.distortion))
  }
  
  // ADSR Envelope
  const envelope = calculateADSR(time, instrument.attack, instrument.decay, instrument.sustain, instrument.release)
  
  return distorted * envelope * velocity
}

function generateSynthSound(frequency, time, velocity, instrument) {
  // Synthesizer Sound mit Filter
  const fundamental = Math.sin(2 * Math.PI * frequency * time)
  const harmonic1 = 0.6 * Math.sin(2 * Math.PI * frequency * 2 * time)
  const harmonic2 = 0.4 * Math.sin(2 * Math.PI * frequency * 3 * time)
  const harmonic3 = 0.2 * Math.sin(2 * Math.PI * frequency * 4 * time)
  
  // Low-pass Filter Simulation
  let filtered = fundamental + harmonic1 + harmonic2 + harmonic3
  if (instrument.filter) {
    const filterFreq = frequency * instrument.filter
    const filterResponse = 1 / (1 + (frequency / filterFreq))
    filtered *= filterResponse
  }
  
  // ADSR Envelope
  const envelope = calculateADSR(time, instrument.attack, instrument.decay, instrument.sustain, instrument.release)
  
  return filtered * envelope * velocity
}

function generateSaxSound(frequency, time, velocity, instrument) {
  // Saxophone Sound mit charakteristischen Harmonischen
  const fundamental = Math.sin(2 * Math.PI * frequency * time)
  const harmonic1 = 0.8 * Math.sin(2 * Math.PI * frequency * 2 * time)
  const harmonic2 = 0.6 * Math.sin(2 * Math.PI * frequency * 3 * time)
  const harmonic3 = 0.4 * Math.sin(2 * Math.PI * frequency * 4 * time)
  const harmonic4 = 0.2 * Math.sin(2 * Math.PI * frequency * 5 * time)
  
  // Vibrato
  const vibrato = 0.02 * Math.sin(2 * Math.PI * 6 * time)
  const vibratoFreq = frequency * (1 + vibrato)
  
  const fundamentalVib = Math.sin(2 * Math.PI * vibratoFreq * time)
  const harmonic1Vib = 0.8 * Math.sin(2 * Math.PI * vibratoFreq * 2 * time)
  const harmonic2Vib = 0.6 * Math.sin(2 * Math.PI * vibratoFreq * 3 * time)
  const harmonic3Vib = 0.4 * Math.sin(2 * Math.PI * vibratoFreq * 4 * time)
  const harmonic4Vib = 0.2 * Math.sin(2 * Math.PI * vibratoFreq * 5 * time)
  
  // ADSR Envelope
  const envelope = calculateADSR(time, instrument.attack, instrument.decay, instrument.sustain, instrument.release)
  
  return (fundamentalVib + harmonic1Vib + harmonic2Vib + harmonic3Vib + harmonic4Vib) * envelope * velocity
}

function generateBasicSound(frequency, time, velocity) {
  // Fallback: Einfacher Sinus-Wave
  return Math.sin(2 * Math.PI * frequency * time) * velocity
}

function calculateADSR(time, attack, decay, sustain, release) {
  if (time < attack) {
    return time / attack
  } else if (time < attack + decay) {
    const decayTime = time - attack
    return 1 - (decayTime / decay) * (1 - sustain)
  } else if (time < attack + decay + release) {
    const releaseTime = time - (attack + decay)
    return sustain - (releaseTime / release) * sustain
  } else {
    return 0
  }
}

function createWAVHeader(samples, sampleRate) {
  const header = Buffer.alloc(44)
  const dataSize = samples * 2 // 16-bit = 2 bytes per sample
  
  // RIFF Header
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4) // File size
  header.write('WAVE', 8)
  
  // fmt chunk
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // fmt chunk size
  header.writeUInt16LE(1, 20) // Audio format (PCM)
  header.writeUInt16LE(1, 22) // Number of channels (mono)
  header.writeUInt32LE(sampleRate, 24) // Sample rate
  header.writeUInt32LE(sampleRate * 2, 28) // Byte rate
  header.writeUInt16LE(2, 32) // Block align
  header.writeUInt16LE(16, 34) // Bits per sample
  
  // data chunk
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  
  return header
}

function getPluginsForStyle(style) {
  const pluginMap = {
    'pop': ['3_Band_EQ_DISTRHO', 'ZamCompX2_Damien_Zammit'],
    'rock': ['3_Band_EQ_DISTRHO', 'ZamCompX2_Damien_Zammit'],
    'electronic': ['3_Band_EQ_DISTRHO', 'Samurai_Delay_discoDSP'],
    'jazz': ['3_Band_EQ_DISTRHO', 'Schroeder_discoDSP']
  }
  
  return pluginMap[style] || pluginMap['pop']
}

function generateDexedAudio(patch, note, velocity, duration) {
  const sampleRate = 44100
  const samples = Math.floor(sampleRate * duration)
  const audio = []
  
  // Konvertiere MIDI-Note zu Frequenz
  const freq = 440.0 * Math.pow(2, (note - 69) / 12)
  
  // FM-Synthese basierend auf Patch-Parametern
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate
    
    // Carrier (Operator 6)
    const carrierFreq = freq * patch.operators[5].freq_ratio
    const carrierPhase = 2 * Math.PI * carrierFreq * time
    
    // Modulator (Operator 5)
    const modulatorFreq = freq * patch.operators[4].freq_ratio
    const modulatorPhase = 2 * Math.PI * modulatorFreq * time
    const modulator = Math.sin(modulatorPhase)
    
    // FM-Synthese
    const modulationIndex = (patch.operators[4].level / 99.0) * 2.0
    const fmSignal = Math.sin(carrierPhase + modulationIndex * modulator)
    
    // ADSR Envelope
    const envelope = calculateDexedADSR(time, duration, 
                                       patch.operators[5].attack / 99.0,
                                       patch.operators[5].decay / 99.0,
                                       patch.operators[5].sustain / 99.0,
                                       patch.operators[5].release / 99.0)
    
    // Velocity
    const velocityFactor = velocity / 127.0
    
    // Level
    const level = patch.operators[5].level / 99.0
    
    audio.push(fmSignal * envelope * velocityFactor * level)
  }
  
  return audio
}

function calculateDexedADSR(time, duration, attack, decay, sustain, release) {
  const attackTime = attack * duration * 0.1
  const decayTime = decay * duration * 0.1
  const releaseTime = release * duration * 0.1
  const sustainTime = duration - attackTime - decayTime - releaseTime
  
  if (time < attackTime) {
    return time / attackTime
  } else if (time < attackTime + decayTime) {
    const decayPhase = (time - attackTime) / decayTime
    return 1.0 - decayPhase * (1.0 - sustain)
  } else if (time < attackTime + decayTime + sustainTime) {
    return sustain
  } else if (time < duration) {
    const releasePhase = (time - (attackTime + decayTime + sustainTime)) / releaseTime
    return sustain * (1.0 - releasePhase)
  } else {
    return 0.0
  }
}

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 OpenWebUI MCP Bridge Server läuft auf Port ${PORT}`)
  console.log(`📡 Audio-Endpoint: http://localhost:${PORT}/api/audio/`)
  console.log(`🔧 Function Endpoint: http://localhost:${PORT}/api/openwebui/functions`)
  console.log(`🎵 WildFX Endpoints: http://localhost:${PORT}/api/wildfx/`)
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`)
}) 