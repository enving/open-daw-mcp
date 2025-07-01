#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Einfacher Test ohne MCP SDK - simuliert Synthesizer-Loop-Erstellung

class MockSynthGenerator {
  constructor() {
    this.availableNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    this.octaves = [3, 4, 5]
    this.outputDir = join(__dirname, 'output')
    this.ensureOutputDir()
  }

  ensureOutputDir() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
      console.log('📁 Output-Verzeichnis erstellt:', this.outputDir)
    }
  }

  generateSynthLoop(description, bpm = 120, key = 'C', scale = 'major') {
    console.log('🎵 Generiere Synthesizer-Loop...')
    console.log('Beschreibung:', description)
    console.log('BPM:', bpm)
    console.log('Key:', key)
    console.log('Scale:', scale)

    // Simuliere Pattern-Generierung
    const pattern = this.createMockPattern(key, scale, bpm)
    
    // Erstelle MIDI-Datei
    const midiFilePath = this.createMIDIFile(pattern, description)
    
    // Simuliere AudioClip
    const audioClip = {
      id: `clip_${Date.now()}`,
      name: description,
      filePath: midiFilePath,
      duration: 8, // 8 Takte
      bpm: bpm,
      key: key,
      scale: scale,
      createdAt: new Date()
    }

    return {
      success: true,
      audioClip,
      pattern,
      message: 'Synthesizer-Loop erfolgreich erstellt (Mock)'
    }
  }

  createMIDIFile(pattern, description) {
    console.log('🎼 Erstelle MIDI-Datei...')
    
    // Erstelle MIDI-Datei-Header
    const midiHeader = this.createMIDIHeader(pattern.bpm)
    
    // Konvertiere Pattern zu MIDI-Events
    const midiEvents = this.convertPatternToMIDIEvents(pattern)
    
    // Kombiniere Header und Events
    const midiData = this.combineMIDIData(midiHeader, midiEvents)
    
    // Speichere Datei
    const fileName = `synth_loop_${Date.now()}.mid`
    const filePath = join(this.outputDir, fileName)
    
    writeFileSync(filePath, midiData)
    console.log('💾 MIDI-Datei gespeichert:', filePath)
    
    return filePath
  }

  createMIDIHeader(bpm) {
    // MIDI-Datei-Header (vereinfacht)
    const header = Buffer.alloc(14)
    
    // MThd Chunk
    header.write('MThd', 0)           // Chunk Type
    header.writeUInt32BE(6, 4)        // Chunk Length
    header.writeUInt16BE(1, 8)        // Format (Single Track)
    header.writeUInt16BE(1, 10)       // Number of Tracks
    header.writeUInt16BE(480, 12)     // Ticks per Quarter Note
    
    return header
  }

  convertPatternToMIDIEvents(pattern) {
    const events = []
    
    // Tempo Event (Microseconds per Quarter Note)
    const tempo = Math.round(60000000 / pattern.bpm) // 60,000,000 / BPM
    events.push(this.createTempoEvent(tempo))
    
    // Note Events
    pattern.pattern.forEach(note => {
      const noteNumber = this.noteToMIDINumber(note.note)
      const startTick = Math.round(note.startTime * pattern.bpm * 480 / 60)
      const durationTick = Math.round(note.duration * pattern.bpm * 480 / 60)
      
      // Note On Event
      events.push(this.createNoteEvent(startTick, 0x90, noteNumber, note.velocity))
      
      // Note Off Event
      events.push(this.createNoteEvent(startTick + durationTick, 0x80, noteNumber, 0))
    })
    
    // Sortiere Events nach Zeit
    events.sort((a, b) => a.time - b.time)
    
    return events
  }

  createTempoEvent(tempo) {
    const event = Buffer.alloc(7)
    event.writeUInt8(0, 0)            // Delta Time
    event.writeUInt8(0xFF, 1)         // Meta Event
    event.writeUInt8(0x51, 2)         // Tempo
    event.writeUInt8(3, 3)            // Length
    event.writeUIntBE(tempo, 4, 3)    // Tempo Value
    return { time: 0, data: event }
  }

  createNoteEvent(deltaTime, status, note, velocity) {
    const event = Buffer.alloc(status === 0x90 ? 4 : 3)
    event.writeUInt8(deltaTime, 0)    // Delta Time
    event.writeUInt8(status, 1)       // Status (Note On/Off)
    event.writeUInt8(note, 2)         // Note Number
    if (status === 0x90) {            // Note On
      event.writeUInt8(velocity, 3)   // Velocity
    }
    return { time: deltaTime, data: event }
  }

  noteToMIDINumber(noteName) {
    const note = noteName.slice(0, -1)
    const octave = parseInt(noteName.slice(-1))
    
    const noteIndex = this.availableNotes.indexOf(note)
    if (noteIndex === -1) return 60 // Fallback: Middle C
    
    return noteIndex + (octave + 1) * 12
  }

  combineMIDIData(header, events) {
    // Berechne Track-Länge
    let trackLength = 0
    events.forEach(event => {
      trackLength += event.data.length
    })
    
    // Erstelle Track-Header
    const trackHeader = Buffer.alloc(8)
    trackHeader.write('MTrk', 0)      // Chunk Type
    trackHeader.writeUInt32BE(trackLength, 4) // Chunk Length
    
    // Kombiniere alle Daten
    const trackData = Buffer.concat(events.map(e => e.data))
    const endOfTrack = Buffer.from([0x00, 0xFF, 0x2F, 0x00]) // End of Track
    
    return Buffer.concat([header, trackHeader, trackData, endOfTrack])
  }

  createMockPattern(key, scale, bpm) {
    // Einfache Skalen-Logik
    const scaleNotes = this.getScaleNotes(key, scale)
    
    const pattern = {
      pattern: [],
      bpm: bpm,
      key: key,
      scale: scale,
      description: `Mock Pattern in ${key} ${scale}`,
      suggested_plugin: 'ZynAddSubFX',
      plugin_preset: 'Analog Lead'
    }

    // Erstelle 8 Takte Pattern
    const beatsPerBar = 4
    const totalBeats = 8 * beatsPerBar // 8 Takte
    const beatDuration = 60 / bpm // Sekunden pro Beat

    for (let beat = 0; beat < totalBeats; beat++) {
      // Jeder 4. Beat ist ein Akzent
      if (beat % 4 === 0) {
        const note = scaleNotes[beat % scaleNotes.length]
        const octave = this.octaves[Math.floor(Math.random() * this.octaves.length)]
        
        pattern.pattern.push({
          note: `${note}${octave}`,
          velocity: 90,
          duration: beatDuration,
          startTime: beat * beatDuration
        })
      } else if (beat % 2 === 0) {
        // Jeder 2. Beat ist eine Begleitnote
        const note = scaleNotes[(beat + 2) % scaleNotes.length]
        const octave = this.octaves[Math.floor(Math.random() * this.octaves.length)]
        
        pattern.pattern.push({
          note: `${note}${octave}`,
          velocity: 60,
          duration: beatDuration * 0.5,
          startTime: beat * beatDuration
        })
      }
    }

    return pattern
  }

  getScaleNotes(key, scale) {
    const scalePatterns = {
      major: [0, 2, 4, 5, 7, 9, 11], // Ganztonschritte: 2,2,1,2,2,2,1
      minor: [0, 2, 3, 5, 7, 8, 10], // Ganztonschritte: 2,1,2,2,1,2,2
      pentatonic: [0, 2, 4, 7, 9],   // 5-Ton-Skala
      blues: [0, 3, 5, 6, 7, 10]      // Blues-Skala
    }

    const keyIndex = this.availableNotes.indexOf(key)
    const pattern = scalePatterns[scale] || scalePatterns.major
    
    return pattern.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return this.availableNotes[noteIndex]
    })
  }

  generateArdourCommands(description) {
    console.log('🎛️ Generiere Ardour-Befehle...')
    console.log('Beschreibung:', description)

    const commands = {
      commands: [
        {
          type: 'create_track',
          track_type: 'midi',
          name: 'Synthesizer Track'
        },
        {
          type: 'add_plugin',
          plugin_name: 'ZynAddSubFX',
          track_id: 'midi_track_1'
        },
        {
          type: 'set_tempo',
          bpm: 120
        },
        {
          type: 'record_arm',
          track_id: 'midi_track_1'
        }
      ],
      description: 'Ardour-Befehle für Synthesizer-Setup'
    }

    return {
      success: true,
      commands,
      message: 'Ardour-Befehle erfolgreich generiert (Mock)'
    }
  }
}

