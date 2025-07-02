import { writeFileSync } from 'fs'
import { join } from 'path'

class MIDIGenerator {
  constructor() {
    this.ticksPerBeat = 480 // Standard MIDI Resolution
    this.currentTime = 0
  }

  // Erweiterte MIDI-Datei für Song-Strukturen generieren
  generateStructuredMIDI(songData) {
    console.log('🎼 Generiere strukturierte MIDI für:', songData.title)
    
    const { title, style, tempo, key, scale, structure, instruments } = songData
    
    // MIDI Header
    const midiHeader = this.createMIDIHeader()
    
    // Tempo Track
    const tempoTrack = this.createTempoTrack(tempo)
    
    // Instrument Tracks basierend auf Struktur
    const instrumentTracks = this.createInstrumentTracks(songData)
    
    // Alle Tracks zusammenführen
    const allTracks = [tempoTrack, ...instrumentTracks]
    
    return Buffer.concat([midiHeader, ...allTracks])
  }

  createMIDIHeader() {
    return Buffer.from([
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x01, // Format 1
      0x00, 0x02, // 2 tracks (tempo + instruments)
      0x01, 0xE0  // 480 ticks per quarter note
    ])
  }

  createTempoTrack(tempo) {
    const tempoValue = Math.floor(60000000 / tempo) // Mikrosekunden pro Beat
    
    const tempoData = [
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      0x00, 0x00, 0x00, 0x0B, // Track length (placeholder)
      0x00, 0xFF, 0x51, 0x03, // Tempo meta event
      (tempoValue >> 16) & 0xFF, // Tempo value (3 bytes)
      (tempoValue >> 8) & 0xFF,
      tempoValue & 0xFF,
      0x00, 0xFF, 0x2F, 0x00  // End of track
    ]
    
    // Track length korrigieren
    const trackLength = tempoData.length - 8
    tempoData[4] = (trackLength >> 24) & 0xFF
    tempoData[5] = (trackLength >> 16) & 0xFF
    tempoData[6] = (trackLength >> 8) & 0xFF
    tempoData[7] = trackLength & 0xFF
    
    return Buffer.from(tempoData)
  }

  createInstrumentTracks(songData) {
    const { key, scale, structure, instruments, style } = songData
    const tracks = []
    
    // Bass Track
    if (instruments.includes('Bass') || instruments.includes('bass')) {
      const bassTrack = this.createBassTrack(key, scale, structure, style)
      tracks.push(bassTrack)
    }
    
    // Drum Track
    if (instruments.includes('Drums') || instruments.includes('Schlagzeug') || instruments.includes('drums')) {
      const drumTrack = this.createDrumTrack(structure, style)
      tracks.push(drumTrack)
    }
    
    // Lead/Melody Track
    if (instruments.includes('Guitar') || instruments.includes('Gitarre') || instruments.includes('Synth') || instruments.includes('synthesizer')) {
      const leadTrack = this.createLeadTrack(key, scale, structure, style)
      tracks.push(leadTrack)
    }
    
    // Pad/Atmosphere Track
    if (instruments.includes('Piano') || instruments.includes('Melodica') || instruments.includes('pad')) {
      const padTrack = this.createPadTrack(key, scale, structure, style)
      tracks.push(padTrack)
    }
    
    return tracks
  }

  createBassTrack(key, scale, structure, style) {
    const notes = this.getScaleNotes(key, scale)
    const bassNotes = notes.slice(0, 3) // Erste 3 Noten der Skala für Bass
    
    const events = []
    let currentTime = 0
    
    console.log('🎸 Bass Track - Notes:', bassNotes, 'Structure:', structure)
    
    structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, style)
      const notesInSection = Math.floor(sectionLength / 2) // 2 Beats pro Note
      
