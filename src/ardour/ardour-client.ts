import { Client } from 'node-osc'
import { EventEmitter } from 'events'

export interface ArdourTrack {
  id: string
  name: string
  type: 'audio' | 'midi' | 'bus' | 'master'
  muted: boolean
  soloed: boolean
  recordEnabled: boolean
  gain: number
  pan: number
}

export interface ArdourSession {
  name: string
  sampleRate: number
  frameRate: number
  isPlaying: boolean
  isRecording: boolean
  transportFrame: number
  tracks: ArdourTrack[]
}

export interface ArdourState {
  playbackStatus: 'stopped' | 'playing' | 'unknown'
  transportFrame: number | null
  stripList: ArdourTrack[]
}

export class ArdourClient extends EventEmitter {
  private client: Client
  private host: string
  private port: number
  private sendPort: number
  private isConnected: boolean = false
  private session: ArdourSession | null = null
  private state: ArdourState = {
    playbackStatus: 'unknown',
    transportFrame: null,
    stripList: []
  }

  constructor() {
    super()
    this.host = process.env.ARDOUR_OSC_HOST || 'localhost'
    this.port = parseInt(process.env.ARDOUR_OSC_PORT || '3819')
    this.sendPort = parseInt(process.env.ARDOUR_OSC_SEND_PORT || '3818')
    
    this.client = new Client(this.host, this.port)
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      console.log('Ardour OSC Client bereit')
      this.isConnected = true
      this.emit('connected')
    })

    this.client.on('error', (error) => {
      console.error('Ardour OSC Fehler:', error)
      this.isConnected = false
      this.emit('error', error)
    })

    this.client.on('message', (message) => {
      this.handleOSCMessage(message)
    })
  }

  private handleOSCMessage(message: any): void {
    const [address, ...args] = message
    console.log('OSC Nachricht empfangen:', address, args)

    switch (address) {
      case '/transport_state':
        this.handleTransportState(args)
        break
      case '/transport_frame':
        this.handleTransportFrame(args)
        break
      case '/strip/play':
        this.handleStripPlay(args)
        break
      default:
        if (address.startsWith('/strip/name/')) {
          this.handleStripName(address, args)
        } else if (address.startsWith('/strip/type/')) {
          this.handleStripType(address, args)
        } else {
          console.debug('Unbekannte OSC-Nachricht:', address, args)
        }
    }
  }

  private handleTransportState(args: any[]): void {
    if (args.length >= 2) {
      const state = args[0]
      const speed = args[1]
      
      switch (state) {
        case 0:
          this.state.playbackStatus = 'stopped'
          break
        case 1:
        case 2:
          this.state.playbackStatus = 'playing'
          break
        default:
          this.state.playbackStatus = 'unknown'
      }
      
      this.emit('transportStateChanged', {
        status: this.state.playbackStatus,
        speed: speed
      })
    }
  }

  private handleTransportFrame(args: any[]): void {
    if (args.length >= 1) {
      this.state.transportFrame = args[0]
      this.emit('transportFrameChanged', this.state.transportFrame)
    }
  }

  private handleStripPlay(args: any[]): void {
    if (args.length >= 1) {
      const isPlaying = args[0] === 1
      this.state.playbackStatus = isPlaying ? 'playing' : 'stopped'
      this.emit('playbackStatusChanged', this.state.playbackStatus)
    }
  }

  private handleStripName(address: string, args: any[]): void {
    const parts = address.split('/')
    if (parts.length === 4 && args.length >= 1) {
      const stripId = parseInt(parts[3])
      const name = args[0]
      
      if (stripId > 0) {
        let track = this.state.stripList.find(t => t.id === stripId.toString())
        if (!track) {
          track = {
            id: stripId.toString(),
            name: name,
            type: 'audio',
            muted: false,
            soloed: false,
            recordEnabled: false,
            gain: 1.0,
            pan: 0.5
          }
          this.state.stripList.push(track)
        } else {
          track.name = name
        }
        
        this.emit('trackUpdated', track)
      }
    }
  }

  private handleStripType(address: string, args: any[]): void {
    const parts = address.split('/')
    if (parts.length === 4 && args.length >= 1) {
      const stripId = parseInt(parts[3])
      const type = args[0]
      
      if (stripId > 0) {
        const track = this.state.stripList.find(t => t.id === stripId.toString())
        if (track) {
          track.type = type
          this.emit('trackUpdated', track)
        }
      }
    }
  }

  // Ardour-Steuerungsfunktionen basierend auf ardour-mcp
  async connect(): Promise<void> {
    try {
      await this.client.connect()
      console.log(`Verbunden mit Ardour auf ${this.host}:${this.port}`)
      
      // Sende initiale OSC-Setup-Nachrichten
      await this.sendOSCSetup()
    } catch (error) {
      console.error('Fehler beim Verbinden mit Ardour:', error)
      throw error
    }
  }

  private async sendOSCSetup(): Promise<void> {
    // Sende Setup-Nachrichten für Feedback
    this.sendOSC('/strip/list')
    this.sendOSC('/transport_state')
    this.sendOSC('/transport_frame')
  }

  async disconnect(): Promise<void> {
    this.client.close()
    this.isConnected = false
    console.log('Verbindung zu Ardour getrennt')
  }

  // Transport-Steuerung (basierend auf ardour-mcp)
  async play(): Promise<void> {
    this.sendOSC('/transport_play')
  }

  async stop(): Promise<void> {
    this.sendOSC('/transport_stop')
  }

  async record(): Promise<void> {
    this.sendOSC('/transport_record')
  }

  async stopRecord(): Promise<void> {
    this.sendOSC('/transport_record_stop')
  }

  async setTransportSpeed(speed: number): Promise<void> {
    if (speed < 0.1 || speed > 4.0) {
      throw new Error('Transport speed must be between 0.1 and 4.0')
    }
    this.sendOSC('/transport_speed', speed)
  }

  // Track-Management (basierend auf ardour-mcp)
  async createAudioTrack(name?: string): Promise<string> {
    const trackName = name || `Audio Track ${Date.now()}`
    this.sendOSC('/add_audio_track', trackName)
    return `audio_track_${Date.now()}`
  }

  async createMIDITrack(name?: string): Promise<string> {
    const trackName = name || `MIDI Track ${Date.now()}`
    this.sendOSC('/add_midi_track', trackName)
    return `midi_track_${Date.now()}`
  }

  async setTrackMute(trackId: string, muted: boolean): Promise<void> {
    this.sendOSC('/strip/mute', parseInt(trackId), muted ? 1 : 0)
  }

  async setTrackSolo(trackId: string, soloed: boolean): Promise<void> {
    this.sendOSC('/strip/solo', parseInt(trackId), soloed ? 1 : 0)
  }

  async setTrackRecordEnable(trackId: string, enabled: boolean): Promise<void> {
    this.sendOSC('/strip/recenable', parseInt(trackId), enabled ? 1 : 0)
  }

  async setTrackGain(trackId: string, gain: number): Promise<void> {
    if (gain < 0.0 || gain > 2.0) {
      throw new Error('Gain must be between 0.0 and 2.0')
    }
    // Konvertiere zu Fader-Position (0.0-1.0)
    const faderPosition = (gain / 2.0).clamp(0.0, 1.0)
    this.sendOSC('/strip/fader', parseInt(trackId), faderPosition)
  }

  async setTrackGainDB(trackId: string, gainDB: number): Promise<void> {
    if (gainDB < -400.0 || gainDB > 6.0) {
      throw new Error('Gain DB must be between -400.0 and 6.0')
    }
    this.sendOSC('/strip/gain', parseInt(trackId), gainDB)
  }

  async setTrackPan(trackId: string, pan: number): Promise<void> {
    if (pan < 0.0 || pan > 1.0) {
      throw new Error('Pan must be between 0.0 and 1.0')
    }
    this.sendOSC('/strip/pan_stereo_position', parseInt(trackId), pan)
  }

  async selectTrack(trackId: string): Promise<void> {
    this.sendOSC('/strip/select', parseInt(trackId), 1)
  }

  // Plugin-Management (basierend auf ardour-mcp)
  async addPluginToTrack(trackId: string, pluginName: string): Promise<string> {
    this.sendOSC('/strip/plugin/insert', parseInt(trackId), pluginName)
    return `plugin_${Date.now()}`
  }

  async setPluginActive(trackId: string, pluginSlot: number, active: boolean): Promise<void> {
    const address = active ? '/strip/plugin/activate' : '/strip/plugin/deactivate'
    this.sendOSC(address, parseInt(trackId), pluginSlot)
  }

  async setPluginParameter(trackId: string, pluginSlot: number, paramId: number, value: number): Promise<void> {
    if (value < 0.0 || value > 1.0) {
      throw new Error('Parameter value must be between 0.0 and 1.0')
    }
    this.sendOSC('/strip/plugin/parameter', parseInt(trackId), pluginSlot, paramId, value)
  }

  // Session-Management
  async loadSession(sessionPath: string): Promise<void> {
    this.sendOSC('/session/load', sessionPath)
  }

  async saveSession(): Promise<void> {
    this.sendOSC('/session/save')
  }

  async getSessionInfo(): Promise<ArdourSession | null> {
    this.sendOSC('/session/info')
    return this.session
  }

  // Ardour Actions (basierend auf ardour-mcp)
  async executeAction(actionName: string): Promise<void> {
    this.sendOSC('/access_action', actionName)
  }

  // Hilfsfunktionen
  private sendOSC(address: string, ...args: any[]): void {
    if (!this.isConnected) {
      console.warn('Ardour nicht verbunden, OSC-Nachricht nicht gesendet:', address)
      return
    }

    try {
      this.client.send(address, ...args)
      console.log('OSC gesendet:', address, args)
    } catch (error) {
      console.error('Fehler beim Senden OSC-Nachricht:', error)
    }
  }

  isConnectedToArdour(): boolean {
    return this.isConnected
  }

  getCurrentSession(): ArdourSession | null {
    return this.session
  }

  getCurrentState(): ArdourState {
    return { ...this.state }
  }

  getTracks(): ArdourTrack[] {
    return [...this.state.stripList]
  }
} 