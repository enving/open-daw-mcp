#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function createMPEScripts() {
  console.log('🎹 Erstelle MPE-Skripte direkt auf der VM...')
  
  try {
    // 1. Erstelle einfaches MPE-Controller-Skript
    console.log('\n1️⃣ Erstelle MPE-Controller...')
    await createSimpleMPEController()
    
    // 2. Erstelle LLM-MPE-Generator
    console.log('\n2️⃣ Erstelle LLM-MPE-Generator...')
    await createSimpleLLMGenerator()
    
    // 3. Teste die Skripte
    console.log('\n3️⃣ Teste die Skripte...')
    await testMPEScripts()
    
  } catch (error) {
    console.error('❌ MPE-Skripte Erstellung fehlgeschlagen:', error.message)
  }
}

async function createSimpleMPEController() {
  try {
    // Erstelle einfaches MPE-Controller-Skript
    const mpeScript = `#!/usr/bin/env python3
import time
import json

print("🎹 MPE Controller gestartet")

# Simuliere MPE-Daten
mpe_data = [
    {"type": "note", "channel": 1, "note": 60, "velocity": 80, "pressure": 64, "timbre": 32, "pitch_bend": 0, "duration": 0.5},
    {"type": "note", "channel": 1, "note": 64, "velocity": 75, "pressure": 48, "timbre": 16, "pitch_bend": 100, "duration": 0.5},
    {"type": "note", "channel": 1, "note": 67, "velocity": 85, "pressure": 80, "timbre": 64, "pitch_bend": -50, "duration": 0.5}
]

print(f"🎵 Spiele {len(mpe_data)} MPE Events...")

for i, event in enumerate(mpe_data):
    print(f"Event {i+1}: {event}")
    time.sleep(0.5)

print("✅ MPE-Sequenz abgespielt")
`
    
    // Schreibe Skript direkt auf VM
    const writeCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat > /opt/open-daw-mcp/output/mpe_controller.py << 'EOF'
${mpeScript}
EOF"`
    
    await execAsync(writeCommand)
    console.log('✅ MPE-Controller erstellt')
    
    // Mache ausführbar
    const chmodCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "chmod +x /opt/open-daw-mcp/output/mpe_controller.py"`
    await execAsync(chmodCommand)
    console.log('✅ MPE-Controller ausführbar gemacht')
    
  } catch (error) {
    console.log('⚠️ MPE-Controller Erstellung:', error.message)
  }
}

async function createSimpleLLMGenerator() {
  try {
    // Erstelle einfaches LLM-MPE-Generator-Skript
    const llmScript = `#!/usr/bin/env python3
import json
import random

print("🤖 LLM MPE Generator gestartet")

def generate_tame_impala_style():
    print("🎵 Generiere Tame Impala Style...")
    
    mpe_sequence = []
    
    # Tame Impala charakteristische Elemente
    notes = [60, 64, 67, 71, 72, 76, 79, 83]  # C, E, G, B, C, E, G, B
    
    for i in range(8):
        note = random.choice(notes)
        velocity = random.randint(60, 90)
        pressure = random.randint(32, 96)
        timbre = random.randint(16, 80)
        pitch_bend = random.randint(-200, 200)
        
        mpe_sequence.append({
            "type": "note",
            "channel": 1,
            "note": note,
            "velocity": velocity,
            "pressure": pressure,
            "timbre": timbre,
            "pitch_bend": pitch_bend,
            "duration": random.uniform(0.3, 0.8)
        })
    
    return mpe_sequence

# Generiere MPE-Daten
mpe_data = generate_tame_impala_style()

# Speichere MPE-Daten
with open("/opt/open-daw-mcp/output/llm_mpe_data.json", "w") as f:
    json.dump(mpe_data, f, indent=2)

print(f"✅ MPE-Daten generiert: {len(mpe_data)} Events")
`
    
    // Schreibe Skript direkt auf VM
    const writeCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cat > /opt/open-daw-mcp/output/llm_mpe_generator.py << 'EOF'
${llmScript}
EOF"`
    
    await execAsync(writeCommand)
    console.log('✅ LLM-MPE-Generator erstellt')
    
    // Mache ausführbar
    const chmodCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "chmod +x /opt/open-daw-mcp/output/llm_mpe_generator.py"`
    await execAsync(chmodCommand)
    console.log('✅ LLM-MPE-Generator ausführbar gemacht')
    
  } catch (error) {
    console.log('⚠️ LLM-MPE-Generator Erstellung:', error.message)
  }
}

async function testMPEScripts() {
  try {
    console.log('🧪 Teste MPE-Skripte...')
    
    // Teste LLM-MPE-Generator
    const generatorCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 llm_mpe_generator.py"`
    const { stdout: generatorOutput } = await execAsync(generatorCommand)
    console.log('📋 LLM-Generator Output:', generatorOutput)
    
    // Teste MPE-Controller
    const controllerCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 mpe_controller.py"`
    const { stdout: controllerOutput } = await execAsync(controllerCommand)
    console.log('📋 MPE-Controller Output:', controllerOutput)
    
    // Zeige erstellte Dateien
    const lsCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/*.py /opt/open-daw-mcp/output/*.json"`
    const { stdout: lsOutput } = await execAsync(lsCommand)
    console.log('📁 Erstellte Dateien:', lsOutput)
    
    console.log('🎉 MPE-Skripte erfolgreich erstellt und getestet!')
    
  } catch (error) {
    console.log('⚠️ MPE-Skripte Test:', error.message)
  }
}

// Starte MPE-Skripte Erstellung
createMPEScripts().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 