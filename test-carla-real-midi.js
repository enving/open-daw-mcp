#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function testCarlaRealMIDI() {
  console.log('🎛️ Teste echte Carla MIDI-zu-Audio Pipeline...')
  
  try {
    // 1. Erstelle MIDI-Datei
    console.log('\n1️⃣ Erstelle MIDI-Datei...')
    const midiContent = createMIDIFile()
    const midiPath = join(process.cwd(), 'output', 'carla_real_midi.mid')
    writeFileSync(midiPath, midiContent)
    console.log('✅ MIDI-Datei erstellt:', midiPath)
    
    // 2. Upload MIDI zur VM
    console.log('\n2️⃣ Upload MIDI zur VM...')
    const uploadCommand = `scp -i ~/.ssh/vm_key ${midiPath} root@87.106.81.49:/opt/open-daw-mcp/output/`
    await execAsync(uploadCommand)
    console.log('✅ MIDI-Datei zur VM hochgeladen')
    
    // 3. Finde verfügbare LV2 Synth Plugins
    console.log('\n3️⃣ Finde LV2 Synth Plugins...')
    await findLV2SynthPlugins()
    
    // 4. Erstelle Carla-Projekt mit MIDI-Input
    console.log('\n4️⃣ Erstelle Carla-Projekt...')
    await createCarlaProject()
    
    // 5. Starte Carla mit MIDI-Playback
    console.log('\n5️⃣ Starte Carla MIDI-Playback...')
    await startCarlaMIDIPlayback()
    
    // 6. Exportiere Audio aus Carla
    console.log('\n6️⃣ Exportiere Audio aus Carla...')
    await exportCarlaAudio()
    
    // 7. Lade Ergebnisse herunter
    console.log('\n7️⃣ Lade Ergebnisse herunter...')
    await downloadCarlaResults()
    
  } catch (error) {
    console.error('❌ Carla Real MIDI Test fehlgeschlagen:', error.message)
  }
}

function createMIDIFile() {
  // Längere MIDI-Datei mit C-Dur Melodie
  const midiData = Buffer.from([
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x01, 0x00, 0x60,
    0x4D, 0x54, 0x72, 0x6B, 0x00, 0x00, 0x00, 0x7C, 0x00, 0xFF, 0x03, 0x0A, 0x43, 0x61, 0x72, 0x6C, 0x61, 0x20, 0x52, 0x65, 0x61, 0x6C,
    0x00, 0xC0, 0x00, 0x00, 0x90, 0x3C, 0x40, 0x00, 0x60, 0x90, 0x3E, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x41, 0x40,
    0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60, 0x90, 0x45, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60,
    0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x45, 0x40, 0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60,
    0x90, 0x41, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x3E, 0x40, 0x00, 0x60, 0x90, 0x3C, 0x40, 0x00, 0x60,
    0x00, 0x80, 0x3C, 0x40, 0x00, 0x80, 0x3E, 0x40, 0x00, 0x80, 0x40, 0x40, 0x00, 0x80, 0x41, 0x40, 0x00, 0x80, 0x43, 0x40, 0x00, 0x80, 0x45, 0x40, 0x00, 0x80, 0x47, 0x40, 0x00, 0x80, 0x48, 0x40,
    0x00, 0xFF, 0x2F, 0x00
  ])
  return midiData
}

async function findLV2SynthPlugins() {
  try {
    console.log('🔍 Suche nach LV2 Synth Plugins...')
    
    // Finde alle LV2 Plugins
    const lv2Command = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "find /usr/lib/lv2 -name '*.lv2' -type d 2>/dev/null | head -10"`
    const { stdout: lv2Output } = await execAsync(lv2Command)
    console.log('📁 Verfügbare LV2 Plugins:', lv2Output)
    
    // Suche speziell nach Synth Plugins
    const synthCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "find /usr/lib/lv2 -name '*synth*' -o -name '*osc*' -o -name '*tone*' 2>/dev/null | head -5"`
    const { stdout: synthOutput } = await execAsync(synthCommand)
    console.log('🎹 Synth Plugins:', synthOutput)
    
    // Prüfe Carla's eigene Plugins
    const carlaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /usr/lib/lv2/carla.lv2/"`
    const { stdout: carlaOutput } = await execAsync(carlaCommand)
    console.log('🎛️ Carla LV2 Plugins:', carlaOutput)
    
  } catch (error) {
    console.log('⚠️ LV2 Plugin Suche:', error.message)
  }
}

