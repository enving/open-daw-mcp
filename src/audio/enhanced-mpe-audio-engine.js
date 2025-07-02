import { writeFileSync } from 'fs'
import { join } from 'path'
import MPEMIDIGenerator from './mpe-midi-generator.js'
import MPESynthEngine from './mpe-synth-engine.js'
import MPEPresetGenerator from './mpe-preset-generator.js'

class EnhancedMPEAudioEngine {
  constructor() {
    this.midiGenerator = new MPEMIDIGenerator()
    this.synthEngine = new MPESynthEngine()
    this.presetGenerator = new MPEPresetGenerator()
  }

  async createMPESong(songData, outputPath) {
    console.log('🎵 Erstelle erweiterte MPE Audio für:', songData.title)
    
    try {
      // 1. Generiere individuelle MPE MIDI-Daten
      console.log('📝 Schritt 1: Generiere individuelle MPE MIDI-Daten...')
      const mpeMidiData = this.midiGenerator.generateMPEMIDI(songData)
      
      // 2. Generiere Presets für die Sound-Engine
      console.log('🎛️ Schritt 2: Generiere Presets für Sound-Engine...')
      const presets = await this.presetGenerator.generateMPEPresets(songData)
      
      // 3. Initialisiere Synth-Engine
      console.log('🔧 Schritt 3: Initialisiere Synth-Engine...')
      const synthInitialized = await this.synthEngine.initialize()
      
      if (!synthInitialized) {
        console.log('⚠️ Kein MPE-Synth verfügbar, verwende Fallback')
        return await this.createFallbackAudio(songData, outputPath)
      }
      
      // 4. Wende Presets auf Synth an
      console.log('🎛️ Schritt 4: Wende Presets auf Synth an...')
      this.applyPresetsToSynth(presets)
      
      // 5. Erstelle Audio mit MPE-Daten und Presets
      console.log('🎵 Schritt 5: Erstelle Audio mit MPE-Daten...')
      const audioResult = await this.synthEngine.createMPEAudio(
        mpeMidiData, 
        songData, 
        outputPath
      )
      
      // 6. Speichere MIDI-Datei
      const midiFilename = `song_${Date.now()}.mid`
      this.midiGenerator.saveMIDI(mpeMidiData, midiFilename, outputPath)
      
      console.log('✅ Erweiterte MPE Audio erfolgreich erstellt!')
      
      return {
        success: true,
        midi: midiFilename,
        audio: audioResult.outputPath || 'generated_audio.wav',
        presets: presets,
        message: `MPE Song "${songData.title}" erfolgreich erstellt!`
      }
      
    } catch (error) {
      console.log('❌ Fehler bei erweiterter MPE Audio-Erstellung:', error.message)
      return await this.createFallbackAudio(songData, outputPath)
    }
  }

  applyPresetsToSynth(presets) {
    console.log('🎛️ Wende Presets auf Synth-Engine an...')
    
    // Wende Lead-Preset an
    if (presets.lead) {
      this.presetGenerator.applyPresetToSynth(
        this.synthEngine.getLeadSynth(), 
        presets.lead
      )
    }
    
    // Wende Bass-Preset an
    if (presets.bass) {
      this.presetGenerator.applyPresetToSynth(
        this.synthEngine.getBassSynth(), 
        presets.bass
      )
    }
    
    // Wende Pad-Preset an
    if (presets.pad) {
      this.presetGenerator.applyPresetToSynth(
        this.synthEngine.getPadSynth(), 
        presets.pad
      )
    }
  }

  async createFallbackAudio(songData, outputPath) {
    console.log('🔄 Erstelle Fallback-Audio...')
    
    // Einfache synthetische Audio-Erstellung
    const audioData = this.createSyntheticAudio(songData)
    const audioFilename = `song_${Date.now()}.wav`
    const audioPath = join(outputPath, audioFilename)
    
    writeFileSync(audioPath, audioData)
    
    return {
      success: true,
      audio: audioFilename,
      message: `Fallback Audio für "${songData.title}" erstellt`
    }
  }

  createSyntheticAudio(songData) {
    // Erstelle einfache synthetische Audio-Daten
    const sampleRate = 44100
    const duration = 30 // 30 Sekunden
    const samples = sampleRate * duration
    
    const audioBuffer = new ArrayBuffer(samples * 2) // 16-bit
    const view = new DataView(audioBuffer)
    
    const frequency = this.getBaseFrequency(songData.key)
    const amplitude = 0.3
    
    for (let i = 0; i < samples; i++) {
      const time = i / sampleRate
      const value = Math.sin(2 * Math.PI * frequency * time) * amplitude
      const sample = Math.floor(value * 32767)
      view.setInt16(i * 2, sample, true) // Little-endian
    }
    
    return Buffer.from(audioBuffer)
  }

  getBaseFrequency(key) {
    const frequencies = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    }
    return frequencies[key.toUpperCase()] || 440.00
  }

  async createIndividualMPEData(songData) {
    console.log('🎼 Erstelle individuelle MPE-Daten für:', songData.title)
    
    // Erweitere die MIDI-Generierung um individuelle MPE-Parameter
    const mpeData = {
      pressure: this.generatePressureData(songData),
      timbre: this.generateTimbreData(songData),
      slide: this.generateSlideData(songData),
      expression: this.generateExpressionData(songData)
    }
    
    return mpeData
  }

  generatePressureData(songData) {
    const pressurePatterns = {
      'psychedelic_rock': [0.3, 0.7, 0.5, 0.9, 0.2, 0.8],
      'techno': [0.8, 0.4, 0.9, 0.3, 0.7, 0.5],
      'ambient': [0.2, 0.4, 0.3, 0.6, 0.1, 0.5]
    }
    
    const pattern = pressurePatterns[songData.style] || pressurePatterns.psychedelic_rock
    return pattern.map(p => Math.floor(p * 127))
  }

  generateTimbreData(songData) {
    const timbrePatterns = {
      'psychedelic_rock': [0.4, 0.8, 0.6, 0.9, 0.3, 0.7],
      'techno': [0.7, 0.3, 0.8, 0.2, 0.6, 0.4],
      'ambient': [0.3, 0.5, 0.4, 0.7, 0.2, 0.6]
    }
    
    const pattern = timbrePatterns[songData.style] || timbrePatterns.psychedelic_rock
    return pattern.map(t => Math.floor(t * 127))
  }

  generateSlideData(songData) {
    const slidePatterns = {
      'psychedelic_rock': [0, 2, -1, 3, -2, 1],
      'techno': [0, 1, -1, 2, -1, 0],
      'ambient': [0, 1, 0, -1, 1, 0]
    }
    
    const pattern = slidePatterns[songData.style] || slidePatterns.psychedelic_rock
    return pattern.map(s => Math.max(-12, Math.min(12, s)))
  }

  generateExpressionData(songData) {
    const expressionPatterns = {
      'psychedelic_rock': [0.6, 0.9, 0.4, 0.8, 0.5, 0.7],
      'techno': [0.8, 0.5, 0.9, 0.4, 0.7, 0.6],
      'ambient': [0.4, 0.6, 0.5, 0.7, 0.3, 0.6]
    }
    
    const pattern = expressionPatterns[songData.style] || expressionPatterns.psychedelic_rock
    return pattern.map(e => Math.floor(e * 127))
  }
}

export default EnhancedMPEAudioEngine 