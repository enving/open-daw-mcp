#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class SimpleMIDIGenerator {
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

  // Konvertiert eine Zahl zu MIDI Variable Length Quantity (VLQ)
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

  // Erstellt eine einfache MIDI-Datei
  createSimpleMIDI(pattern, description) {
    console.log('🎼 Erstelle einfache MIDI-Datei...')
    
    // MIDI Header (MThd)
    const header = Buffer.alloc(14)
    header.write('MThd', 0)           // Chunk Type
    header.writeUInt32BE(6, 4)        // Chunk Length
    header.writeUInt16BE(1, 8)        // Format (Single Track)
    header.writeUInt16BE(1, 10)       // Number of Tracks
    header.writeUInt16BE(480, 12)     // Ticks per Quarter Note
    
    // Track Events sammeln
    const trackEvents = []
    
    // Tempo Event (0 BPM = 120 BPM)
    const tempo = Math.round(60000000 / pattern.bpm)
    const tempoEvent = Buffer.concat([
      this.toVLQ(0),                  // Delta Time
      Buffer.from([0xFF, 0x51, 0x03]), // Meta Event: Tempo
      Buffer.alloc(3)                 // Tempo Value (3 Bytes)
    ])
    tempoEvent.writeUIntBE(tempo, tempoEvent.length - 3, 3)
    trackEvents.push(tempoEvent)
    
    // Note Events
    pattern.pattern.forEach(note => {
      const noteNumber = this.noteToMIDINumber(note.note)
      const startTick = Math.round(note.startTime * pattern.bpm * 480 / 60)
      const durationTick = Math.round(note.duration * pattern.bpm * 480 / 60)
      
      // Note On Event
      const noteOnEvent = Buffer.concat([
        this.toVLQ(startTick),
        Buffer.from([0x90, noteNumber, note.velocity])
      ])
      trackEvents.push(noteOnEvent)
      
      // Note Off Event
      const noteOffEvent = Buffer.concat([
        this.toVLQ(durationTick),
        Buffer.from([0x80, noteNumber, 0x00])
      ])
      trackEvents.push(noteOffEvent)
    })
    
    // End of Track Event
    const endEvent = Buffer.concat([
      this.toVLQ(0),
      Buffer.from([0xFF, 0x2F, 0x00])
    ])
    trackEvents.push(endEvent)
    
    // Track Data zusammenbauen
    const trackData = Buffer.concat(trackEvents)
    
    // Track Header (MTrk)
    const trackHeader = Buffer.alloc(8)
    trackHeader.write('MTrk', 0)      // Chunk Type
    trackHeader.writeUInt32BE(trackData.length, 4) // Chunk Length
    
    // Komplette MIDI-Datei
    const midiData = Buffer.concat([header, trackHeader, trackData])
    
    // Datei speichern
    const fileName = `synth_loop_${Date.now()}.mid`
    const filePath = join(this.outputDir, fileName)
    
    writeFileSync(filePath, midiData)
    console.log('💾 MIDI-Datei gespeichert:', filePath)
    console.log('📊 Dateigröße:', midiData.length, 'Bytes')
    
    return filePath
  }

  noteToMIDINumber(noteName) {
    const note = noteName.slice(0, -1)
    const octave = parseInt(noteName.slice(-1))
    
    const noteIndex = this.availableNotes.indexOf(note)
    if (noteIndex === -1) return 60 // Fallback: Middle C
    
    return noteIndex + (octave + 1) * 12
  }

  generateSynthLoop(description, bpm = 120, key = 'C', scale = 'major') {
    console.log('🎵 Generiere Synthesizer-Loop...')
    console.log('Beschreibung:', description)
    console.log('BPM:', bpm)
    console.log('Key:', key)
    console.log('Scale:', scale)

    // Erstelle Pattern
    const pattern = this.createPattern(key, scale, bpm)
    
    // Erstelle MIDI-Datei
    const midiFilePath = this.createSimpleMIDI(pattern, description)
    
    // AudioClip Objekt
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
      message: 'Synthesizer-Loop erfolgreich erstellt!'
    }
  }

  createPattern(key, scale, bpm) {
    const scaleNotes = this.getScaleNotes(key, scale)
    
    const pattern = {
      pattern: [],
      bpm: bpm,
      key: key,
      scale: scale,
      description: `Pattern in ${key} ${scale}`,
      suggested_plugin: 'ZynAddSubFX',
      plugin_preset: 'Analog Lead'
    }

    // Erstelle 8 Takte Pattern (vereinfacht)
    const beatsPerBar = 4
    const totalBeats = 8 * beatsPerBar
    const beatDuration = 60 / bpm

    for (let beat = 0; beat < totalBeats; beat++) {
      if (beat % 4 === 0) { // Jeder 4. Beat
        const note = scaleNotes[beat % scaleNotes.length]
        const octave = this.octaves[Math.floor(Math.random() * this.octaves.length)]
        
        pattern.pattern.push({
          note: `${note}${octave}`,
          velocity: 90,
          duration: beatDuration,
          startTime: beat * beatDuration
        })
      }
    }

    return pattern
  }

  getScaleNotes(key, scale) {
    const scalePatterns = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10]
    }

    const keyIndex = this.availableNotes.indexOf(key)
    const pattern = scalePatterns[scale] || scalePatterns.major
    
    return pattern.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return this.availableNotes[noteIndex]
    })
  }
}

async function testSimpleMIDI() {
  console.log('🚀 Starte Simple MIDI Generator Test...')
  
  try {
    const midiGenerator = new SimpleMIDIGenerator()
    
    // Test: Synthesizer-Loop mit MIDI-Datei
    console.log('\n🎵 Test: Synthesizer-Loop mit MIDI-Datei')
    const result = midiGenerator.generateSynthLoop(
      'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien',
      128,
      'A',
      'minor'
    )
    
    console.log('\n✅ Synthesizer-Loop erfolgreich erstellt!')
    console.log('📁 AudioClip ID:', result.audioClip.id)
    console.log('📁 Datei-Pfad:', result.audioClip.filePath)
    console.log('🎵 BPM:', result.audioClip.bpm)
    console.log('🎼 Key:', result.audioClip.key)
    console.log('📏 Scale:', result.audioClip.scale)
    console.log('🎼 Pattern Noten:', result.pattern.pattern.length)
    
    // Zeige erste 5 Noten
    console.log('\n🎼 Erste 5 Noten:')
    result.pattern.pattern.slice(0, 5).forEach((note, index) => {
      console.log(`  ${index + 1}. ${note.note} (Velocity: ${note.velocity}, Duration: ${note.duration.toFixed(2)}s, Start: ${note.startTime.toFixed(2)}s)`)
    })
    
    // Zeige Output-Verzeichnis
    console.log('\n📁 Output-Verzeichnis:')
    console.log('Pfad:', midiGenerator.outputDir)
    console.log('Verwende: ls -la', midiGenerator.outputDir)
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
    console.error('Stack:', error.stack)
  }
  
  console.log('\n🏁 Simple MIDI Generator Test beendet.')
}

// Test ausführen
testSimpleMIDI() 