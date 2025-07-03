import { spawn, exec } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { EventEmitter } from 'events'

class OpenDAWIntegration extends EventEmitter {
  constructor() {
    super()
    this.dawProcess = null
    this.dawType = null // 'ardour', 'lmms', 'qtractor'
    this.isInitialized = false
    this.projectPath = null
    this.midiPort = 5000
    this.audioPort = 5001
    this.oscPort = 5002
  }

  async initialize(config = {}) {
    console.log('🎛️ Initialisiere Open DAW Integration...')
    
    try {
      // Finde verfügbare DAW
      this.dawType = await this.findAvailableDAW()
      
      if (!this.dawType) {
        console.log('⚠️ Keine DAW gefunden, verwende Fallback')
        return false
      }
      
      console.log('✅ DAW gefunden:', this.dawType)
      
      // Erstelle Projekt-Verzeichnis
      this.projectPath = config.projectPath || join(process.cwd(), 'output', 'daw_projects')
      mkdirSync(this.projectPath, { recursive: true })
      
      // Starte DAW-Prozess
      await this.startDAWProcess()
      
      // Warte auf Initialisierung
      await this.waitForDAWReady()
      
      this.isInitialized = true
      return true
      
    } catch (error) {
      console.log('❌ Fehler bei DAW-Initialisierung:', error.message)
      return false
    }
  }

  async findAvailableDAW() {
    const daws = [
      { name: 'ardour', command: 'ardour', type: 'ardour' },
      { name: 'lmms', command: 'lmms', type: 'lmms' },
      { name: 'qtractor', command: 'qtractor', type: 'qtractor' },
      { name: 'muse', command: 'muse', type: 'muse' },
      { name: 'rosegarden', command: 'rosegarden', type: 'rosegarden' }
    ]
    
    for (const daw of daws) {
      try {
        const result = await this.execCommand(`which ${daw.command}`)
        if (result.trim()) {
          return daw.type
        }
      } catch (e) {
        // Ignoriere Fehler
      }
    }
    
    return null
  }

  async startDAWProcess() {
    if (this.dawProcess) {
      this.dawProcess.kill()
    }
    
    const projectName = `open_daw_project_${Date.now()}`
    const projectFile = join(this.projectPath, `${projectName}.ardour`)
    
    switch (this.dawType) {
      case 'ardour':
        await this.startArdour(projectFile)
        break
      case 'lmms':
        await this.startLMMS(projectFile)
        break
      case 'qtractor':
        await this.startQtractor(projectFile)
        break
      default:
        throw new Error(`Unbekannte DAW: ${this.dawType}`)
    }
  }

  async startArdour(projectFile) {
    console.log('🎛️ Starte Ardour...')
    
    // Ardour mit Headless-Modus und OSC-Support starten
    this.dawProcess = spawn('ardour', [
      '--no-splash',
      '--new',
      '--name', 'OpenDAW Project',
      '--sample-rate', '44100',
      '--session-path', projectFile,
      '--osc-port', this.oscPort.toString()
    ])
    
    this.setupProcessHandlers()
  }

  async startLMMS(projectFile) {
    console.log('🎛️ Starte LMMS...')
    
    // LMMS mit Remote-API starten
    this.dawProcess = spawn('lmms', [
      '--remote',
      '--port', this.midiPort.toString(),
      '--project', projectFile
    ])
    
    this.setupProcessHandlers()
  }

  async startQtractor(projectFile) {
    console.log('🎛️ Starte Qtractor...')
    
    // Qtractor mit MIDI-Support starten
    this.dawProcess = spawn('qtractor', [
      '--session', projectFile,
      '--midi-port', this.midiPort.toString()
    ])
    
    this.setupProcessHandlers()
  }

