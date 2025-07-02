#!/usr/bin/env node

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

console.log('🧪 Teste Sprachmodell-Endpunkt...\n')

// MCP Server starten
const server = spawn('node', ['src/server/manual-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let serverReady = false
let requestId = 1

// Server-Output verarbeiten
server.stderr.on('data', (data) => {
  const output = data.toString()
  if (output.includes('⏳ Warte auf JSON-RPC Requests')) {
    serverReady = true
    console.log('✅ MCP Server bereit für Tests\n')
    runLanguageModelTests()
  }
})

// JSON-RPC Request senden
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  }
  
  console.log(`📤 Sende Request: ${method}`)
  server.stdin.write(JSON.stringify(request) + '\n')
}

// Response verarbeiten
server.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString().trim())
    console.log(`📥 Response erhalten (ID: ${response.id})`)
    
    if (response.result) {
      console.log('✅ Erfolgreiche Antwort:')
      console.log(JSON.stringify(response.result, null, 2))
    } else if (response.error) {
      console.log('❌ Fehler:')
      console.log(JSON.stringify(response.error, null, 2))
    }
    console.log('')
  } catch (error) {
    console.log('⚠️ Response konnte nicht geparst werden:', data.toString())
  }
})

// Sprachmodell-Tests
function runLanguageModelTests() {
  console.log('🎵 Starte Sprachmodell-Endpunkt Tests...\n')
  
  // Test 1: Einfache Beschreibung
  console.log('🧪 Test 1: Einfache Beschreibung')
  sendRequest('tools/call', {
    name: 'create_song_from_description',
    arguments: {
      description: 'Ein einfacher Techno-Track'
    }
  })
  
  setTimeout(() => {
    // Test 2: Detaillierte Beschreibung mit Stil
    console.log('🧪 Test 2: Detaillierte Beschreibung mit Stil')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein energetischer Techno-Track mit harten Bass-Kicks und repetitiven Hi-Hats',
        style: 'techno',
        bpm: 130
      }
    })
  }, 2000)
  
  setTimeout(() => {
    // Test 3: Künstler-Referenz
    console.log('🧪 Test 3: Künstler-Referenz (Tame Impala)')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein psychedelischer Song im Stil von Tame Impala mit viel Reverb und dreamy Melodien'
      }
    })
  }, 4000)
  
  setTimeout(() => {
    // Test 4: Komplexe Beschreibung
    console.log('🧪 Test 4: Komplexe Beschreibung')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: '"Cosmic Journey" - Ein atmosphärischer Ambient-Track mit ethereal Pads, sanften Arpeggios und einem subtilen Bass, der eine Reise durch den Weltraum simuliert',
        style: 'ambient',
        bpm: 75,
        key: 'D'
      }
    })
  }, 6000)
  
  setTimeout(() => {
    // Test 5: Beschreibung analysieren
    console.log('🧪 Test 5: Beschreibung analysieren')
    sendRequest('tools/call', {
      name: 'analyze_song_description',
      arguments: {
        description: 'Ein euphorischer Trance-Track mit uplifting Melodien und kraftvollen Drops'
      }
    })
  }, 8000)
  
  setTimeout(() => {
    // Test 6: House-Style mit Referenz
    console.log('🧪 Test 6: House-Style mit Daft Punk Referenz')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein grooviger House-Track im Stil von Daft Punk mit funky Bass-Linien und soulful Piano-Akkorden'
      }
    })
  }, 10000)
  
  setTimeout(() => {
    // Test 7: Drum & Bass
    console.log('🧪 Test 7: Drum & Bass')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein schneller Drum & Bass Track mit Breakbeats, Sub-Bass und Jungle-Sounds',
        style: 'drum_and_bass',
        bpm: 170
      }
    })
  }, 12000)
  
  setTimeout(() => {
    // Test 8: Psychedelic Rock
    console.log('🧪 Test 8: Psychedelic Rock')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein psychedelischer Rock-Song mit flauschigen Synths, Lo-Fi Drums und reverb-verhangenen Melodien',
        style: 'psychedelic_rock',
        bpm: 85,
        key: 'F#'
      }
    })
  }, 14000)
  
  setTimeout(() => {
    // Test 9: Stimmung-basierte Beschreibung
    console.log('🧪 Test 9: Stimmung-basierte Beschreibung')
    sendRequest('tools/call', {
      name: 'create_song_from_description',
      arguments: {
        description: 'Ein melancholischer, trauriger Song mit langsamen, traurigen Melodien'
      }
    })
  }, 16000)
  
  setTimeout(() => {
    // Test 10: Finale Analyse
    console.log('🧪 Test 10: Finale Analyse')
    sendRequest('tools/call', {
      name: 'analyze_song_description',
      arguments: {
        description: 'Ein energetischer, kraftvoller Song mit schnellen Beats und euphorischen Klängen'
      }
    })
  }, 18000)
  
  // Server beenden
  setTimeout(() => {
    console.log('🏁 Beende Tests...')
    server.stdin.end()
    server.kill()
    process.exit(0)
  }, 20000)
}

// Fehlerbehandlung
server.on('error', (error) => {
  console.error('❌ Server-Fehler:', error)
  process.exit(1)
})

server.on('close', (code) => {
  console.log(`🏁 Server beendet mit Code: ${code}`)
})

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Beende Tests...')
  server.stdin.end()
  server.kill()
  process.exit(0)
}) 