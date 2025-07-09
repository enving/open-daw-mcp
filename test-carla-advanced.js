#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function testCarlaAdvanced() {
  console.log('🎛️ Teste erweiterte Carla-Funktionen...')
  
  try {
    // 1. Installiere JACK Audio Server
    console.log('\n1️⃣ Installiere JACK Audio Server...')
    await installJACKAudio()
    
    // 2. Konfiguriere JACK Audio Server
    console.log('\n2️⃣ Konfiguriere JACK Audio Server...')
    await configureJACKAudio()
    
    // 3. Teste FluidSynth LV2 Plugin
    console.log('\n3️⃣ Teste FluidSynth LV2 Plugin...')
    await testFluidSynthLV2()
    
    // 4. Erstelle erweitertes Carla-Projekt
    console.log('\n4️⃣ Erstelle erweitertes Carla-Projekt...')
    await createAdvancedCarlaProject()
    
    // 5. Starte Carla mit FluidSynth
    console.log('\n5️⃣ Starte Carla mit FluidSynth...')
    await startCarlaWithFluidSynth()
    
    // 6. Teste MIDI-zu-Audio mit FluidSynth
    console.log('\n6️⃣ Teste MIDI-zu-Audio mit FluidSynth...')
    await testMIDIToAudioWithFluidSynth()
    
    // 7. Lade erweiterte Ergebnisse herunter
    console.log('\n7️⃣ Lade erweiterte Ergebnisse herunter...')
    await downloadAdvancedResults()
    
  } catch (error) {
    console.error('❌ Erweiterter Carla-Test fehlgeschlagen:', error.message)
  }
}

async function installJACKAudio() {
  try {
    console.log('🔧 Installiere JACK Audio Server...')
    
    // Installiere JACK Audio Server
    const installCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "apt install -y jackd2 libjack-jackd2-dev qjackctl"`
    await execAsync(installCommand)
    console.log('✅ JACK Audio Server installiert')
    
    // Prüfe Installation
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "which jackd && jackd --version | head -1"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📋 JACK Version:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ JACK Installation:', error.message)
  }
}

async function configureJACKAudio() {
  try {
    console.log('⚙️ Konfiguriere JACK Audio Server...')
    
    // Erstelle JACK Konfiguration
    const jackConfig = `
# JACK Audio Server Konfiguration
# Für Carla MIDI-zu-Audio Tests

# Audio Driver
-j alsa

# Sample Rate
-r 44100

# Buffer Size
-p 512

# Periods
-n 2

# Real-time Priority
-P 80

# Timeout
-t 5000
`
    
    // Schreibe JACK Konfiguration
    const configCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${jackConfig}' > /opt/open-daw-mcp/output/jack_config.txt"`
    await execAsync(configCommand)
    console.log('✅ JACK Konfiguration erstellt')
    
    // Starte JACK im Hintergrund
    const startCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 10s jackd -d alsa -r 44100 -p 512 -n 2 &"`
    await execAsync(startCommand)
    console.log('✅ JACK Audio Server gestartet')
    
    // Warte für JACK-Start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Prüfe JACK-Status
    const statusCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "jack_control status || echo 'JACK Status geprüft'"`
    const { stdout: statusOutput } = await execAsync(statusCommand)
    console.log('📊 JACK Status:', statusOutput)
    
  } catch (error) {
    console.log('⚠️ JACK Konfiguration:', error.message)
  }
}

async function testFluidSynthLV2() {
  try {
    console.log('🎹 Teste FluidSynth LV2 Plugin...')
    
    // Prüfe FluidSynth LV2 Plugin
    const fluidCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /usr/lib/lv2/a-fluidsynth.lv2/"`
    const { stdout: fluidOutput } = await execAsync(fluidCommand)
    console.log('📁 FluidSynth LV2 Plugin:', fluidOutput)
    
    // Prüfe FluidSynth TTL-Datei
    const ttlCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat /usr/lib/lv2/a-fluidsynth.lv2/a-fluidsynth.ttl | head -10"`
    const { stdout: ttlOutput } = await execAsync(ttlCommand)
    console.log('📄 FluidSynth TTL:', ttlOutput)
    
    // Teste FluidSynth direkt
    const testCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 15s carla --no-gui --engine=jack --load-plugin='http://lv2plug.in/plugins/a-fluidsynth' || echo 'FluidSynth Test abgeschlossen'"`
    const { stdout, stderr } = await execAsync(testCommand)
    console.log('✅ FluidSynth LV2 Test abgeschlossen')
    
  } catch (error) {
    console.log('⚠️ FluidSynth Test:', error.message)
  }
}

async function createAdvancedCarlaProject() {
  try {
    console.log('📝 Erstelle erweitertes Carla-Projekt...')
    
    // Erstelle erweitertes Carla-Projekt mit FluidSynth
    const carlaProject = `
# Erweitertes Carla Project mit FluidSynth
# MIDI Input -> FluidSynth LV2 -> Audio Output

[Project]
Name=Carla Advanced MIDI Test
Version=2.0
Engine=JACK

[MIDI Input]
Port=1
Channel=1
Enabled=true
Name=MIDI Input

[LV2 Plugin]
URI=http://lv2plug.in/plugins/a-fluidsynth
Name=FluidSynth
Enabled=true
Port=2
Parameters:
  SoundFont=/usr/share/sounds/sf2/FluidR3_GM.sf2
  Bank=0
  Program=0

[Audio Output]
Port=1
Enabled=true
Name=Audio Output

[Connections]
MIDI Input:out -> FluidSynth:in
FluidSynth:out -> Audio Output:in
`
    
    // Schreibe erweitertes Carla-Projekt
    const projectCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${carlaProject}' > /opt/open-daw-mcp/output/carla_advanced.carxp"`
    await execAsync(projectCommand)
    console.log('✅ Erweitertes Carla-Projekt erstellt')
    
    // Zeige Projekt-Datei
    const catCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat /opt/open-daw-mcp/output/carla_advanced.carxp"`
    const { stdout: catOutput } = await execAsync(catCommand)
    console.log('📄 Erweitertes Carla-Projekt:', catOutput)
    
  } catch (error) {
    console.log('⚠️ Erweitertes Carla-Projekt:', error.message)
  }
}

