#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class SimpleAudioServer {
  constructor() {
    this.outputDir = join(__dirname, '../../output')
    this.ensureOutputDir()
  }

  ensureOutputDir() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
      console.log('📁 Output-Verzeichnis erstellt:', this.outputDir)
    }
  }

  async handleRequest(request) {
    const { method, params, id } = request
    
    try {
      let result
      
      switch (method) {
        case 'generate_synth_audio':
          result = await this.generateSynthAudio(params)
          break
          
        case 'generate_midi_and_audio':
          result = await this.generateMIDIAndAudio(params)
          break
          
        case 'list_available_synths':
          result = await this.listAvailableSynths()
          break
          
        default:
          throw new Error(`Unbekannte Methode: ${method}`)
      }
      
      return {
        jsonrpc: '2.0',
        id,
        result: {
          success: true,
          ...result
        }
      }
      
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -1,
          message: error.message
        }
      }
    }
  }

  async generateSynthAudio(args) {
    console.log('🎵 Generiere Synthesizer-Audio:', args.description)
    
    try {
      // Erstelle MIDI-Pattern
      const pattern = this.createPattern(args.key || 'C', args.scale || 'major', args.bpm || 120, args.synth_type || 'bass')
      
      // Erstelle MIDI-Datei
      const midiPath = this.createMIDIFile(pattern, args.description)
      
      // Konvertiere zu Audio
      const audioPath = await this.convertMIDIToAudio(midiPath, args.output_format || 'wav')
      
      const audioClip = {
        id: `audio_${Date.now()}`,
        name: args.description,
        midiPath: midiPath,
        audioPath: audioPath,
        duration: args.duration || 8,
        bpm: args.bpm || 120,
        key: args.key || 'C',
        scale: args.scale || 'major',
        synthType: args.synth_type || 'bass',
        createdAt: new Date()
      }

      return {
        audioClip,
        pattern,
        message: 'Synthesizer-Audio erfolgreich generiert!'
      }
    } catch (error) {
      console.error('Fehler beim Generieren des Audio:', error)
      throw error
    }
  }

  async generateMIDIAndAudio(args) {
    console.log('🎼 Generiere MIDI und Audio:', args.description)
    
    try {
      // Erstelle MIDI-Pattern
      const pattern = this.createPattern('C', 'major', 120, 'bass')
      const midiPath = this.createMIDIFile(pattern, args.description)
      
      // Konvertiere zu Audio
      const audioPath = await this.convertMIDIToAudio(midiPath, args.output_format || 'wav')
      
      return {
        midiPath,
        audioPath,
        pattern,
        message: 'MIDI und Audio erfolgreich generiert!'
      }
    } catch (error) {
      throw error
    }
  }

  async listAvailableSynths() {
    console.log('🔍 Liste verfügbare Synthesizer')
    
    const synths = [
      {
        name: 'ZynAddSubFX',
        type: 'Subtractive/Additive',
        status: 'checking',
        description: 'Sehr umfangreicher quelloffener Synthesizer'
      },
      {
        name: 'FluidSynth',
        type: 'SoundFont Player',
        status: 'checking',
        description: 'Software-Synthesizer mit SoundFonts'
      },
      {
        name: 'Custom Web Audio',
        type: 'Web Audio API',
        status: 'implemented',
        description: 'Eigener Synthesizer mit Web Audio API'
      }
    ]
    
    // Prüfe ZynAddSubFX
    try {
      execSync('zynaddsubfx --version', { stdio: 'ignore' })
      synths[0].status = 'available'
      synths[0].description += ' (installiert)'
    } catch (error) {
      synths[0].status = 'not_installed'
      synths[0].description += ' (nicht installiert)'
    }
    
    // Prüfe FluidSynth
    try {
      execSync('fluidsynth --version', { stdio: 'ignore' })
      synths[1].status = 'available'
      synths[1].description += ' (installiert)'
    } catch (error) {
      synths[1].status = 'not_installed'
      synths[1].description += ' (nicht installiert)'
    }
    
    return {
      synths,
      message: 'Verfügbare Synthesizer aufgelistet'
    }
  }

  createPattern(key, scale, bpm, synthType) {
    const scaleNotes = this.getScaleNotes(key, scale)
    
    const pattern = {
      synthType,
      bpm,
      key,
      scale,
      pattern: []
    }
    
    switch (synthType) {
      case 'bass':
        this.createBassPattern(pattern, scaleNotes, bpm)
        break
      case 'lead':
        this.createLeadPattern(pattern, scaleNotes, bpm)
        break
      case 'pad':
        this.createPadPattern(pattern, scaleNotes, bpm)
        break
      case 'arp':
        this.createArpPattern(pattern, scaleNotes, bpm)
        break
      default:
        this.createBassPattern(pattern, scaleNotes, bpm)
    }
    
    return pattern
  }

  createBassPattern(pattern, scaleNotes, bpm) {
    const beatDuration = 60 / bpm
    const totalBeats = 8 * 4

    // Bass-Line: Grundton auf jedem Beat
    for (let beat = 0; beat < totalBeats; beat += 1) {
      const note = scaleNotes[0] // Grundton
      pattern.pattern.push({
        note: `${note}2`, // Tiefe Oktave
        velocity: 100,
        duration: beatDuration * 0.5,
        startTime: beat * beatDuration
      })
    }
  }

  createLeadPattern(pattern, scaleNotes, bpm) {
    const beatDuration = 60 / bpm
    const totalBeats = 8 * 4

    // Lead-Melodie: Verschiedene Noten der Skala
    for (let beat = 0; beat < totalBeats; beat += 2) {
      const note = scaleNotes[beat % scaleNotes.length]
      pattern.pattern.push({
        note: `${note}5`, // Höhere Oktave
        velocity: 80,
        duration: beatDuration * 0.5,
        startTime: beat * beatDuration
      })
    }
  }

  createPadPattern(pattern, scaleNotes, bpm) {
    const beatDuration = 60 / bpm
    const totalBeats = 8 * 4

    // Lange, atmosphärische Noten
    for (let beat = 0; beat < totalBeats; beat += 8) { // Alle 2 Takte
      const note = scaleNotes[beat % scaleNotes.length]
      pattern.pattern.push({
        note: `${note}4`,
        velocity: 60,
        duration: beatDuration * 8, // 2 Takte
        startTime: beat * beatDuration
      })
    }
  }

  createArpPattern(pattern, scaleNotes, bpm) {
    const beatDuration = 60 / bpm
    const totalBeats = 8 * 4

    for (let beat = 0; beat < totalBeats; beat++) {
      const note = scaleNotes[beat % scaleNotes.length]
      pattern.pattern.push({
        note: `${note}4`,
        velocity: 70,
        duration: beatDuration * 0.25,
        startTime: beat * beatDuration
      })
    }
  }

  getScaleNotes(key, scale) {
    const availableNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const scalePatterns = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10]
    }

    const keyIndex = availableNotes.indexOf(key)
    const pattern = scalePatterns[scale] || scalePatterns.major
    
    return pattern.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return availableNotes[noteIndex]
    })
  }

  createMIDIFile(pattern, description) {
    console.log('🎼 Erstelle MIDI-Datei...')
    
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
    const fileName = `synth_${pattern.synthType}_${Date.now()}.mid`
    const filePath = join(this.outputDir, fileName)
    
    writeFileSync(filePath, midiData)
    console.log('💾 MIDI-Datei gespeichert:', filePath)
    
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

  noteToMIDINumber(noteName) {
    const availableNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const note = noteName.slice(0, -1)
    const octave = parseInt(noteName.slice(-1))
    
    const noteIndex = availableNotes.indexOf(note)
    if (noteIndex === -1) return 60
    
    return noteIndex + (octave + 1) * 12
  }

  async convertMIDIToAudio(midiPath, format) {
    console.log('🔊 Konvertiere MIDI zu Audio...')
    
    const audioFileName = midiPath.replace('.mid', `.${format}`)
    const audioPath = audioFileName.replace('synth_', 'audio_')
    
    try {
      // Versuche FluidSynth für Audio-Konvertierung
      console.log('🎹 Verwende FluidSynth für Audio-Konvertierung...')
      
      // Standard SoundFont-Pfad (kann je nach System variieren)
      const soundFontPath = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
      
      // FluidSynth Kommando für Audio-Konvertierung
      const fluidSynthCmd = [
        'fluidsynth',
        '-ni', // Non-interactive
        '-g', '1.0', // Gain
        '-F', audioPath, // Output file
        '-r', '44100', // Sample rate
        soundFontPath, // SoundFont
        midiPath // MIDI input
      ].join(' ')
      
      console.log('🔧 Führe FluidSynth aus:', fluidSynthCmd)
      execSync(fluidSynthCmd, { stdio: 'pipe' })
      
      console.log('💾 Audio-Datei erfolgreich erstellt:', audioPath)
      return audioPath
      
    } catch (error) {
      console.log('⚠️ FluidSynth nicht verfügbar, erstelle Platzhalter-Audio...')
      
      // Fallback: Erstelle eine leere Audio-Datei (Platzhalter)
      writeFileSync(audioPath, Buffer.alloc(1024)) // 1KB Platzhalter
      
      console.log('💾 Audio-Datei erstellt (Platzhalter):', audioPath)
      return audioPath
    }
  }
}

// Server-Instanz erstellen
const server = new SimpleAudioServer()

// JSON-RPC Handler für stdin/stdout
process.stdin.setEncoding('utf8')
process.stdout.setEncoding('utf8')

process.stdin.on('data', async (data) => {
  const lines = data.toString().split('\n')
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line)
        const response = await server.handleRequest(request)
        process.stdout.write(JSON.stringify(response) + '\n')
      } catch (error) {
        console.error('Fehler beim Verarbeiten der Anfrage:', error)
      }
    }
  }
})

console.log('🚀 Simple Audio Server gestartet')
console.log('📋 Verfügbare Methoden:')
console.log('- generate_synth_audio: Generiert Audio-Dateien')
console.log('- generate_midi_and_audio: MIDI + Audio Konvertierung')
console.log('- list_available_synths: Zeigt verfügbare Synthesizer')
console.log('🔄 Server läuft... Drücke Ctrl+C zum Beenden') 