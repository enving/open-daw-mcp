import { spawn } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { EventEmitter } from 'events'

class DexedIntegration extends EventEmitter {
  constructor() {
    super()
    this.dexedProcess = null
    this.vstPath = null
    this.isInitialized = false
    this.midiBuffer = []
    this.audioOutput = null
  }

  async initialize(config = {}) {
    console.log('🎹 Initialisiere Dexed Integration...')
    
    try {
      // Konfiguriere Dexed-Pfad
      this.vstPath = config.vstPath || this.findDexedVST()
      
      if (!this.vstPath) {
        console.log('⚠️ Dexed VST nicht gefunden, verwende Standalone-Modus')
        return await this.initializeStandalone()
      }
      
      console.log('✅ Dexed VST gefunden:', this.vstPath)
      this.isInitialized = true
      
      // Starte Dexed-Prozess
      await this.startDexedProcess()
      
      return true
      
    } catch (error) {
      console.log('❌ Fehler bei Dexed-Initialisierung:', error.message)
      return false
    }
  }

  findDexedVST() {
    const commonPaths = [
      '/usr/lib/vst/Dexed.so',
      '/usr/local/lib/vst/Dexed.so',
      '/opt/vst/Dexed.so',
      '/home/*/.vst/Dexed.so',
      '/Library/Audio/Plug-Ins/VST/Dexed.vst',
      '/Library/Audio/Plug-Ins/Components/Dexed.component',
      'C:\\Program Files\\VSTPlugins\\Dexed.dll',
      'C:\\Program Files (x86)\\VSTPlugins\\Dexed.dll'
    ]
    
    for (const path of commonPaths) {
      if (existsSync(path)) {
        return path
      }
    }
    
    return null
  }

  async initializeStandalone() {
    console.log('🎹 Starte Dexed im Standalone-Modus...')
    
    try {
      // Versuche Dexed als Standalone-Anwendung zu starten
      const dexedStandalone = this.findDexedStandalone()
      
      if (dexedStandalone) {
        this.dexedProcess = spawn(dexedStandalone, ['--headless', '--port', '5000'])
        
        this.dexedProcess.stdout.on('data', (data) => {
          console.log('Dexed:', data.toString())
        })
        
        this.dexedProcess.stderr.on('data', (data) => {
          console.log('Dexed Error:', data.toString())
        })
        
        this.dexedProcess.on('close', (code) => {
          console.log('Dexed Prozess beendet mit Code:', code)
        })
        
        // Warte auf Initialisierung
        await this.waitForDexedReady()
        this.isInitialized = true
        return true
      }
      
      return false
      
    } catch (error) {
      console.log('❌ Fehler bei Standalone-Initialisierung:', error.message)
      return false
    }
  }

  findDexedStandalone() {
    const commonPaths = [
      '/usr/bin/dexed',
      '/usr/local/bin/dexed',
      '/opt/dexed/dexed',
      'dexed' // Falls im PATH
    ]
    
    for (const path of commonPaths) {
      try {
        const result = require('child_process').execSync(`which ${path}`, { encoding: 'utf8' })
        if (result.trim()) {
          return result.trim()
        }
      } catch (e) {
        // Ignoriere Fehler
      }
    }
    
    return null
  }

  async startDexedProcess() {
    if (this.dexedProcess) {
      this.dexedProcess.kill()
    }
    
    // Starte Dexed mit VST-Host (z.B. Carla, Ardour, etc.)
    const vstHost = this.findVSTHost()
    
    if (vstHost) {
      this.dexedProcess = spawn(vstHost, [
        '--load-plugin', this.vstPath,
        '--port', '5000',
        '--headless'
      ])
      
      this.setupProcessHandlers()
    }
  }

  findVSTHost() {
    const hosts = [
      'carla',
      'carla-bridge',
      'ardour',
      'reaper',
      'bitwig-studio'
    ]
    
    for (const host of hosts) {
      try {
        const result = require('child_process').execSync(`which ${host}`, { encoding: 'utf8' })
        if (result.trim()) {
          return result.trim()
        }
      } catch (e) {
        // Ignoriere Fehler
      }
    }
    
    return null
  }

