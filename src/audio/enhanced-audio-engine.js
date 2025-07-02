import * as Tone from 'tone'
import { writeFileSync } from 'fs'
import { join } from 'path'

class EnhancedAudioEngine {
  constructor() {
    this.isInitialized = false
    this.synths = {}
    this.effects = {}
    this.currentBpm = 120
    this.audioContext = null
  }

  // Tone.js initialisieren
  async initialize() {
    if (this.isInitialized) return
    
    console.log('🎵 Initialisiere Enhanced Audio Engine...')
    
    try {
      // Audio Context starten
      await Tone.start()
      
      // Transport konfigurieren
      if (Tone.Transport && Tone.Transport.bpm) {
        Tone.Transport.bpm.value = this.currentBpm
      }
      
      this.isInitialized = true
      console.log('✅ Enhanced Audio Engine initialisiert')
    } catch (error) {
      console.log('❌ Fehler bei Audio Engine Initialisierung:', error)
      throw error
    }
  }

  // Erweiterte Synthesizer-Palette
  createSynth(type, options = {}) {
    const synthId = `${type}_${Date.now()}`
    
    let synth
    
    try {
      switch (type) {
        // Tame Impala Style Synths
        case 'tame_impala_lead':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'sawtooth'
            },
            envelope: {
              attack: 0.1,
              decay: 0.3,
              sustain: 0.6,
              release: 1.2
            },
            filterEnvelope: {
              attack: 0.1,
              decay: 0.2,
              sustain: 0.4,
              release: 0.8,
              baseFrequency: 400,
              octaves: 3
            }
          })
          // Tame Impala Effekte
          synth.chain(
            new Tone.Chorus({ frequency: 2, delayTime: 3.5, depth: 0.7, wet: 0.3 }),
            new Tone.Reverb({ decay: 3, wet: 0.4 }),
            new Tone.Distortion({ distortion: 0.3, wet: 0.2 }),
            Tone.Destination
          )
          break
          
