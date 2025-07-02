import { IONOSClient } from '../ionos/ionos-client.js'

class MPEPresetGenerator {
  constructor() {
    this.ionosClient = new IONOSClient()
  }

  async generateMPEPresets(songData) {
    console.log('🎛️ Generiere MPE Presets für:', songData.title)
    
    const presetPrompt = this.createPresetPrompt(songData)
    
    try {
      const response = await this.ionosClient.generateText(presetPrompt)
      const presets = this.parsePresetResponse(response)
      
      console.log('✅ MPE Presets generiert:', Object.keys(presets))
      return presets
    } catch (error) {
      console.log('❌ Fehler bei Preset-Generierung:', error.message)
      return this.getFallbackPresets(songData)
    }
  }

  createPresetPrompt(songData) {
    return `Erstelle MPE-Synthesizer-Presets für einen ${songData.style} Song mit dem Titel "${songData.title}".

Song-Details:
- Stil: ${songData.style}
- Tempo: ${songData.tempo} BPM
- Tonart: ${songData.key} ${songData.scale}
- Instrumente: ${songData.instruments.join(', ')}
- Beschreibung: ${songData.description}

Erstelle für jedes Instrument ein detailliertes Preset im folgenden JSON-Format:

{
  "lead": {
    "oscillator": {
      "type": "sawtooth",
      "detune": 0.1,
      "phase": 0
    },
    "filter": {
      "type": "lowpass",
      "frequency": 2000,
      "resonance": 0.5,
      "envelope": {
        "attack": 0.1,
        "decay": 0.3,
        "sustain": 0.7,
        "release": 0.5
      }
    },
    "amplifier": {
      "envelope": {
        "attack": 0.01,
        "decay": 0.2,
        "sustain": 0.8,
        "release": 0.3
      }
    },
    "mpe": {
      "pressure": {
        "target": "filter_frequency",
        "range": [500, 8000]
      },
      "timbre": {
        "target": "oscillator_detune",
        "range": [0, 0.5]
      },
      "slide": {
        "target": "pitch",
        "range": [-12, 12]
      }
    },
    "effects": {
      "reverb": {
        "wet": 0.3,
        "decay": 2.0
      },
      "delay": {
        "time": 0.3,
        "feedback": 0.4
      }
    }
  },
  "bass": {
    "oscillator": {
      "type": "square",
      "detune": 0,
      "phase": 0
    },
    "filter": {
      "type": "lowpass",
      "frequency": 800,
      "resonance": 0.3,
      "envelope": {
        "attack": 0.05,
        "decay": 0.2,
        "sustain": 0.9,
        "release": 0.4
      }
    },
    "amplifier": {
      "envelope": {
        "attack": 0.01,
        "decay": 0.1,
        "sustain": 0.9,
        "release": 0.2
      }
    },
    "mpe": {
      "pressure": {
        "target": "filter_resonance",
        "range": [0.1, 0.8]
      },
      "timbre": {
        "target": "oscillator_mix",
        "range": [0.5, 1.0]
      }
    },
    "effects": {
      "distortion": {
        "amount": 0.2
      },
      "compressor": {
        "threshold": -20,
        "ratio": 4
      }
    }
  },
  "pad": {
    "oscillator": {
      "type": "sine",
      "detune": 0.05,
      "phase": 0
    },
    "filter": {
      "type": "lowpass",
      "frequency": 1500,
      "resonance": 0.2,
      "envelope": {
        "attack": 1.0,
        "decay": 0.5,
        "sustain": 0.8,
        "release": 2.0
      }
    },
    "amplifier": {
      "envelope": {
        "attack": 0.5,
        "decay": 0.3,
        "sustain": 0.7,
        "release": 1.5
      }
    },
    "mpe": {
      "pressure": {
        "target": "reverb_wet",
        "range": [0.1, 0.8]
      },
      "timbre": {
        "target": "filter_frequency",
        "range": [500, 3000]
      }
    },
    "effects": {
      "reverb": {
        "wet": 0.6,
        "decay": 3.0
      },
      "chorus": {
        "rate": 0.5,
        "depth": 0.3
      }
    }
  }
}

Berücksichtige den Stil und die Atmosphäre des Songs bei der Preset-Erstellung.`
  }

