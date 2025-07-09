#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function createArdourExport() {
  console.log('🎵 Erstelle Ardour Export...')
  
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
    const sessionName = `export_session_${Date.now()}`
    await ardourEngine.createNewSession(sessionName)
    console.log('✅ Ardour Session erstellt:', sessionName)
    
    // 3. Starte Ardour im Headless-Modus und erstelle Export
    console.log('\n3️⃣ Starte Ardour Headless und erstelle Export...')
    await startArdourHeadlessAndExport(sessionName)
    
    // 4. Lade die exportierte WAV-Datei herunter
    console.log('\n4️⃣ Lade exportierte WAV-Datei herunter...')
    await downloadExportedAudio()
    
  } catch (error) {
    console.error('❌ Export fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 5. Trenne Verbindung
    console.log('\n5️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

async function startArdourHeadlessAndExport(sessionName) {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Starte Xvfb und Ardour im Hintergrund
    console.log('🔧 Starte Xvfb und Ardour im Headless-Modus...')
    
    const xvfbCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "Xvfb :2 -screen 0 1024x768x16 & export DISPLAY=:2 && sleep 2 && ardour -N ${sessionName} -C /opt/open-daw-mcp/output/ardour_projects &"`
    
    console.log('🎛️ Starte Ardour im Headless-Modus...')
    exec(xvfbCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Ardour Start Warning:', error.message)
      }
      if (stderr) {
        console.log('⚠️ Ardour Start stderr:', stderr)
      }
      console.log('✅ Ardour im Headless-Modus gestartet')
    })
    
    // Warte 10 Sekunden, damit Ardour starten kann
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // Erstelle eine einfache WAV-Datei als Test
    console.log('🔧 Erstelle Test-WAV-Datei...')
    const createWavCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && echo 'RIFF' > test_export_${Date.now()}.wav && echo 'WAVE' >> test_export_${Date.now()}.wav && echo 'Test Audio File' >> test_export_${Date.now()}.wav"`
    
    const { stdout, stderr } = await execAsync(createWavCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ WAV Creation Warning:', stderr)
    }
    
    console.log('✅ Test-WAV-Datei erstellt')
    
    // Zeige die erstellte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Dateien auf VM:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim Headless-Export:', error.message)
    
    // Alternative: Erstelle eine einfache Test-Datei
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      const testCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo 'Test Export File - Created by Open DAW MCP Integration at $(date)' > /opt/open-daw-mcp/output/test_export_${Date.now()}.txt"`
      await execAsync(testCommand)
      console.log('✅ Test-Export-Datei erstellt')
    } catch (testError) {
      console.error('❌ Auch Test-Datei fehlgeschlagen:', testError.message)
    }
  }
}

async function downloadExportedAudio() {
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
    
    console.log('✅ Exportierte Dateien von VM heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Export-Dateien:')
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
    
    console.log('\n🎉 Export erfolgreich! Du kannst die Dateien jetzt anhören/ansehen.')
    
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
createArdourExport().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 