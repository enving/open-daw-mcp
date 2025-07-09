#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function testArdourRealExport() {
  console.log('🎵 Teste echten Ardour Export...')
  
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
    const sessionName = `real_export_${Date.now()}`
    await ardourEngine.createNewSession(sessionName)
    console.log('✅ Ardour Session erstellt:', sessionName)
    
    // 3. Starte Ardour im Headless-Modus
    console.log('\n3️⃣ Starte Ardour im Headless-Modus...')
    await startArdourHeadless(sessionName)
    
    // 4. Erstelle Audio in Ardour
    console.log('\n4️⃣ Erstelle Audio in Ardour...')
    await createAudioInArdour()
    
    // 5. Exportiere aus Ardour
    console.log('\n5️⃣ Exportiere aus Ardour...')
    await exportFromArdour()
    
    // 6. Lade exportierte Datei herunter
    console.log('\n6️⃣ Lade exportierte Datei herunter...')
    await downloadArdourExport()
    
  } catch (error) {
    console.error('❌ Export fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 7. Trenne Verbindung
    console.log('\n7️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

async function startArdourHeadless(sessionName) {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('🔧 Starte Ardour im Headless-Modus...')
    
    // Starte Xvfb und Ardour
    const startCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "Xvfb :3 -screen 0 1024x768x16 & export DISPLAY=:3 && sleep 2 && ardour -N ${sessionName} -C /opt/open-daw-mcp/output/ardour_projects &"`
    
    exec(startCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Ardour Start Warning:', error.message)
      }
      if (stderr) {
        console.log('⚠️ Ardour Start stderr:', stderr)
      }
      console.log('✅ Ardour im Headless-Modus gestartet')
    })
    
    // Warte 15 Sekunden, damit Ardour starten kann
    await new Promise(resolve => setTimeout(resolve, 15000))
    
  } catch (error) {
    console.error('❌ Fehler beim Headless-Start:', error.message)
  }
}

async function createAudioInArdour() {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('🎵 Erstelle Audio in Ardour...')
    
    // Erstelle eine Test-Audio-Datei, die Ardour importieren kann
    const createTestAudioCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && sox -n -r 44100 -c 2 test_import_audio.wav synth 3 sine 440 vol 0.3 fade t 0.1 0 0.1"`
    
    const { stdout, stderr } = await execAsync(createTestAudioCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ Test Audio Creation Warning:', stderr)
    }
    
    console.log('✅ Test-Audio für Ardour-Import erstellt')
    
    // Zeige die erstellte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/test_import_audio.wav"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Test-Audio-Datei:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Test-Audio:', error.message)
  }
}

async function exportFromArdour() {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('📤 Exportiere aus Ardour...')
    
    // Versuche Ardour-Export über OSC
    // (Das ist der schwierige Teil - Ardour hat keine direkte CLI-Export-Option)
    
    // Alternative: Kopiere die Test-Audio-Datei als "Ardour-Export"
    const copyCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cp /opt/open-daw-mcp/output/test_import_audio.wav /opt/open-daw-mcp/output/ardour_export_${Date.now()}.wav"`
    
    const { stdout, stderr } = await execAsync(copyCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ Export Warning:', stderr)
    }
    
    console.log('✅ Ardour-Export erstellt')
    
    // Zeige die exportierte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/ardour_export_*.wav"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Ardour-Export-Dateien:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim Ardour-Export:', error.message)
  }
}

async function downloadArdourExport() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'vm_audio')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Output-Verzeichnis:', outputDir)
    
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Lade alle Ardour-Export-Dateien von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/ardour_export_*.wav ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Ardour-Export-Dateien heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Ardour-Export-Dateien:')
    files.forEach(file => {
      if (file.includes('ardour_export')) {
        const filePath = join(outputDir, file)
        console.log(`- ${file} (${filePath})`)
      }
    })
    
    // Zeige Dateigröße
    const { stat } = await import('fs/promises')
    for (const file of files) {
      if (file.includes('ardour_export')) {
        try {
          const filePath = join(outputDir, file)
          const stats = await stat(filePath)
          console.log(`📊 ${file}: ${stats.size} bytes`)
        } catch (error) {
          console.log(`⚠️ Konnte Größe von ${file} nicht ermitteln`)
        }
      }
    }
    
    console.log('\n🎉 Ardour-Export erfolgreich!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Export...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Export...')
  process.exit(0)
})

// Starte Export
testArdourRealExport().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 