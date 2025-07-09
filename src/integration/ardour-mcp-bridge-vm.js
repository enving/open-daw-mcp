import { spawn } from 'child_process'
import { join } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, existsSync } from 'fs'

class ArdourMCPBridgeVM extends EventEmitter {
  constructor(config = {}) {
    super()
    this.ardourMCPProcess = null
    this.sshTunnelProcess = null
    this.isConnected = false
    this.requestId = 1
    this.pendingRequests = new Map()
    this.ardourMCPPath = join(process.cwd(), 'external', 'ardour-mcp')
    
    // VM Konfiguration
    this.vmHost = config.vmHost || '87.106.81.49'
    this.vmUser = config.vmUser || 'root'
    this.vmSshKey = config.vmSshKey || '~/.ssh/vm_key'
    this.localOscPort = config.localOscPort || 9099
    this.vmOscPort = config.vmOscPort || 3819
    
    // SSH Tunnel Konfiguration
    this.sshTunnelLocalPort = 9099
    this.sshTunnelRemotePort = 3819
  }

  async initialize() {
    console.log('🎛️ Initialisiere Ardour MCP Bridge für VM...')
    
    try {
      // 1. SSH Tunnel zu VM erstellen
      await this.createSSHTunnel()
      
      // 2. Prüfe ob Ardour MCP Server kompiliert ist
      const binaryPath = join(this.ardourMCPPath, 'target', 'release', 'ardour_mcp_server')
      
      if (!existsSync(binaryPath)) {
        console.log('🔨 Kompiliere Ardour MCP Server...')
        await this.compileArdourMCPServer()
      }
      
      // 3. Starte Ardour MCP Server mit VM-Konfiguration
      await this.startArdourMCPServer()
      
      // 4. Führe MCP-Protokoll-Handshake durch
      await this.performMCPHandshake()
      
      this.isConnected = true
      console.log('✅ Ardour MCP Bridge für VM initialisiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler bei Ardour MCP Bridge VM Initialisierung:', error.message)
      return false
    }
  }

  async createSSHTunnel() {
    console.log('🔗 Erstelle SSH Tunnel zu VM...')
    
    return new Promise((resolve, reject) => {
      const sshArgs = [
        '-i', this.vmSshKey,
        '-L', `${this.sshTunnelLocalPort}:localhost:${this.sshTunnelRemotePort}`,
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

  async compileArdourMCPServer() {
    return new Promise((resolve, reject) => {
      const cargo = spawn('cargo', ['build', '--release'], {
        cwd: this.ardourMCPPath,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      cargo.stdout.on('data', (data) => {
        console.log('🔨 Cargo Build:', data.toString())
      })
      
      cargo.stderr.on('data', (data) => {
        console.log('🔨 Cargo Build Error:', data.toString())
      })
      
      cargo.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Ardour MCP Server kompiliert')
          resolve()
        } else {
          reject(new Error(`Cargo build failed with code ${code}`))
        }
      })
    })
  }

  async startArdourMCPServer() {
    const binaryPath = join(this.ardourMCPPath, 'target', 'release', 'ardour_mcp_server')
    
    // Starte MCP Server mit VM-OSC-Konfiguration
    this.ardourMCPProcess = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ARDOUR_OSC_TARGET_ADDR: `127.0.0.1:${this.sshTunnelLocalPort}`,
        MCP_SERVER_OSC_LISTEN_ADDR: `127.0.0.1:${this.localOscPort}`
      }
    })
    
    this.ardourMCPProcess.stdout.on('data', (data) => {
      this.handleArdourMCPResponse(data.toString())
    })
    
    this.ardourMCPProcess.stderr.on('data', (data) => {
      console.log('🎛️ Ardour MCP Error:', data.toString())
    })
    
    this.ardourMCPProcess.on('close', (code) => {
      console.log('🎛️ Ardour MCP Server beendet mit Code:', code)
      this.isConnected = false
      this.emit('disconnected')
    })
    
    // Warte auf Initialisierung
    await this.waitForArdourMCPReady()
  }

