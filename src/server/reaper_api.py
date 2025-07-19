#!/usr/bin/env python3
"""
Reaper API für Open DAW MCP

FastAPI-basierte Web-API für die Reaper/MusicXML Integration.
"""

import os
import logging
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

# DAW Integration
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from daw.core import get_daw
from daw.midi_export import get_midi_exporter
from daw.audio_export import get_audio_exporter

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="Open DAW MCP - Reaper API",
    description="API für Reaper/MusicXML Integration",
    version="1.0.0"
)

# Pydantic Models
class TrackInfo(BaseModel):
    name: str
    instrument: str
    channel: int
    note_count: int
    notes: List[Dict[str, Any]]

class ProjectInfo(BaseModel):
    name: str
    tracks: int
    state: str
    reapy_available: bool

class ImportResponse(BaseModel):
    success: bool
    message: str
    project_info: Optional[ProjectInfo] = None

class ExportResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None

# DAW Instance
daw = get_daw()

@app.get("/")
async def root():
    """Root Endpoint"""
    return {
        "message": "Open DAW MCP - Reaper API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health Check Endpoint"""
    try:
        project_info = daw.get_reaper_project_info()
        return {
            "status": "healthy",
            "reaper_available": project_info.get("reapy_available", False),
            "project_info": project_info
        }
    except Exception as e:
        logger.error(f"Health check fehlgeschlagen: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/parse-musicxml", response_model=List[TrackInfo])
async def parse_musicxml(file: UploadFile = File(...)):
    """
    Parst eine MusicXML-Datei und gibt Track-Informationen zurück
    
    Args:
        file: MusicXML-Datei
        
    Returns:
        Liste von Track-Informationen
    """
    try:
        # Speichere hochgeladene Datei temporär
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse MusicXML
        track_info = daw.parse_musicxml(temp_file)
        
        # Cleanup
        os.remove(temp_file)
        
        return track_info
        
    except Exception as e:
        logger.error(f"MusicXML Parsing fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Parsing fehlgeschlagen: {str(e)}")

@app.post("/import-to-reaper", response_model=ImportResponse)
async def import_to_reaper(
    file: UploadFile = File(...),
    project_name: Optional[str] = None
):
    """
    Importiert eine MusicXML-Datei in Reaper
    
    Args:
        file: MusicXML-Datei
        project_name: Name des Reaper Projekts
        
    Returns:
        Import-Ergebnis
    """
    try:
        # Speichere hochgeladene Datei temporär
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Importiere in Reaper
        success = daw.import_musicxml_to_reaper(temp_file, project_name)
        
        # Cleanup
        os.remove(temp_file)
        
        if success:
            project_info = daw.get_reaper_project_info()
            return ImportResponse(
                success=True,
                message="MusicXML erfolgreich in Reaper importiert",
                project_info=ProjectInfo(**project_info)
            )
        else:
            return ImportResponse(
                success=False,
                message="MusicXML Import in Reaper fehlgeschlagen"
            )
            
    except Exception as e:
        logger.error(f"Reaper Import fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Import fehlgeschlagen: {str(e)}")

@app.post("/export-midi", response_model=ExportResponse)
async def export_midi(file: UploadFile = File(...), output_filename: Optional[str] = None):
    """
    Exportiert eine MusicXML-Datei als MIDI
    
    Args:
        file: MusicXML-Datei
        output_filename: Name der Ausgabe-MIDI-Datei (optional)
        
    Returns:
        Export-Ergebnis
    """
    try:
        # Speichere hochgeladene Datei temporär
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse MusicXML
        tracks = daw.parse_musicxml(temp_file)
        
        if not tracks:
            raise HTTPException(status_code=400, detail="Keine Tracks in MusicXML gefunden")
        
        # Erstelle Output-Verzeichnis
        output_dir = "output/midi"
        os.makedirs(output_dir, exist_ok=True)
        
        # Bestimme Output-Dateiname
        if output_filename is None:
            base_name = os.path.splitext(file.filename)[0]
            output_filename = f"{base_name}.mid"
        
        output_file = os.path.join(output_dir, output_filename)
        
        # Exportiere MIDI
        midi_exporter = get_midi_exporter()
        success = midi_exporter.export_tracks_to_midi(tracks, output_file)
        
        # Cleanup
        os.remove(temp_file)
        
        if success:
            return ExportResponse(
                success=True,
                message="MIDI erfolgreich exportiert",
                file_path=output_file
            )
        else:
            return ExportResponse(
                success=False,
                message="MIDI Export fehlgeschlagen"
            )
            
    except Exception as e:
        logger.error(f"MIDI Export fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Export fehlgeschlagen: {str(e)}")

@app.get("/download-midi/{filename}")
async def download_midi(filename: str):
    """
    Download einer MIDI-Datei
    
    Args:
        filename: Name der MIDI-Datei
        
    Returns:
        MIDI-Datei als Download
    """
    try:
        file_path = os.path.join("output/midi", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="MIDI-Datei nicht gefunden")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="audio/midi"
        )
        
    except Exception as e:
        logger.error(f"MIDI Download fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Download fehlgeschlagen: {str(e)}")

