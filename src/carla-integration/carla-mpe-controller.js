#!/usr/bin/env node

/**
 * Carla MPE Controller
 * Steuert Carla Plugins mit MPE-Daten
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

class CarlaMPEController {
  constructor(vmHost = '87.106.81.49', vmUser = 'root', vmSshKey = '~/.ssh/vm_key') {
    this.vmHost = vmHost
    this.vmUser = vmUser
    this.vmSshKey = vmSshKey
    this.carlaPort = 2000
  }

  /**
   * Startet Carla im Headless-Modus
   */
  async startCarla() {
    try {
      console.log('🎛️ Starte Carla im Headless-Modus...')
      
      const startCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "cd /opt/open-daw-mcp/output && timeout 30s carla --no-gui --engine=jack &"`
      await execAsync(startCommand)
      
      // Warte für Carla-Start
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      console.log('✅ Carla gestartet')
      return true
      
    } catch (error) {
      console.log('⚠️ Carla Start:', error.message)
      return false
    }
  }

  /**
   * Sendet MPE Note an Carla Plugin
   */
  async sendMPENote(channel, note, velocity, pressure, timbre, pitchBend) {
    try {
      const oscMessage = `/carla/mpe/note_on ${channel} ${note} ${velocity}`
      const command = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${oscMessage}' | nc -u localhost ${this.carlaPort}"`
      
      await execAsync(command)
      
      // MPE Pressure (Aftertouch)
      if (pressure > 0) {
        const pressureMessage = `/carla/mpe/pressure ${channel} ${pressure}`
        const pressureCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${pressureMessage}' | nc -u localhost ${this.carlaPort}"`
        await execAsync(pressureCommand)
      }
      
      // MPE Timbre (CC74)
      if (timbre > 0) {
        const timbreMessage = `/carla/mpe/timbre ${channel} ${timbre}`
        const timbreCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${timbreMessage}' | nc -u localhost ${this.carlaPort}"`
        await execAsync(timbreCommand)
      }
      
      // MPE Pitch Bend
      if (pitchBend !== 0) {
        const pitchMessage = `/carla/mpe/pitch_bend ${channel} ${pitchBend}`
        const pitchCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${pitchMessage}' | nc -u localhost ${this.carlaPort}"`
        await execAsync(pitchCommand)
      }
      
    } catch (error) {
      console.log('⚠️ MPE Note Send:', error.message)
    }
  }

  /**
   * Sendet MPE Note-off
   */
  async sendMPENoteOff(channel, note) {
    try {
      const oscMessage = `/carla/mpe/note_off ${channel} ${note}`
      const command = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${oscMessage}' | nc -u localhost ${this.carlaPort}"`
      
      await execAsync(command)
      
    } catch (error) {
      console.log('⚠️ MPE Note-off Send:', error.message)
    }
  }

  /**
   * Sendet MPE CC (Continuous Controller)
   */
  async sendMPECC(channel, controller, value) {
    try {
      const oscMessage = `/carla/mpe/cc ${channel} ${controller} ${value}`
      const command = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "echo '${oscMessage}' | nc -u localhost ${this.carlaPort}"`
      
      await execAsync(command)
      
    } catch (error) {
      console.log('⚠️ MPE CC Send:', error.message)
    }
  }

  /**
   * Spielt MPE-Sequenz ab
   */
  async playMPESequence(mpeData) {
    try {
      console.log(`🎵 Spiele MPE-Sequenz mit ${mpeData.length} Events...`)
      
      for (const event of mpeData) {
        const eventType = event.type || 'note'
        const channel = event.channel || 1
        const note = event.note || 60
        const velocity = event.velocity || 64
        const pressure = event.pressure || 0
        const timbre = event.timbre || 0
        const pitchBend = event.pitch_bend || 0
        const duration = event.duration || 0.5
        
        if (eventType === 'note') {
          await this.sendMPENote(channel, note, velocity, pressure, timbre, pitchBend)
          await new Promise(resolve => setTimeout(resolve, duration * 1000))
          await this.sendMPENoteOff(channel, note)
        } else if (eventType === 'cc') {
          const controller = event.controller || 1
          const value = event.value || 0
          await this.sendMPECC(channel, controller, value)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log('✅ MPE-Sequenz abgespielt')
      
    } catch (error) {
      console.log('⚠️ MPE-Sequenz Playback:', error.message)
    }
  }

  /**
   * Startet Audio-Aufnahme
   */
  async startAudioRecording(filename = 'carla_mpe_audio.wav', duration = 10) {
    try {
      console.log('🎙️ Starte Audio-Aufnahme...')
      
      const recordCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "cd /opt/open-daw-mcp/output && timeout ${duration}s arecord -f S16_LE -r 44100 -c 2 ${filename} &"`
      await execAsync(recordCommand)
      
      console.log(`✅ Audio-Aufnahme gestartet: ${filename}`)
      return true
      
    } catch (error) {
      console.log('⚠️ Audio-Aufnahme Start:', error.message)
      return false
    }
  }

  /**
   * Stoppt Audio-Aufnahme und lädt Datei herunter
   */
  async stopAudioRecording(filename = 'carla_mpe_audio.wav') {
    try {
      console.log('🛑 Stoppe Audio-Aufnahme...')
      
      // Stoppe Aufnahme
      const stopCommand = `ssh -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost} "pkill arecord"`
      await execAsync(stopCommand)
      
      // Warte kurz
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Lade Datei herunter
      const downloadCommand = `scp -i ${this.vmSshKey} ${this.vmUser}@${this.vmHost}:/opt/open-daw-mcp/output/${filename} ./output/`
      await execAsync(downloadCommand)
      
      console.log(`✅ Audio-Datei heruntergeladen: ${filename}`)
      return true
      
    } catch (error) {
      console.log('⚠️ Audio-Aufnahme Stop:', error.message)
      return false
    }
  }

  /**
   * Vollständige MPE-zu-Audio Pipeline
   */
  async runMPEPipeline(mpeData, audioFilename = 'carla_mpe_output.wav') {
    try {
      console.log('🚀 Starte MPE-zu-Audio Pipeline...')
      
      // 1. Starte Carla
      const carlaStarted = await this.startCarla()
      if (!carlaStarted) {
        throw new Error('Carla konnte nicht gestartet werden')
      }
      
      // 2. Starte Audio-Aufnahme
      const recordingStarted = await this.startAudioRecording(audioFilename, 15)
      if (!recordingStarted) {
        throw new Error('Audio-Aufnahme konnte nicht gestartet werden')
      }
      
      // 3. Warte kurz für Aufnahme-Start
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 4. Spiele MPE-Sequenz
      await this.playMPESequence(mpeData)
      
      // 5. Stoppe Aufnahme und lade herunter
      await this.stopAudioRecording(audioFilename)
      
      console.log('🎉 MPE-zu-Audio Pipeline erfolgreich!')
      return true
      
    } catch (error) {
      console.error('❌ MPE Pipeline fehlgeschlagen:', error.message)
      return false
    }
  }
}

export default CarlaMPEController 