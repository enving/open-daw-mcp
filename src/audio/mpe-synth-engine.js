import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'

class MPESynthEngine {
  constructor() {
    this.supportedSynths = {
      'surge-xt': {
        name: 'Surge XT',
        command: 'surge-xt',
        mpeSupport: true,
        description: 'Quelloffener MPE-fähiger Synthesizer'
      },
      'vital': {
        name: 'Vital',
        command: 'vital',
        mpeSupport: true,
        description: 'Wavetable Synthesizer mit MPE'
      },
      'helm': {
        name: 'Helm',
        command: 'helm',
        mpeSupport: true,
        description: 'Modularer Synthesizer'
      },
      'zynaddsubfx': {
        name: 'ZynAddSubFX',
        command: 'zynaddsubfx',
        mpeSupport: true,
        description: 'Advanced Additive/Subtractive Synthesizer'
      }
    }
    
    this.currentSynth = null
    this.mpeChannels = {
      lead: 1,
      bass: 2,
      pad: 3,
      arp: 4,
      fx: 5
    }
  }

  async initialize() {
    console.log('🎛️ Initialisiere MPE Synth Engine...')
    
    // Prüfe verfügbare Synths
    const availableSynths = await this.checkAvailableSynths()
    
    if (availableSynths.length === 0) {
      console.log('⚠️ Keine MPE-fähigen Synths gefunden, verwende Fallback')
      return false
    }
    
    this.currentSynth = availableSynths[0]
    console.log(`✅ MPE Synth gefunden: ${this.currentSynth.name}`)
    return true
  }

  async checkAvailableSynths() {
    const available = []
    
    for (const [key, synth] of Object.entries(this.supportedSynths)) {
      try {
        const isAvailable = await this.checkSynthAvailability(synth.command)
        if (isAvailable) {
          available.push({ ...synth, key })
        }
      } catch (error) {
        console.log(`❌ ${synth.name} nicht verfügbar:`, error.message)
      }
    }
    
    return available
  }

  async checkSynthAvailability(command) {
    return new Promise((resolve) => {
      const process = spawn('which', [command])
      
      process.on('close', (code) => {
        resolve(code === 0)
      })
      
      process.on('error', () => {
        resolve(false)
      })
    })
  }

  async createMPEAudio(midiData, songData, outputPath) {
    if (!this.currentSynth) {
      throw new Error('Kein MPE-fähiger Synth verfügbar')
    }

    console.log(`🎵 Erstelle MPE Audio mit ${this.currentSynth.name}...`)
    
    try {
      switch (this.currentSynth.key) {
        case 'surge-xt':
          return await this.createSurgeXTAudio(midiData, songData, outputPath)
        case 'vital':
          return await this.createVitalAudio(midiData, songData, outputPath)
        case 'helm':
          return await this.createHelmAudio(midiData, songData, outputPath)
        case 'zynaddsubfx':
          return await this.createZynAddSubFXAudio(midiData, songData, outputPath)
        default:
          throw new Error(`Unbekannter Synth: ${this.currentSynth.key}`)
      }
    } catch (error) {
      console.log(`❌ Fehler bei ${this.currentSynth.name}:`, error.message)
      throw error
    }
  }

  async createSurgeXTAudio(midiData, songData, outputPath) {
    // Surge XT über JACK oder ALSA
    const command = 'surge-xt'
    const args = [
      '--headless',
      '--output', outputPath,
      '--midi-input', 'stdin',
      '--sample-rate', '44100',
      '--buffer-size', '512'
    ]
    
    return await this.runSynthCommand(command, args, midiData)
  }

  async createVitalAudio(midiData, songData, outputPath) {
    // Vital über VST3 Bridge
    const command = 'vital'
    const args = [
      '--headless',
      '--output', outputPath,
      '--midi', 'stdin',
      '--sample-rate', '44100'
    ]
    
    return await this.runSynthCommand(command, args, midiData)
  }

  async createHelmAudio(midiData, songData, outputPath) {
    // Helm über JACK
    const command = 'helm'
    const args = [
      '--output', outputPath,
      '--midi-input', 'stdin',
      '--sample-rate', '44100'
    ]
    
    return await this.runSynthCommand(command, args, midiData)
  }