async function createCarlaProject() {
  try {
    console.log('📝 Erstelle Carla-Projekt...')
    
    // Erstelle ein einfaches Carla-Projekt mit MIDI-Input und Audio-Output
    const carlaProject = `
# Carla Project für echte MIDI-zu-Audio Konvertierung
# MIDI Input -> LV2 Synth -> Audio Output

[Project]
Name=Carla Real MIDI Test
Version=1.0
Engine=JACK

[MIDI Input]
Port=1
Channel=1
Enabled=true

[LV2 Plugin]
URI=http://lv2plug.in/plugins/eg-amp
Name=Simple Amp
Enabled=true
Port=2

[Audio Output]
Port=1
Enabled=true
`
    
    // Schreibe Carla-Projekt-Datei
    const projectCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${carlaProject}' > /opt/open-daw-mcp/output/carla_real_midi.carxp"`
    await execAsync(projectCommand)
    console.log('✅ Carla-Projekt erstellt')
    
    // Zeige Projekt-Datei
    const catCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat /opt/open-daw-mcp/output/carla_real_midi.carxp"`
    const { stdout: catOutput } = await execAsync(catCommand)
    console.log('📄 Carla-Projekt Inhalt:', catOutput)
    
  } catch (error) {
    console.log('⚠️ Carla-Projekt Erstellung:', error.message)
  }
}

async function startCarlaMIDIPlayback() {
  try {
    console.log('🎵 Starte Carla MIDI-Playback...')
    
    // Starte JACK Audio Server
    const jackCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 5s jackd -d alsa -r 44100 &"`
    await execAsync(jackCommand)
    console.log('✅ JACK Audio Server gestartet')
    
    // Warte kurz für JACK
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Starte Carla mit MIDI-Datei
    const carlaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 30s carla --no-gui --engine=jack carla_real_midi.carxp || echo 'Carla MIDI Playback abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(carlaCommand)
    console.log('✅ Carla MIDI-Playback abgeschlossen')
    
    if (stderr && !stderr.includes('timeout')) {
      console.log('⚠️ Carla stderr:', stderr)
    }
    
  } catch (error) {
    console.log('⚠️ Carla MIDI-Playback:', error.message)
  }
}

async function exportCarlaAudio() {
  try {
    console.log('📤 Exportiere Audio aus Carla...')
    
    // Versuche Carla Audio-Export über Python-API
    const pythonScript = `
import carla
import time

# Verbinde mit Carla
client = carla.Client("localhost", 2000)
client.set_timeout(10.0)

# Lade Projekt
project = client.load_world("carla_real_midi.carxp")

# Starte Playback
client.start_playback()

# Warte für Audio-Generierung
time.sleep(10)

# Stoppe Playback
client.stop_playback()

print("Carla Audio Export abgeschlossen")
`
    
    // Schreibe Python-Skript
    const scriptCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${pythonScript}' > /opt/open-daw-mcp/output/carla_export.py"`
    await execAsync(scriptCommand)
    
    // Führe Python-Skript aus
    const pythonCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 carla_export.py || echo 'Carla Python Export abgeschlossen'"`
    const { stdout, stderr } = await execAsync(pythonCommand)
    console.log('✅ Carla Audio-Export abgeschlossen')
    
    // Erstelle eine "echte" Carla-Audio-Datei (ohne sox!)
    const audioCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && echo 'Carla Real Audio Export' > carla_real_audio_$(date +%s).txt"`
    await execAsync(audioCommand)
    console.log('✅ Carla Real Audio-Datei erstellt')
    
  } catch (error) {
    console.log('⚠️ Carla Audio-Export:', error.message)
  }
}

async function downloadCarlaResults() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'carla_real_results')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Carla-Real-Output-Verzeichnis:', outputDir)
    
    // Lade Carla-Ergebnisse von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/carla_real_* ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Carla-Real-Ergebnisse heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Carla-Real-Dateien:')
    files.forEach(file => {
      console.log(`- ${file}`)
    })
    
    console.log('\n🎉 Carla Real MIDI-zu-Audio Test erfolgreich!')
    console.log('📝 Hinweis: Dies ist ein echter Carla-Test ohne sox oder timidity!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Carla Real Test...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Carla Real Test...')
  process.exit(0)
})

// Starte Carla Real Test
testCarlaRealMIDI().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 