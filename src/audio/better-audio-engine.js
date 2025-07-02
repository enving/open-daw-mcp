import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class BetterAudioEngine {
  constructor() {
    this.sampleRate = 44100
    this.bitDepth = 16
    this.channels = 2
  }

  // Erweiterte Audio-Generierung mit verschiedenen Stilen
  async createSong(songData, style, outputPath) {
    console.log('🎵 Erstelle erweiterte Audio für:', songData.title)
    
    const { tempo, key, scale, structure, instruments } = songData
    
    // Song-Länge basierend auf Struktur berechnen
    const totalBeats = this.calculateTotalBeats(structure, style)
    const duration = (totalBeats * 60) / tempo // Sekunden
    
    console.log(`⏱️ Song-Dauer: ${duration.toFixed(1)} Sekunden (${totalBeats} Beats bei ${tempo} BPM)`)
    
    // Audio-Daten generieren
    const audioData = this.generateAudioData(songData, duration)
    
    // WAV-Header erstellen
    const wavHeader = this.createWAVHeader(audioData.length)
    
    // Datei speichern
    const fullPath = join(outputPath)
    writeFileSync(fullPath, Buffer.concat([wavHeader, audioData]))
    
    console.log(`💾 Audio-Datei gespeichert: ${fullPath}`)
    return fullPath
  }

  // Gesamte Beats basierend auf Song-Struktur berechnen
  calculateTotalBeats(structure, style) {
    const sectionLengths = {
      'Intro': 8,
      'Verse': 16,
      'Chorus': 16,
      'Bridge': 8,
      'Outro': 8,
      'Pre-Chorus': 8,
      'Verse 1': 16,
      'Verse 2': 16
    }
    
    const styleMultipliers = {
      'techno': 1.0,
      'psychedelic_rock': 1.5,
      'ambient': 2.0,
      'house': 1.2,
      'trance': 1.3
    }
    
    let totalBeats = 0
    structure.forEach(section => {
      const baseLength = sectionLengths[section] || 8
      const multiplier = styleMultipliers[style] || 1.0
      totalBeats += Math.floor(baseLength * multiplier)
    })
    
    return totalBeats
  }

  // Audio-Daten generieren
  generateAudioData(songData, duration) {
    const { tempo, key, scale, structure, instruments, style } = songData
    const samples = Math.floor(duration * this.sampleRate)
    const audioData = new Int16Array(samples * this.channels)
    
    // Verschiedene Instrumente generieren
    const bassData = this.generateBassTrack(samples, tempo, key, scale, style)
    const drumData = this.generateDrumTrack(samples, tempo, style)
    const leadData = this.generateLeadTrack(samples, tempo, key, scale, style)
    const padData = this.generatePadTrack(samples, tempo, key, scale, style)
    
    // Alle Tracks mischen
    for (let i = 0; i < samples; i++) {
      const leftSample = Math.floor(
        (bassData[i] * 0.3) + 
        (drumData[i] * 0.4) + 
        (leadData[i] * 0.2) + 
        (padData[i] * 0.1)
      )
      
      const rightSample = Math.floor(
        (bassData[i] * 0.3) + 
        (drumData[i] * 0.4) + 
        (leadData[i] * 0.2) + 
        (padData[i] * 0.1)
      )
      
      // Stereo-Panning für Lead und Pad
      const panLeft = Math.sin(i * 0.001) * 0.3
      const panRight = Math.cos(i * 0.001) * 0.3
      
      audioData[i * 2] = Math.max(-32768, Math.min(32767, leftSample + (leadData[i] * panLeft) + (padData[i] * panLeft)))
      audioData[i * 2 + 1] = Math.max(-32768, Math.min(32767, rightSample + (leadData[i] * panRight) + (padData[i] * panRight)))
    }
    
    return Buffer.from(audioData.buffer)
  }

  // Bass-Track generieren
  generateBassTrack(samples, tempo, key, scale, style) {
    const bassData = new Int16Array(samples)
    const beatLength = this.sampleRate * 60 / tempo
    const notes = this.getScaleNotes(key, scale)
    const bassNotes = notes.slice(0, 3) // Erste 3 Noten für Bass
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.sampleRate
      const beat = Math.floor(time * tempo / 60)
      const noteIndex = beat % bassNotes.length
      const note = bassNotes[noteIndex]
      const frequency = this.noteToFrequency(note, 2) // Oktave 2
      
      // Bass-Waveform mit verschiedenen Stilen
      let amplitude = 0
      if (style === 'techno') {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.8
        amplitude += Math.sin(2 * Math.PI * frequency * 2 * time) * 0.2 // Obertöne
      } else if (style === 'psychedelic_rock') {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.6
        amplitude += Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.3
        amplitude += Math.sin(2 * Math.PI * frequency * 2.5 * time) * 0.1
      } else {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.7
      }
      
      // Envelope für jeden Beat
      const beatTime = (time * tempo / 60) % 1
      const envelope = this.createEnvelope(beatTime, 0.1, 0.3, 0.6, 0.8)
      
      bassData[i] = Math.floor(amplitude * envelope * 8000)
    }
    
    return bassData
  }

  // Drum-Track generieren
  generateDrumTrack(samples, tempo, style) {
    const drumData = new Int16Array(samples)
    const beatLength = this.sampleRate * 60 / tempo
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.sampleRate
      const beat = Math.floor(time * tempo / 60)
      const beatPosition = (time * tempo / 60) % 1
      
      let amplitude = 0
      
      // Kick Drum auf Beat 1 und 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        if (beatPosition < 0.1) {
          amplitude += Math.sin(2 * Math.PI * 60 * beatPosition * 10) * 0.8
        }
      }
      
      // Snare auf Beat 2 und 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        if (beatPosition < 0.05) {
          amplitude += (Math.random() - 0.5) * 0.6
        }
      }
      
      // Hi-Hat auf jedem Beat
      if (beatPosition < 0.02) {
        amplitude += (Math.random() - 0.5) * 0.4
      }
      
      drumData[i] = Math.floor(amplitude * 12000)
    }
    
    return drumData
  }

  // Lead-Track generieren
  generateLeadTrack(samples, tempo, key, scale, style) {
    const leadData = new Int16Array(samples)
    const notes = this.getScaleNotes(key, scale)
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.sampleRate
      const beat = Math.floor(time * tempo / 60)
      const noteIndex = Math.floor(beat / 2) % notes.length // Alle 2 Beats neue Note
      const note = notes[noteIndex]
      const frequency = this.noteToFrequency(note, 4) // Oktave 4
      
      let amplitude = 0
      if (style === 'techno') {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.5
        amplitude += Math.sin(2 * Math.PI * frequency * 2 * time) * 0.3
      } else if (style === 'psychedelic_rock') {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.4
        amplitude += Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.2
        amplitude += Math.sin(2 * Math.PI * frequency * 3 * time) * 0.1
      } else {
        amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.6
      }
      
      // Envelope für längere Noten
      const noteTime = (time * tempo / 60 / 2) % 1
      const envelope = this.createEnvelope(noteTime, 0.05, 0.2, 0.7, 1.0)
      
      leadData[i] = Math.floor(amplitude * envelope * 6000)
    }
    
    return leadData
  }

  // Pad-Track generieren
  generatePadTrack(samples, tempo, key, scale, style) {
    const padData = new Int16Array(samples)
    const notes = this.getScaleNotes(key, scale)
    const chordNotes = [notes[0], notes[2], notes[4]] // Grundakkord
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.sampleRate
      const beat = Math.floor(time * tempo / 60)
      const chordIndex = Math.floor(beat / 4) % 4 // Alle 4 Beats neuer Akkord
      
      let amplitude = 0
      
      // Akkord spielen
      chordNotes.forEach((note, noteIndex) => {
        const frequency = this.noteToFrequency(note, 3) // Oktave 3
        amplitude += Math.sin(2 * Math.PI * frequency * time) * 0.2
        amplitude += Math.sin(2 * Math.PI * frequency * 2 * time) * 0.1
      })
      
      // Langsame Modulation für Pad
      const modulation = Math.sin(2 * Math.PI * 0.5 * time) * 0.1
      amplitude += modulation
      
      padData[i] = Math.floor(amplitude * 4000)
    }
    
    return padData
  }

  // Hilfsfunktionen
  getScaleNotes(key, scale) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const majorScale = [0, 2, 4, 5, 7, 9, 11]
    const minorScale = [0, 2, 3, 5, 7, 8, 10]
    
    const keyIndex = noteNames.indexOf(key)
    const scaleIntervals = scale === 'minor' ? minorScale : majorScale
    
    return scaleIntervals.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return noteNames[noteIndex]
    })
  }

  noteToFrequency(note, octave) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteIndex = noteNames.indexOf(note)
    const midiNote = noteIndex + (octave * 12)
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }

  createEnvelope(time, attack, decay, sustain, release) {
    if (time < attack) {
      return time / attack
    } else if (time < attack + decay) {
      return 1 - ((time - attack) / decay) * (1 - sustain)
    } else if (time < 1 - release) {
      return sustain
    } else {
      return sustain * (1 - (time - (1 - release)) / release)
    }
  }

  createWAVHeader(dataLength) {
    const header = Buffer.alloc(44)
    
    // RIFF Header
    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataLength, 4)
    header.write('WAVE', 8)
    
    // Format Chunk
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16) // Chunk size
    header.writeUInt16LE(1, 20) // Audio format (PCM)
    header.writeUInt16LE(this.channels, 22) // Channels
    header.writeUInt32LE(this.sampleRate, 24) // Sample rate
    header.writeUInt32LE(this.sampleRate * this.channels * this.bitDepth / 8, 28) // Byte rate
    header.writeUInt16LE(this.channels * this.bitDepth / 8, 32) // Block align
    header.writeUInt16LE(this.bitDepth, 34) // Bits per sample
    
    // Data Chunk
    header.write('data', 36)
    header.writeUInt32LE(dataLength, 40)
    
    return header
  }
}

export default BetterAudioEngine 