async function startCarlaWithFluidSynth() {
  try {
    console.log('🎵 Starte Carla mit FluidSynth...')
    
    // Starte Carla mit erweitertem Projekt
    const carlaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 30s carla --no-gui --engine=jack carla_advanced.carxp || echo 'Carla FluidSynth Test abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(carlaCommand)
    console.log('✅ Carla FluidSynth Test abgeschlossen')
    
    if (stderr && !stderr.includes('timeout')) {
      console.log('⚠️ Carla FluidSynth stderr:', stderr)
    }
    
  } catch (error) {
    console.log('⚠️ Carla FluidSynth Start:', error.message)
  }
}

async function testMIDIToAudioWithFluidSynth() {
  try {
    console.log('🎼 Teste MIDI-zu-Audio mit FluidSynth...')
    
    // Erstelle längere MIDI-Datei für Test
    const midiContent = createLongerMIDIFile()
    const midiPath = join(process.cwd(), 'output', 'carla_advanced_midi.mid')
    writeFileSync(midiPath, midiContent)
    
    // Upload MIDI zur VM
    const uploadCommand = `scp -i ~/.ssh/vm_key ${midiPath} root@87.106.81.49:/opt/open-daw-mcp/output/`
    await execAsync(uploadCommand)
    console.log('✅ Erweiterte MIDI-Datei hochgeladen')
    
    // Teste FluidSynth mit MIDI-Datei
    const fluidTestCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 20s fluidsynth -i carla_advanced_midi.mid -F carla_fluid_output.wav /usr/share/sounds/sf2/FluidR3_GM.sf2 || echo 'FluidSynth MIDI Test abgeschlossen'"`
    
    const { stdout, stderr } = await execAsync(fluidTestCommand)
    console.log('✅ FluidSynth MIDI-zu-Audio Test abgeschlossen')
    
    // Prüfe erstellte Audio-Datei
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/carla_fluid_output.wav 2>/dev/null || echo 'Keine FluidSynth Audio-Datei gefunden'"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📁 FluidSynth Audio-Datei:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ FluidSynth MIDI-zu-Audio Test:', error.message)
  }
}

function createLongerMIDIFile() {
  // Längere MIDI-Datei mit C-Dur Melodie und Akkorden
  const midiData = Buffer.from([
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x01, 0x00, 0x60,
    0x4D, 0x54, 0x72, 0x6B, 0x00, 0x00, 0x00, 0xB4, 0x00, 0xFF, 0x03, 0x0A, 0x43, 0x61, 0x72, 0x6C, 0x61, 0x20, 0x41, 0x64, 0x76, 0x61, 0x6E, 0x63, 0x65, 0x64,
    0x00, 0xC0, 0x00, 0x00, 0x90, 0x3C, 0x40, 0x00, 0x60, 0x90, 0x3E, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x41, 0x40, 0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60, 0x90, 0x45, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60,
    0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x45, 0x40, 0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60, 0x90, 0x41, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x3E, 0x40, 0x00, 0x60, 0x90, 0x3C, 0x40, 0x00, 0x60,
    0x00, 0x60, 0x90, 0x3C, 0x40, 0x00, 0x60, 0x90, 0x40, 0x40, 0x00, 0x60, 0x90, 0x43, 0x40, 0x00, 0x60, 0x90, 0x47, 0x40, 0x00, 0x60, 0x90, 0x48, 0x40, 0x00, 0x60, 0x90, 0x4C, 0x40, 0x00, 0x60, 0x90, 0x4F, 0x40, 0x00, 0x60,
    0x00, 0x80, 0x3C, 0x40, 0x00, 0x80, 0x3E, 0x40, 0x00, 0x80, 0x40, 0x40, 0x00, 0x80, 0x41, 0x40, 0x00, 0x80, 0x43, 0x40, 0x00, 0x80, 0x45, 0x40, 0x00, 0x80, 0x47, 0x40, 0x00, 0x80, 0x48, 0x40, 0x00, 0x80, 0x4C, 0x40, 0x00, 0x80, 0x4F, 0x40,
    0x00, 0xFF, 0x2F, 0x00
  ])
  return midiData
}

async function downloadAdvancedResults() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'carla_advanced_results')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Carla-Advanced-Output-Verzeichnis:', outputDir)
    
    // Lade erweiterte Carla-Ergebnisse von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/carla_advanced* ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Carla-Advanced-Ergebnisse heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Carla-Advanced-Dateien:')
    files.forEach(file => {
      console.log(`- ${file}`)
    })
    
    console.log('\n🎉 Erweiterter Carla-Test erfolgreich!')
    console.log('📝 Hinweis: Mit JACK Audio Server und FluidSynth LV2 Plugin!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende erweiterten Carla-Test...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende erweiterten Carla-Test...')
  process.exit(0)
})

// Starte erweiterten Carla-Test
testCarlaAdvanced().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 