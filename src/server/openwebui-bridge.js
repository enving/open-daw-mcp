import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

/**
 * OpenWebUI MCP Bridge für die DAW
 * 
 * Diese Bridge übersetzt natürliche Sprache in DAW-Befehle
 * und generiert MusicXML basierend auf Textbeschreibungen.
 */
export class OpenWebUIMCPBridge {
  constructor() {
    this.outputDir = join(process.cwd(), 'output')
    this.audioDir = join(this.outputDir, 'audio')
    this.musicxmlDir = join(this.outputDir, 'musicxml')
    
    // Erstelle Output-Verzeichnisse
    this._ensureDirectories()
  }

  _ensureDirectories() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
    if (!existsSync(this.audioDir)) {
      mkdirSync(this.audioDir, { recursive: true })
    }
    if (!existsSync(this.musicxmlDir)) {
      mkdirSync(this.musicxmlDir, { recursive: true })
    }
  }

  /**
   * Gibt die verfügbaren Funktionen für OpenWebUI zurück
   */
  getFunctionDefinitions() {
    return [
      {
        name: "create_musicxml",
        description: "Erstellt MusicXML basierend auf natürlicher Sprachbeschreibung",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Beschreibung der gewünschten Musik (z.B. 'Tame Impala Style Song mit psychedelischen Synths')"
            },
            style: {
              type: "string",
              description: "Musikstil oder Künstler-Inspiration (z.B. 'tame impala', 'rock', 'electronic')",
              default: "pop"
            },
            duration: {
              type: "number",
              description: "Dauer in Sekunden (Standard: 60)",
              default: 60
            }
          },
          required: ["description"]
        }
      },
      {
        name: "generate_melody",
        description: "Generiert eine Melodie basierend auf einer Textbeschreibung",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Beschreibung der gewünschten Melodie (z.B. 'fröhliche Melodie in C-Dur')"
            },
            duration: {
              type: "number",
              description: "Dauer in Sekunden (Standard: 30)",
              default: 30
            },
            tempo: {
              type: "number", 
              description: "Tempo in BPM (Standard: 120)",
              default: 120
            }
          },
          required: ["description"]
        }
      },
      {
        name: "generate_song",
        description: "Generiert einen kompletten Song mit mehreren Instrumenten",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Beschreibung des gewünschten Songs (z.B. 'fröhlicher Pop-Song mit Gitarre und Schlagzeug')"
            },
            duration: {
              type: "number",
              description: "Dauer in Sekunden (Standard: 60)",
              default: 60
            },
            style: {
              type: "string",
              description: "Musikstil (z.B. 'pop', 'rock', 'jazz', 'electronic')",
              default: "pop"
            }
          },
          required: ["description"]
        }
      }
    ]
  }

  /**
   * Verarbeitet Funktionsaufrufe von OpenWebUI
   */
  async handleFunctionCall(functionName, parameters = {}) {
    console.log(`🎵 Function Call: ${functionName}`, parameters)
    console.log(`🎵 Function Name Type: ${typeof functionName}`)
    console.log(`🎵 Parameters Type: ${typeof parameters}`)

    try {
      switch (functionName) {
        case "create_musicxml":
          console.log(`🎵 Calling _createMusicXML with:`, parameters)
          return await this._createMusicXML(parameters)
        
        case "generate_melody":
          console.log(`🎵 Calling _generateMelody with:`, parameters)
          return await this._generateMelody(parameters)
        
        case "generate_song":
          console.log(`🎵 Calling _generateSong with:`, parameters)
          return await this._generateSong(parameters)
        
        default:
          console.log(`🎵 No direct function match, using natural language processing`)
          // Natürliche Sprachverarbeitung
          return await this._processNaturalLanguage(functionName, parameters)
      }
    } catch (error) {
      console.error(`❌ Fehler bei Function Call ${functionName}:`, error)
      throw error
    }
  }

  /**
   * Erstellt MusicXML basierend auf natürlicher Sprachbeschreibung
   * Diese Funktion ist der zentrale Ansatz: LLM → MusicXML → DAW
   */
  async _createMusicXML(params) {
    const { description = "Ein Pop-Song", style = "pop", duration = 60 } = params
    
    const filename = `musicxml_${Date.now()}.musicxml`
    const musicxmlPath = join(this.musicxmlDir, filename)
    
    // Analysiere die Beschreibung für Stil und Stimmung
    const lowerDesc = (description || "Ein Pop-Song").toLowerCase()
    const lowerStyle = (style || "pop").toLowerCase()
    
    // Bestimme Tonart, Tempo und Stil basierend auf Beschreibung
    let key = "C"
    let tempo = 120
    let timeSignature = "4/4"
    let notes = []
    
    // Tame Impala Style (psychedelic rock)
    if (lowerDesc.includes('tame impala') || lowerStyle.includes('tame impala') || 
        lowerDesc.includes('psychedelic') || lowerDesc.includes('psychedelisch')) {
      key = "G"
      tempo = 110
      notes = [
        { step: "G", octave: 4, duration: 480, type: "quarter" },
        { step: "B", octave: 4, duration: 480, type: "quarter" },
        { step: "D", octave: 5, duration: 480, type: "quarter" },
        { step: "G", octave: 5, duration: 480, type: "quarter" },
        { step: "A", octave: 4, duration: 480, type: "quarter" },
        { step: "C", octave: 5, duration: 480, type: "quarter" },
        { step: "E", octave: 5, duration: 480, type: "quarter" },
        { step: "G", octave: 5, duration: 480, type: "quarter" }
      ]
    }
    // Rock Style
    else if (lowerDesc.includes('rock') || lowerStyle.includes('rock') || 
             lowerDesc.includes('energetic') || lowerDesc.includes('energisch')) {
      key = "G"
      tempo = 140
      notes = [
        { step: "G", octave: 4, duration: 240, type: "eighth" },
        { step: "B", octave: 4, duration: 240, type: "eighth" },
        { step: "D", octave: 5, duration: 240, type: "eighth" },
        { step: "G", octave: 5, duration: 240, type: "eighth" },
        { step: "A", octave: 4, duration: 240, type: "eighth" },
        { step: "C", octave: 5, duration: 240, type: "eighth" },
        { step: "E", octave: 5, duration: 240, type: "eighth" },
        { step: "G", octave: 5, duration: 240, type: "eighth" }
      ]
    }
    // Jazz Style
    else if (lowerDesc.includes('jazz') || lowerStyle.includes('jazz') || 
             lowerDesc.includes('smooth') || lowerDesc.includes('sophisticated')) {
      key = "F"
      tempo = 90
      notes = [
        { step: "F", octave: 4, duration: 960, type: "half" },
        { step: "A", octave: 4, duration: 960, type: "half" },
        { step: "C", octave: 5, duration: 960, type: "half" },
        { step: "F", octave: 5, duration: 960, type: "half" }
      ]
    }
    // Electronic/Pop Style
    else {
      key = "C"
      tempo = 120
      notes = [
        { step: "C", octave: 5, duration: 480, type: "quarter" },
        { step: "E", octave: 5, duration: 480, type: "quarter" },
        { step: "G", octave: 5, duration: 480, type: "quarter" },
        { step: "C", octave: 6, duration: 480, type: "quarter" },
        { step: "D", octave: 5, duration: 480, type: "quarter" },
        { step: "F", octave: 5, duration: 480, type: "quarter" },
        { step: "A", octave: 5, duration: 480, type: "quarter" },
        { step: "C", octave: 6, duration: 480, type: "quarter" }
      ]
    }
    
    // Erstelle MusicXML
    let musicxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>${style.charAt(0).toUpperCase() + style.slice(1)} Song</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>${key === "C" ? 0 : key === "G" ? 1 : key === "F" ? -1 : 0}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempo}</per-minute>
          </metronome>
        </direction-type>
      </direction>`
    
    // Füge Noten hinzu
    let currentMeasure = 1
    let measureDuration = 0
    
    for (const note of notes) {
      if (measureDuration + note.duration > 1920) { // 4/4 Takt = 1920 ticks
        musicxml += `
    </measure>
    <measure number="${++currentMeasure}">`
        measureDuration = 0
      }
      
      musicxml += `
      <note>
        <pitch>
          <step>${note.step}</step>
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${note.type}</type>
      </note>`
      
      measureDuration += note.duration
    }
    
    // Schließe letztes Maß
    musicxml += `
    </measure>
  </part>
