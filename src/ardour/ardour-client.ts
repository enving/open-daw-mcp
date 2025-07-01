import { Client } from 'node-osc'
import { EventEmitter } from 'events'

export interface ArdourTrack {
  id: string
  name: string
  type: 'audio' | 'midi'
  muted: boolean
  soloed: boolean
  recordEnabled: boolean
}

export interface ArdourSession {
  name: string
  sampleRate: number
  frameRate: number
  isPlaying: boolean
  isRecording: boolean
  tracks: ArdourTrack[]
}

export class ArdourClient extends EventEmitter {
  private client: Client
  private host: string
  private port: number
  private sendPort: number
  private isConnected: boolean = false
  private session: ArdourSession | null = null

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
      case '/ardour/session/loaded':
        this.handleSessionLoaded(args)
        break
      case '/ardour/transport/state':
        this.handleTransportState(args)
        break
      case '/ardour/track/added':
        this.handleTrackAdded(args)
        break
      default:
        // Unbekannte Nachrichten ignorieren
        break
    }
  }

  private handleSessionLoaded(args: any[]): void {
    if (args.length >= 3) {
      this.session = {
        name: args[0] || 'Unnamed Session',
        sampleRate: args[1] || 44100,
        frameRate: args[2] || 25,
        isPlaying: false,
        isRecording: false,
        tracks: []
      }
      this.emit('sessionLoaded', this.session)
    }
  }

  private handleTransportState(args: any[]): void {
    if (this.session && args.length >= 2) {
      this.session.isPlaying = args[0] === 1
      this.session.isRecording = args[1] === 1
      this.emit('transportStateChanged', {
        isPlaying: this.session.isPlaying,
        isRecording: this.session.isRecording
      })
    }
  }

  private handleTrackAdded(args: any[]): void {
    if (args.length >= 3) {
      const track: ArdourTrack = {
        id: args[0]?.toString() || '',
        name: args[1] || 'Unnamed Track',
        type: args[2] === 'midi' ? 'midi' : 'audio',
        muted: false,
        soloed: false,
        recordEnabled: false
      }
      
      if (this.session) {
        this.session.tracks.push(track)
      }
      this.emit('trackAdded', track)
    }
  }

  // Ardour-Steuerungsfunktionen
  async connect(): Promise<void> {
    try {
      await this.client.connect()
      console.log(`Verbunden mit Ardour auf ${this.host}:${this.port}`)
    } catch (error) {
      console.error('Fehler beim Verbinden mit Ardour:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.client.close()
    this.isConnected = false
    console.log('Verbindung zu Ardour getrennt')
  }

  // Transport-Steuerung
  async play(): Promise<void> {
    this.sendOSC('/ardour/transport/play')
  }

  async stop(): Promise<void> {
    this.sendOSC('/ardour/transport/stop')
  }

  async record(): Promise<void> {
    this.sendOSC('/ardour/transport/record')
  }

  async stopRecord(): Promise<void> {
    this.sendOSC('/ardour/transport/stop_record')
  }

  // Track-Management
  async createAudioTrack(name?: string): Promise<string> {
    const trackName = name || `Audio Track ${Date.now()}`
    this.sendOSC('/ardour/add_audio_track', trackName)
    return `audio_track_${Date.now()}`
  }

  async createMIDITrack(name?: string): Promise<string> {
    const trackName = name || `MIDI Track ${Date.now()}`
    this.sendOSC('/ardour/add_midi_track', trackName)
    return `midi_track_${Date.now()}`
  }

  async enableTrackRecord(trackId: string): Promise<void> {
    this.sendOSC('/ardour/track/record_enable', trackId, 1)
  }

  async disableTrackRecord(trackId: string): Promise<void> {
    this.sendOSC('/ardour/track/record_enable', trackId, 0)
  }

  async setTrackMute(trackId: string, muted: boolean): Promise<void> {
    this.sendOSC('/ardour/track/mute', trackId, muted ? 1 : 0)
  }

  async setTrackSolo(trackId: string, soloed: boolean): Promise<void> {
    this.sendOSC('/ardour/track/solo', trackId, soloed ? 1 : 0)
  }

  // Plugin-Management
  async addPluginToTrack(trackId: string, pluginName: string): Promise<string> {
    this.sendOSC('/ardour/track/plugin/add', trackId, pluginName)
    return `plugin_${Date.now()}`
  }

  async setPluginParameter(pluginId: string, parameter: string, value: number): Promise<void> {
    this.sendOSC('/ardour/plugin/parameter/set', pluginId, parameter, value)
  }

  // Session-Management
  async loadSession(sessionPath: string): Promise<void> {
    this.sendOSC('/ardour/session/load', sessionPath)
  }

  async saveSession(): Promise<void> {
    this.sendOSC('/ardour/session/save')
  }

  async getSessionInfo(): Promise<ArdourSession | null> {
    this.sendOSC('/ardour/session/info')
    return this.session
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
} 