async function testMockSynth() {
  console.log('🚀 Starte Mock Synthesizer Test...')
  
  try {
    const synthGenerator = new MockSynthGenerator()
    
    // Test 1: Synthesizer-Loop generieren
    console.log('\n🎵 Test 1: Synthesizer-Loop generieren')
    const loopResult = synthGenerator.generateSynthLoop(
      'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien und atmosphärischen Pad-Sounds',
      128,
      'A',
      'minor'
    )
    
    console.log('\n✅ Synthesizer-Loop erfolgreich erstellt!')
    console.log('📁 AudioClip ID:', loopResult.audioClip.id)
    console.log('📁 Datei-Pfad:', loopResult.audioClip.filePath)
    console.log('🎵 BPM:', loopResult.audioClip.bpm)
    console.log('🎼 Key:', loopResult.audioClip.key)
    console.log('📏 Scale:', loopResult.audioClip.scale)
    console.log('🎼 Pattern Noten:', loopResult.pattern.pattern.length)
    console.log('🔌 Plugin:', loopResult.pattern.suggested_plugin)
    
    // Zeige erste 5 Noten
    console.log('\n🎼 Erste 5 Noten:')
    loopResult.pattern.pattern.slice(0, 5).forEach((note, index) => {
      console.log(`  ${index + 1}. ${note.note} (Velocity: ${note.velocity}, Duration: ${note.duration.toFixed(2)}s, Start: ${note.startTime.toFixed(2)}s)`)
    })
    
    // Test 2: Ardour-Befehle generieren
    console.log('\n🎛️ Test 2: Ardour-Befehle generieren')
    const commandResult = synthGenerator.generateArdourCommands(
      'Erstelle einen MIDI-Track und füge einen Synthesizer hinzu'
    )
    
    console.log('\n✅ Ardour-Befehle erfolgreich generiert!')
    console.log('📋 Befehle:')
    commandResult.commands.commands.forEach((cmd, index) => {
      console.log(`  ${index + 1}. ${cmd.type}: ${JSON.stringify(cmd)}`)
    })
    
    // Zeige Output-Verzeichnis
    console.log('\n📁 Output-Verzeichnis:')
    console.log('Pfad:', synthGenerator.outputDir)
    console.log('Verwende: ls -la', synthGenerator.outputDir)
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
  }
  
  console.log('\n🏁 Mock Synthesizer Test beendet.')
}

// Test ausführen
testMockSynth() 