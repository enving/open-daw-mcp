#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function createTestAudioOnVM() {
  console.log('🎵 Erstelle Test-Audio auf der VM...')
  
  const ardourEngine = new ArdourOSCDAWEngineVM({
    vmHost: '87.106.81.49',
    vmUser: 'root',
    vmSshKey: '~/.ssh/vm_key',
    localOscPort: 9099,
    vmOscPort: 3819
  })
  
  try {
    // 1. Initialisiere Ardour Engine
    console.log('\n1️⃣ Initialisiere Ardour Engine...')
    const initialized = await ardourEngine.initialize()
    
    if (!initialized) {
      console.error('❌ Initialisierung fehlgeschlagen')
      return
    }
    
    console.log('✅ Ardour Engine initialisiert')
    
    // 2. Erstelle neue Session
    console.log('\n2️⃣ Erstelle neue Ardour Session...')
    const sessionName = `test_audio_session_${Date.now()}`
    await ardourEngine.createNewSession(sessionName)
    console.log('✅ Ardour Session erstellt:', sessionName)
    
    // 3. Erstelle eine einfache Audio-Datei auf der VM
    console.log('\n3️⃣ Erstelle Test-Audio-Datei auf der VM...')
    await createSimpleAudioFileOnVM()
    
    // 4. Lade die Audio-Datei herunter
    console.log('\n4️⃣ Lade Audio-Datei herunter...')
    await downloadAudioFromVM()
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 5. Trenne Verbindung
    console.log('\n5️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

async function createSimpleAudioFileOnVM() {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Erstelle eine einfache WAV-Datei mit sox auf der VM
    const soxCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && sox -n -r 44100 -c 2 test_audio_${Date.now()}.wav synth 5 sine 440 vol 0.5"`
    
    console.log('🔧 Erstelle Audio-Datei mit sox...')
    const { stdout, stderr } = await execAsync(soxCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ Sox Warning:', stderr)
    }
    
    console.log('✅ Audio-Datei auf VM erstellt')
    
    // Zeige die erstellte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Dateien auf VM:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Audio-Datei:', error.message)
    
    // Alternative: Erstelle eine einfache Text-Datei als Beweis
    try {
      const echoCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo 'Test Audio File - Created by Open DAW MCP Integration' > /opt/open-daw-mcp/output/test_audio_${Date.now()}.txt"`
      await execAsync(echoCommand)
      console.log('✅ Test-Datei auf VM erstellt')
    } catch (echoError) {
      console.error('❌ Auch Test-Datei fehlgeschlagen:', echoError.message)
    }
  }
}

async function downloadAudioFromVM() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'vm_audio')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Output-Verzeichnis:', outputDir)
    
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Lade alle Dateien von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/ ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Dateien von VM heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Dateien:')
    files.forEach(file => {
      const filePath = join(outputDir, file)
      console.log(`- ${file} (${filePath})`)
    })
    
    // Zeige Dateigröße
    const { stat } = await import('fs/promises')
    for (const file of files) {
      try {
        const filePath = join(outputDir, file)
        const stats = await stat(filePath)
        console.log(`📊 ${file}: ${stats.size} bytes`)
      } catch (error) {
        console.log(`⚠️ Konnte Größe von ${file} nicht ermitteln`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
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
createTestAudioOnVM().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 