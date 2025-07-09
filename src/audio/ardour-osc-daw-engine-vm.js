import ArdourOSCBridgeVM from '../integration/ardour-osc-bridge-vm.js'
import { EventEmitter } from 'events'
import { join } from 'path'

class ArdourOSCDAWEngineVM extends EventEmitter {
  constructor(config = {}) {
    super()
    this.ardourBridge = new ArdourOSCBridgeVM(config)
    this.isInitialized = false
    this.currentProject = null
    
    // MPE und MIDI 2.0 Support
    this.mpeEnabled = config.mpeEnabled || false
    this.midi2Enabled = config.midi2Enabled || false
    this.mpeChannels = config.mpeChannels || 16
    this.mpeBaseChannel = config.mpeBaseChannel || 1
    
    // MPE Channel Mapping
    this.mpeChannelMap = new Map()
    this.nextMpeChannel = this.mpeBaseChannel
    
    // MIDI 2.0 Features
    this.midi2Features = {
      perNoteControllers: true,
      noteExpression: true,
      polyPressure: true,
      channelPressure: true,
      pitchBend: true,
      programChange: true,
      controlChange: true
    }
    
    // Event-Forwarding von Ardour Bridge
    this.ardourBridge.on('oscMessage', (oscData) => {
      this.emit('ardourOSCMessage', oscData)
    })
    
    this.ardourBridge.on('disconnected', () => {
      this.isInitialized = false
      this.emit('ardourDisconnected')
    })
  }

  async initialize(config = {}) {
    console.log('🎛️ Initialisiere Ardour OSC DAW Engine für VM...')
    
    try {
      // Initialisiere Ardour OSC Bridge für VM
      const bridgeInitialized = await this.ardourBridge.initialize(config)
      
      if (!bridgeInitialized) {
        console.log('⚠️ Ardour OSC Bridge für VM konnte nicht initialisiert werden')
        return false
      }
      
      this.isInitialized = true
      console.log('✅ Ardour OSC DAW Engine für VM initialisiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler bei Ardour OSC DAW Engine VM Initialisierung:', error.message)
      return false
    }
  }

  async playProject() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('▶️ Starte Ardour Projekt Wiedergabe auf VM...')
    
