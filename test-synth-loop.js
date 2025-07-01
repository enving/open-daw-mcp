#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// MCP Server starten
const serverProcess = spawn('node', [join(__dirname, 'src/server/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let serverReady = false
let requestId = 1

// Server-Ausgabe überwachen
serverProcess.stdout.on('data', (data) => {
  const output = data.toString()
  console.log('Server Output:', output)
  
  // Prüfe ob Server bereit ist
  if (output.includes('MCP Server gestartet')) {
    serverReady = true
    console.log('✅ MCP Server ist bereit!')
    sendSynthLoopRequest()
  }
})

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString())
})

// Synthesizer-Loop Request senden
function sendSynthLoopRequest() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'create_synth_loop',
      arguments: {
        description: 'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien und atmosphärischen Pad-Sounds',
        bpm: 128,
        key: 'A',
        scale: 'minor'
      }
    }
  }

  console.log('\n🎵 Sende Synthesizer-Loop Request...')
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
          console.log('\n🎉 Synthesizer-Loop Response erhalten!')
          console.log('Response:', JSON.stringify(response, null, 2))
          
          if (response.result && response.result.success) {
            console.log('\n✅ Synthesizer-Loop erfolgreich erstellt!')
            console.log('📁 AudioClip ID:', response.result.audioClip?.id)
            console.log('🎛️ Track ID:', response.result.trackId)
            console.log('🔌 Plugin ID:', response.result.pluginId)
            console.log('🎵 BPM:', response.result.audioClip?.bpm)
            console.log('🎼 Key:', response.result.audioClip?.key)
            console.log('📏 Scale:', response.result.audioClip?.scale)
          } else {
            console.log('\n❌ Fehler beim Erstellen des Synthesizer-Loops:')
            console.log('Error:', response.result?.error)
          }
          
          // Server beenden
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

console.log('🚀 Starte MCP Server für Synthesizer-Loop Test...')
console.log('Warte auf Server-Bereitschaft...') 