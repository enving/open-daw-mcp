import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import dgram from 'dgram'

class ArdourOSCBridgeVM extends EventEmitter {
  constructor(config = {}) {
    super()
    this.sshTunnelProcess = null
    this.isConnected = false
    
    // VM Konfiguration
    this.vmHost = config.vmHost || '87.106.81.49'
    this.vmUser = config.vmUser || 'root'
    this.vmSshKey = config.vmSshKey || '~/.ssh/vm_key'
    this.localOscPort = config.localOscPort || 9099
    this.vmOscPort = config.vmOscPort || 3819
    
    // OSC UDP Socket
    this.oscSocket = null
    this.oscTargetHost = '127.0.0.1'
    this.oscTargetPort = this.localOscPort
  }

  async initialize() {
    console.log('🎛️ Initialisiere Ardour OSC Bridge für VM...')
    
    try {
      // 1. SSH Tunnel zu VM erstellen
      await this.createSSHTunnel()
      
      // 2. OSC UDP Socket erstellen
      await this.createOSCSocket()
      
      this.isConnected = true
      console.log('✅ Ardour OSC Bridge für VM initialisiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler bei Ardour OSC Bridge VM Initialisierung:', error.message)
      return false
    }
  }

  async createSSHTunnel() {
    console.log('🔗 Erstelle SSH Tunnel zu VM...')
    
    return new Promise((resolve, reject) => {
      const sshArgs = [
        '-i', this.vmSshKey,
        '-L', `${this.localOscPort}:localhost:${this.vmOscPort}`,
        '-N', // Keine Remote-Befehle ausführen
        '-T', // Keine TTY zuweisen
        `${this.vmUser}@${this.vmHost}`
      ]
      
      this.sshTunnelProcess = spawn('ssh', sshArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      this.sshTunnelProcess.stdout.on('data', (data) => {
        console.log('🔗 SSH Tunnel:', data.toString())
      })
      
      this.sshTunnelProcess.stderr.on('data', (data) => {
        console.log('🔗 SSH Tunnel Error:', data.toString())
      })
      
      this.sshTunnelProcess.on('close', (code) => {
        console.log('🔗 SSH Tunnel beendet mit Code:', code)
        this.isConnected = false
        this.emit('disconnected')
      })
      
      // Warte kurz, damit sich der Tunnel etablieren kann
      setTimeout(() => {
        console.log('✅ SSH Tunnel zu VM erstellt')
        resolve()
      }, 2000)
    })
  }

  async createOSCSocket() {
    console.log('📡 Erstelle OSC UDP Socket...')
    
    return new Promise((resolve, reject) => {
      this.oscSocket = dgram.createSocket('udp4')
      
      this.oscSocket.on('error', (error) => {
        console.error('❌ OSC Socket Error:', error)
        reject(error)
      })
      
      this.oscSocket.on('message', (msg, rinfo) => {
        this.handleOSCMessage(msg, rinfo)
      })
      
      this.oscSocket.bind(() => {
        console.log('✅ OSC UDP Socket erstellt')
        resolve()
      })
    })
  }

  handleOSCMessage(msg, rinfo) {
    try {
      // Einfache OSC-Nachrichten-Parsing (für Feedback)
      const message = msg.toString()
      console.log('📡 OSC Feedback von Ardour:', message)
      
      // Emit OSC-Nachrichten für Event-Handler
      this.emit('oscMessage', { message, rinfo })
      
    } catch (error) {
      console.error('❌ Fehler beim Parsen OSC-Nachricht:', error)
    }
  }

  sendOSCMessage(address, args = []) {
    if (!this.isConnected || !this.oscSocket) {
      throw new Error('Ardour OSC Bridge nicht verbunden')
    }
    
    // Einfache OSC-Nachrichten-Formatierung
    const oscMessage = this.formatOSCMessage(address, args)
    const buffer = Buffer.from(oscMessage)
    
    this.oscSocket.send(buffer, this.oscTargetPort, this.oscTargetHost, (error) => {
      if (error) {
        console.error('❌ OSC Send Error:', error)
      } else {
        console.log(`📡 OSC gesendet: ${address} ${args.join(' ')}`)
      }
    })
  }

  formatOSCMessage(address, args) {
    // Einfache OSC-Nachrichten-Formatierung
    // In einer echten Implementierung würde hier eine OSC-Bibliothek verwendet
    const message = `${address} ${args.join(' ')}\n`
    return message
  }

  // Ardour Transport Controls
  async play() {
    this.sendOSCMessage('/transport_play')
  }

  async stop() {
    this.sendOSCMessage('/transport_stop')
  }

  async pause() {
    this.sendOSCMessage('/transport_stop') // Ardour hat kein pause, nur stop
  }

  async locate(position, roll = 0) {
    this.sendOSCMessage('/ardour/locate', [position, roll])
  }

  async setTempo(bpm) {
    const speed = bpm / 120.0
    this.sendOSCMessage('/ardour/transport_speed', [speed])
  }

  // Track Management
  async setTrackMute(trackId, mute) {
    this.sendOSCMessage('/ardour/routes/mute', [trackId, mute ? 1 : 0])
  }

  async setTrackSolo(trackId, solo) {
    this.sendOSCMessage('/ardour/routes/solo', [trackId, solo ? 1 : 0])
  }

  async setTrackGain(trackId, gain) {
    this.sendOSCMessage('/ardour/routes/gainabs', [trackId, gain])
  }

  async setTrackGainDB(trackId, gainDB) {
    this.sendOSCMessage('/ardour/routes/gain', [trackId, gainDB])
  }

  async setTrackRecord(trackId, record) {
    this.sendOSCMessage('/ardour/routes/recenable', [trackId, record ? 1 : 0])
  }

  // General Actions
  async executeAction(action) {
    this.sendOSCMessage('/ardour/access_action', [action])
  }

  // Utility Functions
  async gotoStart() {
    this.sendOSCMessage('/ardour/goto_start')
  }

  async gotoEnd() {
    this.sendOSCMessage('/ardour/goto_end')
  }

  async toggleLoop() {
    this.sendOSCMessage('/ardour/toggle_loop')
  }

  async toggleClick() {
    this.sendOSCMessage('/ardour/toggle_click')
  }

  async saveSession() {
    this.sendOSCMessage('/ardour/save')
  }

  async quitArdour() {
    this.sendOSCMessage('/ardour/quit')
  }

  async disconnect() {
    console.log('🔌 Trenne Ardour OSC Bridge VM Verbindung...')
    
    if (this.oscSocket) {
      this.oscSocket.close()
      this.oscSocket = null
    }
    
    if (this.sshTunnelProcess) {
      this.sshTunnelProcess.kill()
      this.sshTunnelProcess = null
    }
    
    this.isConnected = false
    console.log('✅ Ardour OSC Bridge VM Verbindung getrennt')
  }
}

export default ArdourOSCBridgeVM 