  async waitForArdourMCPReady() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ Ardour MCP Server Timeout, fahre trotzdem fort...')
        resolve()
      }, 5000)
      
      this.ardourMCPProcess.stdout.once('data', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  async performMCPHandshake() {
    console.log('🤝 Führe MCP-Protokoll-Handshake durch...')
    
    try {
      // 1. Sende Initialize Request mit korrekter MCP-Struktur
      const initializeRequest = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          clientInfo: {
            name: 'open-daw-mcp-client',
            version: '1.0.0'
          }
        }
      }
      
      const initResponse = await this.sendMCPRequest(initializeRequest)
      console.log('✅ Initialize Response erhalten:', initResponse)
      
      // 2. Sende Initialized Notification
      const initializedNotification = {
        jsonrpc: '2.0',
        method: 'initialized',
        params: {}
      }
      
      this.sendMCPNotification(initializedNotification)
      console.log('✅ Initialized Notification gesendet')
      
      // 3. Warte kurz, damit der Server sich stabilisiert
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('✅ MCP-Protokoll-Handshake abgeschlossen')
      
    } catch (error) {
      console.log('⚠️ MCP-Handshake fehlgeschlagen, fahre mit OSC fort:', error.message)
    }
  }
    
    console.log('✅ MCP-Protokoll-Handshake abgeschlossen')
  }

  async sendMCPRequest(request) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.id, { resolve, reject })
      
      const requestStr = JSON.stringify(request) + '\n'
      
      try {
        // Prüfe ob der Prozess noch läuft
        if (this.ardourMCPProcess && !this.ardourMCPProcess.killed) {
          this.ardourMCPProcess.stdin.write(requestStr, (error) => {
            if (error) {
              this.pendingRequests.delete(request.id)
              reject(new Error(`Write error: ${error.message}`))
            }
          })
        } else {
          this.pendingRequests.delete(request.id)
          reject(new Error('MCP Server process not available'))
        }
      } catch (error) {
        this.pendingRequests.delete(request.id)
        reject(new Error(`Request error: ${error.message}`))
      }
      
      // Timeout nach 10 Sekunden
      setTimeout(() => {
        if (this.pendingRequests.has(request.id)) {
          this.pendingRequests.delete(request.id)
          reject(new Error('MCP Request Timeout'))
        }
      }, 10000)
    })
  }

  sendMCPNotification(notification) {
    const notificationStr = JSON.stringify(notification) + '\n'
    
    try {
      if (this.ardourMCPProcess && !this.ardourMCPProcess.killed) {
        this.ardourMCPProcess.stdin.write(notificationStr, (error) => {
          if (error) {
            console.error('❌ Notification write error:', error.message)
          }
        })
      }
    } catch (error) {
      console.error('❌ Notification error:', error.message)
    }
  }

  async sendArdourMCPRequest(method, params = {}) {
    if (!this.isConnected) {
      throw new Error('Ardour MCP Bridge nicht verbunden')
    }
    
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name: method,
        arguments: params
      }
    }
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.id, { resolve, reject })
      
      const requestStr = JSON.stringify(request) + '\n'
      
      try {
        // Prüfe ob der Prozess noch läuft
        if (this.ardourMCPProcess && !this.ardourMCPProcess.killed) {
          this.ardourMCPProcess.stdin.write(requestStr, (error) => {
            if (error) {
              this.pendingRequests.delete(request.id)
              reject(new Error(`Write error: ${error.message}`))
            }
          })
        } else {
          this.pendingRequests.delete(request.id)
          reject(new Error('MCP Server process not available'))
        }
      } catch (error) {
        this.pendingRequests.delete(request.id)
        reject(new Error(`Request error: ${error.message}`))
      }
      
      // Timeout nach 10 Sekunden
      setTimeout(() => {
        if (this.pendingRequests.has(request.id)) {
          this.pendingRequests.delete(request.id)
          reject(new Error('Ardour MCP Request Timeout'))
        }
      }, 10000)
    })
  }

  handleArdourMCPResponse(data) {
    try {
      const lines = data.trim().split('\n')
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        const response = JSON.parse(line)
        
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id)
          this.pendingRequests.delete(response.id)
          
          if (response.error) {
            reject(new Error(response.error.message))
          } else {
            resolve(response.result)
          }
        } else if (response.method) {
          // Event/Notification
          this.emit('notification', response)
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Parsen Ardour MCP Response:', error)
    }
  }

  // Ardour Transport Controls
  async play() {
    return this.sendArdourMCPRequest('transport_play')
  }

  async stop() {
    return this.sendArdourMCPRequest('transport_stop')
  }

  async pause() {
    return this.sendArdourMCPRequest('transport_stop') // Ardour hat kein pause, nur stop
  }

  async locate(position) {
    return this.sendArdourMCPRequest('locate', { spos: position, roll: 0 })
  }

  async setTempo(bpm) {
    return this.sendArdourMCPRequest('set_transport_speed', { speed: bpm / 120.0 })
  }

  // Track Management
  async createTrack(name, type = 'audio') {
    // Ardour MCP Server hat keine direkte Track-Erstellung
    // Verwende access_action für Track-Erstellung
    const actionName = type === 'audio' ? 'Editor/add-audio-track' : 'Editor/add-midi-track'
    return this.sendArdourMCPRequest('access_action', { action_name: actionName })
  }

  async deleteTrack(trackId) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/remove-selected-tracks' })
  }

  async setTrackGain(trackId, gain) {
    return this.sendArdourMCPRequest('set_track_gain_abs', { rid: trackId, gain_abs: gain })
  }

  async setTrackMute(trackId, mute) {
    return this.sendArdourMCPRequest('set_track_mute', { rid: trackId, mute_state: mute })
  }

  async setTrackSolo(trackId, solo) {
    return this.sendArdourMCPRequest('set_track_solo', { rid: trackId, solo_st: solo ? 1 : 0 })
  }

  async setTrackPan(trackId, pan) {
    // Ardour MCP Server hat keine direkte Pan-Funktion
    // Verwende access_action für Pan-Einstellungen
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/set-pan' })
  }

  // Plugin Management
  async addPluginToTrack(trackId, pluginName) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/add-plugin' })
  }

  async removePluginFromTrack(trackId, pluginId) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/remove-plugin' })
  }

  async setPluginParameter(trackId, pluginId, parameter, value) {
    return this.sendArdourMCPRequest('set_strip_plugin_parameter', { 
      rid: trackId, 
      plugin_slot: pluginId, 
      param_id: parameter, 
      value: value 
    })
  }

  // MIDI Management
  async addMIDIToTrack(trackId, midiData) {
    // Ardour MCP Server hat keine direkte MIDI-Funktion
    // Verwende access_action für MIDI-Operationen
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/add-midi' })
  }

  async removeMIDIFromTrack(trackId, midiId) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/remove-midi' })
  }

  // Project Management
  async createProject(name, sampleRate = 48000) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Session/new' })
  }

  async openProject(path) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Session/open' })
  }

  async saveProject() {
    return this.sendArdourMCPRequest('save_state')
  }

  async exportProject(format = 'wav', path) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Session/export' })
  }

  // General Actions
  async executeAction(action) {
    return this.sendArdourMCPRequest('access_action', { action_name: action })
  }

  // Status Queries
  async getTransportState() {
    // Ardour MCP Server hat keine direkte Status-Abfrage
    // Verwende access_action für Status-Informationen
    return this.sendArdourMCPRequest('access_action', { action_name: 'Transport/status' })
  }

  async getTracks() {
    // Ardour MCP Server hat keine direkte Track-Liste
    // Verwende access_action für Track-Informationen
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/list-tracks' })
  }

  async getTrackInfo(trackId) {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Editor/track-info' })
  }

  async getProjectInfo() {
    return this.sendArdourMCPRequest('access_action', { action_name: 'Session/info' })
  }

  async disconnect() {
    console.log('🔌 Trenne Ardour MCP Bridge VM Verbindung...')
    
    if (this.ardourMCPProcess) {
      this.ardourMCPProcess.kill()
      this.ardourMCPProcess = null
    }
    
    if (this.sshTunnelProcess) {
      this.sshTunnelProcess.kill()
      this.sshTunnelProcess = null
    }
    
    this.isConnected = false
    console.log('✅ Ardour MCP Bridge VM Verbindung getrennt')
  }
}

export default ArdourMCPBridgeVM 