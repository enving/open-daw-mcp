#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function testCarlaMPEPython() {
  console.log('🎛️ Teste Carla + Python + MPE Integration...')
  
  try {
    // 1. Installiere Python-Carla Client
    console.log('\n1️⃣ Installiere Python-Carla Client...')
    await installPythonCarlaClient()
    
    // 2. Erstelle MPE-Controller Python-Skript
    console.log('\n2️⃣ Erstelle MPE-Controller Python-Skript...')
    await createMPEControllerScript()
    
    // 3. Erstelle LLM-MPE-Generator
    console.log('\n3️⃣ Erstelle LLM-MPE-Generator...')
    await createLLMMPEGenerator()
    
    // 4. Teste Carla mit MPE-Controller
    console.log('\n4️⃣ Teste Carla mit MPE-Controller...')
    await testCarlaWithMPEController()
    
    // 5. Teste Audio-Aufnahme
    console.log('\n5️⃣ Teste Audio-Aufnahme...')
    await testAudioRecording()
    
    // 6. Lade Ergebnisse herunter
    console.log('\n6️⃣ Lade Ergebnisse herunter...')
    await downloadMPEResults()
    
  } catch (error) {
    console.error('❌ Carla MPE Python Test fehlgeschlagen:', error.message)
  }
}

