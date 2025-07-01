#!/usr/bin/env node

import { IONOSClient } from './src/ionos/ionos-client.js'

async function testIONOSAPI() {
  console.log('🚀 Starte IONOS API Test...')
  
  try {
    // IONOS Client erstellen
    const ionosClient = new IONOSClient()
    console.log('📡 IONOS Client initialisiert')
    
    // Test: Synthesizer-Pattern generieren
    console.log('\n🎵 Generiere Synthesizer-Pattern mit IONOS API...')
    
    const patternResponse = await ionosClient.generateSynthPattern(
      'Ein energetischer Synthesizer-Loop mit pulsierenden Bass-Linien und atmosphärischen Pad-Sounds',
      128,
      'A',
      'minor'
    )
    
    console.log('\n📥 Rohe IONOS Antwort erhalten:')
    console.log('Länge:', patternResponse.length, 'Zeichen')
    console.log('Antwort:', patternResponse)
    
    // Pattern parsen
    console.log('\n🔍 Parse Pattern...')
    const patternData = await ionosClient.parseSynthPattern(patternResponse)
    
    console.log('\n✅ Pattern erfolgreich geparst!')
    console.log('📊 Pattern Details:')
    console.log('- BPM:', patternData.bpm)
    console.log('- Key:', patternData.key)
    console.log('- Scale:', patternData.scale)
    console.log('- Beschreibung:', patternData.description)
    console.log('- Vorgeschlagenes Plugin:', patternData.suggested_plugin)
    console.log('- Plugin Preset:', patternData.plugin_preset)
    
    if (patternData.pattern && Array.isArray(patternData.pattern)) {
      console.log('- Anzahl MIDI-Noten:', patternData.pattern.length)
      console.log('- Erste 3 Noten:')
      patternData.pattern.slice(0, 3).forEach((note, index) => {
        console.log(`  ${index + 1}. Note: ${note.note}, Velocity: ${note.velocity}, Duration: ${note.duration}s, Start: ${note.startTime}s`)
      })
    }
    
    // Test: Ardour-Befehle generieren
    console.log('\n🎛️ Teste Ardour-Befehle Generierung...')
    
    const commandResponse = await ionosClient.generateArdourCommand(
      'Erstelle einen MIDI-Track und füge einen Synthesizer hinzu'
    )
    
    console.log('\n📥 Ardour-Befehle Antwort:')
    console.log('Länge:', commandResponse.length, 'Zeichen')
    console.log('Antwort:', commandResponse)
    
    // Befehle parsen
    const commandsData = await ionosClient.parseArdourCommands(commandResponse)
    
    console.log('\n✅ Ardour-Befehle erfolgreich geparst!')
    console.log('📋 Befehle:')
    if (commandsData.commands && Array.isArray(commandsData.commands)) {
      commandsData.commands.forEach((cmd, index) => {
        console.log(`  ${index + 1}. ${cmd.type}: ${JSON.stringify(cmd)}`)
      })
    }
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
    
    // Zeige spezifische Fehlerinformationen
    if (error.message?.includes('IONOS_API_TOKEN')) {
      console.log('\n🔧 Konfiguration prüfen:')
      console.log('1. Kopiere env.example zu .env: cp env.example .env')
      console.log('2. Setze deinen IONOS API Token in .env')
      console.log('3. Führe den Test erneut aus')
    } else if (error.message?.includes('IONOS API')) {
      console.log('\n🌐 API Fehler - mögliche Ursachen:')
      console.log('1. Internetverbindung prüfen')
      console.log('2. IONOS API Verfügbarkeit prüfen')
      console.log('3. API Token Gültigkeit prüfen')
    }
  }
  
  console.log('\n🏁 IONOS API Test beendet.')
  process.exit(0)
}

// Test ausführen
testIONOSAPI() 