#!/usr/bin/env node

import { DAWMCPServer } from './src/server/mcp-server.js'

async function testSynthLoop() {
  console.log('🚀 Starte Synthesizer-Loop Test...')
  
  try {
    // MCP Server erstellen
    const mcpServer = new DAWMCPServer()
    
    console.log('📡 MCP Server initialisiert...')
    
    // Test: Synthesizer-Loop erstellen (ohne Ardour)
    console.log('\n🎵 Erstelle Synthesizer-Loop mit IONOS API...')
    console.log('⚠️  Ardour ist nicht verfügbar - teste nur IONOS API Integration')
    
    const result = await mcpServer.createSynthLoop({
      description: 'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien und atmosphärischen Pad-Sounds',
      bpm: 128,
      key: 'A',
      scale: 'minor'
    })
    
    if (result.success) {
      console.log('\n✅ Synthesizer-Loop erfolgreich erstellt!')
      console.log('📁 AudioClip ID:', result.audioClip?.id)
      console.log('🎛️ Track ID:', result.trackId || 'N/A (Ardour nicht verfügbar)')
      console.log('🔌 Plugin ID:', result.pluginId || 'N/A (Ardour nicht verfügbar)')
      console.log('🎵 BPM:', result.audioClip?.bpm)
      console.log('🎼 Key:', result.audioClip?.key)
      console.log('📏 Scale:', result.audioClip?.scale)
      console.log('📝 Beschreibung:', result.audioClip?.name)
      console.log('📅 Erstellt am:', result.audioClip?.createdAt)
    } else {
      console.log('\n❌ Fehler beim Erstellen des Synthesizer-Loops:')
      console.log('Error:', result.error)
      
      // Zeige detaillierte Fehlerinformationen
      if (result.error?.includes('IONOS')) {
        console.log('\n💡 Mögliche Lösungen:')
        console.log('1. Prüfe ob IONOS_API_TOKEN in .env korrekt gesetzt ist')
        console.log('2. Stelle sicher, dass die IONOS API verfügbar ist')
        console.log('3. Prüfe die Internetverbindung')
      }
    }
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
    
    // Zeige spezifische Fehlerinformationen
    if (error.message?.includes('IONOS_API_TOKEN')) {
      console.log('\n🔧 Konfiguration prüfen:')
      console.log('1. Kopiere env.example zu .env: cp env.example .env')
      console.log('2. Setze deinen IONOS API Token in .env')
      console.log('3. Führe den Test erneut aus')
    }
  }
  
  console.log('\n🏁 Test beendet.')
  process.exit(0)
}

// Test ausführen
testSynthLoop() 