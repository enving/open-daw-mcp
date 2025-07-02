import { writeFileSync } from 'fs'
import { join } from 'path'

class VariableAudioEngine {
  constructor() {
    this.sampleRate = 44100
    this.bitDepth = 16
    this.channels = 2
  }

  async createVariableAudio(songData, outputPath) {
    console.log('🎵 Erstelle variable Audio für:', songData.title)
    
    const { title, style, tempo, key, structure, instruments } = songData
    
    // Länge basierend auf Song-Struktur berechnen
    const totalLength = this.calculateSongLength(structure, tempo)
    const samples = this.sampleRate * totalLength
    
    console.log(`📏 Song-Länge: ${totalLength.toFixed(1)} Sekunden (${samples} Samples)`)
    
    // Multi-Track Audio erstellen
    const audioData = this.createMultiTrackAudio(songData, samples)
    
    // WAV-Header erstellen
    const wavHeader = this.createWAVHeader(audioData.length)
    
    // Audio-Datei speichern
    const fullAudioData = Buffer.concat([wavHeader, audioData])
    writeFileSync(outputPath, fullAudioData)
    
    console.log(`💾 Variable Audio gespeichert: ${outputPath}`)
    return outputPath
  }

  calculateSongLength(structure, tempo) {
    const beatsPerSecond = tempo / 60
    let totalBeats = 0
    
    structure.forEach(section => {
      const sectionBeats = this.getSectionBeats(section, tempo)
      totalBeats += sectionBeats
    })
    
    return totalBeats / beatsPerSecond
  }

  getSectionBeats(section, tempo) {
    const sectionLengths = {
      'Intro': 8,
      'Verse': 16,
      'Chorus': 16,
      'Bridge': 8,
      'Outro': 8,
      'Pre-Chorus': 8,
      'Build-up': 8,
      'Drop': 16
    }
    
    return sectionLengths[section] || 8
  }

  createMultiTrackAudio(songData, totalSamples) {
    const { style, tempo, key, structure, instruments } = songData
    const audioData = new Float32Array(totalSamples * this.channels)
    
    // Bass Track
    if (instruments.includes('Bass') || instruments.includes('bass')) {
      this.addBassTrack(audioData, songData, totalSamples)
    }
    
    // Drum Track
    if (instruments.includes('Drums') || instruments.includes('Schlagzeug')) {
      this.addDrumTrack(audioData, songData, totalSamples)
    }
    
    // Lead Track
    if (instruments.includes('Guitar') || instruments.includes('Synth')) {
      this.addLeadTrack(audioData, songData, totalSamples)
    }
    
    // Pad Track
    if (instruments.includes('Piano') || instruments.includes('Keyboards')) {
      this.addPadTrack(audioData, songData, totalSamples)
    }
    
    // Mastering
    this.applyMastering(audioData)
    
    // Float32 zu Int16 konvertieren
    return this.float32ToInt16(audioData)
  }