  parsePresetResponse(response) {
    try {
      // Versuche JSON aus der Antwort zu extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback: Verwende die gesamte Antwort als JSON
      return JSON.parse(response)
    } catch (error) {
      console.log('❌ Fehler beim Parsen der Preset-Antwort:', error.message)
      return this.getFallbackPresets()
    }
  }

  getFallbackPresets(songData = {}) {
    const style = songData.style || 'psychedelic_rock'
    
    const presets = {
      lead: {
        oscillator: {
          type: style.includes('rock') ? 'sawtooth' : 'sine',
          detune: 0.1,
          phase: 0
        },
        filter: {
          type: 'lowpass',
          frequency: 2000,
          resonance: 0.5,
          envelope: {
            attack: 0.1,
            decay: 0.3,
            sustain: 0.7,
            release: 0.5
          }
        },
        amplifier: {
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.8,
            release: 0.3
          }
        },
        mpe: {
          pressure: {
            target: 'filter_frequency',
            range: [500, 8000]
          },
          timbre: {
            target: 'oscillator_detune',
            range: [0, 0.5]
          },
          slide: {
            target: 'pitch',
            range: [-12, 12]
          }
        },
        effects: {
          reverb: {
            wet: 0.3,
            decay: 2.0
          },
          delay: {
            time: 0.3,
            feedback: 0.4
          }
        }
      },
      bass: {
        oscillator: {
          type: 'square',
          detune: 0,
          phase: 0
        },
        filter: {
          type: 'lowpass',
          frequency: 800,
          resonance: 0.3,
          envelope: {
            attack: 0.05,
            decay: 0.2,
            sustain: 0.9,
            release: 0.4
          }
        },
        amplifier: {
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.9,
            release: 0.2
          }
        },
        mpe: {
          pressure: {
            target: 'filter_resonance',
            range: [0.1, 0.8]
          },
          timbre: {
            target: 'oscillator_mix',
            range: [0.5, 1.0]
          }
        },
        effects: {
          distortion: {
            amount: 0.2
          },
          compressor: {
            threshold: -20,
            ratio: 4
          }
        }
      },
      pad: {
        oscillator: {
          type: 'sine',
          detune: 0.05,
          phase: 0
        },
        filter: {
          type: 'lowpass',
          frequency: 1500,
          resonance: 0.2,
          envelope: {
            attack: 1.0,
            decay: 0.5,
            sustain: 0.8,
            release: 2.0
          }
        },
        amplifier: {
          envelope: {
            attack: 0.5,
            decay: 0.3,
            sustain: 0.7,
            release: 1.5
          }
        },
        mpe: {
          pressure: {
            target: 'reverb_wet',
            range: [0.1, 0.8]
          },
          timbre: {
            target: 'filter_frequency',
            range: [500, 3000]
          }
        },
        effects: {
          reverb: {
            wet: 0.6,
            decay: 3.0
          },
          chorus: {
            rate: 0.5,
            depth: 0.3
          }
        }
      }
    }
    
    return presets
  }

  applyPresetToSynth(synth, preset) {
    console.log('🎛️ Wende Preset auf Synth an...')
    
    // Oscillator-Einstellungen
    if (preset.oscillator) {
      synth.setOscillatorType(preset.oscillator.type)
      synth.setOscillatorDetune(preset.oscillator.detune)
      synth.setOscillatorPhase(preset.oscillator.phase)
    }
    
    // Filter-Einstellungen
    if (preset.filter) {
      synth.setFilterType(preset.filter.type)
      synth.setFilterFrequency(preset.filter.frequency)
      synth.setFilterResonance(preset.filter.resonance)
      
      if (preset.filter.envelope) {
        synth.setFilterEnvelope(preset.filter.envelope)
      }
    }
    
    // Amplifier-Einstellungen
    if (preset.amplifier && preset.amplifier.envelope) {
      synth.setAmplifierEnvelope(preset.amplifier.envelope)
    }
    
    // MPE-Einstellungen
    if (preset.mpe) {
      synth.setMPEMapping(preset.mpe)
    }
    
    // Effekte
    if (preset.effects) {
      synth.setEffects(preset.effects)
    }
  }
}

export default MPEPresetGenerator 