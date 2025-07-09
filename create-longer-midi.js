#!/usr/bin/env node

import { writeFileSync, statSync } from 'fs'
import { join } from 'path'

function createLongerMIDIFile() {
  console.log('🎼 Erstelle längere MIDI-Datei...')
  
  // Längere MIDI-Datei mit mehr Noten
  const midiData = {
    header: {
      format: 1,
      tracks: 1,
      timeDivision: 480
    },
    tracks: [
      {
        name: 'Long Test Track',
        notes: [
          // C-Dur Tonleiter (länger)
          { time: 0, duration: 960, note: 60, velocity: 100 }, // C4
          { time: 960, duration: 960, note: 62, velocity: 100 }, // D4
          { time: 1920, duration: 960, note: 64, velocity: 100 }, // E4
          { time: 2880, duration: 960, note: 65, velocity: 100 }, // F4
          { time: 3840, duration: 960, note: 67, velocity: 100 }, // G4
          { time: 4800, duration: 960, note: 69, velocity: 100 }, // A4
          { time: 5760, duration: 960, note: 71, velocity: 100 }, // B4
          { time: 6720, duration: 960, note: 72, velocity: 100 }, // C5
          { time: 7680, duration: 960, note: 71, velocity: 100 }, // B4
          { time: 8640, duration: 960, note: 69, velocity: 100 }, // A4
          { time: 9600, duration: 960, note: 67, velocity: 100 }, // G4
          { time: 10560, duration: 960, note: 65, velocity: 100 }, // F4
          { time: 11520, duration: 960, note: 64, velocity: 100 }, // E4
          { time: 12480, duration: 960, note: 62, velocity: 100 }, // D4
          { time: 13440, duration: 960, note: 60, velocity: 100 }  // C4
        ]
      }
    ]
  }
  
  // Konvertiere zu MIDI-Bytes
  const midiBytes = createMIDIBytes(midiData)
  
  // Speichere MIDI-Datei
  const filename = `long_test_midi_${Date.now()}.mid`
  const filepath = join(process.cwd(), 'output', filename)
  
  writeFileSync(filepath, Buffer.from(midiBytes))
  
  console.log('✅ Längere MIDI-Datei erstellt:', filepath)
  return { filename, filepath }
}

function createMIDIBytes(midiData) {
  const bytes = []
  
  // MIDI Header (MThd)
  bytes.push(...stringToBytes('MThd'))
  bytes.push(0, 0, 0, 6) // Header length
  bytes.push(0, 1) // Format 1
  bytes.push(0, 1) // 1 track
  bytes.push(0, 0x60) // Time division (480 ticks per quarter note)
  
  // Track 1
  bytes.push(...stringToBytes('MTrk'))
  
  const trackBytes = []
  
  // Track name
  trackBytes.push(0, 0xFF, 0x03, 0x0F) // Meta event: track name
  trackBytes.push(...stringToBytes('Long Test Track'))
  
  // Instrument (Piano)
  trackBytes.push(0, 0xC0, 0x00) // Program change: Piano
  
  // Notes
  let currentTime = 0
  for (const note of midiData.tracks[0].notes) {
    // Note on
    const deltaTime = note.time - currentTime
    trackBytes.push(...encodeVariableLength(deltaTime))
    trackBytes.push(0x90, note.note, note.velocity) // Note on
    
    // Note off
    trackBytes.push(...encodeVariableLength(note.duration))
    trackBytes.push(0x80, note.note, 0) // Note off
    
    currentTime = note.time + note.duration
  }
  
  // End of track
  trackBytes.push(0, 0xFF, 0x2F, 0x00)
  
  // Track length
  const trackLength = trackBytes.length
  bytes.push((trackLength >> 24) & 0xFF)
  bytes.push((trackLength >> 16) & 0xFF)
  bytes.push((trackLength >> 8) & 0xFF)
  bytes.push(trackLength & 0xFF)
  
  // Track data
  bytes.push(...trackBytes)
  
  return bytes
}

function stringToBytes(str) {
  return Array.from(str).map(char => char.charCodeAt(0))
}

function encodeVariableLength(value) {
  const bytes = []
  let v = value
  
  if (v === 0) {
    bytes.push(0)
  } else {
    while (v > 0) {
      bytes.unshift(v & 0x7F)
      v >>= 7
      if (v > 0) {
        bytes[0] |= 0x80
      }
    }
  }
  
  return bytes
}

// Erstelle längere MIDI-Datei
const result = createLongerMIDIFile()
console.log('🎵 Längere MIDI-Datei erfolgreich erstellt!')
console.log('📁 Datei:', result.filepath)
console.log('📊 Größe:', statSync(result.filepath).size, 'bytes') 