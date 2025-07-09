#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import MPEMIDIGenerator from './src/audio/mpe-midi-generator.js'
import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class MPEArdourIntegrationTester {
  constructor() {
    this.mcpServer = null
    this.testResults = []
    this.mpeMidiGenerator = new MPEMIDIGenerator()
    this.ardourEngine = new ArdourOSCDAWEngineVM({
      mpeEnabled: true,
      midi2Enabled: true,
      mpeChannels: 16
    })
  }

  async startMCPServer() {
    console.log('🚀 Starte MCP Server für MPE Test...')
    
    return new Promise((resolve, reject) => {
      this.mcpServer = spawn('node', ['src/server/manual-mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: join(__dirname)
      })

      this.mcpServer.stderr.on('data', (data) => {
        const output = data.toString()
        console.log('⚠️ MCP Server Error:', output)
        
        if (output.includes('Warte auf JSON-RPC Requests')) {
          console.log('✅ MCP Server bereit')
          resolve()
        }
      })

      this.mcpServer.on('error', (error) => {
        console.error('❌ MCP Server Fehler:', error)
        reject(error)
      })

      setTimeout(() => {
        reject(new Error('MCP Server Start Timeout'))
      }, 10000)
    })
  }

  async sendRequest(method, params) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    }

    console.log(`📤 Sende Request: ${method}`)
    console.log('📋 Params:', JSON.stringify(params, null, 2))

    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n'
      this.mcpServer.stdin.write(requestStr)

      const timeout = setTimeout(() => {
        reject(new Error(`Request Timeout für ${method}`))
      }, 30000)

      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString())
          clearTimeout(timeout)
          this.mcpServer.stdout.removeListener('data', responseHandler)
          resolve(response)
        } catch (error) {
          // Ignoriere nicht-JSON Output
        }
      }

      this.mcpServer.stdout.on('data', responseHandler)
    })
  }

  async testMPEMIDIGeneration() {
    console.log('\n🧪 Teste MPE MIDI Generation...')
    
    try {
      const songData = {
        title: 'MPE Test Song',
        style: 'techno',
        tempo: 128,
        key: 'C',
        scale: 'major',
        structure: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Outro'],
        useMPE: true,
        useMIDI2: true
      }

      const midiData = this.mpeMidiGenerator.generateMPEMIDI(songData)
      const midiFilename = 'mpe_test_song.mid'
      const outputPath = join(__dirname, 'output')
      
      this.mpeMidiGenerator.saveMIDI(midiData, midiFilename, outputPath)
      
      console.log('✅ MPE MIDI Generation erfolgreich')
      this.testResults.push({ test: 'mpe_midi_generation', success: true })
      
      return { midiData, midiFilename, outputPath, songData }
      
    } catch (error) {
      console.error('❌ MPE MIDI Generation fehlgeschlagen:', error)
      this.testResults.push({ test: 'mpe_midi_generation', success: false, error: error.message })
      throw error
    }
  }

  async testArdourMPEIntegration(midiData, songData) {
    console.log('\n🧪 Teste Ardour MPE Integration...')
    
    try {
      // Ardour Engine initialisieren
      const initialized = await this.ardourEngine.initialize({
        mpeEnabled: true,
        midi2Enabled: true
      })
      
      if (!initialized) {
        throw new Error('Ardour Engine konnte nicht initialisiert werden')
      }
      
      console.log('✅ Ardour Engine initialisiert')
      
      // Song mit Ardour erstellen
      const outputPath = join(__dirname, 'output')
      const result = await this.ardourEngine.createSongWithArdour(songData, outputPath)
      
      console.log('✅ Ardour MPE Integration erfolgreich:', result)
      this.testResults.push({ test: 'ardour_mpe_integration', success: true, result })
      
      return result
      
    } catch (error) {
      console.error('❌ Ardour MPE Integration fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_mpe_integration', success: false, error: error.message })
      throw error
    }
  }

  async testCreateSongWithArdour() {
    console.log('\n🧪 Teste create_song_with_ardour Tool...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'create_song_with_ardour',
        arguments: {
          description: 'Ein psychedelischer Techno Track mit MPE Lead und Slide Bass',
          style: 'techno',
          artist: 'Tame Impala',
          useMPE: true,
          useMIDI2: true
        }
      })

      console.log('✅ Create Song with Ardour Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'create_song_with_ardour', success: true, response })
      
      return response
      
    } catch (error) {
      console.error('❌ Create Song with Ardour Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'create_song_with_ardour', success: false, error: error.message })
      throw error
    }
  }

  async testArdourMPEStatus() {
    console.log('\n🧪 Teste Ardour MPE Status...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'ardour_status',
        arguments: {}
      })

      console.log('✅ Ardour MPE Status Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'ardour_mpe_status', success: true, response })
      
      return response
      
    } catch (error) {
      console.error('❌ Ardour MPE Status Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_mpe_status', success: false, error: error.message })
      throw error
    }
  }

  async testArdourMPETrackCreation() {
    console.log('\n🧪 Teste Ardour MPE Track Creation...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'ardour_create_track',
        arguments: {
          name: 'MPE Lead',
          type: 'midi'
        }
      })

      console.log('✅ Ardour MPE Track Creation Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'ardour_mpe_track_creation', success: true, response })
      
      return response
      
    } catch (error) {
      console.error('❌ Ardour MPE Track Creation Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_mpe_track_creation', success: false, error: error.message })
      throw error
    }
  }

  async runAllTests() {
    console.log('🎵 Starte MPE/MIDI 2.0 Ardour Integration Tests...')
    
    try {
      await this.startMCPServer()
      
      // Warte kurz bis Server bereit ist
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test 1: MPE MIDI Generation
      const { midiData, midiFilename, outputPath, songData } = await this.testMPEMIDIGeneration()
      
      // Test 2: Ardour MPE Integration
      await this.testArdourMPEIntegration(midiData, songData)
      
      // Test 3: Create Song with Ardour Tool
      await this.testCreateSongWithArdour()
      
      // Test 4: Ardour MPE Status
      await this.testArdourMPEStatus()
      
      // Test 5: Ardour MPE Track Creation
      await this.testArdourMPETrackCreation()
      
      console.log('\n🎉 Alle MPE/MIDI 2.0 Tests abgeschlossen!')
      this.printTestSummary()
      
    } catch (error) {
      console.error('❌ MPE Test Suite fehlgeschlagen:', error)
      this.printTestSummary()
    } finally {
      this.stopMCPServer()
      await this.ardourEngine.disconnect()
    }
  }

  printTestSummary() {
    console.log('\n📊 MPE/MIDI 2.0 Test Zusammenfassung:')
    console.log('=' * 60)
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      const testName = result.test
      console.log(`${status} Test ${index + 1}: ${testName}`)
      
      if (!result.success) {
        console.log(`   Fehler: ${result.error}`)
      }
    })
    
    const successCount = this.testResults.filter(r => r.success).length
    const totalCount = this.testResults.length
    
    console.log(`\n📈 Erfolgsrate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`)
    
    if (successCount === totalCount) {
      console.log('\n🎉 MPE/MIDI 2.0 Integration erfolgreich!')
      console.log('🎛️ Du kannst jetzt expressive Synth-Audiospuren mit MPE/MIDI 2.0 erstellen!')
    }
  }

  stopMCPServer() {
    if (this.mcpServer) {
      console.log('🛑 Stoppe MCP Server...')
      this.mcpServer.kill()
    }
  }
}

// Test ausführen
const tester = new MPEArdourIntegrationTester()

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Beende MPE Tests...')
  tester.stopMCPServer()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Beende MPE Tests...')
  tester.stopMCPServer()
  process.exit(0)
})

tester.runAllTests().catch(error => {
  console.error('❌ MPE Test Suite Fehler:', error)
  process.exit(1)
}) 