    try {
      await this.ardourBridge.play()
      console.log('✅ Ardour Projekt Wiedergabe auf VM gestartet')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Starten der Wiedergabe auf VM:', error.message)
      throw error
    }
  }

  async stopProject() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('⏹️ Stoppe Ardour Projekt auf VM...')
    
    try {
      await this.ardourBridge.stop()
      console.log('✅ Ardour Projekt auf VM gestoppt')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Stoppen des Projekts auf VM:', error.message)
      throw error
    }
  }

  async pauseProject() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('⏸️ Pausiere Ardour Projekt auf VM...')
    
    try {
      await this.ardourBridge.pause()
      console.log('✅ Ardour Projekt auf VM pausiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Pausieren des Projekts auf VM:', error.message)
      throw error
    }
  }

  async saveProject() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('💾 Speichere Ardour Projekt auf VM...')
    
    try {
      await this.ardourBridge.saveSession()
      console.log('✅ Ardour Projekt auf VM gespeichert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Projekts auf VM:', error.message)
      throw error
    }
  }

  async setTempo(bpm) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log(`🎵 Setze Tempo auf VM: ${bpm} BPM`)
    
    try {
      await this.ardourBridge.setTempo(bpm)
      console.log(`✅ Tempo auf VM gesetzt: ${bpm} BPM`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Setzen des Tempos auf VM:', error.message)
      throw error
    }
  }

  async gotoStart() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('⏮️ Gehe zum Anfang auf VM...')
    
    try {
      await this.ardourBridge.gotoStart()
      console.log('✅ Zum Anfang auf VM gegangen')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Gehen zum Anfang auf VM:', error.message)
      throw error
    }
  }

  async gotoEnd() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('⏭️ Gehe zum Ende auf VM...')
    
    try {
      await this.ardourBridge.gotoEnd()
      console.log('✅ Zum Ende auf VM gegangen')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Gehen zum Ende auf VM:', error.message)
      throw error
    }
  }

  async toggleLoop() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('🔄 Toggle Loop auf VM...')
    
    try {
      await this.ardourBridge.toggleLoop()
      console.log('✅ Loop auf VM getoggled')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Togglen der Loop auf VM:', error.message)
      throw error
    }
  }

  async toggleClick() {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('🥁 Toggle Click auf VM...')
    
    try {
      await this.ardourBridge.toggleClick()
      console.log('✅ Click auf VM getoggled')
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Togglen des Clicks auf VM:', error.message)
      throw error
    }
  }

  async setTrackMute(trackId, mute) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log(`🔇 Setze Track ${trackId} Mute auf VM: ${mute}`)
    
    try {
      await this.ardourBridge.setTrackMute(trackId, mute)
      console.log(`✅ Track ${trackId} Mute auf VM gesetzt: ${mute}`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Setzen des Track Mute auf VM:', error.message)
      throw error
    }
  }

  async setTrackSolo(trackId, solo) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log(`🎤 Setze Track ${trackId} Solo auf VM: ${solo}`)
    
    try {
      await this.ardourBridge.setTrackSolo(trackId, solo)
      console.log(`✅ Track ${trackId} Solo auf VM gesetzt: ${solo}`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Setzen des Track Solo auf VM:', error.message)
      throw error
    }
  }

  async setTrackGain(trackId, gain) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log(`🎛️ Setze Track ${trackId} Gain auf VM: ${gain}`)
    
    try {
      await this.ardourBridge.setTrackGain(trackId, gain)
      console.log(`✅ Track ${trackId} Gain auf VM gesetzt: ${gain}`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Setzen des Track Gain auf VM:', error.message)
      throw error
    }
  }

  async executeArdourAction(action) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log(`🎛️ Führe Ardour-Aktion auf VM aus: ${action}`)
    
    try {
      await this.ardourBridge.executeAction(action)
      console.log(`✅ Ardour-Aktion auf VM ausgeführt: ${action}`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Ausführen der Ardour-Aktion auf VM:', error.message)
      throw error
    }
  }

  async disconnect() {
    console.log('🔌 Trenne Ardour OSC DAW Engine VM Verbindung...')
    
    if (this.ardourBridge) {
      await this.ardourBridge.disconnect()
    }
    
    this.isInitialized = false
    this.currentProject = null
    
    console.log('✅ Ardour OSC DAW Engine VM Verbindung getrennt')
  }

  // MPE/MIDI 2.0 Import Funktionen
  async createSongWithArdour(songData, outputPath) {
    if (!this.isInitialized) {
      throw new Error('Ardour OSC DAW Engine für VM nicht initialisiert')
    }
    
    console.log('🎵 Erstelle Song mit Ardour MPE/MIDI 2.0 Support...')
    
    try {
      // Prüfe ob MPE/MIDI 2.0 aktiviert ist
      const useMPE = this.mpeEnabled || songData.useMPE
      const useMIDI2 = this.midi2Enabled || songData.useMIDI2
      
      console.log(`🎛️ MPE: ${useMPE}, MIDI 2.0: ${useMIDI2}`)
      
      // Erstelle neue Ardour Session
      await this.createNewSession(songData.title)
      
      // Setze Tempo
      await this.setTempo(songData.tempo || 120)
      
      // Erstelle MPE/MIDI 2.0 Tracks
      const trackIds = await this.createMPETracks(songData, useMPE, useMIDI2)
      
      // Importiere MIDI-Daten
      const midiFilename = `${songData.title.replace(/\s+/g, '_')}_mpe.mid`
      const midiPath = join(outputPath, midiFilename)
      
      await this.importMIDIToTracks(midiPath, trackIds, useMPE, useMIDI2)
      
      // Speichere Session
      await this.saveProject()
      
      console.log('✅ Song mit Ardour MPE/MIDI 2.0 Support erstellt')
      
      return {
        success: true,
        session: songData.title,
        tracks: trackIds,
        midi: midiFilename,
        mpe: useMPE,
        midi2: useMIDI2
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Songs mit Ardour:', error.message)
      throw error
    }
  }

  async createNewSession(sessionName) {
    console.log(`🎛️ Erstelle neue Ardour Session: ${sessionName}`)
    
    try {
      // Neue Session erstellen über Ardour Action
      await this.executeArdourAction('Session > New Session')
      
      // Kurz warten bis Session erstellt ist
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Session speichern
      await this.executeArdourAction('Session > Save Session As')
      
      console.log(`✅ Ardour Session erstellt: ${sessionName}`)
      return true
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Ardour Session:', error.message)
      throw error
    }
  }

  async createMPETracks(songData, useMPE, useMIDI2) {
    console.log('🎛️ Erstelle MPE/MIDI 2.0 Tracks in Ardour...')
    
    const trackIds = []
    const trackTypes = ['lead', 'bass', 'pad', 'arp', 'fx', 'drum']
    
    try {
      for (let i = 0; i < trackTypes.length; i++) {
        const trackType = trackTypes[i]
        const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)}`
        
        // Track erstellen
        const trackId = await this.createMPETrack(trackName, trackType, useMPE, useMIDI2)
        trackIds.push(trackId)
        
        console.log(`✅ Track erstellt: ${trackName} (ID: ${trackId})`)
        
        // Kurz warten zwischen Track-Erstellung
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      return trackIds
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der MPE Tracks:', error.message)
      throw error
    }
  }

  async createMPETrack(trackName, trackType, useMPE, useMIDI2) {
    console.log(`🎛️ Erstelle MPE Track: ${trackName} (${trackType})`)
    
    try {
      // MIDI Track erstellen
      await this.executeArdourAction('Track > Add Track/Bus > MIDI Track')
      
      // Kurz warten
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Track umbenennen
      await this.executeArdourAction(`Track > Rename Track > ${trackName}`)
      
      // MPE/MIDI 2.0 Setup falls aktiviert
      if (useMPE || useMIDI2) {
        await this.setupMPETrack(trackType, useMPE, useMIDI2)
      }
      
      // Track ID zurückgeben (vereinfacht - in echtem System würde man die ID von Ardour bekommen)
      return `track_${trackType}_${Date.now()}`
      
    } catch (error) {
      console.error(`❌ Fehler beim Erstellen des MPE Tracks ${trackName}:`, error.message)
      throw error
    }
  }

  async setupMPETrack(trackType, useMPE, useMIDI2) {
    console.log(`🎛️ Setup MPE/MIDI 2.0 für Track: ${trackType}`)
    
    try {
      // MPE Zone Setup falls aktiviert
      if (useMPE) {
        await this.executeArdourAction('Track > MPE > Enable MPE Zone')
      }
      
      // MIDI 2.0 Setup falls aktiviert
      if (useMIDI2) {
        await this.executeArdourAction('Track > MIDI > Enable MIDI 2.0')
      }
      
      // Track-spezifische Controller Setup
      await this.setupTrackControllers(trackType)
      
      console.log(`✅ MPE/MIDI 2.0 Setup für Track ${trackType} abgeschlossen`)
      
    } catch (error) {
      console.error(`❌ Fehler beim MPE Setup für Track ${trackType}:`, error.message)
      // Nicht kritisch - weitermachen
    }
  }

  async setupTrackControllers(trackType) {
    const controllers = this.getTrackControllers(trackType)
    
    for (const controller of controllers) {
      try {
        await this.executeArdourAction(`Track > MIDI > Add Controller > ${controller}`)
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.log(`⚠️ Controller ${controller} konnte nicht hinzugefügt werden`)
      }
    }
  }

  getTrackControllers(trackType) {
    const controllerMap = {
      lead: ['Poly Pressure', 'Vibrato', 'Expression', 'Modulation'],
      bass: ['Slide', 'Poly Pressure', 'Expression'],
      pad: ['Timbre', 'Expression', 'Volume'],
      arp: ['Modulation', 'Slide', 'Glide'],
      fx: ['Timbre', 'Expression', 'Volume', 'Pan'],
      drum: ['Volume', 'Pan']
    }
    
    return controllerMap[trackType] || ['Volume', 'Pan']
  }

  async importMIDIToTracks(midiPath, trackIds, useMPE, useMIDI2) {
    console.log(`🎛️ Importiere MIDI-Daten: ${midiPath}`)
    
    try {
      // MIDI-Datei in Ardour importieren
      await this.executeArdourAction('Session > Import > MIDI File')
      
      // Kurz warten
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // MIDI-Daten auf Tracks verteilen
      await this.distributeMIDIToTracks(trackIds, useMPE, useMIDI2)
      
      console.log('✅ MIDI-Daten erfolgreich importiert und verteilt')
      
    } catch (error) {
      console.error('❌ Fehler beim Importieren der MIDI-Daten:', error.message)
      throw error
    }
  }

  async distributeMIDIToTracks(trackIds, useMPE, useMIDI2) {
    console.log('🎛️ Verteile MIDI-Daten auf Tracks...')
    
    try {
      // Vereinfachte Verteilung - in echtem System würde man die MIDI-Daten
      // basierend auf Channel/Controller-Daten auf die entsprechenden Tracks verteilen
      
      for (let i = 0; i < trackIds.length; i++) {
        const trackId = trackIds[i]
        
        // MIDI-Region auf Track ziehen
        await this.executeArdourAction(`Track > MIDI > Import Region to Track > ${trackId}`)
        
        // Kurz warten
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log('✅ MIDI-Daten auf Tracks verteilt')
      
    } catch (error) {
      console.error('❌ Fehler beim Verteilen der MIDI-Daten:', error.message)
      throw error
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      mpeEnabled: this.mpeEnabled,
      midi2Enabled: this.midi2Enabled,
      mpeChannels: this.mpeChannels,
      currentProject: this.currentProject
    }
  }
}

export default ArdourOSCDAWEngineVM 