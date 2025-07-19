#!/usr/bin/env python3
"""
Vereinfachte Reaper API für Container

Fokussiert auf MIDI-Export ohne komplexe DAW-Integration.
"""

import os
import logging
import shutil
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

# Import path setup
import sys
sys.path.insert(0, '/app/src')

from daw.reaper import ReaperIntegration
from daw.midi_export import get_midi_exporter
from daw.audio_export import get_audio_exporter

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="Open DAW MCP - Simple Reaper API",
    description="Vereinfachte API für MIDI-Export mit WildFX-Integration",
    version="1.0.0"
)

# Pydantic Models
class ExportResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None

@app.get("/")
async def root():
    """Root Endpoint"""
    return {
        "message": "Open DAW MCP - Simple Reaper API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health Check Endpoint"""
    return {
        "status": "healthy",
        "message": "Simple Reaper API läuft"
    }

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
        import sys
        sys.path.insert(0, '/app/src')
        from daw.reaper import ReaperIntegration
        ri = ReaperIntegration()
        tracks = ri.parse_musicxml(temp_file)
        
        if not tracks:
            raise HTTPException(status_code=400, detail="Keine Tracks in MusicXML gefunden")
        
        # Erstelle Output-Verzeichnis
        output_dir = "/app/output/midi"
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
        file_path = os.path.join("/app/output/midi", filename)
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
        output_dir = "/app/output/audio"
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
        output_dir = "/app/output/audio"
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
            shutil.move(processed_audio, output_file)
        else:
            shutil.copy2(temp_file, output_file)
        
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
        file_path = os.path.join("/app/output/audio", filename)
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9010) 