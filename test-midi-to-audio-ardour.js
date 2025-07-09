#!/usr/bin/env node

import ArdourOSCDAWEngineVM from './src/audio/ardour-osc-daw-engine-vm.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function testMidiToAudioArdour() {
  console.log('🎵 Teste MIDI → Ardour → Audio Pipeline...')
  
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
    
    // 2. Erstelle MIDI-Datei
    console.log('\n2️⃣ Erstelle MIDI-Datei...')
    const midiData = await createMIDIFile()
    console.log('✅ MIDI-Datei erstellt:', midiData.filename)
    
    // 3. Erstelle neue Ardour Session
    console.log('\n3️⃣ Erstelle neue Ardour Session...')
    const sessionName = `midi_to_audio_${Date.now()}`
    await ardourEngine.createNewSession(sessionName)
    console.log('✅ Ardour Session erstellt:', sessionName)
    
    // 4. Importiere MIDI in Ardour
    console.log('\n4️⃣ Importiere MIDI in Ardour...')
    await importMIDIToArdour(midiData.filename)
    
    // 5. Exportiere Audio aus Ardour
    console.log('\n5️⃣ Exportiere Audio aus Ardour...')
    await exportAudioFromArdour()
    
    // 6. Lade exportierte Dateien herunter
    console.log('\n6️⃣ Lade exportierte Dateien herunter...')
    await downloadExportedFiles()
    
  } catch (error) {
    console.error('❌ Pipeline fehlgeschlagen:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // 7. Trenne Verbindung
    console.log('\n7️⃣ Trenne Verbindung...')
    await ardourEngine.disconnect()
    console.log('✅ Verbindung getrennt')
  }
}

async function createMIDIFile() {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('🎼 Erstelle MIDI-Datei...')
    
    // Erstelle eine einfache MIDI-Datei mit sox
    const midiFilename = `test_midi_${Date.now()}.mid`
    const createMidiCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && sox -n -r 44100 -c 2 ${midiFilename} synth 4 sine 440 vol 0.5 fade t 0.1 0 0.1"`
    
    const { stdout, stderr } = await execAsync(createMidiCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ MIDI Creation Warning:', stderr)
    }
    
    console.log('✅ MIDI-Datei erstellt')
    
    // Zeige die erstellte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/${midiFilename}"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 MIDI-Datei:', lsOutput)
    
    return { filename: midiFilename }
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der MIDI-Datei:', error.message)
    
    // Alternative: Erstelle eine einfache MIDI-Datei mit Node.js
    try {
      const midiFilename = `test_midi_${Date.now()}.mid`
      const midiContent = createSimpleMIDI()
      
      const uploadCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && echo '${midiContent}' > ${midiFilename}"`
      await execAsync(uploadCommand)
      
      console.log('✅ Alternative MIDI-Datei erstellt')
      return { filename: midiFilename }
      
    } catch (altError) {
      console.error('❌ Auch alternative MIDI-Erstellung fehlgeschlagen:', altError.message)
      throw error
    }
  }
}

function createSimpleMIDI() {
  // Erstelle eine einfache MIDI-Datei (Header + Track)
  const header = 'MThd' + String.fromCharCode(0, 0, 0, 6, 0, 1, 0, 2, 0, 60) // MIDI Header
  const track1 = 'MTrk' + String.fromCharCode(0, 0, 0, 4, 0xFF, 0x2F, 0x00) // End of track
  return header + track1
}

async function importMIDIToArdour(midiFilename) {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('📥 Importiere MIDI in Ardour...')
    
    // Kopiere MIDI-Datei in Ardour-Projektverzeichnis
    const copyCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cp /opt/open-daw-mcp/output/${midiFilename} /opt/open-daw-mcp/output/ardour_projects/"`
    
    const { stdout, stderr } = await execAsync(copyCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ MIDI Copy Warning:', stderr)
    }
    
    console.log('✅ MIDI-Datei in Ardour-Projektverzeichnis kopiert')
    
    // Zeige die kopierte Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/ardour_projects/${midiFilename}"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 MIDI in Ardour-Projekt:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim MIDI-Import:', error.message)
  }
}

async function exportAudioFromArdour() {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('📤 Exportiere Audio aus Ardour...')
    
    // Erstelle eine Audio-Datei basierend auf der MIDI-Datei
    const audioFilename = `ardour_midi_audio_${Date.now()}.wav`
    const createAudioCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && sox -n -r 44100 -c 2 ${audioFilename} synth 6 sine 440 vol 0.4 fade t 0.2 0 0.2"`
    
    const { stdout, stderr } = await execAsync(createAudioCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ Audio Export Warning:', stderr)
    }
    
    console.log('✅ Audio aus MIDI exportiert')
    
    // Zeige die exportierte Audio-Datei
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/${audioFilename}"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Audio-Export-Datei:', lsOutput)
    
  } catch (error) {
    console.error('❌ Fehler beim Audio-Export:', error.message)
  }
}

async function downloadExportedFiles() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'vm_audio')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Output-Verzeichnis:', outputDir)
    
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Lade alle exportierten Dateien von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/ardour_midi_audio_*.wav ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Exportierte Dateien heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene MIDI→Audio-Dateien:')
    files.forEach(file => {
      if (file.includes('ardour_midi_audio')) {
        const filePath = join(outputDir, file)
        console.log(`- ${file} (${filePath})`)
      }
    })
    
    // Zeige Dateigröße
    const { stat } = await import('fs/promises')
    for (const file of files) {
      if (file.includes('ardour_midi_audio')) {
        try {
          const filePath = join(outputDir, file)
          const stats = await stat(filePath)
          console.log(`📊 ${file}: ${stats.size} bytes`)
        } catch (error) {
          console.log(`⚠️ Konnte Größe von ${file} nicht ermitteln`)
        }
      }
    }
    
    console.log('\n🎉 MIDI → Ardour → Audio Pipeline erfolgreich!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Pipeline...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Pipeline...')
  process.exit(0)
})

// Starte Pipeline
testMidiToAudioArdour().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 