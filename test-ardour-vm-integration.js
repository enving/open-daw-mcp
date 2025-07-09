#!/usr/bin/env node

import ArdourDAWEngineVM from './src/audio/ardour-daw-engine-vm.js'

async function testArdourVMIntegration() {
  console.log('🧪 Teste Ardour VM Integration...')
  
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
    
    // 2. Erstelle Test-Song-Daten
    const testSongData = {
      title: 'VM_Test_Song',
      bpm: 120,
      key: 'C',
      instruments: ['drums', 'bass', 'synth'],
      style: 'Techno'
    }
    
    // 3. Erstelle Projekt auf VM
    console.log('\n2️⃣ Erstelle Ardour Projekt auf VM...')
    const project = await ardourEngine.createSongProject(testSongData)
    console.log('✅ Projekt erstellt:', project.name)
    
    // 4. Teste Transport-Controls
    console.log('\n3️⃣ Teste Transport-Controls...')
    await ardourEngine.playProject()
    console.log('✅ Wiedergabe gestartet')
    
    // Warte 3 Sekunden
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    await ardourEngine.pauseProject()
    console.log('✅ Wiedergabe pausiert')
    
    // 5. Teste Track-Parameter
    console.log('\n4️⃣ Teste Track-Parameter...')
    await ardourEngine.adjustTrackParameter('bass', 'gain', 0.8)
    await ardourEngine.adjustTrackParameter('synth', 'pan', 0.3)
    console.log('✅ Track-Parameter angepasst')
    
    // 6. Hole Projekt-Status
    console.log('\n5️⃣ Hole Projekt-Status...')
    const status = await ardourEngine.getProjectStatus()
    console.log('✅ Projekt-Status:', JSON.stringify(status, null, 2))
    
    // 7. Speichere Projekt
    console.log('\n6️⃣ Speichere Projekt...')
    await ardourEngine.saveProject()
    console.log('✅ Projekt gespeichert')
    
    // 8. Stoppe Projekt
    console.log('\n7️⃣ Stoppe Projekt...')
    await ardourEngine.stopProject()
    console.log('✅ Projekt gestoppt')
    
    console.log('\n🎉 Alle Tests erfolgreich!')
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 9. Trenne Verbindung
    console.log('\n8️⃣ Trenne Verbindung...')
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
testArdourVMIntegration().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 