  async createZynAddSubFXAudio(midiData, songData, outputPath) {
    // ZynAddSubFX über ALSA
    const command = 'zynaddsubfx'
    const args = [
      '--output', outputPath,
      '--midi-input', 'stdin',
      '--sample-rate', '44100',
      '--buffer-size', '256'
    ]
    
    return await this.runSynthCommand(command, args, midiData)
  }

  async runSynthCommand(command, args, midiData) {
    return new Promise((resolve, reject) => {
      console.log(`🎛️ Starte ${command} mit MPE MIDI...`)
      
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${command} erfolgreich beendet`)
          resolve({ success: true, output: stdout })
        } else {
          console.log(`❌ ${command} fehlgeschlagen (Code: ${code})`)
          reject(new Error(`Synth-Fehler: ${stderr}`))
        }
      })
      
      process.on('error', (error) => {
        reject(new Error(`Synth-Prozess-Fehler: ${error.message}`))
      })
      
      // MIDI-Daten an Synth senden
      process.stdin.write(midiData)
      process.stdin.end()
    })
  }

  // MPE-Preset für verschiedene Stile
  getMPEPreset(style) {
    const presets = {
      psychedelic_rock: {
        lead: {
          pressure: { range: [40, 100], curve: 'exponential' },
          timbre: { range: [20, 80], curve: 'sine' },
          pitchBend: { range: [-200, 200], curve: 'smooth' }
        },
        bass: {
          pressure: { range: [60, 120], curve: 'linear' },
          timbre: { range: [10, 50], curve: 'warm' },
          pitchBend: { range: [-100, 100], curve: 'slide' }
        },
        pad: {
          pressure: { range: [30, 70], curve: 'atmospheric' },
          timbre: { range: [80, 120], curve: 'air' },
          pitchBend: { range: [-50, 50], curve: 'modulation' }
        }
      },
      techno: {
        lead: {
          pressure: { range: [50, 90], curve: 'sharp' },
          timbre: { range: [40, 80], curve: 'industrial' },
          pitchBend: { range: [-150, 150], curve: 'staccato' }
        },
        bass: {
          pressure: { range: [70, 110], curve: 'punch' },
          timbre: { range: [20, 60], curve: 'deep' },
          pitchBend: { range: [-80, 80], curve: 'tight' }
        },
        pad: {
          pressure: { range: [40, 80], curve: 'smooth' },
          timbre: { range: [60, 100], curve: 'wide' },
          pitchBend: { range: [-30, 30], curve: 'subtle' }
        }
      }
    }
    
    return presets[style] || presets.psychedelic_rock
  }

  // MPE-Channel Mapping
  getMPEChannelMapping(instrument) {
    const mappings = {
      'Guitar': this.mpeChannels.lead,
      'Gitarre': this.mpeChannels.lead,
      'Synth': this.mpeChannels.lead,
      'Bass': this.mpeChannels.bass,
      'bass': this.mpeChannels.bass,
      'Piano': this.mpeChannels.pad,
      'Keyboards': this.mpeChannels.pad,
      'pad': this.mpeChannels.pad,
      'Arp': this.mpeChannels.arp,
      'FX': this.mpeChannels.fx
    }
    
    return mappings[instrument] || this.mpeChannels.lead
  }

  // MPE-Expression Mapping
  mapMPEExpression(channel, expressionType, value) {
    const mappings = {
      pressure: 0xD0,
      timbre: 0xE0,
      pitchBend: 0xE0
    }
    
    const status = mappings[expressionType]
    if (!status) return null
    
    return {
      status: status | channel,
      data1: value & 0x7F,
      data2: expressionType === 'pitchBend' ? (value >> 7) & 0x7F : 0
    }
  }

  getStatus() {
    return {
      initialized: !!this.currentSynth,
      currentSynth: this.currentSynth ? this.currentSynth.name : null,
      mpeSupport: this.currentSynth ? this.currentSynth.mpeSupport : false,
      availableSynths: Object.keys(this.supportedSynths)
    }
  }
}

export default MPESynthEngine 