      for (let i = 0; i < notesInSection; i++) {
        const note = bassNotes[i % bassNotes.length]
        const noteNumber = this.noteToMIDI(note, 2) // Oktave 2 für Bass
        
        // Note On
        const noteOnEvent = this.createMIDIEvent(currentTime, 0x90, noteNumber, 80)
        events.push(noteOnEvent)
        currentTime += 240 // 2 Beats
        
        // Note Off
        const noteOffEvent = this.createMIDIEvent(currentTime, 0x80, noteNumber, 0)
        events.push(noteOffEvent)
        currentTime += 240 // 2 Beats
      }
    })
    
    return this.createTrackBuffer(events, 0) // Channel 0 für Bass
  }

  createDrumTrack(structure, style) {
    const events = []
    let currentTime = 0
    
    console.log('🥁 Drum Track - Structure:', structure, 'Style:', style)
    
    structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, style)
      const beatsInSection = sectionLength
      
      for (let beat = 0; beat < beatsInSection; beat++) {
        // Kick Drum auf Beat 1 und 3
        if (beat % 4 === 0 || beat % 4 === 2) {
          const kickOn = this.createMIDIEvent(currentTime, 0x99, 36, 100) // Kick
          const kickOff = this.createMIDIEvent(currentTime + 120, 0x89, 36, 0)
          events.push(kickOn, kickOff)
        }
        
        // Snare auf Beat 2 und 4
        if (beat % 4 === 1 || beat % 4 === 3) {
          const snareOn = this.createMIDIEvent(currentTime, 0x99, 38, 90) // Snare
          const snareOff = this.createMIDIEvent(currentTime + 120, 0x89, 38, 0)
          events.push(snareOn, snareOff)
        }
        
        // Hi-Hat auf jedem Beat
        const hihatOn = this.createMIDIEvent(currentTime, 0x99, 42, 70) // Hi-Hat
        const hihatOff = this.createMIDIEvent(currentTime + 60, 0x89, 42, 0)
        events.push(hihatOn, hihatOff)
        
        currentTime += 120 // 1 Beat
      }
    })
    
    return this.createTrackBuffer(events, 9) // Channel 9 für Drums
  }

  createLeadTrack(key, scale, structure, style) {
    const notes = this.getScaleNotes(key, scale)
    const events = []
    let currentTime = 0
    
    console.log('🎹 Lead Track - Notes:', notes, 'Structure:', structure)
    
    structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, style)
      const notesInSection = Math.floor(sectionLength / 4) // 4 Beats pro Note
      
      for (let i = 0; i < notesInSection; i++) {
        const note = notes[i % notes.length]
        const noteNumber = this.noteToMIDI(note, 4) // Oktave 4 für Lead
        
        // Note On
        const leadOn = this.createMIDIEvent(currentTime, 0x90, noteNumber, 85)
        events.push(leadOn)
        currentTime += 480 // 4 Beats
        
        // Note Off
        const leadOff = this.createMIDIEvent(currentTime, 0x80, noteNumber, 0)
        events.push(leadOff)
        currentTime += 480 // 4 Beats
      }
    })
    
    return this.createTrackBuffer(events, 1) // Channel 1 für Lead
  }

  createPadTrack(key, scale, structure, style) {
    const notes = this.getScaleNotes(key, scale)
    const events = []
    let currentTime = 0
    
    console.log('🎼 Pad Track - Notes:', notes, 'Structure:', structure)
    
    structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, style)
      
      // Pad spielt Akkorde
      const chordNotes = [notes[0], notes[2], notes[4]] // Grundakkord
      
      chordNotes.forEach(note => {
        const noteNumber = this.noteToMIDI(note, 3) // Oktave 3 für Pad
        
        // Note On
        const padOn = this.createMIDIEvent(currentTime, 0x90, noteNumber, 60)
        events.push(padOn)
      })
      
      currentTime += sectionLength * 120 // Ganze Sektion
      
      // Note Off für alle Akkord-Noten
      chordNotes.forEach(note => {
        const noteNumber = this.noteToMIDI(note, 3)
        const padOff = this.createMIDIEvent(currentTime, 0x80, noteNumber, 0)
        events.push(padOff)
      })
    })
    
    return this.createTrackBuffer(events, 2) // Channel 2 für Pad
  }

  getScaleNotes(key, scale) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const majorScale = [0, 2, 4, 5, 7, 9, 11] // C major scale intervals
    const minorScale = [0, 2, 3, 5, 7, 8, 10] // C minor scale intervals
    
    const keyIndex = noteNames.indexOf(key)
    const scaleIntervals = scale === 'minor' ? minorScale : majorScale
    
    return scaleIntervals.map(interval => {
      const noteIndex = (keyIndex + interval) % 12
      return noteNames[noteIndex]
    })
  }

  getSectionLength(section, style) {
    // Verschiedene Längen für verschiedene Sektionen und Stile
    const baseLengths = {
      'Intro': 8,
      'Verse': 16,
      'Chorus': 16,
      'Bridge': 8,
      'Outro': 8,
      'Build-up': 8,
      'Drop': 16
    }
    
    const styleMultipliers = {
      'techno': 1.0,
      'psychedelic_rock': 1.2,
      'ambient': 1.5,
      'house': 1.0,
      'trance': 1.1
    }
    
    const baseLength = baseLengths[section] || 8
    const multiplier = styleMultipliers[style] || 1.0
    
    return Math.floor(baseLength * multiplier)
  }

  noteToMIDI(noteName, octave) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteIndex = noteNames.indexOf(noteName)
    return noteIndex + (octave * 12)
  }

  createMIDIEvent(deltaTime, status, data1, data2) {
    const deltaTimeBytes = this.encodeVariableLength(deltaTime)
    const event = [...deltaTimeBytes, status, data1, data2]
    return event
  }

  encodeVariableLength(value) {
    const bytes = []
    let v = value
    
    do {
      let b = v & 0x7F
      v >>= 7
      if (v > 0) b |= 0x80
      bytes.push(b)
    } while (v > 0)
    
    return bytes
  }

  createTrackBuffer(events, channel) {
    const trackData = []
    
    // Sicherheitsprüfung für events
    if (!Array.isArray(events)) {
      console.error('❌ Events ist kein Array:', events)
      events = []
    }
    
    console.log(`🎵 Creating track buffer for channel ${channel} with ${events.length} events`)
    
    // Track header
    trackData.push(0x4D, 0x54, 0x72, 0x6B) // MTrk
    
    // Placeholder für Track length
    const lengthPosition = trackData.length
    trackData.push(0x00, 0x00, 0x00, 0x00)
    
    // Channel program change
    trackData.push(0x00, 0xC0 + channel, this.getInstrumentForChannel(channel))
    
    // Events hinzufügen
    events.forEach((event, index) => {
      if (Array.isArray(event)) {
        trackData.push(...event)
      } else {
        console.error(`❌ Event ${index} ist kein Array:`, event)
      }
    })
    
    // End of track
    trackData.push(0x00, 0xFF, 0x2F, 0x00)
    
    // Track length berechnen und einsetzen
    const trackLength = trackData.length - 8
    trackData[lengthPosition] = (trackLength >> 24) & 0xFF
    trackData[lengthPosition + 1] = (trackLength >> 16) & 0xFF
    trackData[lengthPosition + 2] = (trackLength >> 8) & 0xFF
    trackData[lengthPosition + 3] = trackLength & 0xFF
    
    return Buffer.from(trackData)
  }

  getInstrumentForChannel(channel) {
    const instruments = {
      0: 32, // Bass
      1: 80, // Lead (Square Lead)
      2: 89, // Pad (Warm Pad)
      9: 0   // Drums (Acoustic Grand Piano für Drums)
    }
    return instruments[channel] || 0
  }

  // MIDI-Datei speichern
  saveMIDI(midiData, filename, outputPath) {
    const filepath = join(outputPath, filename)
    writeFileSync(filepath, midiData)
    console.log(`💾 MIDI-Datei gespeichert: ${filepath}`)
    return filepath
  }
}

export default MIDIGenerator 