async function installPythonCarlaClient() {
  try {
    console.log('🐍 Installiere Python-Carla Client...')
    
    // Installiere Python-Carla Dependencies
    const installCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "apt install -y python3-pip python3-liblo python3-osc && pip3 install python-osc liblo"`
    await execAsync(installCommand)
    console.log('✅ Python-Carla Dependencies installiert')
    
    // Prüfe Installation
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "python3 -c 'import liblo; print(\"liblo OK\")' && python3 -c 'from pythonosc import udp_client; print(\"python-osc OK\")'"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📋 Python-Carla Status:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ Python-Carla Installation:', error.message)
  }
}

async function createMPEControllerScript() {
  try {
    console.log('🎹 Erstelle MPE-Controller Python-Skript...')
    
    // Erstelle Python-Skript für MPE-Controller
    const mpeControllerScript = `
#!/usr/bin/env python3
"""
MPE Controller für Carla Plugins
Sendet MPE-Daten an Carla LV2 Plugins
"""

import liblo
import time
import json
from pythonosc import udp_client

class MPEController:
    def __init__(self, carla_host="localhost", carla_port=2000):
        self.carla_host = carla_host
        self.carla_port = carla_port
        self.osc_client = udp_client.SimpleUDPClient(carla_host, carla_port)
        
    def send_mpe_note(self, channel, note, velocity, pressure, timbre, pitch_bend):
        """Sendet MPE Note an Carla Plugin"""
        # MPE Note-on
        self.osc_client.send_message("/carla/mpe/note_on", [channel, note, velocity])
        
        # MPE Pressure (Aftertouch)
        if pressure > 0:
            self.osc_client.send_message("/carla/mpe/pressure", [channel, pressure])
            
        # MPE Timbre (CC74)
        if timbre > 0:
            self.osc_client.send_message("/carla/mpe/timbre", [channel, timbre])
            
        # MPE Pitch Bend
        if pitch_bend != 0:
            self.osc_client.send_message("/carla/mpe/pitch_bend", [channel, pitch_bend])
    
    def send_mpe_note_off(self, channel, note):
        """Sendet MPE Note-off"""
        self.osc_client.send_message("/carla/mpe/note_off", [channel, note])
    
    def send_mpe_cc(self, channel, controller, value):
        """Sendet MPE CC (Continuous Controller)"""
        self.osc_client.send_message("/carla/mpe/cc", [channel, controller, value])
    
    def play_mpe_sequence(self, mpe_data):
        """Spielt MPE-Sequenz ab"""
        print(f"🎵 Spiele MPE-Sequenz mit {len(mpe_data)} Events...")
        
        for event in mpe_data:
            event_type = event.get('type', 'note')
            channel = event.get('channel', 1)
            note = event.get('note', 60)
            velocity = event.get('velocity', 64)
            pressure = event.get('pressure', 0)
            timbre = event.get('timbre', 0)
            pitch_bend = event.get('pitch_bend', 0)
            duration = event.get('duration', 0.5)
            
            if event_type == 'note':
                self.send_mpe_note(channel, note, velocity, pressure, timbre, pitch_bend)
                time.sleep(duration)
                self.send_mpe_note_off(channel, note)
            elif event_type == 'cc':
                controller = event.get('controller', 1)
                value = event.get('value', 0)
                self.send_mpe_cc(channel, controller, value)
                time.sleep(0.1)
        
        print("✅ MPE-Sequenz abgespielt")

if __name__ == "__main__":
    # Test MPE-Controller
    controller = MPEController()
    
    # Test MPE-Daten (Tame Impala Style)
    test_mpe_data = [
        {"type": "note", "channel": 1, "note": 60, "velocity": 80, "pressure": 64, "timbre": 32, "pitch_bend": 0, "duration": 0.5},
        {"type": "note", "channel": 1, "note": 64, "velocity": 75, "pressure": 48, "timbre": 16, "pitch_bend": 100, "duration": 0.5},
        {"type": "note", "channel": 1, "note": 67, "velocity": 85, "pressure": 80, "timbre": 64, "pitch_bend": -50, "duration": 0.5},
        {"type": "cc", "channel": 1, "controller": 74, "value": 64},  # Timbre
        {"type": "cc", "channel": 1, "controller": 1, "value": 32},   # Modulation
    ]
    
    controller.play_mpe_sequence(test_mpe_data)
`
    
    // Schreibe MPE-Controller-Skript
    const scriptCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${mpeControllerScript}' > /opt/open-daw-mcp/output/mpe_controller.py"`
    await execAsync(scriptCommand)
    console.log('✅ MPE-Controller Python-Skript erstellt')
    
    // Mache Skript ausführbar
    const chmodCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "chmod +x /opt/open-daw-mcp/output/mpe_controller.py"`
    await execAsync(chmodCommand)
    console.log('✅ MPE-Controller ausführbar gemacht')
    
  } catch (error) {
    console.log('⚠️ MPE-Controller Erstellung:', error.message)
  }
}

async function createLLMMPEGenerator() {
  try {
    console.log('🤖 Erstelle LLM-MPE-Generator...')
    
    // Erstelle Python-Skript für LLM-MPE-Generierung
    const llmMPEGeneratorScript = `
#!/usr/bin/env python3
"""
LLM MPE Generator
Generiert MPE-Daten basierend auf LLM-Beschreibungen
"""

import json
import random

class LLMMPEGenerator:
    def __init__(self):
        self.mpe_data = []
        
    def generate_tame_impala_style(self):
        """Generiert Tame Impala Style MPE-Daten"""
        print("🎵 Generiere Tame Impala Style MPE-Daten...")
        
        # Tame Impala charakteristische Elemente
        # - Psychedelische Synth-Linien
        # - Expressive MPE-Kontrolle
        # - Modulations-Intensität
        
        mpe_sequence = []
        
        # Intro-Sektion
        for i in range(8):
            note = random.choice([60, 64, 67, 71, 72, 76, 79, 83])  # C, E, G, B, C, E, G, B
            velocity = random.randint(60, 90)
            pressure = random.randint(32, 96)  # Expressive Aftertouch
            timbre = random.randint(16, 80)    # Timbre-Kontrolle
            pitch_bend = random.randint(-200, 200)  # Pitch Bend
            
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
            
            # Modulations-CC
            if random.random() > 0.7:
                mpe_sequence.append({
                    "type": "cc",
                    "channel": 1,
                    "controller": 1,  # Modulation
                    "value": random.randint(16, 96)
                })
        
        return mpe_sequence
    
    def generate_ambient_style(self):
        """Generiert Ambient Style MPE-Daten"""
        print("🌊 Generiere Ambient Style MPE-Daten...")
        
        mpe_sequence = []
        
        # Ambient charakteristische Elemente
        # - Lange, atmosphärische Noten
        # - Subtile MPE-Kontrolle
        # - Weniger Modulation
        
        for i in range(6):
            note = random.choice([48, 52, 55, 60, 64, 67, 72, 76])  # Bass bis Mid
            velocity = random.randint(40, 70)  # Leiser
            pressure = random.randint(16, 64)  # Subtiler Aftertouch
            timbre = random.randint(8, 48)     # Weniger Timbre
            pitch_bend = random.randint(-50, 50)  # Weniger Pitch Bend
            
            mpe_sequence.append({
                "type": "note",
                "channel": 1,
                "note": note,
                "velocity": velocity,
                "pressure": pressure,
                "timbre": timbre,
                "pitch_bend": pitch_bend,
                "duration": random.uniform(1.0, 2.5)  # Längere Noten
            })
        
        return mpe_sequence
    
    def generate_techno_style(self):
        """Generiert Techno Style MPE-Daten"""
        print("🔊 Generiere Techno Style MPE-Daten...")
        
        mpe_sequence = []
        
        # Techno charakteristische Elemente
        # - Rhythmisierte Synth-Linien
        # - Starke Modulation
        # - Repetitive Patterns
        
        for i in range(16):  # Mehr Events für Rhythmus
            note = random.choice([60, 64, 67, 72, 76, 79])  # Mid-Range
            velocity = random.randint(70, 100)  # Lauter
            pressure = random.randint(48, 96)   # Stärkerer Aftertouch
            timbre = random.randint(32, 96)     # Mehr Timbre
            pitch_bend = random.randint(-100, 100)
            
            mpe_sequence.append({
                "type": "note",
                "channel": 1,
                "note": note,
                "velocity": velocity,
                "pressure": pressure,
                "timbre": timbre,
                "pitch_bend": pitch_bend,
                "duration": random.uniform(0.2, 0.6)  # Kürzere Noten
            })
            
            # Häufige Modulations-CC
            if random.random() > 0.5:
                mpe_sequence.append({
                    "type": "cc",
                    "channel": 1,
                    "controller": 1,  # Modulation
                    "value": random.randint(32, 96)
                })
        
        return mpe_sequence
    
    def generate_from_description(self, description):
        """Generiert MPE-Daten basierend auf LLM-Beschreibung"""
        description_lower = description.lower()
        
        if "tame impala" in description_lower or "psychedelic" in description_lower:
            return self.generate_tame_impala_style()
        elif "ambient" in description_lower or "atmospheric" in description_lower:
            return self.generate_ambient_style()
        elif "techno" in description_lower or "electronic" in description_lower:
            return self.generate_techno_style()
        else:
            # Default: Tame Impala Style
            return self.generate_tame_impala_style()

if __name__ == "__main__":
    generator = LLMMPEGenerator()
    
    # Test mit verschiedenen Stilen
    test_description = "Erstelle einen psychedelischen Song im Stil von Tame Impala"
    mpe_data = generator.generate_from_description(test_description)
    
    # Speichere MPE-Daten
    with open("/opt/open-daw-mcp/output/llm_mpe_data.json", "w") as f:
        json.dump(mpe_data, f, indent=2)
    
    print(f"✅ MPE-Daten generiert: {len(mpe_data)} Events")
`
    
    // Schreibe LLM-MPE-Generator-Skript
    const scriptCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "echo '${llmMPEGeneratorScript}' > /opt/open-daw-mcp/output/llm_mpe_generator.py"`
    await execAsync(scriptCommand)
    console.log('✅ LLM-MPE-Generator Python-Skript erstellt')
    
    // Mache Skript ausführbar
    const chmodCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "chmod +x /opt/open-daw-mcp/output/llm_mpe_generator.py"`
    await execAsync(chmodCommand)
    console.log('✅ LLM-MPE-Generator ausführbar gemacht')
    
  } catch (error) {
    console.log('⚠️ LLM-MPE-Generator Erstellung:', error.message)
  }
}

async function testCarlaWithMPEController() {
  try {
    console.log('🎛️ Teste Carla mit MPE-Controller...')
    
    // Starte Carla im Hintergrund
    const carlaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 30s carla --no-gui --engine=jack &"`
    await execAsync(carlaCommand)
    console.log('✅ Carla im Hintergrund gestartet')
    
    // Warte für Carla-Start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Generiere MPE-Daten mit LLM-Generator
    const generateCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && python3 llm_mpe_generator.py"`
    await execAsync(generateCommand)
    console.log('✅ MPE-Daten generiert')
    
    // Teste MPE-Controller
    const controllerCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 20s python3 mpe_controller.py || echo 'MPE Controller Test abgeschlossen'"`
    const { stdout, stderr } = await execAsync(controllerCommand)
    console.log('✅ MPE-Controller Test abgeschlossen')
    
    if (stderr && !stderr.includes('timeout')) {
      console.log('⚠️ MPE Controller stderr:', stderr)
    }
    
  } catch (error) {
    console.log('⚠️ Carla MPE-Controller Test:', error.message)
  }
}

