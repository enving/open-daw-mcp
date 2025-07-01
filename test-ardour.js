import { spawn } from 'child_process'
import { ArdourClient } from './dist/ardour/ardour-client.js'

// Test der Ardour-Integration
async function testArdourIntegration() {
  console.log('Teste Ardour Integration...')
  
  const ardourClient = new ArdourClient()
  
  ardourClient.on('connected', () => {
    console.log('✅ Ardour verbunden')
  })
  
  ardourClient.on('error', (error) => {
    console.error('❌ Ardour Fehler:', error)
  })
  
  ardourClient.on('transportStateChanged', (state) => {
    console.log('🔄 Transport Status geändert:', state)
  })
  
  ardourClient.on('trackUpdated', (track) => {
    console.log('🎵 Track aktualisiert:', track)
  })
  
  try {
    // Versuche Verbindung zu Ardour
    await ardourClient.connect()
    
    // Teste einige Funktionen
    console.log('Teste Transport-Funktionen...')
    await ardourClient.play()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await ardourClient.stop()
    
    console.log('Teste Track-Erstellung...')
    const trackId = await ardourClient.createAudioTrack('Test Track')
    console.log('Track erstellt:', trackId)
    
    console.log('Teste Plugin-Hinzufügung...')
    const pluginId = await ardourClient.addPluginToTrack(trackId, 'ZynAddSubFX')
    console.log('Plugin hinzugefügt:', pluginId)
    
    console.log('✅ Alle Tests erfolgreich!')
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error)
  } finally {
    await ardourClient.disconnect()
  }
}

// Test des MCP-Servers
async function testMCPServer() {
  console.log('Teste MCP Server...')
  
  const serverProcess = spawn('node', ['dist/server/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  serverProcess.stdout.on('data', (data) => {
    console.log('Server Output:', data.toString())
  })

  serverProcess.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString())
  })

  serverProcess.on('close', (code) => {
    console.log(`Server beendet mit Code: ${code}`)
  })

  // Warte kurz und beende dann
  setTimeout(() => {
    serverProcess.kill()
  }, 5000)
}

// Führe Tests aus
async function runTests() {
  console.log('🚀 Starte Tests...\n')
  
  try {
    await testArdourIntegration()
    console.log('\n' + '='.repeat(50) + '\n')
    await testMCPServer()
  } catch (error) {
    console.error('Test-Suite fehlgeschlagen:', error)
  }
}

runTests().catch(console.error) 