  addBassTrack(audioData, songData, totalSamples) {
    const { tempo, key, structure } = songData
    const bassFreq = this.getBassFrequency(key)
    const beatDuration = this.sampleRate * 60 / tempo
    
    console.log('🎸 Bass Track - Frequenz:', bassFreq, 'Hz')
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / this.sampleRate
      const beat = (time * tempo) / 60
      
      // Bass-Pattern basierend auf Beat
      let amplitude = 0
      if (Math.floor(beat) % 4 === 0 || Math.floor(beat) % 4 === 2) {
        amplitude = 0.3 * Math.exp(-beat % 1 * 2) // Bass-Kick
      }
      
      const sample = amplitude * Math.sin(2 * Math.PI * bassFreq * time)
      
      // Stereo
      audioData[i * 2] += sample * 0.8     // Left
      audioData[i * 2 + 1] += sample * 0.8  // Right
    }
  }

  addDrumTrack(audioData, songData, totalSamples) {
    const { tempo, structure } = songData
    const beatDuration = this.sampleRate * 60 / tempo
    
    console.log('🥁 Drum Track - Tempo:', tempo, 'BPM')
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / this.sampleRate
      const beat = (time * tempo) / 60
      
      let amplitude = 0
      
      // Kick Drum
      if (Math.floor(beat) % 4 === 0) {
        amplitude += 0.4 * Math.exp(-(beat % 1) * 8)
      }
      
      // Snare
      if (Math.floor(beat) % 4 === 2) {
        amplitude += 0.3 * Math.exp(-(beat % 1) * 6)
      }
      
      // Hi-Hat
      if (Math.floor(beat * 2) % 2 === 0) {
        amplitude += 0.1 * Math.exp(-(beat % 0.5) * 10)
      }
      
      const sample = amplitude * (Math.random() * 2 - 1) // Noise für Drums
      
      // Stereo
      audioData[i * 2] += sample * 0.6     // Left
      audioData[i * 2 + 1] += sample * 0.6  // Right
    }
  }

  addLeadTrack(audioData, songData, totalSamples) {
    const { tempo, key, structure } = songData
    const notes = this.getScaleNotes(key)
    const beatDuration = this.sampleRate * 60 / tempo
    
    console.log('🎹 Lead Track - Noten:', notes)
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / this.sampleRate
      const beat = (time * tempo) / 60
      
      let amplitude = 0
      const noteIndex = Math.floor(beat / 2) % notes.length
      const noteFreq = this.noteToFrequency(notes[noteIndex], 4) // Oktave 4
      
      if (beat % 2 < 1.5) { // Note spielt für 1.5 Beats
        amplitude = 0.2 * Math.exp(-(beat % 2) * 1.5)
        const sample = amplitude * Math.sin(2 * Math.PI * noteFreq * time)
        
        // Stereo mit leichter Panning
        audioData[i * 2] += sample * 0.7     // Left
        audioData[i * 2 + 1] += sample * 0.5  // Right
      }
    }
  }

  addPadTrack(audioData, songData, totalSamples) {
    const { tempo, key, structure } = songData
    const notes = this.getScaleNotes(key)
    const chordNotes = [notes[0], notes[2], notes[4]] // Grundakkord
    
    console.log('🎼 Pad Track - Akkord:', chordNotes)
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / this.sampleRate
      const beat = (time * tempo) / 60
      
      let amplitude = 0
      
      // Akkord spielt für längere Zeit
      if (Math.floor(beat) % 8 < 6) {
        amplitude = 0.1 * Math.exp(-(beat % 8) * 0.3)
        
        chordNotes.forEach((note, index) => {
          const noteFreq = this.noteToFrequency(note, 3) // Oktave 3
          const sample = amplitude * Math.sin(2 * Math.PI * noteFreq * time)
          
          // Stereo mit breiter Verteilung
          audioData[i * 2] += sample * 0.4     // Left
          audioData[i * 2 + 1] += sample * 0.4  // Right
        })
      }
    }
  }

  applyMastering(audioData) {
    // Kompression
    const threshold = 0.7
    const ratio = 4
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i]
      if (Math.abs(sample) > threshold) {
        const excess = Math.abs(sample) - threshold
        const compressed = threshold + (excess / ratio)
        audioData[i] = sample > 0 ? compressed : -compressed
      }
    }
    
    // Limiting
    const limit = 0.95
    for (let i = 0; i < audioData.length; i++) {
      if (audioData[i] > limit) audioData[i] = limit
      if (audioData[i] < -limit) audioData[i] = -limit
    }
  }

  getBassFrequency(key) {
    const keyFrequencies = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    }
    return keyFrequencies[key] || 261.63
  }

  getScaleNotes(key) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const majorScale = [0, 2, 4, 5, 7, 9, 11]
    const keyIndex = noteNames.indexOf(key)
    
    return majorScale.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return noteNames[noteIndex]
    })
  }

  noteToFrequency(note, octave = 4) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteIndex = noteNames.indexOf(note)
    const a4 = 440
    const c0 = a4 * Math.pow(2, -4.75)
    const halfStepsBelowMiddleC = noteIndex + (octave - 4) * 12
    return c0 * Math.pow(2, halfStepsBelowMiddleC / 12)
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
    header.writeUInt16LE(1, 20)  // Audio format (PCM)
    header.writeUInt16LE(this.channels, 22)
    header.writeUInt32LE(this.sampleRate, 24)
    header.writeUInt32LE(this.sampleRate * this.channels * this.bitDepth / 8, 28) // Byte rate
    header.writeUInt16LE(this.channels * this.bitDepth / 8, 32) // Block align
    header.writeUInt16LE(this.bitDepth, 34)
    
    // Data Chunk
    header.write('data', 36)
    header.writeUInt32LE(dataLength, 40)
    
    return header
  }

  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = sample * 32767
    }
    return Buffer.from(int16Array.buffer)
  }

  async createSong(songData, style, outputPath) {
    return await this.createVariableAudio(songData, outputPath)
  }
}

export default VariableAudioEngine 