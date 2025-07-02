#!/usr/bin/env node

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

console.log('🧪 Teste IONOS LLM Integration im MCP Server (DEBUG MODE)...\n')

// MCP Server starten
const server = spawn('node', ['src/server/manual-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let serverReady = false
let requestId = 1

// Debug: Alle Server-Ausgaben loggen
server.stderr.on('data', (data) => {
  const output = data.toString()
  console.log('🔍 [STDERR] Server:', output.trim())
  
  if (output.includes('⏳ Warte auf JSON-RPC Requests')) {
    serverReady = true
    console.log('✅ MCP Server bereit für IONOS Tests\n')
    setTimeout(() => runIONOSTests(), 1000) // Kurze Verzögerung
  }
})

server.stdout.on('data', (data) => {
  const output = data.toString()
  console.log('📤 [STDOUT] Server:', output.trim())
})

// JSON-RPC Request senden
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  }
  
  const requestStr = JSON.stringify(request) + '\n'
  console.log(`📤 Sende Request: ${method}`)
  console.log(`📋 Request JSON:`, requestStr.trim())
  
  try {
    server.stdin.write(requestStr)
    console.log('✅ Request an Server gesendet')
  } catch (error) {
    console.error('❌ Fehler beim Senden des Requests:', error)
  }
}

// Tests ausführen
async function runIONOSTests() {
  console.log('🎵 Starte IONOS LLM Integration Tests...\n')
  
  // Test 1: Tools auflisten
  console.log('=== Test 1: Tools auflisten ===')
  sendRequest('tools/list')
  await sleep(3000)
  
  // Test 2: Musikstile auflisten
  console.log('\n=== Test 2: Musikstile auflisten ===')
  sendRequest('tools/call', {
    name: 'list_music_styles',
    arguments: {}
  })
  await sleep(3000)
  
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
  await sleep(15000) // Längere Wartezeit für IONOS API
  
  console.log('\n✅ Alle IONOS Tests abgeschlossen!')
  console.log('📁 Überprüfe das output/ Verzeichnis für erstellte Dateien.')
  
  // Server beenden
  console.log('🏁 Beende Server...')
  server.kill()
  process.exit(0)
}

function sleep(ms) {
  return new Promise(resolve => {
    console.log(`⏳ Warte ${ms}ms...`)
    setTimeout(resolve, ms)
  })
}

// Fehlerbehandlung
server.on('error', (error) => {
  console.error('❌ Server Fehler:', error)
  process.exit(1)
})

server.on('exit', (code) => {
  console.log(`🏁 Server beendet mit Code: ${code}`)
})

// Process-Signal-Handler
process.on('SIGINT', () => {
  console.log('\n🛑 Test abgebrochen durch Benutzer')
  server.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Test beendet')
  server.kill()
  process.exit(0)
}) 