@app.post("/export-audio", response_model=ExportResponse)
async def export_audio(
    file: UploadFile = File(...), 
    output_filename: Optional[str] = None, 
    format: str = "wav",
    style: str = "pop",
    use_wildfx: bool = True
):
    """
    Exportiert eine MusicXML-Datei als Audio mit WildFX-Integration
    
    Args:
        file: MusicXML-Datei
        output_filename: Name der Ausgabe-Audio-Datei (optional)
        format: Audio Format (wav, mp3, etc.)
        style: Musikstil für WildFX-Plugins (pop, rock, electronic, jazz)
        use_wildfx: Ob WildFX-Plugins verwendet werden sollen
        
    Returns:
        Export-Ergebnis
    """
    try:
        # Speichere hochgeladene Datei temporär
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Erstelle Output-Verzeichnis
        output_dir = "output/audio"
        os.makedirs(output_dir, exist_ok=True)
        
        # Bestimme Output-Dateiname
        if output_filename is None:
            base_name = os.path.splitext(file.filename)[0]
            output_filename = f"{base_name}_{style}.{format}"
        
        output_file = os.path.join(output_dir, output_filename)
        
        # Exportiere Audio mit WildFX-Integration
        audio_exporter = get_audio_exporter()
        success = audio_exporter.export_musicxml_to_audio(
            temp_file, 
            output_file, 
            format, 
            style, 
            use_wildfx
        )
        
        # Cleanup
        os.remove(temp_file)
        
        if success:
            return ExportResponse(
                success=True,
                message=f"Audio erfolgreich exportiert mit WildFX-Style: {style}",
                file_path=output_file
            )
        else:
            return ExportResponse(
                success=False,
                message="Audio Export fehlgeschlagen"
            )
            
    except Exception as e:
        logger.error(f"Audio Export fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Export fehlgeschlagen: {str(e)}")

@app.get("/wildfx/plugins")
async def get_wildfx_plugins():
    """
    Gibt verfügbare WildFX-Plugins zurück
    
    Returns:
        Liste verfügbarer Plugins
    """
    try:
        audio_exporter = get_audio_exporter()
        plugins = audio_exporter.get_wildfx_plugins()
        
        return {
            "success": True,
            "plugins": plugins,
            "count": len(plugins)
        }
        
    except Exception as e:
        logger.error(f"WildFX Plugin-Liste fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Plugin-Liste fehlgeschlagen: {str(e)}")

@app.get("/wildfx/styles")
async def get_wildfx_styles():
    """
    Gibt verfügbare WildFX-Musikstile zurück
    
    Returns:
        Liste verfügbarer Stile
    """
    try:
        styles = [
            {"name": "pop", "description": "Pop-Musik mit EQ und Kompression"},
            {"name": "rock", "description": "Rock-Musik mit verstärktem Bass"},
            {"name": "electronic", "description": "Elektronische Musik mit Delay-Effekten"},
            {"name": "jazz", "description": "Jazz-Musik mit Reverb-Effekten"}
        ]
        
        return {
            "success": True,
            "styles": styles,
            "count": len(styles)
        }
        
    except Exception as e:
        logger.error(f"WildFX Style-Liste fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Style-Liste fehlgeschlagen: {str(e)}")

@app.post("/wildfx/apply-effects")
async def apply_wildfx_effects(
    file: UploadFile = File(...),
    style: str = "pop",
    output_filename: Optional[str] = None
):
    """
    Wendet WildFX-Effekte auf eine Audio-Datei an
    
    Args:
        file: Audio-Datei
        style: Musikstil für Effekte
        output_filename: Name der Ausgabe-Datei (optional)
        
    Returns:
        Verarbeitete Audio-Datei
    """
    try:
        # Speichere hochgeladene Datei temporär
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Erstelle Output-Verzeichnis
        output_dir = "output/audio"
        os.makedirs(output_dir, exist_ok=True)
        
        # Bestimme Output-Dateiname
        if output_filename is None:
            base_name = os.path.splitext(file.filename)[0]
            output_filename = f"{base_name}_wildfx_{style}.wav"
        
        output_file = os.path.join(output_dir, output_filename)
        
        # Wende WildFX-Effekte an
        audio_exporter = get_audio_exporter()
        wildfx = audio_exporter.wildfx
        
        # Generiere Plugin-Chain
        plugin_chain = wildfx.generate_preset_chain(style)
        
        # Wende Plugin-Chain an
        processed_audio = wildfx.apply_plugin_chain(temp_file, plugin_chain)
        
        # Verschiebe verarbeitete Datei
        if processed_audio != temp_file:
            os.replace(processed_audio, output_file) # Use os.replace for atomic move
        else:
            os.rename(temp_file, output_file) # Fallback to rename if no new file was created
        
        # Cleanup
        os.remove(temp_file)
        
        return ExportResponse(
            success=True,
            message=f"WildFX-Effekte angewendet für Stil: {style}",
            file_path=output_file
        )
        
    except Exception as e:
        logger.error(f"WildFX-Effekte fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Effekte fehlgeschlagen: {str(e)}")

