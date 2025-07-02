import { IterativeSongGenerator } from '../song-generator/iterative-song-generator.js'
import { IONOSClient } from '../ionos/ionos-client.js'
import ToneAudioEngine from '../audio/tone-audio-engine.js'
import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export class OpenWebUIMCPBridge {
  constructor() {
    this.songGenerator = new IterativeSongGenerator()
    this.ionosClient = new IONOSClient()
    this.audioEngine = new ToneAudioEngine()
    this.activeSessions = new Map()
    
    // Audio-Output-Verzeichnis erstellen
    this.audioOutputDir = join(process.cwd(), 'output', 'audio')
    if (!existsSync(this.audioOutputDir)) {
      mkdirSync(this.audioOutputDir, { recursive: true })
    }
    
    // Song-Daten-Verzeichnis erstellen
    this.songDataDir = join(process.cwd(), 'output', 'songs')
    if (!existsSync(this.songDataDir)) {
      mkdirSync(this.songDataDir, { recursive: true })
    }
  }

  // OpenWebUI Function Definitions für Song-Entwicklung
  getFunctionDefinitions() {
    return [
      {
        name: 'start_song_session',
        description: 'Startet eine neue Song-Entwicklungssession',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Beschreibung des gewünschten Songs'
            },
            style: {
              type: 'string',
              description: 'Musikstil (Techno, House, Ambient, etc.)'
            },
            artist: {
              type: 'string',
              description: 'Inspirierender Künstler (optional)'
            }
          },
          required: ['description', 'style']
        }
      },
      {
        name: 'develop_song_structure',
        description: 'Entwickelt die Song-Struktur basierend auf Benutzer-Feedback',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            },
            feedback: {
              type: 'string',
              description: 'Benutzer-Feedback für die Struktur-Entwicklung'
            }
          },
          required: ['sessionId', 'feedback']
        }
      },
      {
        name: 'develop_chord_progressions',
        description: 'Entwickelt Akkord-Progressions für den Song',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            },
            feedback: {
              type: 'string',
              description: 'Benutzer-Feedback für Akkord-Entwicklung'
            }
          },
          required: ['sessionId', 'feedback']
        }
      },
      {
        name: 'develop_melodies',
        description: 'Entwickelt Melodien für den Song',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            },
            feedback: {
              type: 'string',
              description: 'Benutzer-Feedback für Melodie-Entwicklung'
            }
          },
          required: ['sessionId', 'feedback']
        }
      },
      {
        name: 'develop_instrumentation',
        description: 'Entwickelt die Instrumentierung für den Song',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            },
            feedback: {
              type: 'string',
              description: 'Benutzer-Feedback für Instrumentierung'
            }
          },
          required: ['sessionId', 'feedback']
        }
      },
      {
        name: 'finalize_song',
        description: 'Finalisiert den Song und generiert finale Daten',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            },
            feedback: {
              type: 'string',
              description: 'Finales Benutzer-Feedback'
            }
          },
          required: ['sessionId', 'feedback']
        }
      },
      {
        name: 'get_session_status',
        description: 'Zeigt den aktuellen Status einer Song-Session',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der Session'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'list_active_sessions',
        description: 'Listet alle aktiven Song-Sessions auf',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'generate_audio_preview',
        description: 'Generiert eine Audio-Vorschau für den aktuellen Song-Stand',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der Session'
            },
            section: {
              type: 'string',
              description: 'Sektion für Vorschau (optional)'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'generate_final_audio',
        description: 'Generiert die finale Audio-Datei für den Song',
        parameters: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID der aktiven Session'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'list_saved_songs',
        description: 'Listet alle gespeicherten Song-Dateien auf',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ]
  }

  // Function Handler für OpenWebUI
  async handleFunctionCall(functionName, parameters) {
    try {
      // Falls functionName ein natürlicher Text ist, versuche ihn zu interpretieren
      if (typeof functionName === 'string' && !functionName.includes('_')) {
        return await this.handleNaturalLanguageRequest(functionName, parameters)
      }
      
      switch (functionName) {
        case 'start_song_session':
          return await this.startSongSession(parameters)
        
        case 'develop_song_structure':
          return await this.developSongStructure(parameters)
        
        case 'develop_chord_progressions':
          return await this.developChordProgressions(parameters)
        
        case 'develop_melodies':
          return await this.developMelodies(parameters)
        
        case 'develop_instrumentation':
          return await this.developInstrumentation(parameters)
        
        case 'finalize_song':
          return await this.finalizeSong(parameters)
        
        case 'get_session_status':
          return await this.getSessionStatus(parameters)
        
        case 'list_active_sessions':
          return await this.listActiveSessions(parameters)
        
        case 'generate_audio_preview':
          return await this.generateAudioPreview(parameters)
        
        case 'generate_final_audio':
          return await this.generateFinalAudio(parameters)
        
        case 'list_saved_songs':
          return await this.listSavedSongs()
        
        default:
          return {
            success: false,
            error: `Unbekannte Funktion: ${functionName}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Natürliche Sprache in Funktionsaufrufe übersetzen
  async handleNaturalLanguageRequest(text, parameters) {
    const lowerText = text.toLowerCase()
    
    // Song-Session starten
    if (lowerText.includes('start') || lowerText.includes('erstellen') || lowerText.includes('neue') || lowerText.includes('song')) {
      if (lowerText.includes('session') || lowerText.includes('song')) {
        return await this.startSongSession(parameters)
      }
    }
    
    // Audio generieren
    if (lowerText.includes('audio') || lowerText.includes('musik') || lowerText.includes('generieren') || lowerText.includes('erstellen')) {
      if (lowerText.includes('preview') || lowerText.includes('vorschau')) {
        return await this.generateAudioPreview(parameters)
      } else {
        return await this.generateFinalAudio(parameters)
      }
    }
    
    // Song-Struktur entwickeln
    if (lowerText.includes('struktur') || lowerText.includes('aufbau')) {
      return await this.developSongStructure(parameters)
    }
    
    // Akkorde entwickeln
    if (lowerText.includes('akkord') || lowerText.includes('chord')) {
      return await this.developChordProgressions(parameters)
    }
    
    // Melodien entwickeln
    if (lowerText.includes('melodie') || lowerText.includes('melody')) {
      return await this.developMelodies(parameters)
    }
    
    // Instrumentierung entwickeln
    if (lowerText.includes('instrument') || lowerText.includes('sound')) {
      return await this.developInstrumentation(parameters)
    }
    
    // Song finalisieren
    if (lowerText.includes('final') || lowerText.includes('fertig') || lowerText.includes('abschließen')) {
      return await this.finalizeSong(parameters)
    }
    
    // Sessions auflisten
    if (lowerText.includes('liste') || lowerText.includes('zeige') || lowerText.includes('alle')) {
      if (lowerText.includes('session')) {
        return await this.listActiveSessions(parameters)
      } else if (lowerText.includes('song') || lowerText.includes('songs')) {
        return await this.listSavedSongs()
      }
    }
    
    // Status abfragen
    if (lowerText.includes('status') || lowerText.includes('wie')) {
      return await this.getSessionStatus(parameters)
    }
    
    // Fallback: Versuche eine neue Song-Session zu starten
    return await this.startSongSession(parameters)
  }

  // Implementierung der Funktionen
  async startSongSession(parameters) {
    try {
      console.log('🎵 StartSongSession Parameter:', parameters)
      
      // Parameter extrahieren - verschiedene Formate unterstützen
      let description, style, artist
      
      if (typeof parameters === 'object') {
        description = parameters.description || 'Ein elektronischer Song'
        style = parameters.style || 'techno'
        artist = parameters.artist || null
      } else if (typeof parameters === 'string') {
        // Versuche Parameter aus String zu extrahieren
        const descMatch = parameters.match(/description:\s*"([^"]+)"/)
        const styleMatch = parameters.match(/style:\s*"([^"]+)"/)
        const artistMatch = parameters.match(/artist:\s*"([^"]+)"/)
        
        description = descMatch ? descMatch[1] : 'Ein elektronischer Song'
        style = styleMatch ? styleMatch[1] : 'techno'
        artist = artistMatch ? artistMatch[1] : null
      } else {
        // Fallback
        description = 'Ein elektronischer Song'
        style = 'techno'
        artist = null
      }
      
      console.log('🎵 Extrahierte Parameter:', { description, style, artist })
      
      const result = await this.songGenerator.startNewSong(description, style, artist)
      
      if (result.success) {
        this.activeSessions.set(result.sessionId, {
          generator: this.songGenerator,
          currentStep: result.nextStep,
          createdAt: new Date()
        })
        
        // Song-Daten speichern
        this.saveSongData(result.sessionId, result.songData)
      }
      
      return {
        success: result.success,
        sessionId: result.sessionId,
        songData: result.songData,
        nextStep: result.nextStep,
        message: result.message,
        functionResponse: `🎵 Neue Song-Session gestartet: "${result.songData.title}" (${result.songData.style}, ${result.songData.tempo} BPM, ${result.songData.key})`
      }
    } catch (error) {
      console.error('❌ Fehler beim Starten der Song-Session:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async developSongStructure({ sessionId, feedback }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const result = await session.generator.developStructure(feedback)
    
    if (result.success) {
      session.currentStep = result.nextStep
    }
    
    return {
      success: result.success,
      structure: result.structure,
      nextStep: result.nextStep,
      message: result.message,
      functionResponse: `🏗️ Song-Struktur entwickelt: ${result.structure.structure.length} Sektionen, ${result.structure.totalDuration} Takte Gesamtdauer`
    }
  }

  async developChordProgressions({ sessionId, feedback }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const result = await session.generator.developChordProgressions(feedback)
    
    if (result.success) {
      session.currentStep = result.nextStep
    }
    
    return {
      success: result.success,
      chordProgressions: result.chordProgressions,
      nextStep: result.nextStep,
      message: result.message,
      functionResponse: `🎼 Akkord-Progressions entwickelt: ${Object.keys(result.chordProgressions.progressions).length} Sektionen mit Variationen`
    }
  }

  async developMelodies({ sessionId, feedback }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const result = await session.generator.developMelodies(feedback)
    
    if (result.success) {
      session.currentStep = result.nextStep
    }
    
    return {
      success: result.success,
      melodies: result.melodies,
      nextStep: result.nextStep,
      message: result.message,
      functionResponse: `🎶 Melodien entwickelt: ${Object.keys(result.melodies.melodies).length} Sektionen mit Hook-Lines`
    }
  }

  async developInstrumentation({ sessionId, feedback }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const result = await session.generator.developInstrumentation(feedback)
    
    if (result.success) {
      session.currentStep = result.nextStep
    }
    
    return {
      success: result.success,
      instruments: result.instruments,
      nextStep: result.nextStep,
      message: result.message,
      functionResponse: `🎛️ Instrumentierung entwickelt: ${Object.keys(result.instruments.instruments).length} Sektionen mit Effekten`
    }
  }

  async finalizeSong({ sessionId, feedback }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const result = await session.generator.finalizeSong(feedback)
    
    if (result.success) {
      session.currentStep = 'completed'
      const completeSong = session.generator.getCompleteSong()
      
      return {
        success: true,
        finalData: result.finalData,
        song: completeSong,
        message: result.message,
        functionResponse: `🎉 Song finalisiert: "${completeSong.title}" - ${completeSong.duration} Takte, ${completeSong.structure.length} Sektionen, bereit für Audio-Generierung!`
      }
    }
    
    return {
      success: false,
      error: result.error
    }
  }

  async getSessionStatus({ sessionId }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    const song = session.generator.getCompleteSong()
    const currentSong = session.generator.currentSong
    
    return {
      success: true,
      sessionId,
      currentStep: session.currentStep,
      songData: currentSong?.songData,
      structure: currentSong?.structure,
      chordProgressions: currentSong?.chordProgressions,
      melodies: currentSong?.melodies,
      instruments: currentSong?.instruments,
      isCompleted: session.currentStep === 'completed',
      functionResponse: `📊 Session Status: ${session.currentStep} - ${currentSong?.songData?.title || 'Unbekannt'}`
    }
  }

  async listActiveSessions() {
    const sessions = Array.from(this.activeSessions.entries()).map(([id, session]) => ({
      id,
      currentStep: session.currentStep,
      createdAt: session.createdAt,
      songTitle: session.generator.currentSong?.songData?.title || 'Unbekannt'
    }))
    
    return {
      success: true,
      sessions,
      count: sessions.length,
      functionResponse: `📚 ${sessions.length} aktive Sessions gefunden`
    }
  }

  async generateAudioPreview({ sessionId, section }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    try {
      const song = session.generator.getCompleteSong()
      if (!song) {
        return { success: false, error: 'Song-Daten nicht verfügbar' }
      }

      // Audio-Parameter aus Song-Daten extrahieren
      const audioPattern = {
        bpm: song.songData?.tempo || 120,
        key: song.songData?.key || 'C',
        scale: song.songData?.scale || 'major'
      }
      
      const style = song.songData?.style || 'techno'
      
      // Eindeutigen Dateinamen erstellen
      const timestamp = Date.now()
      const audioFileName = `preview_${sessionId}_${timestamp}.wav`
      const audioFilePath = join(this.audioOutputDir, audioFileName)
      
      // Audio generieren
      console.log('🎵 Generiere Audio-Vorschau...')
      await this.audioEngine.createSong(audioPattern, style, audioFilePath)
      
      // Relative URL für OpenWebUI erstellen
      const audioUrl = `/api/audio/${audioFileName}`
      
      return {
        success: true,
        audioUrl: audioUrl,
        audioFilePath: audioFilePath,
        duration: 30,
        section: section || 'full',
        songTitle: song.songData?.title || 'Unbekannt',
        functionResponse: `🎵 Audio-Vorschau generiert: ${song.songData?.title || 'Song'} (${section || 'Vollständiger Song'}) - [Audio abspielen](${audioUrl})`
      }
    } catch (error) {
      console.error('❌ Fehler bei Audio-Generierung:', error)
      return {
        success: false,
        error: 'Audio-Generierung fehlgeschlagen: ' + error.message
      }
    }
  }

  async generateFinalAudio({ sessionId }) {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return { success: false, error: 'Session nicht gefunden' }
    }

    try {
      const song = session.generator.getCompleteSong()
      if (!song) {
        return { success: false, error: 'Song-Daten nicht verfügbar' }
      }

      // Audio-Parameter aus Song-Daten extrahieren
      const audioPattern = {
        bpm: song.songData?.tempo || 120,
        key: song.songData?.key || 'C',
        scale: song.songData?.scale || 'major'
      }
      
      const style = song.songData?.style || 'techno'
      
      // Eindeutigen Dateinamen erstellen
      const timestamp = Date.now()
      const audioFileName = `final_${sessionId}_${timestamp}.wav`
      const audioFilePath = join(this.audioOutputDir, audioFileName)
      
      // Audio generieren
      console.log('🎵 Generiere finale Audio-Datei...')
      await this.audioEngine.createSong(audioPattern, style, audioFilePath)
      
      // Relative URL für OpenWebUI erstellen
      const audioUrl = `/api/audio/${audioFileName}`
      
      return {
        success: true,
        audioUrl: audioUrl,
        audioFilePath: audioFilePath,
        songTitle: song.songData?.title || 'Unbekannt',
        duration: song.duration || 120,
        functionResponse: `🎉 Finale Audio-Datei generiert: ${song.songData?.title || 'Song'} - [Download Audio](${audioUrl})`
      }
    } catch (error) {
      console.error('❌ Fehler bei finaler Audio-Generierung:', error)
      return {
        success: false,
        error: 'Finale Audio-Generierung fehlgeschlagen: ' + error.message
      }
    }
  }

  // Hilfsmethoden
  getSessionById(sessionId) {
    return this.activeSessions.get(sessionId)
  }

  removeSession(sessionId) {
    return this.activeSessions.delete(sessionId)
  }

  getAllSessions() {
    return Array.from(this.activeSessions.entries())
  }
  
  // Song-Daten als JSON-Datei speichern
  saveSongData(sessionId, songData) {
    try {
      const filename = `song_${sessionId}.json`
      const filepath = join(this.songDataDir, filename)
      
      const dataToSave = {
        sessionId,
        createdAt: new Date().toISOString(),
        songData,
        lastUpdated: new Date().toISOString()
      }
      
      writeFileSync(filepath, JSON.stringify(dataToSave, null, 2), 'utf8')
      console.log(`💾 Song-Daten gespeichert: ${filepath}`)
      return filepath
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Song-Daten:', error)
      return null
    }
  }
  
  // Song-Daten aus JSON-Datei laden
  loadSongData(sessionId) {
    try {
      const filename = `song_${sessionId}.json`
      const filepath = join(this.songDataDir, filename)
      
      if (existsSync(filepath)) {
        const data = readFileSync(filepath, 'utf8')
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      console.error('❌ Fehler beim Laden der Song-Daten:', error)
      return null
    }
  }
  
  // Alle gespeicherten Songs auflisten
  async listSavedSongs() {
    try {
      const files = []
      if (existsSync(this.songDataDir)) {
        const songFiles = readdirSync(this.songDataDir).filter(file => file.endsWith('.json'))
        for (const file of songFiles) {
          const filepath = join(this.songDataDir, file)
          const data = readFileSync(filepath, 'utf8')
          const songData = JSON.parse(data)
          files.push({
            filename: file,
            sessionId: songData.sessionId,
            title: songData.songData?.title || 'Unbekannt',
            createdAt: songData.createdAt,
            lastUpdated: songData.lastUpdated
          })
        }
      }
      
      return {
        success: true,
        songs: files,
        count: files.length,
        functionResponse: `📁 ${files.length} gespeicherte Songs gefunden`
      }
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der Songs:', error)
      return {
        success: false,
        error: error.message,
        songs: [],
        count: 0
      }
    }
  }
} 