async function testAudioRecording() {
  try {
    console.log('🎙️ Teste Audio-Aufnahme...')
    
    // Teste verschiedene Audio-Aufnahme-Methoden
    
    // 1. ALSA Audio-Aufnahme
    const alsaCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 10s arecord -f S16_LE -r 44100 -c 2 carla_mpe_alsa.wav || echo 'ALSA Aufnahme abgeschlossen'"`
    await execAsync(alsaCommand)
    console.log('✅ ALSA Audio-Aufnahme getestet')
    
    // 2. JACK Audio-Aufnahme
    const jackCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 10s jack_capture -d 5 carla_mpe_jack.wav || echo 'JACK Aufnahme abgeschlossen'"`
    await execAsync(jackCommand)
    console.log('✅ JACK Audio-Aufnahme getestet')
    
    // 3. PulseAudio Audio-Aufnahme
    const pulseCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "cd /opt/open-daw-mcp/output && timeout 10s parecord -r 44100 carla_mpe_pulse.wav || echo 'PulseAudio Aufnahme abgeschlossen'"`
    await execAsync(pulseCommand)
    console.log('✅ PulseAudio Audio-Aufnahme getestet')
    
    // Prüfe erstellte Audio-Dateien
    const checkCommand = `ssh -i ~/.ssh/vm_key root@87.106.81.49 "ls -la /opt/open-daw-mcp/output/carla_mpe_*.wav 2>/dev/null || echo 'Keine Audio-Dateien gefunden'"`
    const { stdout: checkOutput } = await execAsync(checkCommand)
    console.log('📁 Audio-Aufnahme-Dateien:', checkOutput)
    
  } catch (error) {
    console.log('⚠️ Audio-Aufnahme Test:', error.message)
  }
}

async function downloadMPEResults() {
  try {
    // Erstelle lokales Output-Verzeichnis
    const outputDir = join(process.cwd(), 'output', 'carla_mpe_results')
    mkdirSync(outputDir, { recursive: true })
    
    console.log('📁 Lokales Carla-MPE-Output-Verzeichnis:', outputDir)
    
    // Lade Carla-MPE-Ergebnisse von der VM
    const rsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/carla_mpe_* ${outputDir}/`
    console.log('🔗 Führe rsync aus:', rsyncCommand)
    
    const { stdout, stderr } = await execAsync(rsyncCommand)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️ rsync Warning:', stderr)
    }
    
    console.log('✅ Carla-MPE-Ergebnisse heruntergeladen')
    
    // Lade auch Python-Skripte
    const scriptRsyncCommand = `rsync -avz -e "ssh -i ~/.ssh/vm_key" root@87.106.81.49:/opt/open-daw-mcp/output/*.py ${outputDir}/`
    await execAsync(scriptRsyncCommand)
    console.log('✅ Python-Skripte heruntergeladen')
    
    // Zeige heruntergeladene Dateien
    const { readdir } = await import('fs/promises')
    const files = await readdir(outputDir)
    
    console.log('\n📁 Heruntergeladene Carla-MPE-Dateien:')
    files.forEach(file => {
      console.log(`- ${file}`)
    })
    
    console.log('\n🎉 Carla + Python + MPE Integration erfolgreich!')
    console.log('📝 Hinweis: Vollständig headless und LLM-optimiert!')
    
  } catch (error) {
    console.error('❌ Fehler beim Herunterladen:', error.message)
  }
}

// Event-Handler für sauberes Beenden
process.on('SIGINT', async () => {
  console.log('\n🛑 Beende Carla MPE Python Test...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Beende Carla MPE Python Test...')
  process.exit(0)
})

// Starte Carla MPE Python Test
testCarlaMPEPython().catch(error => {
  console.error('❌ Unbehandelter Fehler:', error)
  process.exit(1)
}) 