</score-partwise>`

    // Speichere MusicXML
    writeFileSync(musicxmlPath, musicxml)
    
    return {
      success: true,
      song: {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Song`,
        style: style,
        tempo: tempo,
        key: `${key}-Dur`,
        structure: ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"],
        description: description,
        duration: duration,
        notes: notes.length
      },
      files: {
        musicxml: filename
      }
    }
  }

  /**
   * Generiert eine interessante Melodie als MusicXML basierend auf der Beschreibung
   */
  async _generateMelody(params) {
    const { description = "Eine fröhliche Melodie", duration = 30, tempo = 120 } = params
    
    const filename = `melody_${Date.now()}.musicxml`
    const musicxmlPath = join(this.musicxmlDir, filename)
    
    // Analysiere die Beschreibung für Stil und Stimmung
    const lowerDesc = (description || "Eine fröhliche Melodie").toLowerCase()
    let key = "C"
    let scale = ["C", "D", "E", "F", "G", "A", "B"]
    let melodyNotes = []
    
    // Bestimme Tonart und Stil basierend auf Beschreibung
    if (lowerDesc.includes('fröhlich') || lowerDesc.includes('happy') || lowerDesc.includes('joyful')) {
      key = "C"
      scale = ["C", "D", "E", "F", "G", "A", "B"]
      melodyNotes = ["C", "E", "G", "C", "D", "F", "A", "C", "B", "A", "G", "F", "E", "D", "C"]
    } else if (lowerDesc.includes('traurig') || lowerDesc.includes('sad') || lowerDesc.includes('melancholic')) {
      key = "A"
      scale = ["A", "B", "C", "D", "E", "F", "G"]
      melodyNotes = ["A", "C", "E", "A", "G", "F", "E", "D", "C", "B", "A"]
    } else if (lowerDesc.includes('energisch') || lowerDesc.includes('energetic') || lowerDesc.includes('powerful')) {
      key = "G"
      scale = ["G", "A", "B", "C", "D", "E", "F#"]
      melodyNotes = ["G", "B", "D", "G", "A", "C", "E", "G", "F#", "E", "D", "C", "B", "A", "G"]
    } else if (lowerDesc.includes('romantisch') || lowerDesc.includes('romantic') || lowerDesc.includes('love')) {
      key = "F"
      scale = ["F", "G", "A", "Bb", "C", "D", "E"]
      melodyNotes = ["F", "A", "C", "F", "G", "Bb", "D", "F", "E", "D", "C", "Bb", "A", "G", "F"]
    } else {
      // Standard fröhliche Melodie
      key = "C"
      scale = ["C", "D", "E", "F", "G", "A", "B"]
      melodyNotes = ["C", "E", "G", "C", "D", "F", "A", "C", "B", "A", "G", "F", "E", "D", "C"]
    }
    
    // Erstelle eine interessantere Melodie mit verschiedenen Notenlängen
    const notes = []
    const durations = [480, 240, 960] // Viertel, Achtel, Halbe
    const octaves = [4, 5]
    
    for (let i = 0; i < Math.min(melodyNotes.length, 16); i++) {
      const note = melodyNotes[i]
      const duration = durations[i % durations.length]
      const octave = octaves[i % octaves.length]
      
      notes.push({
        step: note,
        octave: octave,
        duration: duration,
        type: duration === 480 ? 'quarter' : duration === 240 ? 'eighth' : 'half'
      })
    }
    
    // Erstelle MusicXML
    let musicxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Melodie</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>${key === "C" ? 0 : key === "G" ? 1 : key === "F" ? -1 : 0}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempo}</per-minute>
          </metronome>
        </direction-type>
      </direction>`
    
    // Füge Noten hinzu
    let currentMeasure = 1
    let measureDuration = 0
    
    for (const note of notes) {
      if (measureDuration + note.duration > 1920) { // 4/4 Takt = 1920 ticks
        musicxml += `
    </measure>
    <measure number="${++currentMeasure}">`
        measureDuration = 0
      }
      
      musicxml += `
      <note>
        <pitch>
          <step>${note.step}</step>
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${note.type}</type>
      </note>`
      
      measureDuration += note.duration
    }
    
    // Schließe letztes Maß
    musicxml += `
    </measure>
  </part>
