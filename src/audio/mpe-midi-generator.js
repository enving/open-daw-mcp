import { writeFileSync } from 'fs'
import { join } from 'path'

class MPEMIDIGenerator {
  constructor() {
    this.ticksPerBeat = 960 // Höhere Auflösung für MIDI 2.0
    this.mpeChannels = {
      lead: 1,
      bass: 2,
      pad: 3,
      arp: 4,
      fx: 5,
      drum: 10
    }
    
    // MPE Controller Mapping
    this.mpeControllers = {
      pressure: 0x40,      // Poly Pressure
      timbre: 0x47,        // Timbre
      slide: 0x5A,         // Slide
      lift: 0x5B,          // Lift
      glide: 0x5C,         // Glide
      vibrato: 0x5D,       // Vibrato
      volume: 0x07,        // Volume
      pan: 0x0A,           // Pan
      expression: 0x0B,    // Expression
      modulation: 0x01     // Modulation
    }
    
    // MIDI 2.0 Features
    this.midi2Features = {
      perNoteControllers: true,
      noteExpression: true,
      polyPressure: true,
      channelPressure: true,
      pitchBend: true,
      programChange: true,
      controlChange: true
    }
  }

  generateMPEMIDI(songData) {
    console.log('🎼 Generiere erweiterte MPE MIDI 2.0 für:', songData.title)
    
    const midiHeader = this.createMIDI2Header()
    const tempoTrack = this.createTempoTrack(songData.tempo)
    const mpeTracks = this.createExpressiveMPETracks(songData)
    
    return Buffer.concat([midiHeader, tempoTrack, ...mpeTracks])
  }

  createMIDI2Header() {
    return Buffer.from([
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x02, // Format 2 (MIDI 2.0)
      0x00, 0x08, // 8 tracks (erweitert)
      0x03, 0xC0  // 960 ticks per quarter note
    ])
  }

  createTempoTrack(tempo) {
    const tempoValue = Math.floor(60000000 / tempo)
    const data = [
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      0x00, 0x00, 0x00, 0x0B, // Track length
      0x00, 0xFF, 0x51, 0x03, // Tempo
      (tempoValue >> 16) & 0xFF,
      (tempoValue >> 8) & 0xFF,
      tempoValue & 0xFF,
      0x00, 0xFF, 0x2F, 0x00  // End of track
    ]
    return Buffer.from(data)
  }

  createExpressiveMPETracks(songData) {
    const tracks = []
    
    // Lead Track mit MPE Expression
    tracks.push(this.createExpressiveMPETrack(this.mpeChannels.lead, 'Lead', songData, 'lead'))
    // Bass Track mit Slide und Pressure
    tracks.push(this.createExpressiveMPETrack(this.mpeChannels.bass, 'Bass', songData, 'bass'))
    // Pad Track mit Timbre und Vibrato
    tracks.push(this.createExpressiveMPETrack(this.mpeChannels.pad, 'Pad', songData, 'pad'))
    // Arp Track mit Glide und Modulation
    tracks.push(this.createExpressiveMPETrack(this.mpeChannels.arp, 'Arp', songData, 'arp'))
    // FX Track mit Expression und Volume
    tracks.push(this.createExpressiveMPETrack(this.mpeChannels.fx, 'FX', songData, 'fx'))
    // Drum Track (Standard MIDI)
    tracks.push(this.createDrumTrack(this.mpeChannels.drum, 'Drums', songData))
    
    return tracks
  }

  createExpressiveMPETrack(channel, name, songData, trackType) {
    const notes = this.getScaleNotes(songData.key, songData.scale)
    const events = []
    let time = 0
    
    // Track Name und MPE Setup
    events.push(...this.createTrackName(name))
    events.push(...this.createMPESetup(channel))
    
    songData.structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, songData.style)
      const notesPerSection = this.getNotesPerSection(trackType, section)
      
