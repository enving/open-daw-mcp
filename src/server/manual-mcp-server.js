#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ToneAudioEngine from '../audio/tone-audio-engine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ManualMCPServer {
  constructor() {
    this.outputDir = join(__dirname, '../../output')
    this.ensureOutputDir()
    
    // Audio Engine initialisieren
    this.audioEngine = new ToneAudioEngine()
    
    // Verfügbare Tools
    this.tools = {
      create_song_from_description: {
        description: 'Erstellt einen Song basierend auf einer natürlichen Sprachbeschreibung',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Beschreibung des gewünschten Songs' },
            style: { type: 'string', description: 'Musikstil (optional)' },
            bpm: { type: 'number', description: 'Beats per Minute (optional)' },
            key: { type: 'string', description: 'Tonart (optional)' }
          },
          required: ['description']
        }
      },
      analyze_song_description: {
        description: 'Analysiert eine Song-Beschreibung und schlägt Parameter vor',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Beschreibung des gewünschten Songs' }
          },
          required: ['description']
        }
      },
      list_music_styles: {
        description: 'Zeigt alle verfügbaren Musikstile',
        inputSchema: { type: 'object', properties: {} }
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

  // JSON-RPC Request Handler
  handleRequest(request) {
    console.error('📥 Empfange Request:', request.method)
    
    try {
      switch (request.method) {
        case 'tools/list':
          return this.handleToolsList(request)
        case 'tools/call':
          return this.handleToolCall(request)
        default:
          return this.createErrorResponse(request.id, -32601, 'Method not found')
      }
    } catch (error) {
      console.error('❌ Fehler beim Verarbeiten des Requests:', error)
      return this.createErrorResponse(request.id, -32603, 'Internal error', error.message)
    }
  }

  // Tools auflisten
  handleToolsList(request) {
    console.error('📋 Tools auflisten')
    
    const tools = Object.entries(this.tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
    
    return this.createSuccessResponse(request.id, { tools })
  }

  // Tool ausführen
  handleToolCall(request) {
    const { name, arguments: args } = request.params
    
    console.error('🎵 Tool ausführen:', name)
    console.error('📋 Argumente:', args)
    
    switch (name) {
      case 'create_song_from_description':
        return this.handleCreateSong(request.id, args)
      case 'analyze_song_description':
        return this.handleAnalyzeDescription(request.id, args)
      case 'list_music_styles':
        return this.handleListMusicStyles(request.id)
      default:
        return this.createErrorResponse(request.id, -32601, 'Tool not found')
    }
  }

  // Song erstellen
  async handleCreateSong(requestId, args) {
    console.error('🎵 Erstelle Song aus Beschreibung:', args.description)
    
    try {
      const analysis = this.analyzeDescription(args.description)
      const pattern = this.createPattern(analysis.key, analysis.bpm, analysis.style)
      const midiPath = this.createMIDIFile(pattern, analysis.title)
      
      // Neue Audio-Engine verwenden
      const audioPath = await this.audioEngine.createSong(pattern, analysis.style, 
        join(this.outputDir, `audio_${analysis.style}_${Date.now()}.wav`))
      
      const song = {
        id: `song_${Date.now()}`,
        name: analysis.title,
        description: args.description,
        style: analysis.style,
        bpm: analysis.bpm,
        key: analysis.key,
        midiPath: midiPath,
        audioPath: audioPath,
        createdAt: new Date().toISOString(),
        analysis: analysis,
        audioEngine: 'ToneAudioEngine (mit Fallback)',
        features: [
          'Verschiedene Wellenformen (Sinus, Sägezahn, Rechteck, Dreieck)',
          'Akkord-Progressionen und Melodien',
          'Multi-Track (Bass, Lead, Pad)',
          'Effekte (Reverb, Delay)',
          'Stil-spezifische Presets'
        ]
      }
      
      return this.createSuccessResponse(requestId, {
        success: true,
        song,
        message: `Song "${song.name}" erfolgreich erstellt mit verbesserter Audio-Qualität!`
      })
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Songs:', error)
      return this.createErrorResponse(requestId, -32603, 'Song creation failed', error.message)
    }
  }

  // Beschreibung analysieren
  handleAnalyzeDescription(requestId, args) {
    console.error('📊 Analysiere Song-Beschreibung:', args.description)
    
    const analysis = this.analyzeDescription(args.description)
    
    return this.createSuccessResponse(requestId, {
      success: true,
      analysis,
      suggestions: {
        style: analysis.style,
        bpm: analysis.bpm,
        key: analysis.key,
        mood: analysis.mood
      },
      message: 'Song-Beschreibung erfolgreich analysiert!'
    })
  }

  // Musikstile auflisten
  handleListMusicStyles(requestId) {
    console.error('🎭 Liste Musikstile')
    
    return this.createSuccessResponse(requestId, {
      success: true,
      styles: this.musicStyles,
      message: 'Musikstile erfolgreich aufgelistet!'
    })
  }

  // Beschreibung analysieren
  analyzeDescription(description) {
    const lowerDesc = description.toLowerCase()
    
    // Künstler-Referenz erkennen
    let referenceArtist = null
    let style = 'techno'
    
    for (const [artist, artistStyle] of Object.entries(this.artistReferences)) {
      if (lowerDesc.includes(artist)) {
        referenceArtist = artist
        style = artistStyle
        break
      }
    }
    
    // Stil-Erkennung basierend auf Schlüsselwörtern
    if (!referenceArtist) {
      if (lowerDesc.includes('psychedelic') || lowerDesc.includes('dreamy') || lowerDesc.includes('reverb')) {
        style = 'psychedelic_rock'
      } else if (lowerDesc.includes('house') || lowerDesc.includes('groove')) {
        style = 'house'
      } else if (lowerDesc.includes('ambient') || lowerDesc.includes('atmospheric')) {
        style = 'ambient'
      } else if (lowerDesc.includes('trance') || lowerDesc.includes('euphoric')) {
        style = 'trance'
      } else if (lowerDesc.includes('drum') && lowerDesc.includes('bass')) {
        style = 'drum_and_bass'
      }
    }
    
    const styleConfig = this.musicStyles[style]
    
    // BPM-Erkennung
    let bpm = Math.floor((styleConfig.bpm_range[0] + styleConfig.bpm_range[1]) / 2)
    if (lowerDesc.includes('slow') || lowerDesc.includes('chill')) {
      bpm = styleConfig.bpm_range[0]
    } else if (lowerDesc.includes('fast') || lowerDesc.includes('energetic')) {
      bpm = styleConfig.bpm_range[1]
    }
    
    // Key-Erkennung
    let key = 'C'
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']
    for (const k of keys) {
      if (lowerDesc.includes(k.toLowerCase())) {
        key = k
        break
      }
    }
    
    // Titel extrahieren
    let title = 'Generierter Song'
    if (description.includes('"')) {
      const match = description.match(/"([^"]+)"/)
      if (match) title = match[1]
    }
    
    return {
      style,
      bpm,
      key,
      title,
      mood: this.extractMood(lowerDesc),
      reference_artist: referenceArtist
    }
  }

  // Stimmung extrahieren
  extractMood(description) {
    if (description.includes('dark') || description.includes('moody')) return 'dark'
    if (description.includes('happy') || description.includes('uplifting')) return 'happy'
    if (description.includes('melancholic') || description.includes('sad')) return 'melancholic'
    if (description.includes('energetic') || description.includes('powerful')) return 'energetic'
    if (description.includes('chill') || description.includes('relaxing')) return 'chill'
    if (description.includes('dreamy') || description.includes('ethereal')) return 'dreamy'
    return 'neutral'
  }

  // MIDI-Pattern erstellen
  createPattern(key, bpm, style) {
    const scaleNotes = this.getScaleNotes(key, 'major')
    const beatDuration = 60 / bpm
    const pattern = {
      pattern: [],
      bpm: bpm,
      key: key,
      scale: 'major',
      style: style
    }
    
    // Einfaches Pattern erstellen
    for (let beat = 0; beat < 32; beat++) {
      if (beat % 4 === 0) {
        const note = scaleNotes[beat % scaleNotes.length]
        pattern.pattern.push({
          note: `${note}3`,
          velocity: 80,
          duration: beatDuration,
          startTime: beat * beatDuration
        })
      }
    }
    
    return pattern
  }

  // Hilfsfunktionen
  getScaleNotes(key, scale) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const keyIndex = noteNames.indexOf(key)
    const scaleIntervals = scale === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
    
    return scaleIntervals.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return noteNames[noteIndex]
    })
  }

  createMIDIFile(pattern, name) {
    console.error('🎼 Erstelle MIDI-Datei:', name)
    
    // MIDI Header
    const header = Buffer.alloc(14)
    header.write('MThd', 0)
    header.writeUInt32BE(6, 4)
    header.writeUInt16BE(1, 8)
    header.writeUInt16BE(1, 10)
    header.writeUInt16BE(480, 12)
    
    // Track Events
    const trackEvents = []
    
    // Tempo Event
    const tempo = Math.round(60000000 / pattern.bpm)
    const tempoEvent = Buffer.concat([
      this.toVLQ(0),
      Buffer.from([0xFF, 0x51, 0x03]),
      Buffer.alloc(3)
    ])
    tempoEvent.writeUIntBE(tempo, tempoEvent.length - 3, 3)
    trackEvents.push(tempoEvent)
    
    // Note Events
    pattern.pattern.forEach(note => {
      const noteNumber = this.noteToMIDINumber(note.note)
      const startTick = Math.round(note.startTime * pattern.bpm * 480 / 60)
      const durationTick = Math.round(note.duration * pattern.bpm * 480 / 60)
      
      // Note On
      const noteOnEvent = Buffer.concat([
        this.toVLQ(startTick),
        Buffer.from([0x90, noteNumber, note.velocity])
      ])
      trackEvents.push(noteOnEvent)
      
      // Note Off
      const noteOffEvent = Buffer.concat([
        this.toVLQ(durationTick),
        Buffer.from([0x80, noteNumber, 0x00])
      ])
      trackEvents.push(noteOffEvent)
    })
    
    // End of Track
    const endEvent = Buffer.concat([
      this.toVLQ(0),
      Buffer.from([0xFF, 0x2F, 0x00])
    ])
    trackEvents.push(endEvent)
    
    // Track Data
    const trackData = Buffer.concat(trackEvents)
    const trackHeader = Buffer.alloc(8)
    trackHeader.write('MTrk', 0)
    trackHeader.writeUInt32BE(trackData.length, 4)
    
    // Komplette MIDI-Datei
    const midiData = Buffer.concat([header, trackHeader, trackData])
    
    // Speichern
    const fileName = `${name}_${Date.now()}.mid`
    const filePath = join(this.outputDir, fileName)
    
    writeFileSync(filePath, midiData)
    console.error('💾 MIDI-Datei gespeichert:', filePath)
    
    return filePath
  }

  toVLQ(value) {
    const bytes = []
    let v = value
    
    do {
      let b = v & 0x7F
      v >>= 7
      if (v > 0) b |= 0x80
      bytes.push(b)
    } while (v > 0)
    
    return Buffer.from(bytes)
  }

  noteToMIDINumber(note) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteName = note.slice(0, -1)
    const octave = parseInt(note.slice(-1))
    const noteIndex = noteNames.indexOf(noteName)
    return noteIndex + (octave + 1) * 12
  }

  // JSON-RPC Response Helper
  createSuccessResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id: id,
      result: result
    }
  }

  createErrorResponse(id, code, message, data = null) {
    const error = {
      code: code,
      message: message
    }
    
    if (data) {
      error.data = data
    }
    
    return {
      jsonrpc: '2.0',
      id: id,
      error: error
    }
  }

  // Server starten
  start() {
    console.error('🚀 Manual MCP Server gestartet')
    console.error('📋 Verfügbare Tools:')
    Object.keys(this.tools).forEach(tool => {
      console.error(`  - ${tool}: ${this.tools[tool].description}`)
    })
    console.error('🎵 Musikstile:')
    Object.keys(this.musicStyles).forEach(style => {
      console.error(`  - ${style}: ${this.musicStyles[style].name}`)
    })
    console.error('🎛️ Audio-Engine: ToneAudioEngine mit Fallback-System')
    console.error('📁 Output-Verzeichnis:', this.outputDir)
    console.error('⏳ Warte auf JSON-RPC Requests...')
    
    // STDIN/STDOUT für JSON-RPC
    process.stdin.setEncoding('utf8')
    
    process.stdin.on('data', (data) => {
      try {
        const request = JSON.parse(data.trim())
        const response = this.handleRequest(request)
        
        if (response) {
          // JSON-RPC Response nur auf stdout
          process.stdout.write(JSON.stringify(response) + '\n')
        }
      } catch (error) {
        console.error('❌ Fehler beim Parsen des Requests:', error)
        const errorResponse = this.createErrorResponse(null, -32700, 'Parse error', error.message)
        process.stdout.write(JSON.stringify(errorResponse) + '\n')
      }
    })
    
    process.stdin.on('end', () => {
      console.error('🏁 Server beendet')
      // Audio Engine cleanup
      this.audioEngine.dispose()
      process.exit(0)
    })
  }
}

// Server starten
const server = new ManualMCPServer()
server.start() 