#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple Audio Server starten
const serverProcess = spawn('node', [join(__dirname, 'src/server/simple-audio-server.js')], {
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

// Test 1: Verfügbare Synthesizer auflisten
function testListAvailableSynths() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'list_available_synths',
    params: {}
  }

  console.log('\n🔍 Test 1: Liste verfügbare Synthesizer...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Test 2: Synthesizer-Audio generieren
function testGenerateSynthAudio() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'generate_synth_audio',
    params: {
      description: 'Ein energetischer Bass-Loop mit pulsierenden Synth-Linien',
      duration: 8,
      bpm: 128,
      key: 'A',
      scale: 'minor',
      synth_type: 'bass'
    }
  }

  console.log('\n🎵 Test 2: Generiere Synthesizer-Audio...')
  console.log('Request:', JSON.stringify(request, null, 2))
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n')
}

// Test 3: MIDI und Audio generieren
function testGenerateMIDIAndAudio() {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'generate_midi_and_audio',
    params: {
      description: 'Ein atmosphärischer Pad-Sound mit Arpeggios',
      output_format: 'wav'
    }
  }

  console.log('\n🎼 Test 3: Generiere MIDI und Audio...')
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
        
        if (response.jsonrpc === '2.0' && response.id) {
          console.log('\n🎉 JSON-RPC Response erhalten!')
          console.log('Response:', JSON.stringify(response, null, 2))
          
          if (response.result && response.result.success) {
            console.log('\n✅ Methode erfolgreich ausgeführt!')
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
          } else if (response.error) {
            console.log('\n❌ Methode Fehler:')
            console.log('Error Code:', response.error.code)
            console.log('Error Message:', response.error.message)
          }
          
          // Führe nächsten Test aus oder beende
          if (response.id === 1) {
            setTimeout(testGenerateSynthAudio, 1000)
          } else if (response.id === 2) {
            setTimeout(testGenerateMIDIAndAudio, 1000)
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
setTimeout(testListAvailableSynths, 1000)

console.log('🚀 Starte Simple Audio Client Test...')
console.log('Warte auf Server-Bereitschaft...') 