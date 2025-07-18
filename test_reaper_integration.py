#!/usr/bin/env python3
"""
Test-Skript für die Reaper/MusicXML Integration

Testet die Verarbeitung der Tame Impala MusicXML-Datei.
"""

import sys
import os
import logging

# Füge src zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from daw.core import get_daw

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_musicxml_parsing():
    """Testet das Parsing der MusicXML-Datei"""
    logger.info("=== MusicXML Parsing Test ===")
    
    daw = get_daw()
    xml_file = "output/musicxml/tame_impala_song.musicxml"
    
    if not os.path.exists(xml_file):
        logger.error(f"MusicXML-Datei nicht gefunden: {xml_file}")
        return False
    
    try:
        # Parse MusicXML
        track_info = daw.parse_musicxml(xml_file)
        
        logger.info(f"MusicXML erfolgreich geparst:")
        for i, track in enumerate(track_info):
            logger.info(f"  Track {i+1}: {track['name']}")
            logger.info(f"    Instrument: {track['instrument']}")
            logger.info(f"    Noten: {track['note_count']}")
            
            # Zeige erste paar Noten
            for j, note in enumerate(track['notes'][:5]):
                logger.info(f"      Note {j+1}: {note['pitch']} (Dauer: {note['duration']})")
            
            if len(track['notes']) > 5:
                logger.info(f"      ... und {len(track['notes']) - 5} weitere Noten")
        
        return True
        
    except Exception as e:
        logger.error(f"MusicXML Parsing fehlgeschlagen: {e}")
        return False

def test_reaper_integration():
    """Testet die Reaper-Integration"""
    logger.info("=== Reaper Integration Test ===")
    
    daw = get_daw()
    xml_file = "output/musicxml/tame_impala_song.musicxml"
    
    if not os.path.exists(xml_file):
        logger.error(f"MusicXML-Datei nicht gefunden: {xml_file}")
        return False
    
    try:
        # Teste Reaper Projekt Info
        project_info = daw.get_reaper_project_info()
        logger.info(f"Reaper Projekt Info: {project_info}")
        
        # Importiere MusicXML in Reaper
        success = daw.import_musicxml_to_reaper(xml_file, "Tame Impala Test")
        
        if success:
            logger.info("MusicXML erfolgreich in Reaper importiert")
            
            # Teste Projekt Info nach Import
            project_info = daw.get_reaper_project_info()
            logger.info(f"Projekt Info nach Import: {project_info}")
            
            # Teste Audio Export
            output_file = "output/tame_impala_export.wav"
            export_success = daw.export_reaper_audio(output_file, "wav")
            
            if export_success:
                logger.info(f"Audio erfolgreich exportiert: {output_file}")
            else:
                logger.warning("Audio Export fehlgeschlagen")
            
            return True
        else:
            logger.error("MusicXML Import in Reaper fehlgeschlagen")
            return False
            
    except Exception as e:
        logger.error(f"Reaper Integration Test fehlgeschlagen: {e}")
        return False

def test_playback():
    """Testet die Wiedergabe-Funktionen"""
    logger.info("=== Playback Test ===")
    
    daw = get_daw()
    
    try:
        # Teste Play
        play_success = daw.play_reaper_project()
        if play_success:
            logger.info("Reaper Projekt wird abgespielt")
            
            # Warte kurz
            import time
            time.sleep(2)
            
            # Teste Stop
            stop_success = daw.stop_reaper_project()
            if stop_success:
                logger.info("Reaper Projekt gestoppt")
            else:
                logger.warning("Stop fehlgeschlagen")
        else:
            logger.warning("Play fehlgeschlagen")
        
        return True
        
    except Exception as e:
        logger.error(f"Playback Test fehlgeschlagen: {e}")
        return False

def main():
    """Hauptfunktion für alle Tests"""
    logger.info("Starte Reaper/MusicXML Integration Tests")
    
    # Test 1: MusicXML Parsing
    if not test_musicxml_parsing():
        logger.error("MusicXML Parsing Test fehlgeschlagen")
        return
    
    # Test 2: Reaper Integration
    if not test_reaper_integration():
        logger.error("Reaper Integration Test fehlgeschlagen")
        return
    
    # Test 3: Playback
    if not test_playback():
        logger.error("Playback Test fehlgeschlagen")
        return
    
    logger.info("Alle Tests erfolgreich abgeschlossen!")

if __name__ == "__main__":
    main() 