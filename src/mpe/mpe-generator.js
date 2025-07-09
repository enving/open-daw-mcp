#!/usr/bin/env node

/**
 * MPE Generator für LLM-Integration
 * Generiert expressive MIDI-Daten basierend auf LLM-Beschreibungen
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

class MPEGenerator {
  constructor() {
    this.mpeData = []
  }

  /**
   * Generiert Tame Impala Style MPE-Daten
   */
  generateTameImpalaStyle() {
    console.log('🎵 Generiere Tame Impala Style MPE-Daten...')
    
    const mpeSequence = []
    const notes = [60, 64, 67, 71, 72, 76, 79, 83] // C, E, G, B, C, E, G, B
    
    // Intro-Sektion
    for (let i = 0; i < 8; i++) {
      const note = notes[Math.floor(Math.random() * notes.length)]
      const velocity = Math.floor(Math.random() * 30) + 60 // 60-90
      const pressure = Math.floor(Math.random() * 64) + 32 // 32-96
      const timbre = Math.floor(Math.random() * 64) + 16 // 16-80
      const pitchBend = Math.floor(Math.random() * 400) - 200 // -200 bis 200
      
      mpeSequence.push({
        type: 'note',
        channel: 1,
        note: note,
        velocity: velocity,
        pressure: pressure,
        timbre: timbre,
        pitch_bend: pitchBend,
        duration: Math.random() * 0.5 + 0.3 // 0.3-0.8 Sekunden
      })
      
      // Modulations-CC
      if (Math.random() > 0.7) {
        mpeSequence.push({
          type: 'cc',
          channel: 1,
          controller: 1, // Modulation
          value: Math.floor(Math.random() * 80) + 16 // 16-96
        })
      }
    }
    
    return mpeSequence
  }

  /**
   * Generiert Ambient Style MPE-Daten
   */
  generateAmbientStyle() {
    console.log('🌊 Generiere Ambient Style MPE-Daten...')
    
    const mpeSequence = []
    const notes = [48, 52, 55, 60, 64, 67, 72, 76] // Bass bis Mid
    
    for (let i = 0; i < 6; i++) {
      const note = notes[Math.floor(Math.random() * notes.length)]
      const velocity = Math.floor(Math.random() * 30) + 40 // 40-70 (leiser)
      const pressure = Math.floor(Math.random() * 48) + 16 // 16-64 (subtiler)
      const timbre = Math.floor(Math.random() * 40) + 8 // 8-48 (weniger Timbre)
      const pitchBend = Math.floor(Math.random() * 100) - 50 // -50 bis 50 (weniger Pitch Bend)
      
      mpeSequence.push({
        type: 'note',
        channel: 1,
        note: note,
        velocity: velocity,
        pressure: pressure,
        timbre: timbre,
        pitch_bend: pitchBend,
        duration: Math.random() * 1.5 + 1.0 // 1.0-2.5 Sekunden (längere Noten)
      })
    }
    
    return mpeSequence
  }

  /**
   * Generiert Techno Style MPE-Daten
   */
  generateTechnoStyle() {
    console.log('🔊 Generiere Techno Style MPE-Daten...')
    
    const mpeSequence = []
    const notes = [60, 64, 67, 72, 76, 79] // Mid-Range
    
    for (let i = 0; i < 16; i++) { // Mehr Events für Rhythmus
      const note = notes[Math.floor(Math.random() * notes.length)]
      const velocity = Math.floor(Math.random() * 30) + 70 // 70-100 (lauter)
      const pressure = Math.floor(Math.random() * 48) + 48 // 48-96 (stärkerer Aftertouch)
      const timbre = Math.floor(Math.random() * 64) + 32 // 32-96 (mehr Timbre)
      const pitchBend = Math.floor(Math.random() * 200) - 100
      
      mpeSequence.push({
        type: 'note',
        channel: 1,
        note: note,
        velocity: velocity,
        pressure: pressure,
        timbre: timbre,
        pitch_bend: pitchBend,
        duration: Math.random() * 0.4 + 0.2 // 0.2-0.6 Sekunden (kürzere Noten)
      })
      
      // Häufige Modulations-CC
      if (Math.random() > 0.5) {
        mpeSequence.push({
          type: 'cc',
          channel: 1,
          controller: 1, // Modulation
          value: Math.floor(Math.random() * 64) + 32 // 32-96
        })
      }
    }
    
    return mpeSequence
  }

  /**
   * Generiert MPE-Daten basierend auf LLM-Beschreibung
   */
  generateFromDescription(description) {
    const descriptionLower = description.toLowerCase()
    
    if (descriptionLower.includes('tame impala') || descriptionLower.includes('psychedelic')) {
      return this.generateTameImpalaStyle()
    } else if (descriptionLower.includes('ambient') || descriptionLower.includes('atmospheric')) {
      return this.generateAmbientStyle()
    } else if (descriptionLower.includes('techno') || descriptionLower.includes('electronic')) {
      return this.generateTechnoStyle()
    } else {
      // Default: Tame Impala Style
      return this.generateTameImpalaStyle()
    }
  }

  /**
   * Speichert MPE-Daten als JSON
   */
  saveMPEData(mpeData, filename = 'mpe_data.json') {
    const outputPath = join(process.cwd(), 'output', filename)
    writeFileSync(outputPath, JSON.stringify(mpeData, null, 2))
    console.log(`✅ MPE-Daten gespeichert: ${outputPath}`)
    return outputPath
  }
}

export default MPEGenerator 