        case 'tame_impala_bass':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'square'
            },
            envelope: {
              attack: 0.05,
              decay: 0.2,
              sustain: 0.7,
              release: 0.5
            },
            filterEnvelope: {
              attack: 0.05,
              decay: 0.1,
              sustain: 0.5,
              release: 0.3,
              baseFrequency: 80,
              octaves: 2.6
            }
          })
          synth.chain(
            new Tone.Distortion({ distortion: 0.4, wet: 0.3 }),
            new Tone.Reverb({ decay: 1.5, wet: 0.2 }),
            Tone.Destination
          )
          break
          
        case 'tame_impala_pad':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 3,
              decay: 1,
              sustain: 0.8,
              release: 5
            }
          })
          synth.chain(
            new Tone.Chorus({ frequency: 1.5, delayTime: 4, depth: 0.8, wet: 0.4 }),
            new Tone.Reverb({ decay: 4, wet: 0.6 }),
            new Tone.AutoFilter({ frequency: '2n', depth: 0.3, baseFrequency: 200, octaves: 2.6 }),
            Tone.Destination
          )
          break

        // Techno Style Synths
        case 'techno_bass':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'sawtooth'
            },
            envelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0.3,
              release: 0.2
            },
            filterEnvelope: {
              attack: 0.01,
              decay: 0.05,
              sustain: 0.2,
              release: 0.1,
              baseFrequency: 60,
              octaves: 3
            }
          })
          synth.chain(
            new Tone.Distortion({ distortion: 0.8, wet: 0.4 }),
            new Tone.Filter({ frequency: 200, type: 'lowpass' }),
            Tone.Destination
          )
          break
          
        case 'techno_lead':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'square'
            },
            envelope: {
              attack: 0.005,
              decay: 0.1,
              sustain: 0.2,
              release: 0.1
            },
            filterEnvelope: {
              attack: 0.005,
              decay: 0.05,
              sustain: 0.1,
              release: 0.05,
              baseFrequency: 800,
              octaves: 2.6
            }
          })
          synth.chain(
            new Tone.Distortion({ distortion: 0.6, wet: 0.3 }),
            new Tone.Reverb({ decay: 1, wet: 0.2 }),
            Tone.Destination
          )
          break

        // Ambient Style Synths
        case 'ambient_pad':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'triangle'
            },
            envelope: {
              attack: 4,
              decay: 2,
              sustain: 0.9,
              release: 8
            }
          })
          synth.chain(
            new Tone.Reverb({ decay: 6, wet: 0.8 }),
            new Tone.Chorus({ frequency: 0.5, delayTime: 5, depth: 0.6, wet: 0.3 }),
            new Tone.AutoFilter({ frequency: '1n', depth: 0.4, baseFrequency: 100, octaves: 3 }),
            Tone.Destination
          )
          break
          
        case 'ambient_bell':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 0.1,
              decay: 0.5,
              sustain: 0.3,
              release: 3
            }
          })
          synth.chain(
            new Tone.Reverb({ decay: 4, wet: 0.7 }),
            new Tone.Chorus({ frequency: 1, delayTime: 3, depth: 0.5, wet: 0.2 }),
            Tone.Destination
          )
          break

        // House Style Synths
        case 'house_bass':
          synth = new Tone.MonoSynth({
            oscillator: {
              type: 'sawtooth'
            },
            envelope: {
              attack: 0.02,
              decay: 0.2,
              sustain: 0.5,
              release: 0.3
            },
            filterEnvelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.4,
              release: 0.2,
              baseFrequency: 100,
              octaves: 2.6
            }
          })
          synth.chain(
            new Tone.Distortion({ distortion: 0.3, wet: 0.2 }),
            new Tone.Filter({ frequency: 300, type: 'lowpass' }),
            Tone.Destination
          )
          break
          
        case 'house_piano':
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
              type: 'triangle'
            },
            envelope: {
              attack: 0.01,
              decay: 0.3,
              sustain: 0.4,
              release: 1
            }
          })
          synth.chain(
            new Tone.Reverb({ decay: 2, wet: 0.3 }),
            new Tone.Chorus({ frequency: 1.5, delayTime: 2, depth: 0.4, wet: 0.2 }),
            Tone.Destination
          )
          break

        // Default Synth
        default:
          synth = new Tone.Synth({
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 0.1,
              decay: 0.2,
              sustain: 0.3,
              release: 0.5
            }
          }).toDestination()
      }
      
      this.synths[synthId] = synth
      return synth
      
    } catch (error) {
      console.log('❌ Fehler beim Erstellen des Synthesizers:', error)
      // Fallback: Einfacher Synth
      return new Tone.Synth().toDestination()
    }
  }

  // Stil-spezifische Synth-Konfigurationen
  getStyleSynths(style) {
    const styleConfigs = {
      'psychedelic_rock': {
        lead: 'tame_impala_lead',
        bass: 'tame_impala_bass',
        pad: 'tame_impala_pad',
        drums: 'analog_drums'
      },
      'techno': {
        bass: 'techno_bass',
        lead: 'techno_lead',
        pad: 'ambient_pad',
        drums: 'electronic_drums'
      },
      'ambient': {
        pad: 'ambient_pad',
        bell: 'ambient_bell',
        drone: 'ambient_pad',
        drums: 'minimal_drums'
      },
      'house': {
        bass: 'house_bass',
        piano: 'house_piano',
        pad: 'ambient_pad',
        drums: 'house_drums'
      }
    }
    
    return styleConfigs[style] || styleConfigs['techno']
  }

  // Akkorde generieren
  generateChords(key, scale, progression) {
    const chords = {
      'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
      'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
      'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
      'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
      'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim']
    }
    
    const keyChords = chords[key] || chords['C']
    return progression.map(index => keyChords[index % keyChords.length])
  }

  // Melodie generieren
  generateMelody(key, scale, length = 8) {
    const notes = {
      'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E']
    }
    
    const keyNotes = notes[key] || notes['C']
    const melody = []
    
    for (let i = 0; i < length; i++) {
      const noteIndex = Math.floor(Math.random() * keyNotes.length)
      const octave = Math.floor(Math.random() * 2) + 4 // Oktaven 4-5
      melody.push(keyNotes[noteIndex] + octave)
    }
    
    return melody
  }

  // Song erstellen
  async createSong(songData, style, outputPath) {
    try {
      await this.initialize()
      
      console.log('🎵 Erstelle erweiterte Audio mit Enhanced Engine...')
      console.log('📋 Audio-Parameter:', { style, pattern: { bpm: songData.bpm, key: songData.key, scale: songData.scale } })
      
      const styleSynths = this.getStyleSynths(style)
      const bpm = songData.bpm || 120
      const key = songData.key || 'C'
      const scale = songData.scale || 'major'
      
      // Transport konfigurieren
      Tone.Transport.bpm.value = bpm
      
      // Synths erstellen
      const leadSynth = this.createSynth(styleSynths.lead)
      const bassSynth = this.createSynth(styleSynths.bass)
      const padSynth = this.createSynth(styleSynths.pad)
      
      // Akkord-Progression
      const chordProgression = [0, 4, 1, 5] // I-V-ii-vi
      const chords = this.generateChords(key, scale, chordProgression)
      
      // Melodie
      const melody = this.generateMelody(key, scale, 16)
      
      // Sequenzen erstellen
      const sequences = []
      
      // Bass-Linie
      sequences.push(
        new Tone.Sequence((time, chord) => {
          const rootNote = this.getChordRoot(chord)
          bassSynth.triggerAttackRelease(rootNote + '2', '4n', time)
        }, chords, '2n')
      )
      
      // Pad-Akkorde
      sequences.push(
        new Tone.Sequence((time, chord) => {
          const chordNotes = this.getChordNotes(chord)
          padSynth.triggerAttackRelease(chordNotes, '2n', time)
        }, chords, '2n')
      )
      
      // Lead-Melodie
      sequences.push(
        new Tone.Sequence((time, note) => {
          leadSynth.triggerAttackRelease(note, '8n', time)
        }, melody, '8n')
      )
      
      // Sequenzen starten
      sequences.forEach(seq => seq.start(0))
      
      // Audio aufnehmen
      const recorder = new Tone.Recorder()
      Tone.Destination.connect(recorder)
      
      // 8 Sekunden aufnehmen
      recorder.start()
      Tone.Transport.start()
      
      setTimeout(async () => {
        Tone.Transport.stop()
        const recording = await recorder.stop()
        const url = URL.createObjectURL(recording)
        
        // Audio-Datei speichern
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        writeFileSync(outputPath, buffer)
        
        console.log('💾 Enhanced Audio gespeichert:', outputPath)
        
        // Cleanup
        sequences.forEach(seq => seq.dispose())
        Object.values(this.synths).forEach(synth => synth.dispose())
      }, 8000)
      
    } catch (error) {
      console.log('❌ Fehler bei Audio-Generierung:', error)
      // Fallback: Einfache Audio erstellen
      this.createFallbackAudio(outputPath, style, { bpm: songData.bpm, key: songData.key, scale: songData.scale })
    }
  }

  // Fallback Audio erstellen
  createFallbackAudio(outputPath, style = 'techno', pattern = { bpm: 120, key: 'C', scale: 'major' }) {
    console.log('🎵 Erstelle erweiterte Fallback-Audio...')
    console.log('📋 Audio-Parameter:', { style, pattern })
    
    // Einfache WAV-Datei erstellen
    const sampleRate = 44100
    const duration = 8 // 8 Sekunden
    const samples = sampleRate * duration
    
    const data = new Float32Array(samples)
    
    // Verschiedene Wellenformen basierend auf Stil
    const frequency = this.noteToFrequency(pattern.key || 'C')
    
    for (let i = 0; i < samples; i++) {
      const time = i / sampleRate
      
      switch (style) {
        case 'psychedelic_rock':
          // Tame Impala Style: Sawtooth mit Modulation
          data[i] = Math.sin(2 * Math.PI * frequency * time) * 0.3 +
                    Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.2 +
                    Math.sin(2 * Math.PI * frequency * 2 * time) * 0.1
          break
        case 'techno':
          // Techno Style: Square Wave mit Bass
          data[i] = Math.sign(Math.sin(2 * Math.PI * frequency * time)) * 0.4 +
                    Math.sign(Math.sin(2 * Math.PI * frequency * 0.5 * time)) * 0.3
          break
        case 'ambient':
          // Ambient Style: Sine Wave mit Pad
          data[i] = Math.sin(2 * Math.PI * frequency * time) * 0.5 +
                    Math.sin(2 * Math.PI * frequency * 0.25 * time) * 0.3
          break
        default:
          data[i] = Math.sin(2 * Math.PI * frequency * time) * 0.4
      }
      
      // Fade in/out
      if (time < 0.5) {
        data[i] *= time / 0.5
      }
      if (time > duration - 0.5) {
        data[i] *= (duration - time) / 0.5
      }
    }
    
    // WAV Header erstellen
    const wavHeader = this.createWAVHeader(data.length * 4, {
      sampleRate,
      channels: 1,
      bitsPerSample: 32
    })
    
    // Float32 zu Int16 konvertieren
    const int16Data = new Int16Array(data.length)
    for (let i = 0; i < data.length; i++) {
      int16Data[i] = Math.max(-32768, Math.min(32767, data[i] * 32767))
    }
    
    // Datei schreiben
    const buffer = Buffer.concat([
      Buffer.from(wavHeader),
      Buffer.from(int16Data.buffer)
    ])
    
    writeFileSync(outputPath, buffer)
    console.log('💾 Erweiterte Fallback-Audio gespeichert:', outputPath)
  }

  // Hilfsfunktionen
  getChordRoot(chord) {
    return chord.replace(/[^A-G#]/g, '')
  }

  getChordNotes(chord) {
    const root = this.getChordRoot(chord)
    const notes = [root + '4', root + '5', root + '6']
    return notes
  }

  noteToFrequency(note) {
    const notes = { 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88 }
    return notes[note] || 261.63
  }

  createWAVHeader(dataLength, settings) {
    const buffer = Buffer.alloc(44)
    
    // RIFF Header
    buffer.write('RIFF', 0)
    buffer.writeUInt32LE(36 + dataLength, 4)
    buffer.write('WAVE', 8)
    
    // fmt chunk
    buffer.write('fmt ', 12)
    buffer.writeUInt32LE(16, 16) // fmt chunk size
    buffer.writeUInt16LE(1, 20) // audio format (PCM)
    buffer.writeUInt16LE(settings.channels, 22)
    buffer.writeUInt32LE(settings.sampleRate, 24)
    buffer.writeUInt32LE(settings.sampleRate * settings.channels * settings.bitsPerSample / 8, 28) // byte rate
    buffer.writeUInt16LE(settings.channels * settings.bitsPerSample / 8, 32) // block align
    buffer.writeUInt16LE(settings.bitsPerSample, 34)
    
    // data chunk
    buffer.write('data', 36)
    buffer.writeUInt32LE(dataLength, 40)
    
    return buffer
  }

  dispose() {
    Object.values(this.synths).forEach(synth => synth.dispose())
    Object.values(this.effects).forEach(effect => effect.dispose())
  }
}

export default EnhancedAudioEngine 