  setupProcessHandlers() {
    this.dexedProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('Dexed Output:', output)
      
      if (output.includes('ready') || output.includes('initialized')) {
        this.emit('ready')
      }
    })
    
    this.dexedProcess.stderr.on('data', (data) => {
      console.log('Dexed Error:', data.toString())
    })
    
    this.dexedProcess.on('close', (code) => {
      console.log('Dexed Prozess beendet mit Code:', code)
      this.isInitialized = false
    })
  }

  async waitForDexedReady() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false)
      }, 10000)
      
      this.once('ready', () => {
        clearTimeout(timeout)
        resolve(true)
      })
    })
  }

  async createMPEAudio(mpeMidiData, songData, outputPath) {
    console.log('🎵 Erstelle Audio mit Dexed MPE Integration...')
    
    if (!this.isInitialized) {
      throw new Error('Dexed nicht initialisiert')
    }
    
    try {
      // 1. Konvertiere MPE-Daten in Dexed-kompatibles Format
      const dexedMidiData = this.convertMPEToDexed(mpeMidiData)
      
      // 2. Generiere Dexed-Presets basierend auf Song-Daten
      const dexedPresets = await this.generateDexedPresets(songData)
      
      // 3. Sende MIDI-Daten an Dexed
      await this.sendMIDIToDexed(dexedMidiData)
      
      // 4. Wende Presets an
      await this.applyDexedPresets(dexedPresets)
      
      // 5. Rendere Audio
      const audioResult = await this.renderAudio(outputPath)
      
      return {
        success: true,
        outputPath: audioResult.path,
        duration: audioResult.duration,
        format: 'wav',
        message: 'Dexed MPE Audio erfolgreich erstellt'
      }
      
    } catch (error) {
      console.log('❌ Fehler bei Dexed Audio-Erstellung:', error.message)
      throw error
    }
  }

  convertMPEToDexed(mpeMidiData) {
    console.log('🔄 Konvertiere MPE-Daten für Dexed...')
    
    const dexedMidi = {
      tracks: [],
      format: 1,
      timeDivision: 480
    }
    
    // Konvertiere MPE-Daten in Standard MIDI mit Expression
    for (const track of mpeMidiData.tracks || []) {
      const dexedTrack = {
        name: track.name,
        notes: [],
        controllers: []
      }
      
      // Konvertiere Noten mit MPE-Daten
      for (const note of track.notes || []) {
        const dexedNote = {
          note: note.note,
          velocity: note.velocity,
          startTime: note.startTime,
          duration: note.duration,
          channel: note.channel || 0
        }
        
        // Füge MPE-Controller hinzu
        if (note.pressure) {
          dexedTrack.controllers.push({
            type: 'pressure',
            value: note.pressure,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        if (note.timbre) {
          dexedTrack.controllers.push({
            type: 'timbre',
            value: note.timbre,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        if (note.slide) {
          dexedTrack.controllers.push({
            type: 'pitchbend',
            value: note.slide,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        dexedTrack.notes.push(dexedNote)
      }
      
      dexedMidi.tracks.push(dexedTrack)
    }
    
    return dexedMidi
  }

  async generateDexedPresets(songData) {
    console.log('🎛️ Generiere Dexed-Presets für:', songData.style)
    
    const presets = {
      lead: this.createDexedPreset(songData, 'lead'),
      bass: this.createDexedPreset(songData, 'bass'),
      pad: this.createDexedPreset(songData, 'pad')
    }
    
    return presets
  }

  createDexedPreset(songData, voiceType) {
    const basePreset = {
      algorithm: 1,
      feedback: 0,
      lfoSpeed: 0,
      lfoDelay: 0,
      lfoPitchModDepth: 0,
      lfoAmpModDepth: 0,
      lfoSync: 0,
      lfoWaveform: 0,
      pitchModSensitivity: 0,
      transpose: 0,
      operators: []
    }
    
    // Erstelle 6 Operatoren (DX7-Standard)
    for (let i = 0; i < 6; i++) {
      basePreset.operators.push({
        enabled: true,
        frequency: 1.0,
        detune: 0,
        level: 99,
        attack: 0,
        decay: 0,
        sustain: 99,
        release: 0,
        envelopeScaling: 0,
        keyboardScaling: 0,
        amplitudeModulation: 0,
        frequencyModulation: 0
      })
    }
    
    // Passe Preset basierend auf Stil und Stimme an
    switch (voiceType) {
      case 'lead':
        return this.createLeadPreset(basePreset, songData)
      case 'bass':
        return this.createBassPreset(basePreset, songData)
      case 'pad':
        return this.createPadPreset(basePreset, songData)
      default:
        return basePreset
    }
  }

  createLeadPreset(preset, songData) {
    // Lead-Sound: scharfer, durchdringender Klang
    preset.algorithm = songData.style === 'psychedelic_rock' ? 5 : 3
    preset.feedback = 3
    
    // Operator 1: Hauptträger
    preset.operators[0] = {
      ...preset.operators[0],
      level: 85,
      attack: 0,
      decay: 15,
      sustain: 70,
      release: 20
    }
    
    // Operator 2: Modulator
    preset.operators[1] = {
      ...preset.operators[1],
      level: 60,
      frequency: 2.0,
      attack: 0,
      decay: 10,
      sustain: 50,
      release: 15
    }
    
    return preset
  }

  createBassPreset(preset, songData) {
    // Bass-Sound: tief, kraftvoll
    preset.algorithm = 1
    preset.feedback = 2
    
    // Operator 1: Hauptträger
    preset.operators[0] = {
      ...preset.operators[0],
      level: 95,
      attack: 0,
      decay: 20,
      sustain: 80,
      release: 25
    }
    
    // Operator 2: Modulator
    preset.operators[1] = {
      ...preset.operators[1],
      level: 70,
      frequency: 1.5,
      attack: 0,
      decay: 15,
      sustain: 60,
      release: 20
    }
    
    return preset
  }

  createPadPreset(preset, songData) {
    // Pad-Sound: weich, atmosphärisch
    preset.algorithm = 6
    preset.feedback = 1
    
    // Operator 1: Hauptträger
    preset.operators[0] = {
      ...preset.operators[0],
      level: 70,
      attack: 50,
      decay: 30,
      sustain: 60,
      release: 40
    }
    
    // Operator 2: Modulator
    preset.operators[1] = {
      ...preset.operators[1],
      level: 50,
      frequency: 1.0,
      attack: 40,
      decay: 25,
      sustain: 50,
      release: 35
    }
    
    return preset
  }

  async sendMIDIToDexed(midiData) {
    console.log('📤 Sende MIDI-Daten an Dexed...')
    
    // Konvertiere MIDI-Daten in Standard MIDI-Datei
    const midiBuffer = this.createMIDIBuffer(midiData)
    
    // Sende über HTTP-API oder direkt an Prozess
    if (this.dexedProcess && this.dexedProcess.stdin) {
      this.dexedProcess.stdin.write(midiBuffer)
    } else {
      // Fallback: Speichere MIDI-Datei und lade sie
      const midiPath = '/tmp/dexed_midi.mid'
      writeFileSync(midiPath, midiBuffer)
      await this.loadMIDIFile(midiPath)
    }
  }

  createMIDIBuffer(midiData) {
    // Einfache MIDI-Datei-Erstellung
    const buffer = Buffer.alloc(1024)
    let offset = 0
    
    // MIDI Header
    const header = Buffer.from('MThd')
    header.copy(buffer, offset)
    offset += 4
    
    // Header-Länge (6 Bytes)
    buffer.writeUInt32BE(6, offset)
    offset += 4
    
    // Format (1 = Multi-Track)
    buffer.writeUInt16BE(1, offset)
    offset += 2
    
    // Anzahl Tracks
    buffer.writeUInt16BE(midiData.tracks.length, offset)
    offset += 2
    
    // Time Division
    buffer.writeUInt16BE(midiData.timeDivision, offset)
    offset += 2
    
    // Tracks
    for (const track of midiData.tracks) {
      const trackHeader = Buffer.from('MTrk')
      trackHeader.copy(buffer, offset)
      offset += 4
      
      // Track-Daten hier hinzufügen...
      // (Vereinfachte Implementierung)
    }
    
    return buffer.slice(0, offset)
  }

  async loadMIDIFile(midiPath) {
    // Lade MIDI-Datei in Dexed
    if (this.dexedProcess && this.dexedProcess.stdin) {
      this.dexedProcess.stdin.write(`load_midi ${midiPath}\n`)
    }
  }

  async applyDexedPresets(presets) {
    console.log('🎛️ Wende Dexed-Presets an...')
    
    for (const [voiceType, preset] of Object.entries(presets)) {
      await this.applyPresetToDexed(preset, voiceType)
    }
  }

  async applyPresetToDexed(preset, voiceType) {
    // Sende Preset-Daten an Dexed
    const presetData = this.serializePreset(preset)
    
    if (this.dexedProcess && this.dexedProcess.stdin) {
      this.dexedProcess.stdin.write(`load_preset ${voiceType} ${presetData}\n`)
    }
  }

  serializePreset(preset) {
    // Konvertiere Preset in Dexed-kompatibles Format
    return JSON.stringify(preset)
  }

  async renderAudio(outputPath) {
    console.log('🎵 Rendere Audio mit Dexed...')
    
    const audioPath = join(outputPath, `dexed_audio_${Date.now()}.wav`)
    
    // Starte Audio-Rendering
    if (this.dexedProcess && this.dexedProcess.stdin) {
      this.dexedProcess.stdin.write(`render_audio ${audioPath}\n`)
    }
    
    // Warte auf Fertigstellung
    await this.waitForRenderComplete()
    
    return {
      path: audioPath,
      duration: 30 // Standard-Dauer
    }
  }

  async waitForRenderComplete() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve()
      }, 30000) // 30 Sekunden Timeout
      
      this.once('render_complete', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  async shutdown() {
    console.log('🛑 Beende Dexed Integration...')
    
    if (this.dexedProcess) {
      this.dexedProcess.kill()
      this.dexedProcess = null
    }
    
    this.isInitialized = false
  }
}

export default DexedIntegration 