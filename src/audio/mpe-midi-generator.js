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
      fx: 5
    }
  }

  generateMPEMIDI(songData) {
    console.log('🎼 Generiere MPE MIDI 2.0 für:', songData.title)
    
    const midiHeader = this.createMIDI2Header()
    const tempoTrack = this.createTempoTrack(songData.tempo)
    const mpeTracks = this.createMPETracks(songData)
    
    return Buffer.concat([midiHeader, tempoTrack, ...mpeTracks])
  }

  createMIDI2Header() {
    return Buffer.from([
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x02, // Format 2 (MIDI 2.0)
      0x00, 0x06, // 6 tracks
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

  createMPETracks(songData) {
    const tracks = []
    
    // Lead Track
    tracks.push(this.createMPETrack(this.mpeChannels.lead, 'Lead', songData))
    // Bass Track  
    tracks.push(this.createMPETrack(this.mpeChannels.bass, 'Bass', songData))
    // Pad Track
    tracks.push(this.createMPETrack(this.mpeChannels.pad, 'Pad', songData))
    
    return tracks
  }

  createMPETrack(channel, name, songData) {
    const notes = this.getScaleNotes(songData.key, songData.scale)
    const events = []
    let time = 0
    
    songData.structure.forEach((section, i) => {
      const sectionLength = this.getSectionLength(section, songData.style)
      
      for (let j = 0; j < 4; j++) {
        const note = notes[j % notes.length]
        const noteNumber = this.noteToMIDI(note, 4)
        
        // MPE Note On mit Expression
        events.push(...this.createMPENoteEvent(time, 0x90, noteNumber, 80, {
          pressure: 64 + Math.sin(i * 0.5) * 20,
          timbre: 64 + Math.cos(i * 0.3) * 30
        }))
        time += 240
        
        // Note Off
        events.push(...this.createMIDIEvent(time, 0x80, noteNumber, 0))
        time += 240
      }
    })
    
    return this.createTrackBuffer(events, channel, name)
  }

  createMPENoteEvent(time, status, note, velocity, mpeData) {
    const events = []
    events.push(...this.createMIDIEvent(time, status, note, velocity))
    
    if (mpeData.pressure) {
      events.push(...this.createMPEEvent(0, 0xD0, 1, mpeData.pressure))
    }
    if (mpeData.timbre) {
      events.push(...this.createMPEEvent(0, 0xE0, 1, mpeData.timbre))
    }
    
    return events
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
    
    // Events
    events.forEach(event => data.push(...event))
    
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