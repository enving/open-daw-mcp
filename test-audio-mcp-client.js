#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Audio MCP Server starten
const serverProcess = spawn('node', [join(__dirname, 'src/server/audio-mcp-server.js')], {
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

// Test 1: Synthesizer-Audio generieren
function testGenerateSynthAudio() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'generate_synth_audio',
      arguments: {
        description: 'Ein energetischer Bass-Loop mit pulsierenden Synth-Linien',
        duration: 8,
        bpm: 128,
        key: 'A',
        scale: 'minor',
        synth_type: 'bass'
      }
    }
  }

  console.log('\n🎵 Test 1: Generiere Synthesizer-Audio...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Test 2: MIDI und Audio generieren
function testGenerateMIDIAndAudio() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'generate_midi_and_audio',
      arguments: {
        description: 'Ein atmosphärischer Pad-Sound mit Arpeggios',
        output_format: 'wav'
      }
    }
  }

  console.log('\n🎼 Test 2: Generiere MIDI und Audio...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Test 3: Verfügbare Synthesizer auflisten
function testListAvailableSynths() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'list_available_synths',
      arguments: {}
    }
  }

  console.log('\n🔍 Test 3: Liste verfügbare Synthesizer...')
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
              console.log('🎵 AudioClip Details:')
              console.log('  ID:', response.result.audioClip.id)
              console.log('  Name:', response.result.audioClip.name)
              console.log('  MIDI-Pfad:', response.result.audioClip.midiPath)
              console.log('  Audio-Pfad:', response.result.audioClip.audioPath)
              console.log('  BPM:', response.result.audioClip.bpm)
              console.log('  Key:', response.result.audioClip.key)
              console.log('  Synth-Type:', response.result.audioClip.synthType)
            }
            
            if (response.result.synths) {
              console.log('🔍 Verfügbare Synthesizer:')
              response.result.synths.forEach((synth, index) => {
                console.log(`  ${index + 1}. ${synth.name} (${synth.type}) - ${synth.status}`)
                console.log(`     ${synth.description}`)
              })
            }
            
            if (response.result.pattern) {
              console.log('🎼 Pattern Details:')
              console.log('  Typ:', response.result.pattern.synthType)
              console.log('  Noten:', response.result.pattern.pattern.length)
              console.log('  BPM:', response.result.pattern.bpm)
            }
          } else {
            console.log('\n❌ Tool Fehler:')
            console.log('Error:', response.result?.error)
          }
          
          // Führe nächsten Test aus oder beende
          if (response.id === 1) {
            setTimeout(testGenerateMIDIAndAudio, 1000)
          } else if (response.id === 2) {
            setTimeout(testListAvailableSynths, 1000)
          } else if (response.id === 3) {
            setTimeout(() => {
              console.log('\n🛑 Beende Server...')
              serverProcess.kill()
              process.exit(0)
            }, 2000)
          }
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
setTimeout(testGenerateSynthAudio, 1000)

console.log('🚀 Starte Audio MCP Client Test...')
console.log('Warte auf Server-Bereitschaft...') 