#!/usr/bin/env node

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

console.log('🧪 Teste IONOS LLM Integration im MCP Server...\n')

// MCP Server starten
const server = spawn('node', ['src/server/manual-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let serverReady = false
let requestId = 1

// Server-Output verarbeiten
server.stderr.on('data', (data) => {
  const output = data.toString()
  console.log('🔍 Server:', output.trim())
  
  if (output.includes('⏳ Warte auf JSON-RPC Requests')) {
    serverReady = true
    console.log('✅ MCP Server bereit für IONOS Tests\n')
    runIONOSTests()
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
  console.log(`📋 Params:`, JSON.stringify(params, null, 2))
  
  server.stdin.write(JSON.stringify(request) + '\n')
}

// Tests ausführen
async function runIONOSTests() {
  console.log('🎵 Starte IONOS LLM Integration Tests...\n')
  
  // Test 1: Tools auflisten
  console.log('=== Test 1: Tools auflisten ===')
  sendRequest('tools/list')
  await sleep(2000)
  
  // Test 2: Musikstile auflisten
  console.log('\n=== Test 2: Musikstile auflisten ===')
  sendRequest('tools/call', {
    name: 'list_music_styles',
    arguments: {}
  })
  await sleep(2000)
  
  // Test 3: Song mit IONOS LLM erstellen
  console.log('\n=== Test 3: Song mit IONOS LLM erstellen ===')
  sendRequest('tools/call', {
    name: 'create_song_from_description',
    arguments: {
      description: 'Ein psychedelischer Techno-Track im Stil von Tame Impala mit hypnotischen Synth-Loops und atmosphärischen Pad-Sounds',
      style: 'Techno',
      artist: 'Tame Impala'
    }
  })
  await sleep(10000)
  
  // Test 4: Weitere Song-Variante
  console.log('\n=== Test 4: Ambient Song erstellen ===')
  sendRequest('tools/call', {
    name: 'create_song_from_description',
    arguments: {
      description: 'Ein ruhiger Ambient-Track mit sanften Piano-Klängen und subtilen Field Recordings',
      style: 'Ambient'
    }
  })
  await sleep(10000)
  
  console.log('\n✅ Alle IONOS Tests abgeschlossen!')
  console.log('📁 Überprüfe das output/ Verzeichnis für erstellte Dateien.')
  
  // Server beenden
  server.kill()
  process.exit(0)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Server-Responses verarbeiten
server.stdout.on('data', (data) => {
  const response = data.toString().trim()
  if (response) {
    try {
      const parsed = JSON.parse(response)
      console.log('📥 Response erhalten:')
      console.log(JSON.stringify(parsed, null, 2))
      
      if (parsed.result && parsed.result.success) {
        console.log('✅ Request erfolgreich!')
        if (parsed.result.files) {
          console.log('📁 Erstellte Dateien:', parsed.result.files)
        }
      }
    } catch (error) {
      console.log('📥 Raw Response:', response)
    }
  }
})

// Fehlerbehandlung
server.on('error', (error) => {
  console.error('❌ Server Fehler:', error)
  process.exit(1)
})

server.on('exit', (code) => {
  console.log(`🏁 Server beendet mit Code: ${code}`)
}) 