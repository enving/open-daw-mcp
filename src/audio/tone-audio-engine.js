import * as Tone from 'tone'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Web Audio API Polyfill für Node.js
import 'web-audio-api'

class ToneAudioEngine {
  constructor() {
    this.isInitialized = false
    this.synths = {}
    this.effects = {}
    this.currentBpm = 120
  }

  // Tone.js initialisieren
  async initialize() {
    if (this.isInitialized) return
    
    console.error('🎵 Initialisiere Tone.js Audio Engine...')
    
    try {
      // Audio Context starten
      await Tone.start()
      
      // Transport konfigurieren
      if (Tone.Transport && Tone.Transport.bpm) {
        Tone.Transport.bpm.value = this.currentBpm
      }
      
      // Basis-Effekte erstellen
      this.createEffects()
      
      this.isInitialized = true
      console.error('✅ Tone.js Audio Engine initialisiert')
    } catch (error) {
      console.error('❌ Fehler bei Tone.js Initialisierung:', error)
      throw error
    }
  }

  // Effekte erstellen
  createEffects() {
    try {
      this.effects = {
        reverb: new Tone.Reverb({
          decay: 2,
          wet: 0.3
        }),
        delay: new Tone.FeedbackDelay({
          delayTime: '8n',
          feedback: 0.3,
          wet: 0.2
        }),
        filter: new Tone.AutoFilter({
          frequency: '4n',
          depth: 0.6,
          baseFrequency: 200,
          octaves: 2.6
        }),
        distortion: new Tone.Distortion({
          distortion: 0.8,
          wet: 0.1
        }),
        chorus: new Tone.Chorus({
          frequency: 1.5,
          delayTime: 3.5,
          depth: 0.7,
          wet: 0.2
        })
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Effekte:', error)
      // Fallback: Einfache Effekte
      this.effects = {}
    }
  }

  // Synthesizer erstellen
  createSynth(type, options = {}) {
    const synthId = `${type}_${Date.now()}`
    
    let synth
    
    try {
      switch (type) {
        case 'analog':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'sawtooth'
            },
            envelope: {
              attack: 0.1,
              decay: 0.2,
              sustain: 0.4,
              release: 0.8
            },
            filterEnvelope: {
              attack: 0.005,
              decay: 0.1,
              sustain: 0.3,
              release: 0.1,
              baseFrequency: 200,
              octaves: 2.6
            }
          }).toDestination()
          break
          
        case 'fm':
          synth = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.4,
              release: 0.8
            },
            modulationEnvelope: {
              attack: 0.2,
              decay: 0.01,
              sustain: 1,
              release: 0.2
            }
          }).toDestination()
          break
          
        case 'poly':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'triangle'
            },
            envelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.3,
              release: 1
            }
          }).toDestination()
          break
          
        case 'bass':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'square'
            },
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.4,
              release: 0.8
            },
            filterEnvelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0.3,
              release: 0.5,
              baseFrequency: 100,
              octaves: 2.6
            }
          }).toDestination()
          break
          
        case 'pad':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 2,
              decay: 0.5,
              sustain: 0.8,
              release: 4
            }
          }).toDestination()
          break
          
        case 'lead':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'sawtooth'
            },
            envelope: {
              attack: 0.005,
              decay: 0.1,
              sustain: 0.3,
              release: 0.1
            },
            filterEnvelope: {
              attack: 0.005,
              decay: 0.1,
              sustain: 0.3,
              release: 0.1,
              baseFrequency: 800,
              octaves: 2.6
            }
          }).toDestination()
          break
          
        default:
          synth = new Tone.Synth().toDestination()
      }
      
      // Effekte anwenden
      if (options.effects) {
        this.applyEffects(synth, options.effects)
      }
      
      this.synths[synthId] = synth
      return synthId
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Synthesizers:', error)
      // Fallback: Einfacher Synth
      const fallbackSynth = new Tone.Synth().toDestination()
      this.synths[synthId] = fallbackSynth
      return synthId
    }
  }

  // Effekte auf Synthesizer anwenden
  applyEffects(synth, effects) {
    try {
      effects.forEach(effectName => {
        if (this.effects[effectName]) {
          synth.chain(this.effects[effectName], Tone.Destination)
        }
      })
    } catch (error) {
      console.error('❌ Fehler beim Anwenden der Effekte:', error)
    }
  }

  // Akkorde generieren
  generateChords(key, scale, progression) {
    const chords = {
      'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
      'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
      'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
      'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
      'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
      'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'],
      'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
      'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
      'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
      'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
      'Db': ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim']
    }
    
    const keyChords = chords[key] || chords['C']
    return progression.map(degree => keyChords[degree - 1])
  }

  // Melodie aus Skala generieren
  generateMelody(key, scale, length = 8) {
    const scales = {
      'major': [0, 2, 4, 5, 7, 9, 11],
      'minor': [0, 2, 3, 5, 7, 8, 10],
      'pentatonic': [0, 2, 4, 7, 9],
      'blues': [0, 3, 5, 6, 7, 10]
    }
    
    const scaleType = scales[scale] || scales['major']
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const keyIndex = notes.indexOf(key)
    
    const melody = []
    for (let i = 0; i < length; i++) {
      const scaleDegree = scaleType[i % scaleType.length]
      const noteIndex = (keyIndex + scaleDegree) % 12
      const octave = Math.floor(i / 7) + 4
      melody.push(notes[noteIndex] + octave)
    }
    
    return melody
  }

  // Einfache Audio-Generierung (Fallback)
  async createSimpleAudio(pattern, style, outputPath) {
    console.error('🎵 Erstelle einfache Audio mit Tone.js...')
    
    try {
      // BPM setzen
      if (Tone.Transport && Tone.Transport.bpm) {
        Tone.Transport.bpm.value = pattern.bpm
      }
      
      // Einfache Synths erstellen
      const bassSynth = this.createSynth('bass')
      const leadSynth = this.createSynth('lead')
      
      // Akkord-Progression generieren
      const chords = this.generateChords(pattern.key, pattern.scale, [1, 4, 5, 1])
      
      // Melodie generieren
      const melody = this.generateMelody(pattern.key, pattern.scale, 8)
      
      // Einfache Sequenz erstellen
      const duration = 8 // 8 Sekunden
      
      // Bass spielen
      chords.forEach((chord, index) => {
        const time = index * 2
        this.synths[bassSynth].triggerAttackRelease(chord + '2', '2n', `+${time}`)
      })
      
      // Melodie spielen
      melody.forEach((note, index) => {
        const time = index * 0.5
        this.synths[leadSynth].triggerAttackRelease(note, '4n', `+${time}`)
      })
      
      // Transport starten
      if (Tone.Transport) {
        Tone.Transport.start()
      }
      
      // Warten und dann stoppen
      setTimeout(() => {
        if (Tone.Transport) {
          Tone.Transport.stop()
        }
        console.error('✅ Audio-Generierung abgeschlossen')
      }, duration * 1000)
      
      return outputPath
    } catch (error) {
      console.error('❌ Fehler bei Audio-Generierung:', error)
      throw error
    }
  }

  // Song erstellen (vereinfachte Version)
  async createSong(pattern, style, outputPath) {
    await this.initialize()
    
    try {
      return await this.createSimpleAudio(pattern, style, outputPath)
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Songs:', error)
      // Fallback: Einfache WAV-Datei erstellen
      this.createFallbackAudio(outputPath, style, pattern)
      return outputPath
    }
  }

  // Fallback: Einfache WAV-Datei
  createFallbackAudio(outputPath, style = 'techno', pattern = { bpm: 120, key: 'C', scale: 'major' }) {
    console.error('🎵 Erstelle erweiterte Fallback-Audio...')
    
    // Sicherheitscheck und Normalisierung der Parameter
    const safeStyle = style || 'techno'
    const safePattern = {
      bpm: pattern?.bpm || 120,
      key: pattern?.key || 'C',
      scale: pattern?.scale || 'major'
    }
    
    console.error('📋 Audio-Parameter:', { style: safeStyle, pattern: safePattern })
    
    // Stil-spezifische Audio-Parameter
    const styleConfig = this.getStyleAudioConfig(safeStyle)
    
    // Einfache WAV-Datei mit verschiedenen Wellenformen
    const sampleRate = 44100
    const duration = 8 // 8 Sekunden
    const samples = sampleRate * duration
    const channels = 2
    
    const audioBuffer = Buffer.alloc(samples * channels * 2) // 16-bit
    
    // Akkord-Progression generieren
    const chords = this.generateChords(safePattern.key, safePattern.scale, [1, 4, 5, 1])
    const melody = this.generateMelody(safePattern.key, safePattern.scale, 16)
    
    // Sicherheitscheck für Akkorde und Melodie
    if (!chords || chords.length === 0) {
      console.error('⚠️ Keine Akkorde generiert - verwende Fallback')
      chords = ['C', 'F', 'G', 'C']
    }
    
    if (!melody || melody.length === 0) {
      console.error('⚠️ Keine Melodie generiert - verwende Fallback')
      melody = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    }
    
    for (let i = 0; i < samples; i++) {
      const time = i / sampleRate
      const beat = time * (safePattern.bpm / 60)
      
      // Bass-Line (tiefe Frequenzen)
      const chordIndex = Math.floor(beat / 2) % chords.length
      const bassFreq = this.getChordRoot(chords[chordIndex])
      const bassSample = this.generateWaveform(bassFreq, time, styleConfig.bass.waveform) * 0.2
      
      // Melodie (mittlere Frequenzen)
      const melodyIndex = Math.floor(beat * 2) % melody.length
      const melodyNote = melody[melodyIndex]
      const melodyFreq = this.noteToFrequency(melodyNote)
      const melodySample = this.generateWaveform(melodyFreq, time, styleConfig.lead.waveform) * 0.15
      
      // Pad (hohe Frequenzen, langsam)
      const padChordIndex = Math.floor(beat / 4) % chords.length
      const padFreq = this.getChordRoot(chords[padChordIndex]) * 2
      const padSample = this.generateWaveform(padFreq, time, styleConfig.pad.waveform) * 0.1
      
      // Effekte anwenden
      const reverbSample = this.applyReverb(bassSample + melodySample + padSample, time, styleConfig.reverb)
      const delaySample = this.applyDelay(bassSample + melodySample + padSample, time, styleConfig.delay)
      
      // Finaler Sample
      const finalSample = (reverbSample + delaySample) * styleConfig.masterVolume
      const pcmValue = Math.round(Math.max(-32767, Math.min(32767, finalSample * 32767)))
      
      for (let ch = 0; ch < channels; ch++) {
        const offset = (i * channels + ch) * 2
        audioBuffer.writeInt16LE(pcmValue, offset)
      }
    }
    
    // WAV-Header erstellen
    const wavHeader = this.createWAVHeader(audioBuffer.length, { sampleRate, bitDepth: 16, channels })
    const wavData = Buffer.concat([wavHeader, audioBuffer])
    
    writeFileSync(outputPath, wavData)
    console.error('💾 Erweiterte Fallback-Audio gespeichert:', outputPath)
  }

  // Stil-spezifische Audio-Konfiguration
  getStyleAudioConfig(style) {
    const configs = {
      techno: {
        bass: { waveform: 'square', frequency: 100 },
        lead: { waveform: 'sawtooth', frequency: 400 },
        pad: { waveform: 'sine', frequency: 200 },
        reverb: { decay: 0.5, wet: 0.2 },
        delay: { time: 0.25, feedback: 0.3, wet: 0.3 },
        masterVolume: 0.8
      },
      house: {
        bass: { waveform: 'sine', frequency: 120 },
        lead: { waveform: 'triangle', frequency: 300 },
        pad: { waveform: 'sine', frequency: 150 },
        reverb: { decay: 1.0, wet: 0.3 },
        delay: { time: 0.5, feedback: 0.2, wet: 0.2 },
        masterVolume: 0.7
      },
      ambient: {
        bass: { waveform: 'sine', frequency: 80 },
        lead: { waveform: 'sine', frequency: 200 },
        pad: { waveform: 'sine', frequency: 100 },
        reverb: { decay: 3.0, wet: 0.6 },
        delay: { time: 1.0, feedback: 0.4, wet: 0.4 },
        masterVolume: 0.6
      },
      trance: {
        bass: { waveform: 'square', frequency: 110 },
        lead: { waveform: 'sawtooth', frequency: 500 },
        pad: { waveform: 'sine', frequency: 250 },
        reverb: { decay: 1.5, wet: 0.4 },
        delay: { time: 0.75, feedback: 0.5, wet: 0.5 },
        masterVolume: 0.8
      },
      psychedelic_rock: {
        bass: { waveform: 'sawtooth', frequency: 90 },
        lead: { waveform: 'sawtooth', frequency: 350 },
        pad: { waveform: 'sine', frequency: 180 },
        reverb: { decay: 2.5, wet: 0.7 },
        delay: { time: 0.6, feedback: 0.6, wet: 0.6 },
        masterVolume: 0.7
      }
    }
    
    return configs[style] || configs.techno
  }

  // Wellenformen generieren
  generateWaveform(frequency, time, type) {
    const phase = 2 * Math.PI * frequency * time
    
    switch (type) {
      case 'sine':
        return Math.sin(phase)
      case 'square':
        return Math.sin(phase) > 0 ? 1 : -1
      case 'sawtooth':
        return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))
      case 'triangle':
        return 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1
      default:
        return Math.sin(phase)
    }
  }

  // Akkord-Root-Note extrahieren
  getChordRoot(chord) {
    // Sicherheitscheck für undefined/null Werte
    if (!chord || typeof chord !== 'string') {
      console.error('⚠️ Ungültiger Akkord:', chord, '- verwende Fallback C')
      return 261.63 // C4 Frequenz als Fallback
    }
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const root = chord.replace(/[^A-Z#]/g, '')
    const noteIndex = notes.indexOf(root)
    
    // Fallback wenn Note nicht gefunden
    if (noteIndex === -1) {
      console.error('⚠️ Unbekannte Note:', root, '- verwende Fallback C')
      return 261.63 // C4 Frequenz als Fallback
    }
    
    return 220 * Math.pow(2, noteIndex / 12) // A4 = 220Hz als Referenz
  }

  // Note zu Frequenz konvertieren
  noteToFrequency(note) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteName = note.slice(0, -1)
    const octave = parseInt(note.slice(-1))
    const noteIndex = notes.indexOf(noteName)
    return 220 * Math.pow(2, (noteIndex + (octave - 4) * 12) / 12)
  }

  // Reverb-Effekt simulieren
  applyReverb(sample, time, config) {
    const decay = Math.exp(-time / config.decay)
    const reverb = sample * decay * config.wet
    return sample * (1 - config.wet) + reverb
  }

  // Delay-Effekt simulieren
  applyDelay(sample, time, config) {
    const delayTime = config.time
    const feedback = config.feedback
    const delaySample = sample * Math.sin(time / delayTime) * feedback * config.wet
    return sample * (1 - config.wet) + delaySample
  }

  createWAVHeader(dataLength, settings) {
    const header = Buffer.alloc(44)
    
    // RIFF Header
    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataLength, 4)
    header.write('WAVE', 8)
    
    // fmt Chunk
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(1, 20)
    header.writeUInt16LE(settings.channels, 22)
    header.writeUInt32LE(settings.sampleRate, 24)
    header.writeUInt32LE(settings.sampleRate * settings.channels * (settings.bitDepth / 8), 28)
    header.writeUInt16LE(settings.channels * (settings.bitDepth / 8), 32)
    header.writeUInt16LE(settings.bitDepth, 34)
    
    // data Chunk
    header.write('data', 36)
    header.writeUInt32LE(dataLength, 40)
    
    return header
  }

  // Stil-spezifische Presets
  getStylePreset(style) {
    const presets = {
      techno: {
        bass: { type: 'bass', effects: ['filter', 'distortion'] },
        lead: { type: 'analog', effects: ['delay'] },
        pad: { type: 'pad', effects: ['reverb'] }
      },
      house: {
        bass: { type: 'bass', effects: ['filter'] },
        lead: { type: 'poly', effects: ['reverb'] },
        pad: { type: 'pad', effects: ['chorus'] }
      },
      ambient: {
        bass: { type: 'bass', effects: ['filter'] },
        lead: { type: 'pad', effects: ['reverb', 'delay'] },
        pad: { type: 'pad', effects: ['reverb', 'chorus'] }
      },
      trance: {
        bass: { type: 'bass', effects: ['filter'] },
        lead: { type: 'lead', effects: ['delay', 'reverb'] },
        pad: { type: 'pad', effects: ['reverb'] }
      },
      psychedelic_rock: {
        bass: { type: 'bass', effects: ['filter', 'distortion'] },
        lead: { type: 'analog', effects: ['reverb', 'delay'] },
        pad: { type: 'pad', effects: ['reverb', 'chorus'] }
      }
    }
    
    return presets[style] || presets.techno
  }

  // Cleanup
  dispose() {
    try {
      Object.values(this.synths).forEach(synth => synth.dispose())
      Object.values(this.effects).forEach(effect => effect.dispose())
      this.synths = {}
      this.effects = {}
      this.isInitialized = false
    } catch (error) {
      console.error('❌ Fehler beim Cleanup:', error)
    }
  }
}

export default ToneAudioEngine 