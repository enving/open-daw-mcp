#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// MCP Server starten
const serverProcess = spawn('node', [join(__dirname, 'test-mcp-basic.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let requestId = 1

// Server-Ausgabe überwachen
serverProcess.stdout.on('data', (data) => {
  const output = data.toString()
  console.log('Server Output:', output)
})

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString())
})

// Test-Request senden
function sendTestRequest() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'test_synth_loop',
      arguments: {
        description: 'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien',
        bpm: 128,
        key: 'A'
      }
    }
  }

  console.log('\n🎵 Sende Test Synthesizer-Loop Request...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Echo-Request senden
function sendEchoRequest() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'echo',
      arguments: {
        message: 'Hallo MCP Server!'
      }
    }
  }

  console.log('\n📢 Sende Echo Request...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Response verarbeiten
serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n')
  
  for (const line of lines) {
    if (line.trim() && line.startsWith('{')) {
      try {
        const response = JSON.parse(line)
        
        if (response.method === 'tools/call') {
          console.log('\n🎉 MCP Response erhalten!')
          console.log('Response:', JSON.stringify(response, null, 2))
          
          if (response.result && response.result.success) {
            console.log('\n✅ Tool erfolgreich ausgeführt!')
            console.log('📝 Message:', response.result.message)
            
            if (response.result.audioClip) {
              console.log('🎵 AudioClip ID:', response.result.audioClip.id)
              console.log('🎼 BPM:', response.result.audioClip.bpm)
              console.log('🎼 Key:', response.result.audioClip.key)
            }
            
            if (response.result.pattern) {
              console.log('🎼 Pattern Noten:', response.result.pattern.pattern.length)
            }
          } else {
            console.log('\n❌ Tool Fehler:')
            console.log('Error:', response.result?.error)
          }
          
          // Server beenden nach erfolgreichem Test
          setTimeout(() => {
            console.log('\n🛑 Beende Server...')
            serverProcess.kill()
            process.exit(0)
          }, 2000)
        }
      } catch (error) {
        // Ignoriere JSON Parse Fehler für andere Ausgaben
      }
    }
  }
})

// Cleanup bei Beendigung
process.on('SIGINT', () => {
  console.log('\n🛑 Beende Test...')
  serverProcess.kill()
  process.exit(0)
})

process.on('exit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})

// Starte Tests nach kurzer Verzögerung
setTimeout(() => {
  sendEchoRequest()
  
  setTimeout(() => {
    sendTestRequest()
  }, 1000)
}, 1000)

console.log('🚀 Starte MCP Client Test...')
console.log('Warte auf Server-Bereitschaft...') 