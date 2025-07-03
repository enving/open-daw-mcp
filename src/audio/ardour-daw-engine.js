import ArdourMCPBridge from '../integration/ardour-mcp-bridge.js'
import { EventEmitter } from 'events'
import { join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

class ArdourDAWEngine extends EventEmitter {
  constructor() {
    super()
    this.ardourBridge = new ArdourMCPBridge()
    this.isInitialized = false
    this.currentProject = null
    this.tracks = new Map()
    this.midiData = null
    this.projectPath = join(process.cwd(), 'output', 'ardour_projects')
    
    // Event-Forwarding von Ardour Bridge
    this.ardourBridge.on('notification', (notification) => {
      this.emit('ardourNotification', notification)
    })
    
    this.ardourBridge.on('disconnected', () => {
      this.isInitialized = false
      this.emit('ardourDisconnected')
    })
  }

  async initialize(config = {}) {
    console.log('🎛️ Initialisiere Ardour DAW Engine...')
    
    try {
      // Erstelle Projekt-Verzeichnis
      mkdirSync(this.projectPath, { recursive: true })
      
      // Initialisiere Ardour MCP Bridge
      const bridgeInitialized = await this.ardourBridge.initialize()
      
      if (!bridgeInitialized) {
        console.log('⚠️ Ardour MCP Bridge konnte nicht initialisiert werden')
        return false
      }
      
      this.isInitialized = true
      console.log('✅ Ardour DAW Engine initialisiert')
      return true
      
    } catch (error) {
      console.error('❌ Fehler bei Ardour DAW Engine Initialisierung:', error.message)
      return false
    }
  }

  async createSongProject(songData) {
    if (!this.isInitialized) {
      throw new Error('Ardour DAW Engine nicht initialisiert')
    }
    
    console.log('🎼 Erstelle Ardour Projekt für Song:', songData.title)
    
    try {
      // Erstelle neues Projekt
      const projectName = `${songData.title}_${Date.now()}`
      const projectResult = await this.ardourBridge.createProject(projectName, 48000)
      
      this.currentProject = {
        name: projectName,
        path: join(this.projectPath, projectName),
        songData: songData
      }
      
      // Setze Tempo
      await this.ardourBridge.setTempo(songData.bpm || 120)
      
      // Erstelle Tracks basierend auf Song-Daten
      await this.createTracksFromSongData(songData)
      
      console.log('✅ Ardour Projekt erstellt:', projectName)
      return this.currentProject
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Ardour Projekts:', error.message)
      throw error
    }
  }

  async createTracksFromSongData(songData) {
    const trackTypes = {
      'drums': 'audio',
      'bass': 'audio', 
      'guitar': 'audio',
      'piano': 'audio',
      'synth': 'audio',
      'vocals': 'audio',
      'strings': 'audio',
      'brass': 'audio'
    }
    
    for (const [instrument, type] of Object.entries(trackTypes)) {
      if (songData.instruments && songData.instruments.includes(instrument)) {
        const trackName = `${instrument}_track`
        const trackId = await this.ardourBridge.createTrack(trackName, type)
        
        this.tracks.set(instrument, {
          id: trackId,
          name: trackName,
          type: type,
          instrument: instrument
        })
        
        console.log(`✅ Track erstellt: ${trackName} (ID: ${trackId})`)
      }
    }
  }

  async addMIDIToTracks(midiData) {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    console.log('🎼 Füge MIDI-Daten zu Ardour Tracks hinzu...')
    
    this.midiData = midiData
    
    try {
      for (const track of midiData.tracks) {
        const dawTrack = this.tracks.get(track.instrument)
        
        if (dawTrack) {
          // Konvertiere MIDI-Daten für Ardour
          const ardourMidiData = this.convertMIDIForArdour(track)
          
          await this.ardourBridge.addMIDIToTrack(dawTrack.id, ardourMidiData)
          console.log(`✅ MIDI zu Track hinzugefügt: ${track.instrument}`)
        }
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen von MIDI zu Tracks:', error.message)
      throw error
    }
  }

  convertMIDIForArdour(track) {
    // Konvertiere MIDI-Daten in Ardour-kompatibles Format
    return {
      notes: track.notes.map(note => ({
        time: note.time,
        duration: note.duration,
        note: note.note,
        velocity: note.velocity,
        channel: note.channel || 0
      })),
      controllers: track.controllers || [],
      program: track.program || 0,
      bank: track.bank || 0
    }
  }

  async addPluginsToTracks(pluginConfig) {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    console.log('🔌 Füge Plugins zu Ardour Tracks hinzu...')
    
    try {
      for (const [instrument, plugins] of Object.entries(pluginConfig)) {
        const dawTrack = this.tracks.get(instrument)
        
        if (dawTrack && Array.isArray(plugins)) {
          for (const plugin of plugins) {
            const pluginId = await this.ardourBridge.addPluginToTrack(dawTrack.id, plugin.name)
            
            // Setze Plugin-Parameter
            if (plugin.parameters) {
              for (const [param, value] of Object.entries(plugin.parameters)) {
                await this.ardourBridge.setPluginParameter(dawTrack.id, pluginId, param, value)
              }
            }
            
            console.log(`✅ Plugin ${plugin.name} zu Track ${instrument} hinzugefügt`)
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen von Plugins:', error.message)
      throw error
    }
  }

  async playProject() {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    console.log('▶️ Starte Ardour Projekt Wiedergabe...')
    
    try {
      await this.ardourBridge.play()
      console.log('✅ Ardour Projekt Wiedergabe gestartet')
      
    } catch (error) {
      console.error('❌ Fehler beim Starten der Wiedergabe:', error.message)
      throw error
    }
  }

  async stopProject() {
    if (!this.isInitialized) {
      return
    }
    
    console.log('⏹️ Stoppe Ardour Projekt...')
    
    try {
      await this.ardourBridge.stop()
      console.log('✅ Ardour Projekt gestoppt')
      
    } catch (error) {
      console.error('❌ Fehler beim Stoppen des Projekts:', error.message)
    }
  }

  async pauseProject() {
    if (!this.isInitialized) {
      return
    }
    
    console.log('⏸️ Pausiere Ardour Projekt...')
    
    try {
      await this.ardourBridge.pause()
      console.log('✅ Ardour Projekt pausiert')
      
    } catch (error) {
      console.error('❌ Fehler beim Pausieren des Projekts:', error.message)
    }
  }

  async saveProject() {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    console.log('💾 Speichere Ardour Projekt...')
    
    try {
      await this.ardourBridge.saveProject()
      console.log('✅ Ardour Projekt gespeichert')
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Projekts:', error.message)
      throw error
    }
  }

  async exportProject(format = 'wav', outputPath = null) {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    if (!outputPath) {
      outputPath = join(process.cwd(), 'output', 'audio', `${this.currentProject.name}.${format}`)
    }
    
    console.log(`📤 Exportiere Ardour Projekt als ${format}...`)
    
    try {
      await this.ardourBridge.exportProject(format, outputPath)
      console.log('✅ Ardour Projekt exportiert:', outputPath)
      
      return outputPath
      
    } catch (error) {
      console.error('❌ Fehler beim Exportieren des Projekts:', error.message)
      throw error
    }
  }

  async getProjectStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' }
    }
    
    try {
      const transportState = await this.ardourBridge.getTransportState()
      const tracks = await this.ardourBridge.getTracks()
      const projectInfo = await this.ardourBridge.getProjectInfo()
      
      return {
        status: 'initialized',
        transport: transportState,
        tracks: tracks,
        project: projectInfo,
        currentProject: this.currentProject
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des Projekt-Status:', error.message)
      return { status: 'error', error: error.message }
    }
  }

  async adjustTrackParameter(instrument, parameter, value) {
    if (!this.isInitialized || !this.currentProject) {
      throw new Error('Ardour DAW Engine nicht initialisiert oder kein Projekt aktiv')
    }
    
    const dawTrack = this.tracks.get(instrument)
    if (!dawTrack) {
      throw new Error(`Track für Instrument ${instrument} nicht gefunden`)
    }
    
    console.log(`🎛️ Passe Parameter an: ${instrument}.${parameter} = ${value}`)
    
    try {
      switch (parameter) {
        case 'gain':
          await this.ardourBridge.setTrackGain(dawTrack.id, value)
          break
        case 'mute':
          await this.ardourBridge.setTrackMute(dawTrack.id, value)
          break
        case 'solo':
          await this.ardourBridge.setTrackSolo(dawTrack.id, value)
          break
        default:
          throw new Error(`Unbekannter Parameter: ${parameter}`)
      }
      
      console.log(`✅ Parameter angepasst: ${instrument}.${parameter} = ${value}`)
      
    } catch (error) {
      console.error('❌ Fehler beim Anpassen des Parameters:', error.message)
      throw error
    }
  }

  async executeArdourAction(action) {
    if (!this.isInitialized) {
      throw new Error('Ardour DAW Engine nicht initialisiert')
    }
    
    console.log(`🎛️ Führe Ardour Aktion aus: ${action}`)
    
    try {
      await this.ardourBridge.executeAction(action)
      console.log(`✅ Ardour Aktion ausgeführt: ${action}`)
      
    } catch (error) {
      console.error('❌ Fehler beim Ausführen der Ardour Aktion:', error.message)
      throw error
    }
  }

  // Cleanup
  async disconnect() {
    if (this.ardourBridge) {
      await this.ardourBridge.disconnect()
    }
    
    this.isInitialized = false
    this.currentProject = null
    this.tracks.clear()
    this.midiData = null
    
    console.log('🎛️ Ardour DAW Engine getrennt')
  }
}

export default ArdourDAWEngine 