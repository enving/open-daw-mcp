#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'

async function testArdourOSCVM() {
  console.log('🧪 Teste Ardour OSC VM Integration...')
  
  const ardourEngine = new ArdourOSCDAWEngineVM({
    vmHost: '87.106.81.49',
    vmUser: 'root',
    vmSshKey: '~/.ssh/vm_key',
    localOscPort: 9099,
    vmOscPort: 3819
  })
  
  try {
    // 1. Initialisiere Ardour OSC DAW Engine für VM
    console.log('\n1️⃣ Initialisiere Ardour OSC DAW Engine für VM...')
    const initialized = await ardourEngine.initialize()
    
    if (!initialized) {
      console.error('❌ Initialisierung fehlgeschlagen')
      return
    }
    
    console.log('✅ Ardour OSC DAW Engine für VM initialisiert')
    
    // 2. Teste Transport-Controls
    console.log('\n2️⃣ Teste Transport-Controls...')
    
    try {
      await ardourEngine.playProject()
      console.log('✅ Wiedergabe gestartet')
      
      // Warte 2 Sekunden
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await ardourEngine.stopProject()
      console.log('✅ Wiedergabe gestoppt')
      
    } catch (error) {
      console.log('⚠️ Transport-Controls Test fehlgeschlagen:', error.message)
    }
    
    // 3. Teste Navigation
    console.log('\n3️⃣ Teste Navigation...')
    
    try {
      await ardourEngine.gotoStart()
      console.log('✅ Zum Anfang gegangen')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await ardourEngine.gotoEnd()
      console.log('✅ Zum Ende gegangen')
      
    } catch (error) {
      console.log('⚠️ Navigation Test fehlgeschlagen:', error.message)
    }
    
    // 4. Teste Utility-Funktionen
    console.log('\n4️⃣ Teste Utility-Funktionen...')
    
    try {
      await ardourEngine.toggleClick()
      console.log('✅ Click getoggled')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await ardourEngine.toggleClick()
      console.log('✅ Click wieder getoggled')
      
    } catch (error) {
      console.log('⚠️ Utility-Funktionen Test fehlgeschlagen:', error.message)
    }
    
    // 5. Teste Track-Controls
    console.log('\n5️⃣ Teste Track-Controls...')
    
    try {
      await ardourEngine.setTrackMute(1, true)
      console.log('✅ Track 1 gemutet')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await ardourEngine.setTrackMute(1, false)
      console.log('✅ Track 1 unmuted')
      
    } catch (error) {
      console.log('⚠️ Track-Controls Test fehlgeschlagen:', error.message)
    }
    
    // 6. Teste Aktionen
    console.log('\n6️⃣ Teste Aktionen...')
    
    try {
      await ardourEngine.executeArdourAction('Transport/goto-start')
      console.log('✅ Goto Start Aktion ausgeführt')
      
      await ardourEngine.executeArdourAction('Transport/goto-end')
      console.log('✅ Goto End Aktion ausgeführt')
      
    } catch (error) {
      console.log('⚠️ Aktionen Test fehlgeschlagen:', error.message)
    }
    
    console.log('\n🎉 OSC VM Tests abgeschlossen!')
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 7. Trenne Verbindung
    console.log('\n7️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Tests...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Tests...')
  process.exit(0)
})

// Starte Tests
testArdourOSCVM().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 