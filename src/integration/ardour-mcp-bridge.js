import { spawn } from 'child_process'
import { join } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, existsSync } from 'fs'

class ArdourMCPBridge extends EventEmitter {
  constructor() {
    super()
    this.ardourMCPProcess = null
    this.isConnected = false
    this.requestId = 1
    this.pendingRequests = new Map()
    this.ardourMCPPath = join(process.cwd(), 'external', 'ardour-mcp')
  }

  async initialize() {
    console.log('🎛️ Initialisiere Ardour MCP Bridge...')
    
    try {
      // Prüfe ob Ardour MCP Server kompiliert ist
      const binaryPath = join(this.ardourMCPPath, 'target', 'release', 'ardour_mcp_server')
      
      if (!existsSync(binaryPath)) {
        console.log('🔨 Kompiliere Ardour MCP Server...')
        await this.compileArdourMCPServer()
      }
      
      // Starte Ardour MCP Server
      await this.startArdourMCPServer()
      
      this.isConnected = true
      console.log('✅ Ardour MCP Bridge initialisiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler bei Ardour MCP Bridge Initialisierung:', error.message)
      return false
    }
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
    
    this.ardourMCPProcess = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
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

  async sendArdourMCPRequest(method, params = {}) {
    if (!this.isConnected) {
      throw new Error('Ardour MCP Bridge nicht verbunden')
    }
    
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    }
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.id, { resolve, reject })
      
      const requestStr = JSON.stringify(request) + '\n'
      this.ardourMCPProcess.stdin.write(requestStr)
      
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
    return this.sendArdourMCPRequest('ardour/transport/play')
  }

  async stop() {
    return this.sendArdourMCPRequest('ardour/transport/stop')
  }

  async pause() {
    return this.sendArdourMCPRequest('ardour/transport/pause')
  }

  async locate(position) {
    return this.sendArdourMCPRequest('ardour/transport/locate', { position })
  }

  async setTempo(bpm) {
    return this.sendArdourMCPRequest('ardour/transport/tempo', { bpm })
  }

  // Track Management
  async createTrack(name, type = 'audio') {
    return this.sendArdourMCPRequest('ardour/track/create', { name, type })
  }

  async deleteTrack(trackId) {
    return this.sendArdourMCPRequest('ardour/track/delete', { track_id: trackId })
  }

  async setTrackGain(trackId, gain) {
    return this.sendArdourMCPRequest('ardour/track/gain', { track_id: trackId, gain })
  }

  async setTrackMute(trackId, mute) {
    return this.sendArdourMCPRequest('ardour/track/mute', { track_id: trackId, mute })
  }

  async setTrackSolo(trackId, solo) {
    return this.sendArdourMCPRequest('ardour/track/solo', { track_id: trackId, solo })
  }

  // Plugin Management
  async addPluginToTrack(trackId, pluginName) {
    return this.sendArdourMCPRequest('ardour/plugin/add', { 
      track_id: trackId, 
      plugin_name: pluginName 
    })
  }

  async removePluginFromTrack(trackId, pluginId) {
    return this.sendArdourMCPRequest('ardour/plugin/remove', { 
      track_id: trackId, 
      plugin_id: pluginId 
    })
  }

  async setPluginParameter(trackId, pluginId, parameter, value) {
    return this.sendArdourMCPRequest('ardour/plugin/parameter', { 
      track_id: trackId, 
      plugin_id: pluginId, 
      parameter, 
      value 
    })
  }

  // MIDI Management
  async addMIDIToTrack(trackId, midiData) {
    return this.sendArdourMCPRequest('ardour/midi/add', { 
      track_id: trackId, 
      midi_data: midiData 
    })
  }

  async removeMIDIFromTrack(trackId, midiId) {
    return this.sendArdourMCPRequest('ardour/midi/remove', { 
      track_id: trackId, 
      midi_id: midiId 
    })
  }

  // Project Management
  async createProject(name, sampleRate = 48000) {
    return this.sendArdourMCPRequest('ardour/project/create', { name, sample_rate: sampleRate })
  }

  async openProject(path) {
    return this.sendArdourMCPRequest('ardour/project/open', { path })
  }

  async saveProject() {
    return this.sendArdourMCPRequest('ardour/project/save')
  }

  async exportProject(format = 'wav', path) {
    return this.sendArdourMCPRequest('ardour/project/export', { format, path })
  }

  // General Actions
  async executeAction(action) {
    return this.sendArdourMCPRequest('ardour/access_action', { action })
  }

  // Status Queries
  async getTransportState() {
    return this.sendArdourMCPRequest('ardour/transport/state')
  }

  async getTracks() {
    return this.sendArdourMCPRequest('ardour/tracks/list')
  }

  async getTrackInfo(trackId) {
    return this.sendArdourMCPRequest('ardour/track/info', { track_id: trackId })
  }

  async getProjectInfo() {
    return this.sendArdourMCPRequest('ardour/project/info')
  }

  // Cleanup
  async disconnect() {
    if (this.ardourMCPProcess) {
      this.ardourMCPProcess.kill()
      this.ardourMCPProcess = null
    }
    this.isConnected = false
    console.log('🎛️ Ardour MCP Bridge getrennt')
  }
}

export default ArdourMCPBridge 