import express from 'express'
import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class OpenWebUIIntegration {
  constructor() {
    this.app = express()
    this.serverProcess = null
    this.requestId = 1
    this.setupMiddleware()
    this.setupRoutes()
  }

  setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use(express.static(join(__dirname, 'public')))
  }

  setupRoutes() {
    // OpenAPI Schema Endpoint (für OpenWebUI)
    this.app.get('/openapi.json', (req, res) => {
      try {
        const openapiSchema = {
          openapi: "3.0.0",
          info: {
            title: "Open DAW MCP Bridge",
            version: "1.0.0",
            description: "MCP Bridge für Song-Erstellung und Audio-Generierung"
          },
          servers: [
            {
              url: "http://87.106.81.49:3001",
              description: "VM Server"
            },
            {
              url: "https://open-daw-mcp-api.digitalalchemisten.de",
              description: "Cloudflare Tunnel"
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
                            enum: ["create_song_from_description", "daw_command", "create_track", "add_effect"]
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
            },
            "/api/health": {
              get: {
                summary: "Health check",
                responses: {
                  "200": {
                    description: "Server is healthy",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            status: { type: "string" },
                            message: { type: "string" }
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

    // API Routes
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Open DAW MCP Server running' })
    })

    // Audio-Datei direkt bereitstellen
    this.app.get('/api/audio/:filename', (req, res) => {
      const { filename } = req.params
      const audioPath = join(process.cwd(), 'output', filename)
      
      if (!existsSync(audioPath)) {
        return res.status(404).json({ error: 'Audio-Datei nicht gefunden' })
      }
      
      res.setHeader('Content-Type', 'audio/wav')
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
      
      try {
        const audioBuffer = readFileSync(audioPath)
        res.send(audioBuffer)
      } catch (error) {
        res.status(500).json({ error: 'Fehler beim Lesen der Audio-Datei' })
      }
    })

    // MIDI-Datei direkt bereitstellen
    this.app.get('/api/midi/:filename', (req, res) => {
      const { filename } = req.params
      const midiPath = join(process.cwd(), 'output', filename)
      
      if (!existsSync(midiPath)) {
        return res.status(404).json({ error: 'MIDI-Datei nicht gefunden' })
      }
      
      res.setHeader('Content-Type', 'audio/midi')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      
      try {
        const midiBuffer = readFileSync(midiPath)
        res.send(midiBuffer)
      } catch (error) {
        res.status(500).json({ error: 'Fehler beim Lesen der MIDI-Datei' })
      }
    })

    this.app.get('/api/tools', async (req, res) => {
      try {
        const tools = await this.sendRequest('tools/list')
        res.json(tools)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.get('/api/styles', async (req, res) => {
      try {
        const styles = await this.sendRequest('tools/call', {
          name: 'list_music_styles',
          arguments: {}
        })
        res.json(styles)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.post('/api/create-song', async (req, res) => {
      try {
        const { description, style, artist } = req.body
        
        const result = await this.sendRequest('tools/call', {
          name: 'create_song_from_description',
          arguments: { description, style, artist }
        })
        
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    // DAW API Endpoints
    this.app.post('/api/daw/command', async (req, res) => {
      try {
        const { command } = req.body
        
        const result = await this.sendRequest('tools/call', {
          name: 'daw_command',
          arguments: { command }
        })
        
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.get('/api/daw/status', async (req, res) => {
      try {
        const result = await this.sendRequest('tools/call', {
          name: 'daw_status',
          arguments: {}
        })
        
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.post('/api/daw/track', async (req, res) => {
      try {
        const { name, type } = req.body
        
        const result = await this.sendRequest('tools/call', {
          name: 'create_track',
          arguments: { name, type }
        })
        
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.post('/api/daw/effect', async (req, res) => {
      try {
        const { track_name, effect_type } = req.body
        
        const result = await this.sendRequest('tools/call', {
          name: 'add_effect',
          arguments: { track_name, effect_type }
        })
        
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    // OpenWebUI Functions Endpoint
    this.app.post('/api/openwebui/functions', async (req, res) => {
      try {
        console.log('📥 OpenWebUI Request:', JSON.stringify(req.body, null, 2))
        
        const { name, arguments: args, function_name, params } = req.body
        
        // OpenWebUI sendet verschiedene Formate, wir müssen flexibel sein
        let toolName = name || function_name || 'create_song_from_description'
        let toolArgs = args || params || {}
        
        // Mapping für OpenWebUI Tool-Namen
        if (toolName === 'generate_song') {
          toolName = 'create_song_from_description'
          // Konvertiere OpenWebUI Parameter in unser Format
          toolArgs = {
            description: `Ein ${toolArgs.genre || 'psychedelischer'} Song mit ${toolArgs.tempo || '100'} BPM im ${toolArgs.time_signature || '4/4'} Takt. Instrumente: ${toolArgs.instruments || 'Gitarre, Bass, Schlagzeug'}. Struktur: ${toolArgs.song_structure || 'Intro, Verse, Chorus, Outro'}. ${toolArgs.lyrics ? 'Text: ' + toolArgs.lyrics : ''}`,
            style: toolArgs.genre?.toLowerCase().includes('psychedelic') ? 'psychedelic_rock' : 'techno',
            artist: 'Tame Impala'
          }
        }
        
        // Mapping für DAW-Befehle
        if (toolName === 'daw_command' || toolName === 'daw_befehl' || toolName === 'daw') {
          toolName = 'daw_command'
          toolArgs = { command: toolArgs.command || toolArgs.description || 'Status anzeigen' }
        }
        
        // Mapping für Track-Erstellung
        if (toolName === 'create_track' || toolName === 'track_erstellen' || toolName === 'neuer_track') {
          toolName = 'create_track'
          toolArgs = { 
            name: toolArgs.name || toolArgs.track_name || 'Track_' + Date.now(),
            type: toolArgs.type || toolArgs.track_type || 'synth'
          }
        }
        
        // Mapping für Effekt-Hinzufügung
        if (toolName === 'add_effect' || toolName === 'effekt_hinzufügen' || toolName === 'effekt') {
          toolName = 'add_effect'
          toolArgs = {
            track_name: toolArgs.track_name || toolArgs.track || 'bass',
            effect_type: toolArgs.effect_type || toolArgs.effekt || 'reverb'
          }
        }
        
        // Fallback für falsch interpretierte Tool-Namen
        if (toolName && !['create_song_from_description', 'list_available_tools', 'list_music_styles', 'daw_command', 'daw_status', 'create_track', 'add_effect'].includes(toolName)) {
          console.log('🔄 Unbekanntes Tool erkannt, verwende Fallback:', toolName)
          
          // Prüfe ob es ein DAW-Befehl sein könnte
          const lowerToolName = toolName.toLowerCase()
          if (lowerToolName.includes('bpm') || lowerToolName.includes('tempo') || 
              lowerToolName.includes('reverb') || lowerToolName.includes('delay') || 
              lowerToolName.includes('track') || lowerToolName.includes('effekt')) {
            toolName = 'daw_command'
            toolArgs = { command: toolName }
          } else {
            toolName = 'create_song_from_description'
            toolArgs = {
              description: `Erstelle einen Song basierend auf der Anfrage: ${toolName}`,
              style: 'psychedelic_rock',
              artist: 'Tame Impala'
            }
          }
        }
        
        console.log('🔧 Calling tool:', toolName, 'with args:', toolArgs)
        
        const result = await this.sendRequest('tools/call', {
          name: toolName,
          arguments: toolArgs
        })
        
        console.log('📤 Sending result:', JSON.stringify(result, null, 2))
        res.json(result)
      } catch (error) {
        console.error('❌ Error in OpenWebUI endpoint:', error)
        res.status(500).json({ error: error.message })
      }
    })

    // Web Interface
    this.app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'public', 'index.html'))
    })
  }

  async startServer() {
    const serverPath = join(__dirname, '../server/manual-mcp-server.js')
    this.serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    this.serverProcess.stdout.on('data', (data) => {
      console.log('📤 MCP Server Output:', data.toString().trim())
    })
    
    this.serverProcess.stderr.on('data', (data) => {
      console.error('❌ MCP Server Error:', data.toString())
    })
    
    // Warten bis Server bereit ist
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 15000)
      
      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString().trim())
          clearTimeout(timeout)
          this.serverProcess.stdout.removeListener('data', responseHandler)
          resolve(response)
        } catch (error) {
          // Ignoriere nicht-JSON Output
        }
      }
      
      this.serverProcess.stdout.on('data', responseHandler)
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n')
    })
  }

  start(port = 3001) {
    this.startServer().then(() => {
      this.app.listen(port, () => {
        console.log(`🌐 OpenWebUI Integration läuft auf http://localhost:${port}`)
        console.log('🎵 MCP Server ist bereit für Song-Erstellung!')
      })
    })
  }

  stop() {
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }
}

export default OpenWebUIIntegration 