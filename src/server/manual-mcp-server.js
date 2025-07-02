#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ToneAudioEngine from '../audio/tone-audio-engine.js'
import { IONOSClient } from '../ionos/ionos-client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ManualMCPServer {
  constructor() {
    this.outputDir = join(__dirname, '../../output')
    this.ensureOutputDir()
    
    // Audio Engine initialisieren
    this.audioEngine = new ToneAudioEngine()
    
    // IONOS Client initialisieren
    this.ionosClient = new IONOSClient()
    
    // Verfügbare Tools
    this.tools = {
      create_song_from_description: {
        description: 'Erstellt einen Song basierend auf einer natürlichen Sprachbeschreibung',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natürliche Sprachbeschreibung des gewünschten Songs'
            },
            style: {
              type: 'string',
              description: 'Optional: Musikstil (Techno, House, Ambient, etc.)'
            },
            artist: {
              type: 'string',
              description: 'Optional: Inspirierender Künstler'
            }
          },
          required: ['description']
        }
      },
      list_available_tools: {
        description: 'Listet alle verfügbaren Tools auf',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      list_music_styles: {
        description: 'Listet alle verfügbaren Musikstile auf',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    }
    
    // Musikstile
    this.musicStyles = {
      techno: { name: 'Techno', bpm_range: [120, 140], characteristics: ['repetitive', 'industrial'] },
      house: { name: 'House', bpm_range: [120, 130], characteristics: ['groovy', 'soulful'] },
      ambient: { name: 'Ambient', bpm_range: [60, 90], characteristics: ['atmospheric', 'ethereal'] },
      trance: { name: 'Trance', bpm_range: [130, 150], characteristics: ['euphoric', 'uplifting'] },
      drum_and_bass: { name: 'Drum & Bass', bpm_range: [160, 180], characteristics: ['fast', 'complex'] },
      psychedelic_rock: { name: 'Psychedelic Rock', bpm_range: [80, 95], characteristics: ['dreamy', 'reverb_heavy'] }
    }
    
    // Referenz-Künstler
    this.artistReferences = {
      'tame impala': 'psychedelic_rock',
      'kevin parker': 'psychedelic_rock',
      'daft punk': 'house',
      'aphex twin': 'ambient',
      'deadmau5': 'trance',
      'pendulum': 'drum_and_bass',
      'carl cox': 'techno'
    }
  }

  ensureOutputDir() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
      console.error('📁 Output-Verzeichnis erstellt:', this.outputDir)
    }
  }

  async handleRequest(request) {
    const { jsonrpc, id, method, params } = request

    if (jsonrpc !== '2.0') {
      return this.createErrorResponse(id, -32600, 'Invalid Request')
    }

    try {
      let result

      switch (method) {
        case 'tools/list':
          result = await this.listTools()
          break
        case 'tools/call':
          result = await this.callTool(params)
          break
        default:
          return this.createErrorResponse(id, -32601, 'Method not found')
      }

      return this.createSuccessResponse(id, result)
    } catch (error) {
      console.error('Fehler bei Request:', error)
      return this.createErrorResponse(id, -32603, error.message)
    }
  }

  async listTools() {
    return {
      tools: Object.entries(this.tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    }
  }

  async callTool(params) {
    const { name, arguments: args } = params

    if (!this.tools[name]) {
      throw new Error(`Tool '${name}' nicht gefunden`)
    }

    switch (name) {
      case 'create_song_from_description':
        return await this.createSongFromDescription(args)
      case 'list_available_tools':
        return await this.listAvailableTools()
      case 'list_music_styles':
        return await this.listMusicStyles()
      default:
        throw new Error(`Tool '${name}' nicht implementiert`)
    }
  }

  async createSongFromDescription(args) {
    const { description, style, artist } = args

    console.log('🎵 Erstelle Song aus Beschreibung:', description)

    try {
      // IONOS LLM API für Song-Generierung nutzen
      const ionosResponse = await this.ionosClient.generateSongFromDescription({
        description,
        style,
        artist
      })

      if (!ionosResponse.success) {
        throw new Error(`IONOS API Fehler: ${ionosResponse.error}`)
      }

      const songData = ionosResponse.songData
      console.log('✅ IONOS Song-Daten erhalten:', songData)

      // MIDI-Datei erstellen
      const midiData = this.generateMIDI(songData)
      const midiFilename = `song_${Date.now()}.mid`
      const midiPath = join(this.outputDir, midiFilename)
      writeFileSync(midiPath, midiData)

      // Audio-Datei erstellen
      const audioFilename = `song_${Date.now()}.wav`
      const audioPath = join(this.outputDir, audioFilename)
      
      await this.audioEngine.generateSongAudio(songData, audioPath)

      return {
        success: true,
        song: {
          title: songData.title,
          style: songData.style,
          tempo: songData.tempo,
          key: songData.key,
          structure: songData.structure,
          instruments: songData.instruments,
          description: songData.description
        },
        files: {
          midi: midiFilename,
          audio: audioFilename
        },
        message: `Song "${songData.title}" erfolgreich erstellt!`
      }

    } catch (error) {
      console.error('Fehler bei Song-Erstellung:', error)
      throw new Error(`Song-Erstellung fehlgeschlagen: ${error.message}`)
    }
  }

  async listAvailableTools() {
    return {
      tools: Object.keys(this.tools),
      count: Object.keys(this.tools).length
    }
  }

  async listMusicStyles() {
    return {
      styles: [
        'Techno',
        'House',
        'Ambient',
        'Trance',
        'Drum & Bass',
        'Psychedelic Rock',
        'Electronic',
        'Synthwave',
        'Downtempo',
        'Experimental'
      ]
    }
  }

  generateMIDI(songData) {
    // Einfache MIDI-Datei generieren
    const midiHeader = Buffer.from([
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x01, // Format 1
      0x00, 0x01, // 1 track
      0x01, 0x20  // 288 ticks per quarter note (120 BPM)
    ])

    const trackData = Buffer.from([
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      0x00, 0x00, 0x00, 0x0B, // Track length
      0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20, // Tempo
      0x00, 0xFF, 0x2F, 0x00  // End of track
    ])

    return Buffer.concat([midiHeader, trackData])
  }

  createSuccessResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    }
  }

  createErrorResponse(id, code, message) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    }
  }

  start() {
    console.log('🎵 Open DAW MCP Server gestartet')
    console.log('📁 Output-Verzeichnis:', this.outputDir)
    console.log('🔧 Verfügbare Tools:', Object.keys(this.tools).join(', '))
    console.log('⏳ Warte auf JSON-RPC Requests...')

    // STDIN für JSON-RPC Requests lesen
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.trim())
        const response = await this.handleRequest(request)
        
        if (response) {
          console.log(JSON.stringify(response))
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten der Request:', error)
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }
        console.log(JSON.stringify(errorResponse))
      }
    })
  }
}

// Server starten
const server = new ManualMCPServer()
server.start() 