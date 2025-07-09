#!/usr/bin/env node

import ArdourDAWEngineVM from './src/audio/ardour-daw-engine-vm.js'

async function testArdourVMSimple() {
  console.log('🧪 Teste Ardour VM Integration (Einfach)...')
  
  const ardourEngine = new ArdourDAWEngineVM({
    vmHost: '87.106.81.49',
    vmUser: 'root',
    vmSshKey: '~/.ssh/vm_key',
    localOscPort: 9099,
    vmOscPort: 3819
  })
  
  try {
    // 1. Initialisiere Ardour DAW Engine für VM
    console.log('\n1️⃣ Initialisiere Ardour DAW Engine für VM...')
    const initialized = await ardourEngine.initialize()
    
    if (!initialized) {
      console.error('❌ Initialisierung fehlgeschlagen')
      return
    }
    
    console.log('✅ Ardour DAW Engine für VM initialisiert')
    
    // 2. Teste einfache Transport-Controls
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
    
    // 3. Teste einfache Aktionen
    console.log('\n3️⃣ Teste einfache Aktionen...')
    
    try {
      await ardourEngine.executeArdourAction('Transport/goto-start')
      console.log('✅ Goto Start ausgeführt')
      
      await ardourEngine.executeArdourAction('Transport/goto-end')
      console.log('✅ Goto End ausgeführt')
      
    } catch (error) {
      console.log('⚠️ Aktionen Test fehlgeschlagen:', error.message)
    }
    
    console.log('\n🎉 Einfache Tests abgeschlossen!')
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 4. Trenne Verbindung
    console.log('\n4️⃣ Trenne Verbindung...')
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
testArdourVMSimple().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 