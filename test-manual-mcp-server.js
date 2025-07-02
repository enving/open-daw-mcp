#!/usr/bin/env node

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ManualMCPClient {
  constructor() {
    this.serverProcess = null
    this.requestId = 1
  }

  // Server starten
  startServer() {
    console.log('🚀 Starte Manual MCP Server...')
    
    const serverPath = join(__dirname, 'src/server/manual-mcp-server.js')
    this.serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Server Output
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.log('📤 Server Output:', output)
      }
    })
    
    this.serverProcess.stderr.on('data', (data) => {
      console.error('❌ Server Error:', data.toString())
    })
    
    this.serverProcess.on('close', (code) => {
      console.log('🏁 Server beendet mit Code:', code)
    })
    
    // Kurz warten bis Server bereit ist
    return new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Request senden
  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    }
    
    console.log('📤 Sende Request:', JSON.stringify(request, null, 2))
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 10000)
      
      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString().trim())
          clearTimeout(timeout)
          this.serverProcess.stdout.removeListener('data', responseHandler)
          resolve(response)
        } catch (error) {
          // Ignoriere nicht-JSON Output
        }
      }
      
      this.serverProcess.stdout.on('data', responseHandler)
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n')
    })
  }

  // Server beenden
  stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }

  // Tests ausführen
  async runTests() {
    try {
      await this.startServer()
      
      console.log('\n🧪 Starte Tests...\n')
      
      // Test 1: Tools auflisten
      console.log('📋 Test 1: Tools auflisten')
      const toolsResponse = await this.sendRequest('tools/list')
      console.log('✅ Tools Response:', JSON.stringify(toolsResponse, null, 2))
      
      // Test 2: Musikstile auflisten
      console.log('\n🎭 Test 2: Musikstile auflisten')
      const stylesResponse = await this.sendRequest('tools/call', {
        name: 'list_music_styles',
        arguments: {}
      })
      console.log('✅ Styles Response:', JSON.stringify(stylesResponse, null, 2))
      
      // Test 3: Song-Beschreibung analysieren
      console.log('\n📊 Test 3: Song-Beschreibung analysieren')
      const analysisResponse = await this.sendRequest('tools/call', {
        name: 'analyze_song_description',
        arguments: {
          description: 'Ein psychedelischer Song im Stil von Tame Impala mit viel Reverb und dreamy Melodien'
        }
      })
      console.log('✅ Analysis Response:', JSON.stringify(analysisResponse, null, 2))
      
      // Test 4: Song erstellen
      console.log('\n🎵 Test 4: Song erstellen')
      const createResponse = await this.sendRequest('tools/call', {
        name: 'create_song_from_description',
        arguments: {
          description: '"Dreamy Psychedelic Journey" - Ein psychedelischer Song im Stil von Tame Impala mit viel Reverb und dreamy Melodien',
          style: 'psychedelic_rock',
          bpm: 85,
          key: 'F#'
        }
      })
      console.log('✅ Create Response:', JSON.stringify(createResponse, null, 2))
      
      // Test 5: Techno Song erstellen
      console.log('\n🎵 Test 5: Techno Song erstellen')
      const technoResponse = await this.sendRequest('tools/call', {
        name: 'create_song_from_description',
        arguments: {
          description: '"Industrial Techno Beat" - Ein harter Techno Track mit repetitiven Beats und industriellen Klängen',
          style: 'techno',
          bpm: 130,
          key: 'A'
        }
      })
      console.log('✅ Techno Response:', JSON.stringify(technoResponse, null, 2))
      
      // Test 6: Ambient Song erstellen
      console.log('\n🎵 Test 6: Ambient Song erstellen')
      const ambientResponse = await this.sendRequest('tools/call', {
        name: 'create_song_from_description',
        arguments: {
          description: '"Atmospheric Ambient Journey" - Ein ruhiger Ambient Track mit atmosphärischen Pads und ethereal Klängen',
          style: 'ambient',
          bpm: 75,
          key: 'D'
        }
      })
      console.log('✅ Ambient Response:', JSON.stringify(ambientResponse, null, 2))
      
      console.log('\n🎉 Alle Tests erfolgreich abgeschlossen!')
      
    } catch (error) {
      console.error('❌ Test fehlgeschlagen:', error)
    } finally {
      this.stopServer()
    }
  }
}

// Tests ausführen
const client = new ManualMCPClient()
client.runTests() 