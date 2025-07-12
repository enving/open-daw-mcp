import express from 'express'
import cors from 'cors'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { OpenWebUIMCPBridge } from '../integration/openwebui-mcp-bridge.js'

const app = express()
const PORT = process.env.PORT || 3001

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
        audioUrl = `http://localhost:3001/api/audio/${result.files.audio}`
        responseText += `🎧 [Audio anhören](${audioUrl})\n\n`
      }
      
      if (result.files && result.files.midi) {
        midiUrl = `http://localhost:3001/api/midi/${result.files.midi}`
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

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 OpenWebUI MCP Bridge Server läuft auf Port ${PORT}`)
  console.log(`📡 Audio-Endpoint: http://localhost:${PORT}/api/audio/`)
  console.log(`🔧 Function Endpoint: http://localhost:${PORT}/api/openwebui/functions`)
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`)
}) 