</score-partwise>`

    // Speichere MusicXML
    writeFileSync(musicxmlPath, musicxml)
    
    return {
      success: true,
      song: {
        title: "Generierte Melodie",
        style: "Melodie",
        tempo: tempo,
        key: `${key}-Dur`,
        structure: ["Intro", "Melodie", "Outro"],
        description: description,
        duration: duration,
        notes: notes.length
      },
      files: {
        musicxml: filename
      }
    }
  }

  /**
   * Generiert einen kompletten Song als MusicXML mit mehreren Stimmen
   */
  async _generateSong(params) {
    const { description = "Ein Pop-Song", duration = 60, style = "pop" } = params
    
    const filename = `song_${Date.now()}.musicxml`
    const musicxmlPath = join(this.musicxmlDir, filename)
    
    // Analysiere die Beschreibung für Stil
    const lowerDesc = (description || "Ein Pop-Song").toLowerCase()
    let key = "C"
    let tempo = 120
    
    if (lowerDesc.includes('schnell') || lowerDesc.includes('fast') || lowerDesc.includes('energisch')) {
      tempo = 140
    } else if (lowerDesc.includes('langsam') || lowerDesc.includes('slow') || lowerDesc.includes('ruhig')) {
      tempo = 80
    }
    
    if (lowerDesc.includes('rock') || lowerDesc.includes('energetic')) {
      key = "G"
    } else if (lowerDesc.includes('jazz') || lowerDesc.includes('smooth')) {
      key = "F"
    }
    
    // Erstelle Melodie und Bass-Linie
    const melodyNotes = [
      { step: "C", octave: 5, duration: 480, type: "quarter" },
      { step: "E", octave: 5, duration: 480, type: "quarter" },
      { step: "G", octave: 5, duration: 480, type: "quarter" },
      { step: "C", octave: 6, duration: 480, type: "quarter" },
      { step: "D", octave: 5, duration: 480, type: "quarter" },
      { step: "F", octave: 5, duration: 480, type: "quarter" },
      { step: "A", octave: 5, duration: 480, type: "quarter" },
      { step: "C", octave: 6, duration: 480, type: "quarter" }
    ]
    
    const bassNotes = [
      { step: "C", octave: 3, duration: 960, type: "half" },
      { step: "G", octave: 3, duration: 960, type: "half" },
      { step: "F", octave: 3, duration: 960, type: "half" },
      { step: "C", octave: 3, duration: 960, type: "half" }
    ]
    
    // Erstelle MusicXML mit zwei Stimmen
    let musicxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Melodie</part-name>
    </score-part>
    <score-part id="P2">
      <part-name>Bass</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>${key === "C" ? 0 : key === "G" ? 1 : key === "F" ? -1 : 0}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempo}</per-minute>
          </metronome>
        </direction-type>
      </direction>`
    
    // Füge Melodie-Noten hinzu
    let currentMeasure = 1
    let measureDuration = 0
    
    for (const note of melodyNotes) {
      if (measureDuration + note.duration > 1920) {
        musicxml += `
    </measure>
    <measure number="${++currentMeasure}">`
        measureDuration = 0
      }
      
      musicxml += `
      <note>
        <pitch>
          <step>${note.step}</step>
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${note.type}</type>
      </note>`
      
      measureDuration += note.duration
    }
    
    musicxml += `
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>${key === "C" ? 0 : key === "G" ? 1 : key === "F" ? -1 : 0}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>`
    
    // Füge Bass-Noten hinzu
    currentMeasure = 1
    measureDuration = 0
    
    for (const note of bassNotes) {
      if (measureDuration + note.duration > 1920) {
        musicxml += `
    </measure>
    <measure number="${++currentMeasure}">`
        measureDuration = 0
      }
      
      musicxml += `
      <note>
        <pitch>
          <step>${note.step}</step>
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${note.type}</type>
      </note>`
      
      measureDuration += note.duration
    }
    
    musicxml += `
    </measure>
  </part>
</score-partwise>`

    // Speichere MusicXML
    writeFileSync(musicxmlPath, musicxml)
    
    return {
      success: true,
      song: {
        title: "Generierter Song",
        style: style,
        tempo: tempo,
        key: `${key}-Dur`,
        structure: ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"],
        description: description,
        duration: duration,
        voices: 2
      },
      files: {
        musicxml: filename
      }
    }
  }

  /**
   * Verarbeitet natürliche Sprache
   */
  async _processNaturalLanguage(message, context = {}) {
    console.log(`🎵 Natürliche Sprachanfrage: ${message}`)
    
    // Einfache Keyword-basierte Verarbeitung
    const lowerMessage = message.toLowerCase()
    
    // Verwende die neue create_musicxml Funktion als Hauptansatz
    if (lowerMessage.includes('tame impala') || lowerMessage.includes('psychedelic') || 
        lowerMessage.includes('rock') || lowerMessage.includes('jazz') || 
        lowerMessage.includes('electronic') || lowerMessage.includes('pop')) {
      return await this._createMusicXML({
        description: message,
        style: this._extractStyle(message),
        duration: 60
      })
    }
    
    if (lowerMessage.includes('melodie') || lowerMessage.includes('melody')) {
      return await this._generateMelody({
        description: message,
        duration: 30
      })
    }
    
    if (lowerMessage.includes('song') || lowerMessage.includes('lied') || lowerMessage.includes('musik')) {
      return await this._createMusicXML({
        description: message,
        style: this._extractStyle(message),
        duration: 60
      })
    }
    
    // Fallback: Verwende create_musicxml für alle anderen Anfragen
    return await this._createMusicXML({
      description: message,
      style: this._extractStyle(message),
      duration: 60
    })
  }
  
  /**
   * Extrahiert den Stil aus der Nachricht
   */
  _extractStyle(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('tame impala') || lowerMessage.includes('psychedelic')) {
      return 'tame impala'
    } else if (lowerMessage.includes('rock')) {
      return 'rock'
    } else if (lowerMessage.includes('jazz')) {
      return 'jazz'
    } else if (lowerMessage.includes('electronic')) {
      return 'electronic'
    } else {
      return 'pop'
    }
  }
} 