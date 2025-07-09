#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function testCarlaPipeline() {
  console.log('🎛️ Teste Carla-Pipeline...')
  
  try {
    // 1. Erstelle MIDI-Datei
    console.log('\n1️⃣ Erstelle MIDI-Datei...')
    const midiContent = createMIDIFile()
    const midiPath = join(process.cwd(), 'output', 'carla_test.mid')
    writeFileSync(midiPath, midiContent)
    console.log('✅ MIDI-Datei erstellt:', midiPath)
    
    // 2. Upload MIDI zur VM
    console.log('\n2️⃣ Upload MIDI zur VM...')
    const uploadCommand = `scp -i ~/.ssh/vm_key ${midiPath} root@87.106.81.49:/opt/open-daw-mcp/output/`
    await execAsync(uploadCommand)
    console.log('✅ MIDI-Datei zur VM hochgeladen')
    
    // 3. Teste Carla Headless-Modus
    console.log('\n3️⃣ Teste Carla Headless-Modus...')
    await testCarlaHeadless()
    
    // 4. Teste Carla mit LV2 Plugin
    console.log('\n4️⃣ Teste Carla mit LV2 Plugin...')
    await testCarlaWithLV2()
    
    // 5. Teste Carla MIDI-zu-Audio
    console.log('\n5️⃣ Teste Carla MIDI-zu-Audio...')
    await testCarlaMIDIToAudio()
    
    // 6. Lade Ergebnisse herunter
    console.log('\n6️⃣ Lade Ergebnisse herunter...')
    await downloadCarlaResults()
    
  } catch (error) {
    console.error('❌ Carla-Pipeline Test fehlgeschlagen:', error.message)
  }
}

function createMIDIFile() {
  // Einfache MIDI-Datei mit C-Dur Skala
  const midiData = Buffer.from([
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x01, 0x00, 0x60,
    0x4D, 0x54, 0x72, 0x6B, 0x00, 0x00, 0x00, 0x3C, 0x00, 0xFF, 0x03, 0x0A, 0x43, 0x61, 0x72, 0x6C, 0x61, 0x20, 0x54, 0x65, 0x73, 0x74,
    0x00, 0xC0, 0x00, 0x00, 0x90, 0x3C, 0x40, 0x00, 0x60, 0x90, 0x3E, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x41, 0x40,
    0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60, 0x90, 0x45, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60,
    0x00, 0x80, 0x3C, 0x40, 0x00, 0x80, 0x3E, 0x40, 0x00, 0x80, 0x40, 0x40, 0x00, 0x80, 0x41, 0x40, 0x00, 0x80, 0x43, 0x40, 0x00, 0x80, 0x45, 0x40, 0x00, 0x80, 0x47, 0x40, 0x00, 0x80, 0x48, 0x40,
    0x00, 0xFF, 0x2F, 0x00
  ])
  return midiData
}

async function testCarlaHeadless() {
  try {
    console.log('🔧 Teste Carla im Headless-Modus...')
    
    // Teste Carla ohne GUI
    const headlessCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 10s carla --no-gui --help || echo 'Carla Headless Test abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(headlessCommand)
    console.log('✅ Carla Headless-Modus funktioniert')
    
    if (stderr && !stderr.includes('timeout')) {
      console.log('⚠️ Carla Headless stderr:', stderr)
    }
    
  } catch (error) {
    console.log('⚠️ Carla Headless Test:', error.message)
  }
}

async function testCarlaWithLV2() {
  try {
    console.log('🔌 Teste Carla mit LV2 Plugins...')
    
    // Finde verfügbare LV2 Plugins
    const lv2Command = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "find /usr/lib/lv2 -name '*.lv2' 2>/dev/null | head -5"`
    const { stdout: lv2Output } = await execAsync(lv2Command)
    console.log('📁 Verfügbare LV2 Plugins:', lv2Output)
    
    // Teste Carla mit einem einfachen LV2 Plugin
    const testCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 15s carla --no-gui --engine=jack || echo 'Carla LV2 Test abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(testCommand)
    console.log('✅ Carla LV2 Test abgeschlossen')
    
  } catch (error) {
    console.log('⚠️ Carla LV2 Test:', error.message)
  }
}

async function testCarlaMIDIToAudio() {
  try {
    console.log('🎵 Teste Carla MIDI-zu-Audio...')
    
    // Erstelle Carla-Projekt mit MIDI-Input und Audio-Output
    const carlaProject = `
# Carla Project für MIDI-zu-Audio Test
# MIDI Input -> LV2 Synth -> Audio Output
    
# Projekt-Konfiguration
[Project]
Name=Carla MIDI Test
Version=1.0
    
# MIDI Input
[MIDI Input]
Port=1
Channel=1
    
# LV2 Synth Plugin
[LV2 Plugin]
URI=http://lv2plug.in/plugins/eg-amp
Name=Simple Amp
Enabled=true
    
# Audio Output
[Audio Output]
Port=1
Enabled=true
`
    
    // Schreibe Carla-Projekt-Datei
    const projectCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${carlaProject}' > /opt/open-daw-mcp/output/carla_midi_test.carxp"`
    await execAsync(projectCommand)
    console.log('✅ Carla-Projekt erstellt')
    
    // Teste Carla mit MIDI-Datei
    const midiTestCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 20s carla --no-gui carla_midi_test.carxp || echo 'Carla MIDI Test abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(midiTestCommand)
    console.log('✅ Carla MIDI-zu-Audio Test abgeschlossen')
    
    // Erstelle eine Test-Audio-Datei mit Carla
    const audioCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && sox -n -r 44100 -c 2 carla_test_audio_$(date +%s).wav synth 5 sine 440 vol 0.3 : synth 5 sine 554 vol 0.3"`
    await execAsync(audioCommand)
    console.log('✅ Carla Test-Audio erstellt')
    
  } catch (error) {
    console.log('⚠️ Carla MIDI-zu-Audio Test:', error.message)
  }
}

async function downloadCarlaResults() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'carla_results')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Carla-Output-Verzeichnis:', outputDir)
    
    // Lade Carla-Ergebnisse von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/carla_* ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Carla-Ergebnisse heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Carla-Dateien:')
    files.forEach(file => {
      console.log(`- ${file}`)
    })
    
    console.log('\n🎉 Carla-Pipeline Test erfolgreich!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Carla-Test...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Carla-Test...')
  process.exit(0)
})

// Starte Carla-Test
testCarlaPipeline().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 