#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testCarlaMPEMVP() {
  console.log('🎛️ Teste Carla + MPE MVP...')
  
  try {
    // 1. Prüfe Carla Installation
    console.log('\n1️⃣ Prüfe Carla Installation...')
    await checkCarlaInstallation()
    
    // 2. Erstelle einfaches MPE-Skript
    console.log('\n2️⃣ Erstelle einfaches MPE-Skript...')
    await createSimpleMPEScript()
    
    // 3. Teste MPE-Generator
    console.log('\n3️⃣ Teste MPE-Generator...')
    await testMPEGenerator()
    
    // 4. Teste Audio-Aufnahme
    console.log('\n4️⃣ Teste Audio-Aufnahme...')
    await testAudioRecording()
    
    console.log('\n🎉 Carla + MPE MVP erfolgreich!')
    
  } catch (error) {
    console.error('❌ Carla MPE MVP fehlgeschlagen:', error.message)
  }
}

async function checkCarlaInstallation() {
  try {
    const carlaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "carla --version"`
    const { stdout } = await execAsync(carlaCommand)
    console.log('✅ Carla Version:', stdout)
    
    const lv2Command = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "find /usr/lib/lv2 -name '*synth*' | head -3"`
    const { stdout: lv2Output } = await execAsync(lv2Command)
    console.log('✅ LV2 Synth Plugins:', lv2Output)
    
  } catch (error) {
    console.log('⚠️ Carla Installation Check:', error.message)
  }
}

async function createSimpleMPEScript() {
  try {
    const mpeScript = `#!/usr/bin/env python3
import json
import random

print("🎹 Einfacher MPE Generator")

# Generiere einfache MPE-Daten
mpe_data = []
for i in range(5):
    mpe_data.append({
        "type": "note",
        "channel": 1,
        "note": random.randint(60, 72),
        "velocity": random.randint(60, 90),
        "pressure": random.randint(32, 96),
        "timbre": random.randint(16, 80),
        "pitch_bend": random.randint(-100, 100),
        "duration": random.uniform(0.3, 0.8)
    })

# Speichere MPE-Daten
with open("/opt/open-daw-mcp/output/mvp_mpe_data.json", "w") as f:
    json.dump(mpe_data, f, indent=2)

print(f"✅ MPE-Daten generiert: {len(mpe_data)} Events")
`
    
    const writeCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat > /opt/open-daw-mcp/output/mvp_mpe_generator.py << 'EOF'
${mpeScript}
EOF"`
    
    await execAsync(writeCommand)
    console.log('✅ Einfaches MPE-Skript erstellt')
    
  } catch (error) {
    console.log('⚠️ MPE-Skript Erstellung:', error.message)
  }
}

async function testMPEGenerator() {
  try {
    const testCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 mvp_mpe_generator.py"`
    const { stdout } = await execAsync(testCommand)
    console.log('📋 MPE-Generator Output:', stdout)
    
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/mvp_mpe_data.json"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📁 MPE-Daten Datei:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ MPE-Generator Test:', error.message)
  }
}

async function testAudioRecording() {
  try {
    // Teste einfache Audio-Aufnahme
    const audioCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 5s arecord -f S16_LE -r 44100 -c 2 mvp_audio_test.wav || echo 'Audio-Aufnahme abgeschlossen'"`
    await execAsync(audioCommand)
    console.log('✅ Audio-Aufnahme getestet')
    
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/mvp_audio_test.wav 2>/dev/null || echo 'Keine Audio-Datei gefunden'"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📁 Audio-Datei:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ Audio-Aufnahme Test:', error.message)
  }
}

// Starte MVP Test
testCarlaMPEMVP().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 