@app.get("/download-audio/{filename}")
async def download_audio(filename: str):
    """
    Download einer Audio-Datei
    
    Args:
        filename: Name der Audio-Datei
        
    Returns:
        Audio-Datei als Download
    """
    try:
        file_path = os.path.join("output/audio", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio-Datei nicht gefunden")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="audio/wav"
        )
        
    except Exception as e:
        logger.error(f"Audio Download fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Download fehlgeschlagen: {str(e)}")

@app.post("/export-audio", response_model=ExportResponse)
async def export_audio(
    output_filename: str,
    format: str = "wav"
):
    """
    Exportiert das aktuelle Reaper Projekt als Audio
    
    Args:
        output_filename: Name der Ausgabedatei
        format: Audio Format (wav, mp3, etc.)
        
    Returns:
        Export-Ergebnis
    """
    try:
        # Erstelle Output-Verzeichnis
        output_dir = "output/audio"
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, output_filename)
        
        # Exportiere Audio
        success = daw.export_reaper_audio(output_file, format)
        
        if success:
            return ExportResponse(
                success=True,
                message="Audio erfolgreich exportiert",
                file_path=output_file
            )
        else:
            return ExportResponse(
                success=False,
                message="Audio Export fehlgeschlagen"
            )
            
    except Exception as e:
        logger.error(f"Audio Export fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Export fehlgeschlagen: {str(e)}")

@app.get("/download-audio/{filename}")
async def download_audio(filename: str):
    """
    Lädt eine exportierte Audio-Datei herunter
    
    Args:
        filename: Name der Audio-Datei
        
    Returns:
        Audio-Datei als Download
    """
    try:
        file_path = os.path.join("output/audio", filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio-Datei nicht gefunden")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="audio/wav"
        )
        
    except Exception as e:
        logger.error(f"Audio Download fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Download fehlgeschlagen: {str(e)}")

@app.post("/play")
async def play_project():
    """Spielt das aktuelle Reaper Projekt ab"""
    try:
        success = daw.play_reaper_project()
        
        if success:
            return {"success": True, "message": "Projekt wird abgespielt"}
        else:
            return {"success": False, "message": "Play fehlgeschlagen"}
            
    except Exception as e:
        logger.error(f"Play fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Play fehlgeschlagen: {str(e)}")

@app.post("/stop")
async def stop_project():
    """Stoppt die Reaper Wiedergabe"""
    try:
        success = daw.stop_reaper_project()
        
        if success:
            return {"success": True, "message": "Wiedergabe gestoppt"}
        else:
            return {"success": False, "message": "Stop fehlgeschlagen"}
            
    except Exception as e:
        logger.error(f"Stop fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Stop fehlgeschlagen: {str(e)}")

@app.get("/project-info", response_model=ProjectInfo)
async def get_project_info():
    """Gibt Informationen über das aktuelle Reaper Projekt zurück"""
    try:
        project_info = daw.get_reaper_project_info()
        return ProjectInfo(**project_info)
        
    except Exception as e:
        logger.error(f"Projekt Info fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Projekt Info fehlgeschlagen: {str(e)}")

@app.post("/test-musicxml")
async def test_musicxml():
    """Testet die MusicXML-Verarbeitung mit der Tame Impala Datei"""
    try:
        xml_file = "output/musicxml/tame_impala_song.musicxml"
        
        if not os.path.exists(xml_file):
            raise HTTPException(status_code=404, detail="Test MusicXML-Datei nicht gefunden")
        
        # Parse MusicXML
        track_info = daw.parse_musicxml(xml_file)
        
        # Importiere in Reaper
        success = daw.import_musicxml_to_reaper(xml_file, "Tame Impala Test")
        
        return {
            "success": success,
            "tracks_parsed": len(track_info),
            "track_info": track_info,
            "message": "Test erfolgreich abgeschlossen" if success else "Test fehlgeschlagen"
        }
        
    except Exception as e:
        logger.error(f"MusicXML Test fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail=f"Test fehlgeschlagen: {str(e)}")

if __name__ == "__main__":
    # Starte Server
    uvicorn.run(
        "reaper_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 