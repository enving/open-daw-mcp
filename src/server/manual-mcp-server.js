#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import ToneAudioEngine from '../audio/tone-audio-engine.js'
import BetterAudioEngine from '../audio/better-audio-engine.js'
import VariableAudioEngine from '../audio/variable-audio-engine.js'
import AdvancedDAWEngine from '../audio/advanced-daw-engine.js'
import MIDIGenerator from '../audio/midi-generator.js'
import MPEMIDIGenerator from '../audio/mpe-midi-generator.js'
import MPESynthEngine from '../audio/mpe-synth-engine.js'
import EnhancedMPEAudioEngine from '../audio/enhanced-mpe-audio-engine.js'
import { IONOSClient } from '../ionos/ionos-client.js'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ManualMCPServer {
  constructor() {
    this.outputDir = join(process.cwd(), 'output')
    this.ensureOutputDir()
    
    // Datei-Management System
    this.songRegistry = new Map() // Speichert Song-Metadaten
    this.currentSongId = null
    
    // Audio Engine initialisieren
    this.audioEngine = new ToneAudioEngine()
    this.betterAudioEngine = new BetterAudioEngine()
    this.variableAudioEngine = new VariableAudioEngine()
    this.enhancedMPEAudioEngine = new EnhancedMPEAudioEngine()
    
    // Advanced DAW Engine initialisieren
    this.dawEngine = new AdvancedDAWEngine()
    
    // MIDI Generator initialisieren
    this.midiGenerator = new MIDIGenerator()
    
    // MPE MIDI Generator initialisieren
    this.mpeMidiGenerator = new MPEMIDIGenerator()
    
    // MPE Synth Engine initialisieren
    this.mpeSynthEngine = new MPESynthEngine()
    
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
            },
            songId: {
              type: 'string',
              description: 'Optional: ID für Song-Überschreibung'
            }
          },
          required: ['description']
        }
      },
      create_mpe_song: {
        description: 'Erstellt einen Song mit MPE MIDI 2.0 für dynamischere Sounds',
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
            },
            songId: {
              type: 'string',
              description: 'Optional: ID für Song-Überschreibung'
            },
            useMPE: {
              type: 'boolean',
              description: 'MPE MIDI 2.0 verwenden (Standard: true)'
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
      },
      list_songs: {
        description: 'Listet alle erstellten Songs auf',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      get_song: {
        description: 'Holt Details eines spezifischen Songs',
        inputSchema: {
          type: 'object',
          properties: {
            songId: {
              type: 'string',
              description: 'ID des Songs'
            }
          },
          required: ['songId']
        }
      },
      delete_song: {
        description: 'Löscht einen Song und seine Dateien',
        inputSchema: {
          type: 'object',
          properties: {
            songId: {
              type: 'string',
              description: 'ID des Songs'
            }
          },
          required: ['songId']
        }
      },
      daw_command: {
        description: 'Führt DAW-Befehle in natürlicher Sprache aus (BPM, Effekte, Tracks, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Natürlicher Sprachbefehl für die DAW (z.B. "BPM auf 120 setzen", "Reverb zu Bass hinzufügen")'
            }
          },
          required: ['command']
        }
      },
      daw_status: {
        description: 'Zeigt den aktuellen DAW-Status an',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      create_track: {
        description: 'Erstellt einen neuen Track in der DAW',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name des Tracks'
            },
            type: {
              type: 'string',
              description: 'Typ des Tracks (bass, lead, pad, drum, synth)',
              enum: ['bass', 'lead', 'pad', 'drum', 'synth']
            }
          },
          required: ['name', 'type']
        }
      },
      add_effect: {
        description: 'Fügt einen Effekt zu einem Track hinzu',
        inputSchema: {
          type: 'object',
          properties: {
            track_name: {
              type: 'string',
              description: 'Name des Tracks'
            },
            effect_type: {
              type: 'string',
              description: 'Typ des Effekts',
              enum: ['reverb', 'delay', 'distortion', 'chorus']
            }
          },
          required: ['track_name', 'effect_type']
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
      case 'create_mpe_song':
        return await this.createMPESong(args)
      case 'list_available_tools':
        return await this.listAvailableTools()
      case 'list_music_styles':
        return await this.listMusicStyles()
      case 'list_songs':
        return await this.listSongs()
      case 'get_song':
        return await this.getSong(args)
      case 'delete_song':
        return await this.deleteSong(args.songId)
      case 'daw_command':
        return await this.executeDAWCommand(args)
      case 'daw_status':
        return await this.getDAWStatus(args)
      case 'create_track':
        return await this.createTrack(args)
      case 'add_effect':
        return await this.addEffect(args)
      default:
        throw new Error(`Tool '${name}' nicht implementiert`)
    }
  }

  async createSongFromDescription(args) {
    const { description, style, artist, songId } = args

    console.log('🎵 Erstelle Song aus Beschreibung:', description)

    try {
      // Prüfe ob ein bestehender Song überschrieben werden soll
      let targetSongId = songId
      if (!targetSongId) {
        targetSongId = this.generateSongId(description)
      } else if (this.songRegistry.has(targetSongId)) {
        console.log(`🔄 Überschreibe bestehenden Song: ${targetSongId}`)
        this.deleteSong(targetSongId)
      }

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
      console.log('📝 Originaler Titel:', songData.title)
      console.log('🎵 Verwendeter Titel:', songData.title || 'Generierter Song')

      // Song-Daten normalisieren und mappen
      const normalizedSongData = this.normalizeSongData(songData)
      console.log('📋 Normalisierte Song-Daten:', normalizedSongData)
      
      // MIDI-Datei erstellen
      const midiData = this.midiGenerator.generateStructuredMIDI(songData)
      const midiFilename = `${targetSongId}.mid`
      const midiPath = join(this.outputDir, midiFilename)
      this.midiGenerator.saveMIDI(midiData, midiFilename, this.outputDir)

      // Audio-Datei erstellen
      const audioFilename = `${targetSongId}.wav`
      const audioPath = join(this.outputDir, audioFilename)
      
      try {
        // Versuche zuerst die bessere Audio-Engine
        await this.betterAudioEngine.createSong(normalizedSongData, normalizedSongData.style, audioPath)
        console.log('✅ Better Audio Engine erfolgreich verwendet')
      } catch (error) {
        console.log('⚠️ Better Audio Engine fehlgeschlagen, verwende Fallback:', error.message)
        // Fallback zur ursprünglichen Audio-Engine
        await this.audioEngine.createSong(normalizedSongData, normalizedSongData.style, audioPath)
      }

      // Song im Registry registrieren
      const files = { midi: midiFilename, audio: audioFilename }
      this.registerSong(targetSongId, songData, files)

      return {
        success: true,
        song: {
          id: targetSongId,
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
        urls: {
          midi: `/api/midi/${midiFilename}`,
          audio: `/api/audio/${audioFilename}`
        },
        message: `Song "${songData.title}" erfolgreich erstellt!`
      }

    } catch (error) {
      console.error('Fehler bei Song-Erstellung:', error)
      throw new Error(`Song-Erstellung fehlgeschlagen: ${error.message}`)
    }
  }

  async createMPESong(args) {
    const { description, style, artist, songId, useMPE = true } = args

    console.log('🎵 Erstelle erweiterte MPE Song aus Beschreibung:', description)

    try {
      // Prüfe ob ein bestehender Song überschrieben werden soll
      let targetSongId = songId
      if (!targetSongId) {
        targetSongId = this.generateSongId(description)
      } else if (this.songRegistry.has(targetSongId)) {
        console.log(`🔄 Überschreibe bestehenden Song: ${targetSongId}`)
        this.deleteSong(targetSongId)
      }

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

      // Song-Daten normalisieren
      const normalizedSongData = this.normalizeSongData(songData)
      console.log('📋 Normalisierte Song-Daten:', normalizedSongData)
      
      // Erweiterte MPE Audio Engine verwenden
      console.log('🎵 Verwende erweiterte MPE Audio Engine...')
      const mpeResult = await this.enhancedMPEAudioEngine.createMPESong(
        normalizedSongData, 
        this.outputDir
      )

      if (!mpeResult.success) {
        throw new Error('MPE Audio Engine fehlgeschlagen')
      }

      // Song im Registry registrieren
      const files = { 
        midi: mpeResult.midi, 
        audio: mpeResult.audio 
      }
      this.registerSong(targetSongId, songData, files)

      return {
        success: true,
        song: {
          id: targetSongId,
          title: songData.title,
          style: songData.style,
          tempo: songData.tempo,
          key: songData.key,
          structure: songData.structure,
          instruments: songData.instruments,
          description: songData.description,
          mpeEnabled: useMPE
        },
        files: {
          midi: mpeResult.midi,
          audio: mpeResult.audio
        },
        urls: {
          midi: `/api/midi/${mpeResult.midi}`,
          audio: `/api/audio/${mpeResult.audio}`
        },
        mpe: {
          enabled: useMPE,
          presets: mpeResult.presets,
          synth: this.mpeSynthEngine.currentSynth?.name || 'Enhanced MPE',
          channels: this.mpeSynthEngine.mpeChannels
        },
        message: `Erweiterte MPE Song "${songData.title}" erfolgreich erstellt!`
      }

    } catch (error) {
      console.error('Fehler bei erweiterter MPE Song-Erstellung:', error)
      throw new Error(`Erweiterte MPE Song-Erstellung fehlgeschlagen: ${error.message}`)
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

  // DAW-Funktionen
  async executeDAWCommand(args) {
    const { command } = args
    
    console.log('🎛️ Führe DAW-Befehl aus:', command)
    
    try {
      // DAW Engine initialisieren falls noch nicht geschehen
      if (!this.dawEngine.isInitialized) {
        await this.dawEngine.initialize()
      }
      
      const result = await this.dawEngine.processNaturalLanguageCommand(command)
      
      return {
        success: true,
        result: result,
        message: `DAW-Befehl ausgeführt: ${result}`
      }
    } catch (error) {
      console.error('❌ DAW-Befehl Fehler:', error)
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Ausführen des DAW-Befehls: ${error.message}`
      }
    }
  }

  async getDAWStatus(args) {
    console.log('📊 Hole DAW-Status...')
    
    try {
      if (!this.dawEngine.isInitialized) {
        return {
          success: true,
          status: {
            initialized: false,
            message: 'DAW Engine noch nicht initialisiert'
          }
        }
      }
      
      const status = this.dawEngine.getStatus()
      
      return {
        success: true,
        status: {
          initialized: true,
          ...status
        }
      }
    } catch (error) {
      console.error('❌ DAW-Status Fehler:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createTrack(args) {
    const { name, type } = args
    
    console.log(`🎵 Erstelle Track: ${name} (${type})`)
    
    try {
      if (!this.dawEngine.isInitialized) {
        await this.dawEngine.initialize()
      }
      
      const trackId = await this.dawEngine.createTrack(name, type)
      
      return {
        success: true,
        track_id: trackId,
        track_name: name,
        track_type: type,
        message: `Track "${name}" (${name}) erfolgreich erstellt`
      }
    } catch (error) {
      console.error('❌ Track-Erstellung Fehler:', error)
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Erstellen des Tracks: ${error.message}`
      }
    }
  }

  async addEffect(args) {
    const { track_name, effect_type } = args
    
    console.log(`🎛️ Füge Effekt hinzu: ${effect_type} zu ${track_name}`)
    
    try {
      if (!this.dawEngine.isInitialized) {
        await this.dawEngine.initialize()
      }
      
      switch (effect_type) {
        case 'reverb':
          await this.dawEngine.addReverb(track_name)
          break
        case 'delay':
          await this.dawEngine.addDelay(track_name)
          break
        case 'distortion':
          await this.dawEngine.addDistortion(track_name)
          break
        case 'chorus':
          await this.dawEngine.addChorus(track_name)
          break
        default:
          throw new Error(`Unbekannter Effekt-Typ: ${effect_type}`)
      }
      
      return {
        success: true,
        track_name: track_name,
        effect_type: effect_type,
        message: `Effekt ${effect_type} erfolgreich zu ${track_name} hinzugefügt`
      }
    } catch (error) {
      console.error('❌ Effekt-Hinzufügung Fehler:', error)
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Hinzufügen des Effekts: ${error.message}`
      }
    }
  }

  // Song-Daten normalisieren und auf unterstützte Werte mappen
  normalizeSongData(songData) {
    // Unterstützte Stile mappen
    const styleMapping = {
      'techno': 'techno',
      'house': 'house', 
      'ambient': 'ambient',
      'trance': 'trance',
      'drum & bass': 'techno', // Fallback
      'psychedelic rock': 'psychedelic_rock',
      'electronic': 'techno',
      'synthwave': 'techno',
      'downtempo': 'ambient',
      'experimental': 'techno',
      'psychedelischer techno': 'techno'
    }
    
    // Unterstützte Tonarten
    const supportedKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    const normalized = {
      title: songData.title || 'Generierter Song',
      style: styleMapping[songData.style?.toLowerCase()] || 'techno',
      tempo: songData.tempo || 120,
      key: supportedKeys.includes(songData.key) ? songData.key : 'C',
      scale: 'major', // Standard-Skala
      structure: songData.structure || ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Outro'],
      instruments: songData.instruments || ['Bass', 'Drums', 'Synth'],
      description: songData.description || 'Keine Beschreibung verfügbar',
      bpm: songData.tempo || 120 // Kompatibilität mit Audio-Engine
    }
    
    console.log('🔄 Normalisierung:', {
      original: { style: songData.style, key: songData.key, tempo: songData.tempo },
      normalized: { style: normalized.style, key: normalized.key, tempo: normalized.tempo }
    })
    
    return normalized
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
    console.error('🎵 Open DAW MCP Server gestartet')
    console.error('📁 Output-Verzeichnis:', this.outputDir)
    console.error('🔧 Verfügbare Tools:', Object.keys(this.tools).join(', '))
    console.error('⏳ Warte auf JSON-RPC Requests...')

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

  // Datei-Management Methoden
  generateSongId(title) {
    const timestamp = Date.now()
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    return `${sanitizedTitle}_${timestamp}`
  }

  registerSong(songId, songData, files) {
    this.songRegistry.set(songId, {
      id: songId,
      title: songData.title,
      style: songData.style,
      created: new Date().toISOString(),
      files: files,
      metadata: songData
    })
    this.currentSongId = songId
    console.log(`📝 Song registriert: ${songId}`)
  }

  getCurrentSong() {
    if (!this.currentSongId) return null
    return this.songRegistry.get(this.currentSongId)
  }

  updateSong(songId, updates) {
    const song = this.songRegistry.get(songId)
    if (song) {
      Object.assign(song, updates)
      song.updated = new Date().toISOString()
      console.log(`🔄 Song aktualisiert: ${songId}`)
    }
  }

  deleteSong(songId) {
    const song = this.songRegistry.get(songId)
    if (song) {
      // Lösche Dateien
      if (song.files.midi && existsSync(join(this.outputDir, song.files.midi))) {
        unlinkSync(join(this.outputDir, song.files.midi))
      }
      if (song.files.audio && existsSync(join(this.outputDir, song.files.audio))) {
        unlinkSync(join(this.outputDir, song.files.audio))
      }
      
      this.songRegistry.delete(songId)
      if (this.currentSongId === songId) {
        this.currentSongId = null
      }
      console.log(`🗑️ Song gelöscht: ${songId}`)
    }
  }

  listSongs() {
    return Array.from(this.songRegistry.values()).map(song => ({
      id: song.id,
      title: song.title,
      style: song.style,
      created: song.created,
      updated: song.updated,
      hasFiles: {
        midi: !!song.files.midi,
        audio: !!song.files.audio
      }
    }))
  }

  getSong(args) {
    const { songId } = args
    const song = this.songRegistry.get(songId)
    
    if (!song) {
      throw new Error(`Song mit ID ${songId} nicht gefunden`)
    }
    
    return {
      success: true,
      song: {
        id: song.id,
        title: song.title,
        style: song.style,
        tempo: song.metadata.tempo,
        key: song.metadata.key,
        structure: song.metadata.structure,
        instruments: song.metadata.instruments,
        description: song.metadata.description,
        created: song.created,
        updated: song.updated
      },
      files: song.files,
      urls: {
        midi: `/api/midi/${song.files.midi}`,
        audio: `/api/audio/${song.files.audio}`
      }
    }
  }
}

// Server starten
const server = new ManualMCPServer()
server.start() 