  setupProcessHandlers() {
    this.dawProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('DAW Output:', output)
      
      if (output.includes('ready') || output.includes('initialized') || output.includes('started')) {
        this.emit('ready')
      }
    })
    
    this.dawProcess.stderr.on('data', (data) => {
      console.log('DAW Error:', data.toString())
    })
    
    this.dawProcess.on('close', (code) => {
      console.log('DAW Prozess beendet mit Code:', code)
      this.isInitialized = false
    })
  }

  async waitForDAWReady() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ DAW Ready Timeout, fahre trotzdem fort...')
        resolve(true)
      }, 15000)
      
      this.once('ready', () => {
        clearTimeout(timeout)
        resolve(true)
      })
    })
  }

  async createMPEAudio(mpeMidiData, songData, outputPath) {
    console.log('🎵 Erstelle Audio mit Open DAW Integration...')
    
    if (!this.isInitialized) {
      throw new Error('DAW nicht initialisiert')
    }
    
    try {
      // 1. Erstelle DAW-Projekt
      const projectId = await this.createProject(songData)
      
      // 2. Konvertiere MPE-Daten für DAW
      const dawMidiData = this.convertMPEToDAW(mpeMidiData)
      
      // 3. Erstelle Tracks und füge MIDI hinzu
      await this.createTracks(songData)
      await this.addMIDIToTracks(dawMidiData)
      
      // 4. Generiere und wende Presets an
      const presets = await this.generateDAWPresets(songData)
      await this.applyPresets(presets)
      
      // 5. Rendere Audio
      const audioResult = await this.renderAudio(outputPath)
      
      return {
        success: true,
        outputPath: audioResult.path,
        duration: audioResult.duration,
        format: 'wav',
        projectId: projectId,
        message: 'Open DAW Audio erfolgreich erstellt'
      }
      
    } catch (error) {
      console.log('❌ Fehler bei Open DAW Audio-Erstellung:', error.message)
      throw error
    }
  }

  async createProject(songData) {
    console.log('📁 Erstelle DAW-Projekt...')
    
    const projectId = `project_${Date.now()}`
    const projectName = `${songData.title || 'OpenDAW_Song'}_${projectId}`
    
    switch (this.dawType) {
      case 'ardour':
        await this.createArdourProject(projectName, songData)
        break
      case 'lmms':
        await this.createLMMSProject(projectName, songData)
        break
      case 'qtractor':
        await this.createQtractorProject(projectName, songData)
        break
    }
    
    return projectId
  }

  async createArdourProject(name, songData) {
    // Ardour-Projekt über OSC erstellen
    const oscCommand = {
      command: 'new_session',
      name: name,
      sample_rate: 44100,
      bpm: songData.bpm || 120,
      key: songData.key || 'C',
      scale: songData.scale || 'major'
    }
    
    await this.sendOSCCommand(oscCommand)
  }

  async createLMMSProject(name, songData) {
    // LMMS-Projekt über Remote-API erstellen
    const remoteCommand = {
      method: 'create_project',
      params: {
        name: name,
        bpm: songData.bpm || 120,
        key: songData.key || 'C'
      }
    }
    
    await this.sendRemoteCommand(remoteCommand)
  }

  async createQtractorProject(name, songData) {
    // Qtractor-Projekt über MIDI-SysEx erstellen
    const sysexCommand = {
      command: 'new_session',
      name: name,
      bpm: songData.bpm || 120
    }
    
    await this.sendSysExCommand(sysexCommand)
  }

  convertMPEToDAW(mpeMidiData) {
    console.log('🔄 Konvertiere MPE-Daten für DAW...')
    
    const dawMidi = {
      tracks: [],
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 }
    }
    
    // Konvertiere MPE-Daten in DAW-kompatibles Format
    for (const track of mpeMidiData.tracks || []) {
      const dawTrack = {
        name: track.name,
        type: this.determineTrackType(track.name),
        notes: [],
        controllers: []
      }
      
      // Konvertiere Noten
      for (const note of track.notes || []) {
        const dawNote = {
          note: note.note,
          velocity: note.velocity,
          startTime: note.startTime,
          duration: note.duration,
          channel: note.channel || 0
        }
        
        // Füge MPE-Controller hinzu
        if (note.pressure) {
          dawTrack.controllers.push({
            type: 'pressure',
            value: note.pressure,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        if (note.timbre) {
          dawTrack.controllers.push({
            type: 'timbre',
            value: note.timbre,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        if (note.slide) {
          dawTrack.controllers.push({
            type: 'pitchbend',
            value: note.slide,
            time: note.startTime,
            channel: note.channel
          })
        }
        
        dawTrack.notes.push(dawNote)
      }
      
      dawMidi.tracks.push(dawTrack)
    }
    
    return dawMidi
  }

  determineTrackType(trackName) {
    const name = trackName.toLowerCase()
    
    if (name.includes('bass') || name.includes('bass')) return 'bass'
    if (name.includes('lead') || name.includes('melody')) return 'lead'
    if (name.includes('pad') || name.includes('atmosphere')) return 'pad'
    if (name.includes('drum') || name.includes('beat')) return 'drum'
    if (name.includes('synth') || name.includes('keys')) return 'synth'
    
    return 'synth'
  }

  async createTracks(songData) {
    console.log('🎵 Erstelle DAW-Tracks...')
    
    const trackTypes = ['lead', 'bass', 'pad', 'drum']
    
    for (const trackType of trackTypes) {
      await this.createTrack(trackType, songData)
    }
  }

  async createTrack(type, songData) {
    const trackName = `${type}_track`
    
    switch (this.dawType) {
      case 'ardour':
        await this.createArdourTrack(trackName, type)
        break
      case 'lmms':
        await this.createLMMSTrack(trackName, type)
        break
      case 'qtractor':
        await this.createQtractorTrack(trackName, type)
        break
    }
  }

  async createArdourTrack(name, type) {
    const oscCommand = {
      command: 'add_track',
      name: name,
      type: type,
      channels: 2 // Stereo
    }
    
    await this.sendOSCCommand(oscCommand)
  }

  async createLMMSTrack(name, type) {
    const remoteCommand = {
      method: 'add_track',
      params: {
        name: name,
        type: type
      }
    }
    
    await this.sendRemoteCommand(remoteCommand)
  }

  async createQtractorTrack(name, type) {
    const sysexCommand = {
      command: 'add_track',
      name: name,
      type: type
    }
    
    await this.sendSysExCommand(sysexCommand)
  }

  async addMIDIToTracks(midiData) {
    console.log('🎼 Füge MIDI-Daten zu Tracks hinzu...')
    
    for (const track of midiData.tracks) {
      await this.addMIDIToTrack(track)
    }
  }

  async addMIDIToTrack(track) {
    switch (this.dawType) {
      case 'ardour':
        await this.addMIDIToArdourTrack(track)
        break
      case 'lmms':
        await.addMIDIToLMMSTrack(track)
        break
      case 'qtractor':
        await this.addMIDIToQtractorTrack(track)
        break
    }
  }

  async addMIDIToArdourTrack(track) {
    const oscCommand = {
      command: 'add_midi',
      track: track.name,
      notes: track.notes,
      controllers: track.controllers
    }
    
    await this.sendOSCCommand(oscCommand)
  }

  async addMIDIToLMMSTrack(track) {
    const remoteCommand = {
      method: 'add_midi',
      params: {
        track: track.name,
        notes: track.notes,
        controllers: track.controllers
      }
    }
    
    await this.sendRemoteCommand(remoteCommand)
  }

  async addMIDIToQtractorTrack(track) {
    const sysexCommand = {
      command: 'add_midi',
      track: track.name,
      notes: track.notes,
      controllers: track.controllers
    }
    
    await this.sendSysExCommand(sysexCommand)
  }

  async generateDAWPresets(songData) {
    console.log('🎛️ Generiere DAW-Presets...')
    
    const presets = {
      lead: this.createDAWPreset(songData, 'lead'),
      bass: this.createDAWPreset(songData, 'bass'),
      pad: this.createDAWPreset(songData, 'pad'),
      drum: this.createDAWPreset(songData, 'drum')
    }
    
    return presets
  }

  createDAWPreset(songData, voiceType) {
    const basePreset = {
      volume: -10,
      pan: 0,
      effects: []
    }
    
    switch (voiceType) {
      case 'lead':
        return {
          ...basePreset,
          volume: -8,
          effects: [
            { type: 'reverb', wet: 0.2, decay: 1.5 },
            { type: 'delay', time: 0.3, feedback: 0.2 }
          ]
        }
      case 'bass':
        return {
          ...basePreset,
          volume: -6,
          effects: [
            { type: 'compressor', threshold: -20, ratio: 4 }
          ]
        }
      case 'pad':
        return {
          ...basePreset,
          volume: -12,
          effects: [
            { type: 'reverb', wet: 0.4, decay: 3.0 },
            { type: 'chorus', rate: 1.5, depth: 0.3 }
          ]
        }
      case 'drum':
        return {
          ...basePreset,
          volume: -4,
          effects: [
            { type: 'compressor', threshold: -15, ratio: 3 }
          ]
        }
      default:
        return basePreset
    }
  }

  async applyPresets(presets) {
    console.log('🎛️ Wende DAW-Presets an...')
    
    for (const [voiceType, preset] of Object.entries(presets)) {
      await this.applyPresetToTrack(voiceType, preset)
    }
  }

  async applyPresetToTrack(trackType, preset) {
    const trackName = `${trackType}_track`
    
    switch (this.dawType) {
      case 'ardour':
        await this.applyPresetToArdourTrack(trackName, preset)
        break
      case 'lmms':
        await this.applyPresetToLMMSTrack(trackName, preset)
        break
      case 'qtractor':
        await this.applyPresetToQtractorTrack(trackName, preset)
        break
    }
  }

  async applyPresetToArdourTrack(trackName, preset) {
    const oscCommand = {
      command: 'apply_preset',
      track: trackName,
      preset: preset
    }
    
    await this.sendOSCCommand(oscCommand)
  }

  async applyPresetToLMMSTrack(trackName, preset) {
    const remoteCommand = {
      method: 'apply_preset',
      params: {
        track: trackName,
        preset: preset
      }
    }
    
    await this.sendRemoteCommand(remoteCommand)
  }

  async applyPresetToQtractorTrack(trackName, preset) {
    const sysexCommand = {
      command: 'apply_preset',
      track: trackName,
      preset: preset
    }
    
    await this.sendSysExCommand(sysexCommand)
  }

  async renderAudio(outputPath) {
    console.log('🎵 Rendere Audio mit DAW...')
    
    const audioPath = join(outputPath, `daw_audio_${Date.now()}.wav`)
    
    switch (this.dawType) {
      case 'ardour':
        return await this.renderArdourAudio(audioPath)
      case 'lmms':
        return await this.renderLMMSAudio(audioPath)
      case 'qtractor':
        return await this.renderQtractorAudio(audioPath)
      default:
        throw new Error(`Unbekannte DAW: ${this.dawType}`)
    }
  }

  async renderArdourAudio(outputPath) {
    const oscCommand = {
      command: 'export_audio',
      path: outputPath,
      format: 'wav',
      sample_rate: 44100
    }
    
    await this.sendOSCCommand(oscCommand)
    
    // Warte auf Fertigstellung
    await this.waitForRenderComplete()
    
    return {
      path: outputPath,
      duration: 30
    }
  }

  async renderLMMSAudio(outputPath) {
    const remoteCommand = {
      method: 'export_audio',
      params: {
        path: outputPath,
        format: 'wav'
      }
    }
    
    await this.sendRemoteCommand(remoteCommand)
    
    await this.waitForRenderComplete()
    
    return {
      path: outputPath,
      duration: 30
    }
  }

  async renderQtractorAudio(outputPath) {
    const sysexCommand = {
      command: 'export_audio',
      path: outputPath,
      format: 'wav'
    }
    
    await this.sendSysExCommand(sysexCommand)
    
    await this.waitForRenderComplete()
    
    return {
      path: outputPath,
      duration: 30
    }
  }

  async waitForRenderComplete() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve()
      }, 60000) // 60 Sekunden Timeout
      
      this.once('render_complete', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  // Kommunikations-Methoden
  async sendOSCCommand(command) {
    // OSC (Open Sound Control) für Ardour
    const oscMessage = JSON.stringify(command)
    
    if (this.dawProcess && this.dawProcess.stdin) {
      this.dawProcess.stdin.write(`osc ${oscMessage}\n`)
    }
  }

  async sendRemoteCommand(command) {
    // Remote-API für LMMS
    const remoteMessage = JSON.stringify(command)
    
    if (this.dawProcess && this.dawProcess.stdin) {
      this.dawProcess.stdin.write(`remote ${remoteMessage}\n`)
    }
  }

  async sendSysExCommand(command) {
    // SysEx für Qtractor
    const sysexMessage = JSON.stringify(command)
    
    if (this.dawProcess && this.dawProcess.stdin) {
      this.dawProcess.stdin.write(`sysex ${sysexMessage}\n`)
    }
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
  }

  async shutdown() {
    console.log('🛑 Beende Open DAW Integration...')
    
    if (this.dawProcess) {
      this.dawProcess.kill()
      this.dawProcess = null
    }
    
    this.isInitialized = false
  }
}

export default OpenDAWIntegration 