      for (let noteIndex = 0; noteIndex < notesPerSection; noteIndex++) {
        const note = notes[noteIndex % notes.length]
        const octave = this.getOctaveForTrack(trackType, sectionIndex)
        const noteNumber = this.noteToMIDI(note, octave)
        
        // Note On mit MPE Expression
        const mpeData = this.generateMPEExpression(trackType, sectionIndex, noteIndex, songData)
        events.push(...this.createExpressiveNoteOn(time, channel, noteNumber, mpeData))
        
        const noteDuration = this.getNoteDuration(trackType, section)
        time += noteDuration
        
        // Note Off
        events.push(...this.createMIDIEvent(time, 0x80 | channel, noteNumber, 0))
        time += 60 // Kurze Pause
      }
    })
    
    return this.createTrackBuffer(events, channel, name)
  }

  createExpressiveNoteOn(time, channel, note, mpeData) {
    const events = []
    
    // Note On
    events.push(...this.createMIDIEvent(time, 0x90 | channel, note, mpeData.velocity))
    
    // MPE Expression Events (mit kleinen Delays für Realismus)
    if (mpeData.pressure) {
      events.push(...this.createMPEEvent(time + 10, 0xA0 | channel, note, mpeData.pressure))
    }
    if (mpeData.timbre) {
      events.push(...this.createMPEEvent(time + 20, 0xE0 | channel, 0, mpeData.timbre))
    }
    if (mpeData.slide) {
      events.push(...this.createMPEEvent(time + 30, 0xE0 | channel, 1, mpeData.slide))
    }
    if (mpeData.vibrato) {
      events.push(...this.createMPEEvent(time + 40, 0xE0 | channel, 2, mpeData.vibrato))
    }
    if (mpeData.expression) {
      events.push(...this.createMPEEvent(time + 50, 0xB0 | channel, 0x0B, mpeData.expression))
    }
    if (mpeData.modulation) {
      events.push(...this.createMPEEvent(time + 60, 0xB0 | channel, 0x01, mpeData.modulation))
    }
    
    return events
  }

  generateMPEExpression(trackType, sectionIndex, noteIndex, songData) {
    const baseVelocity = 80
    const expression = {
      velocity: baseVelocity,
      pressure: 64,
      timbre: 64,
      slide: 64,
      vibrato: 64,
      expression: 64,
      modulation: 64
    }
    
    switch (trackType) {
      case 'lead':
        expression.velocity = 90 + Math.sin(sectionIndex * 0.5) * 10
        expression.pressure = 70 + Math.sin(noteIndex * 0.3) * 20
        expression.vibrato = 60 + Math.cos(noteIndex * 0.4) * 30
        expression.expression = 80 + Math.sin(sectionIndex * 0.7) * 15
        break
        
      case 'bass':
        expression.velocity = 85 + Math.cos(sectionIndex * 0.3) * 15
        expression.slide = 50 + Math.sin(noteIndex * 0.5) * 40
        expression.pressure = 80 + Math.cos(noteIndex * 0.2) * 15
        break
        
      case 'pad':
        expression.velocity = 60 + Math.sin(sectionIndex * 0.4) * 10
        expression.timbre = 40 + Math.cos(noteIndex * 0.6) * 50
        expression.expression = 70 + Math.sin(sectionIndex * 0.8) * 20
        break
        
      case 'arp':
        expression.velocity = 75 + Math.sin(noteIndex * 0.7) * 20
        expression.modulation = 60 + Math.cos(noteIndex * 0.4) * 35
        expression.slide = 30 + Math.sin(noteIndex * 0.3) * 40
        break
        
      case 'fx':
        expression.velocity = 70 + Math.cos(noteIndex * 0.5) * 25
        expression.timbre = 20 + Math.sin(noteIndex * 0.8) * 60
        expression.expression = 50 + Math.cos(noteIndex * 0.6) * 40
        break
    }
    
    return expression
  }

  createMPESetup(channel) {
    const events = []
    
    // MPE Zone Setup (falls unterstützt)
    events.push(...this.createMIDIEvent(0, 0xB0 | channel, 0x79, 0)) // Reset All Controllers
    events.push(...this.createMIDIEvent(0, 0xB0 | channel, 0x7A, 0)) // Local Control Off
    events.push(...this.createMIDIEvent(0, 0xB0 | channel, 0x7B, 0)) // All Notes Off
    
    return events
  }

  createTrackName(name) {
    const nameBytes = Buffer.from(name, 'utf8')
    return [0x00, 0xFF, 0x03, nameBytes.length, ...Array.from(nameBytes)]
  }

  createDrumTrack(channel, name, songData) {
    const events = []
    let time = 0
    
    // Track Name
    events.push(...this.createTrackName(name))
    
    // Drum Pattern basierend auf Style
    const drumPattern = this.getDrumPattern(songData.style)
    
    songData.structure.forEach((section, sectionIndex) => {
      const sectionLength = this.getSectionLength(section, songData.style)
      const beatsPerSection = sectionLength * 4 // 4/4 Time
      
      for (let beat = 0; beat < beatsPerSection; beat++) {
        drumPattern.forEach(drumHit => {
          if (drumHit.beat === beat % 4) {
            events.push(...this.createMIDIEvent(time, 0x90 | channel, drumHit.note, drumHit.velocity))
            time += 60
            events.push(...this.createMIDIEvent(time, 0x80 | channel, drumHit.note, 0))
          }
        })
        time += 240 // Quarter note
      }
    })
    
    return this.createTrackBuffer(events, channel, name)
  }

  getDrumPattern(style) {
    const patterns = {
      techno: [
        { note: 36, velocity: 100, beat: 0 }, // Kick
        { note: 38, velocity: 80, beat: 1 },  // Snare
        { note: 42, velocity: 60, beat: 2 },  // Closed Hi-Hat
        { note: 42, velocity: 60, beat: 3 }   // Closed Hi-Hat
      ],
      house: [
        { note: 36, velocity: 90, beat: 0 },  // Kick
        { note: 38, velocity: 85, beat: 2 },  // Snare
        { note: 42, velocity: 70, beat: 1 },  // Hi-Hat
        { note: 42, velocity: 70, beat: 3 }   // Hi-Hat
      ],
      ambient: [
        { note: 36, velocity: 50, beat: 0 },  // Soft Kick
        { note: 42, velocity: 40, beat: 2 },  // Soft Hi-Hat
        { note: 49, velocity: 60, beat: 1 }   // Crash
      ]
    }
    
    return patterns[style] || patterns.techno
  }

  getNotesPerSection(trackType, section) {
    const patterns = {
      lead: 8,
      bass: 4,
      pad: 2,
      arp: 16,
      fx: 6
    }
    
    return patterns[trackType] || 4
  }

  getOctaveForTrack(trackType, sectionIndex) {
    const octaves = {
      lead: 5,
      bass: 3,
      pad: 4,
      arp: 6,
      fx: 5
    }
    
    return octaves[trackType] || 4
  }

  getNoteDuration(trackType, section) {
    const durations = {
      lead: 480,   // Half note
      bass: 960,   // Whole note
      pad: 1920,   // 2 whole notes
      arp: 240,    // Quarter note
      fx: 720      // Dotted half note
    }
    
    return durations[trackType] || 480
  }

  createMIDIEvent(time, status, data1, data2) {
    return [...this.encodeVariableLength(time), status, data1, data2]
  }

  createMPEEvent(time, status, channel, value) {
    return [...this.encodeVariableLength(time), status | channel, value]
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

  createTrackBuffer(events, channel, name) {
    const data = [0x4D, 0x54, 0x72, 0x6B] // MTrk
    
    // Track Name
    data.push(0x00, 0xFF, 0x03, name.length)
    data.push(...Buffer.from(name, 'utf8'))
    
    // Events - nur Arrays verarbeiten
    events.forEach(event => {
      if (Array.isArray(event)) {
        data.push(...event)
      } else {
        console.warn('⚠️ Nicht-Array Event übersprungen:', event)
      }
    })
    
    // End of Track
    data.push(0x00, 0xFF, 0x2F, 0x00)
    
    // Track Length
    const length = data.length - 8
    data.splice(4, 4, 
      (length >> 24) & 0xFF,
      (length >> 16) & 0xFF,
      (length >> 8) & 0xFF,
      length & 0xFF
    )
    
    return Buffer.from(data)
  }

  getScaleNotes(key, scale) {
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10]
    }
    const keyNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const keyIndex = keyNotes.indexOf(key.toUpperCase())
    const scalePattern = scales[scale] || scales.major
    return scalePattern.map(interval => keyNotes[(keyIndex + interval) % 12])
  }

  getSectionLength(section, style) {
    const lengths = {
      'Intro': 8, 'Verse': 16, 'Chorus': 16, 'Bridge': 8, 'Outro': 8
    }
    return lengths[section] || 8
  }

  noteToMIDI(noteName, octave) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteIndex = noteNames.indexOf(noteName.toUpperCase())
    return noteIndex + (octave * 12)
  }

  saveMIDI(midiData, filename, outputPath) {
    const filePath = join(outputPath, filename)
    writeFileSync(filePath, midiData)
    console.log('💾 MPE MIDI-Datei gespeichert:', filePath)
  }
}

export default MPEMIDIGenerator 