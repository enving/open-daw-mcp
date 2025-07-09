#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function testCompleteArdourIntegration() {
  console.log('🎵 Teste vollständige Ardour Integration...')
  
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
    
    // 2. Erstelle Song-Daten
    console.log('\n2️⃣ Erstelle Song-Daten...')
    const songData = {
      title: 'Test Song Integration',
      style: 'psychedelic_rock',
      bpm: 120,
      instruments: ['drums', 'bass', 'guitar', 'synth'],
      duration: 30,
      structure: {
        intro: { duration: 4, instruments: ['synth'] },
        verse: { duration: 8, instruments: ['drums', 'bass', 'guitar'] },
        chorus: { duration: 8, instruments: ['drums', 'bass', 'guitar', 'synth'] },
        outro: { duration: 4, instruments: ['synth'] }
      }
    }
    
    console.log('✅ Song-Daten erstellt:', songData.title)
    
    // 3. Erstelle neue Session
    console.log('\n3️⃣ Erstelle neue Ardour Session...')
    const sessionName = `test_session_${Date.now()}`
    await ardourEngine.createNewSession(sessionName)
    console.log('✅ Ardour Session erstellt:', sessionName)
    
    // 4. Teste Transport-Controls
    console.log('\n4️⃣ Teste Transport-Controls...')
    
    await ardourEngine.playProject()
    console.log('✅ Wiedergabe gestartet')
    
    // Warte 3 Sekunden
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    await ardourEngine.stopProject()
    console.log('✅ Wiedergabe gestoppt')
    
    // 5. Teste Navigation
    console.log('\n5️⃣ Teste Navigation...')
    
    await ardourEngine.gotoStart()
    console.log('✅ Zum Anfang gegangen')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await ardourEngine.gotoEnd()
    console.log('✅ Zum Ende gegangen')
    
    // 6. Teste Track-Controls
    console.log('\n6️⃣ Teste Track-Controls...')
    
    // Mute Track 1
    await ardourEngine.setTrackMute(1, true)
    console.log('✅ Track 1 gemutet')
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Unmute Track 1
    await ardourEngine.setTrackMute(1, false)
    console.log('✅ Track 1 unmuted')
    
    // 7. Teste Utility-Funktionen
    console.log('\n7️⃣ Teste Utility-Funktionen...')
    
    await ardourEngine.toggleClick()
    console.log('✅ Click getoggled')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await ardourEngine.toggleClick()
    console.log('✅ Click wieder getoggled')
    
    // 8. Teste Aktionen
    console.log('\n8️⃣ Teste Aktionen...')
    
    await ardourEngine.executeArdourAction('Transport/goto-start')
    console.log('✅ Goto Start Aktion ausgeführt')
    
    await ardourEngine.executeArdourAction('Transport/goto-end')
    console.log('✅ Goto End Aktion ausgeführt')
    
    // 9. Speichere Projekt
    console.log('\n9️⃣ Speichere Projekt...')
    await ardourEngine.saveProject()
    console.log('✅ Projekt gespeichert')
    
    // 10. Zeige Status
    console.log('\n🔟 Zeige Status...')
    const status = ardourEngine.getStatus()
    console.log('📊 Status:', status)
    
    console.log('\n🎉 Ardour Integration erfolgreich!')
    
    // 11. Lade Audio-Dateien von der VM herunter
    console.log('\n1️⃣1️⃣ Lade Audio-Dateien von der VM herunter...')
    await downloadAudioFilesFromVM()
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 12. Trenne Verbindung
    console.log('\n1️⃣2️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

async function downloadAudioFilesFromVM() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'vm_audio')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Erstelle lokales Output-Verzeichnis:', outputDir)
    
    // Lade Audio-Dateien von der VM
    const vmAudioPath = '/opt/open-daw-mcp/output/'
    const localAudioPath = outputDir
    
    console.log('📥 Lade Audio-Dateien von VM...')
    
    // Verwende scp um Dateien von der VM zu kopieren
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    try {
      // Lade alle WAV-Dateien von der VM
      const scpCommand = `scp -i ~/.ssh/vm_key root@87.106.81.49:${vmAudioPath}*.wav ${localAudioPath}/`
      console.log('🔗 Führe SCP-Befehl aus:', scpCommand)
      
      const { stdout, stderr } = await execAsync(scpCommand)
      
      if (stderr && !stderr.includes('Warning')) {
        console.log('⚠️ SCP Warning:', stderr)
      }
      
      console.log('✅ Audio-Dateien von VM heruntergeladen')
      
      // Zeige verfügbare Dateien
      const { readdir } = await import('fs/promises')
      const files = await readdir(localAudioPath)
      
      console.log('\n📁 Verfügbare Audio-Dateien:')
      files.forEach(file => {
        if (file.endsWith('.wav') || file.endsWith('.mid')) {
          console.log(`- ${file}`)
        }
      })
      
    } catch (scpError) {
      console.log('⚠️ SCP fehlgeschlagen, versuche alternative Methode...')
      
      // Alternative: Verwende rsync
      try {
        const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:${vmAudioPath} ${localAudioPath}/`
        console.log('🔗 Führe rsync-Befehl aus:', rsyncCommand)
        
        const { stdout, stderr } = await execAsync(rsyncCommand)
        
        if (stderr && !stderr.includes('Warning')) {
          console.log('⚠️ rsync Warning:', stderr)
        }
        
        console.log('✅ Audio-Dateien mit rsync heruntergeladen')
        
      } catch (rsyncError) {
        console.log('⚠️ rsync fehlgeschlagen, versuche direkten SSH-Zugriff...')
        
        // Direkter SSH-Zugriff
        const sshCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la ${vmAudioPath}"`
        const { stdout } = await execAsync(sshCommand)
        
        console.log('📁 Dateien auf VM:', stdout)
        
        // Kopiere einzelne Dateien
        const fileList = stdout.split('\n').filter(line => line.includes('.wav') || line.includes('.mid'))
        
        for (const fileLine of fileList) {
          const fileName = fileLine.split(' ').pop()
          if (fileName && (fileName.endsWith('.wav') || fileName.endsWith('.mid'))) {
            const singleScpCommand = `scp -i ~/.ssh/vm_key root@87.106.81.49:${vmAudioPath}${fileName} ${localAudioPath}/`
            console.log(`📥 Kopiere ${fileName}...`)
            
            try {
              await execAsync(singleScpCommand)
              console.log(`✅ ${fileName} kopiert`)
            } catch (error) {
              console.log(`⚠️ ${fileName} konnte nicht kopiert werden:`, error.message)
            }
          }
        }
      }
    }
    
    // Zeige finale Dateien
    const { readdir } = await import('fs/promises')
    const finalFiles = await readdir(localAudioPath)
    
    console.log('\n🎵 Finale Audio-Dateien:')
    finalFiles.forEach(file => {
      if (file.endsWith('.wav') || file.endsWith('.mid')) {
        const filePath = join(localAudioPath, file)
        console.log(`- ${file} (${filePath})`)
      }
    })
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen der Audio-Dateien:', error.message)
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
testCompleteArdourIntegration().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 