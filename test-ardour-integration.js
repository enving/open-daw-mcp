#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ArdourIntegrationTester {
  constructor() {
    this.mcpServer = null
    this.testResults = []
  }

  async startMCPServer() {
    console.log('🚀 Starte MCP Server...')
    
    return new Promise((resolve, reject) => {
      this.mcpServer = spawn('node', ['src/server/manual-mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: join(__dirname)
      })

      this.mcpServer.stdout.on('data', (data) => {
        const output = data.toString()
        console.log('📤 MCP Server Output:', output)
        
        if (output.includes('Warte auf JSON-RPC Requests')) {
          console.log('✅ MCP Server bereit')
          resolve()
        }
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

      // Timeout nach 10 Sekunden
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

  async testArdourStatus() {
    console.log('\n🧪 Teste Ardour Status...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'ardour_status',
        arguments: {}
      })

      console.log('✅ Ardour Status Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'ardour_status', success: true, response })
      
      return response
    } catch (error) {
      console.error('❌ Ardour Status Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_status', success: false, error: error.message })
      throw error
    }
  }

  async testArdourCommand() {
    console.log('\n🧪 Teste Ardour Command...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'ardour_command',
        arguments: {
          command: 'play'
        }
      })

      console.log('✅ Ardour Command Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'ardour_command', success: true, response })
      
      return response
    } catch (error) {
      console.error('❌ Ardour Command Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_command', success: false, error: error.message })
      throw error
    }
  }

  async testArdourCreateTrack() {
    console.log('\n🧪 Teste Ardour Track Erstellung...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'ardour_create_track',
        arguments: {
          name: 'Test Bass',
          type: 'midi'
        }
      })

      console.log('✅ Ardour Create Track Response:', JSON.stringify(response, null, 2))
      this.testResults.push({ test: 'ardour_create_track', success: true, response })
      
      return response
    } catch (error) {
      console.error('❌ Ardour Create Track Test fehlgeschlagen:', error)
      this.testResults.push({ test: 'ardour_create_track', success: false, error: error.message })
      throw error
    }
  }

  async testCreateSongWithArdour() {
    console.log('\n🧪 Teste Song-Erstellung mit Ardour...')
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'create_song_with_ardour',
        arguments: {
          description: 'Ein psychedelischer Techno Track mit Bass und Drums',
          style: 'techno',
          artist: 'Tame Impala'
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

  async runAllTests() {
    console.log('🎵 Starte Ardour Integration Tests...')
    
    try {
      await this.startMCPServer()
      
      // Warte kurz bis Server bereit ist
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Führe Tests aus
      await this.testArdourStatus()
      await this.testArdourCommand()
      await this.testArdourCreateTrack()
      await this.testCreateSongWithArdour()
      
      console.log('\n🎉 Alle Tests abgeschlossen!')
      this.printTestSummary()
      
    } catch (error) {
      console.error('❌ Test Suite fehlgeschlagen:', error)
      this.printTestSummary()
    } finally {
      this.stopMCPServer()
    }
  }

  printTestSummary() {
    console.log('\n📊 Test Zusammenfassung:')
    console.log('=' * 50)
    
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
  }

  stopMCPServer() {
    if (this.mcpServer) {
      console.log('🛑 Stoppe MCP Server...')
      this.mcpServer.kill()
    }
  }
}

// Test ausführen
const tester = new ArdourIntegrationTester()

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Beende Tests...')
  tester.stopMCPServer()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Beende Tests...')
  tester.stopMCPServer()
  process.exit(0)
})

tester.runAllTests().catch(error => {
  console.error('❌ Test Suite Fehler:', error)
  process.exit(1)
}) 