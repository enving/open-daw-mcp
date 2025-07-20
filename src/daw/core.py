"""
Core DAW Module für Open DAW MCP

Zentrale Funktionalität für Musikproduktion, MIDI-Verarbeitung und Audio-Export.
"""

import os
import logging
import json
from typing import Dict, List, Any, Optional
from pathlib import Path

from .musicxml_to_dexed import MusicXmlToDexedTranslator
from .midi_export import MidiExporter, MusicXmlNote, MusicXmlTrack
from .audio_export import AudioExporter
from .dexed_api import DexedAPI

logger = logging.getLogger(__name__)

class DAWCore:
    """
    Zentrale DAW-Klasse für Open DAW MCP
    
    Funktionen:
    - MusicXML-Verarbeitung
    - MIDI-Export
    - Audio-Generierung
    - Dexed-Integration
    """
    
    def __init__(self):
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialisiere Komponenten
        self.musicxml_translator = MusicXmlToDexedTranslator()
        self.midi_exporter = MidiExporter()
        self.audio_exporter = AudioExporter()
        self.dexed_api = DexedAPI()
        
        # Erstelle Unterverzeichnisse
        (self.output_dir / "musicxml").mkdir(exist_ok=True)
        (self.output_dir / "midi").mkdir(exist_ok=True)
        (self.output_dir / "audio").mkdir(exist_ok=True)
        (self.output_dir / "dexed").mkdir(exist_ok=True)
        
        logger.info("✅ DAW Core initialisiert")
    
    def process_musicxml(self, xml_file: str, output_name: str = None) -> Dict[str, Any]:
        """
        Verarbeitet eine MusicXML-Datei vollständig
        
        Args:
            xml_file: Pfad zur MusicXML-Datei
            output_name: Name für Ausgabedateien (optional)
            
        Returns:
            Dictionary mit Pfaden zu allen generierten Dateien
        """
        if not output_name:
            output_name = Path(xml_file).stem
        
        results = {
            "musicxml_file": xml_file,
            "output_name": output_name,
            "midi_file": None,
            "dexed_patch": None,
            "audio_file": None,
            "success": False
        }
        
        try:
            # 1. Parse MusicXML
            logger.info(f"📝 Verarbeite MusicXML: {xml_file}")
            tracks = self.musicxml_translator.parse_musicxml(xml_file)
            
            if not tracks:
                logger.error("❌ Keine Tracks in MusicXML gefunden")
                return results
            
            # 2. Export MIDI
            midi_file = self.midi_exporter.export_tracks_to_midi(
                tracks, 
                f"output/midi/{output_name}.mid"
            )
            results["midi_file"] = midi_file
            
            # 3. Erstelle Dexed-Patch
            patch = self.musicxml_translator.create_dexed_patch_from_tracks(tracks)
            patch_file = f"output/dexed/{output_name}_patch.json"
            
            with open(patch_file, 'w') as f:
                json.dump(patch, f, indent=2)
            results["dexed_patch"] = patch_file
            
            # 4. Generiere Audio
            audio_file = self.audio_exporter.export_midi_to_audio(
                midi_file,
                f"output/audio/{output_name}.wav"
            )
            results["audio_file"] = audio_file
            
            results["success"] = True
            logger.info(f"✅ MusicXML vollständig verarbeitet: {output_name}")
            
        except Exception as e:
            logger.error(f"❌ MusicXML-Verarbeitung fehlgeschlagen: {e}")
        
        return results
    
    def create_melody_from_notes(self, notes: List[Dict[str, Any]], 
                                output_name: str = "melody") -> Dict[str, Any]:
        """
        Erstellt eine Melodie aus Noten-Daten
        
        Args:
            notes: Liste von Noten mit pitch, duration, velocity
            output_name: Name für Ausgabedateien
            
        Returns:
            Dictionary mit Pfaden zu generierten Dateien
        """
        results = {
            "output_name": output_name,
            "midi_file": None,
            "audio_file": None,
            "success": False
        }
        
        try:
            # 1. Erstelle MIDI
            midi_file = self.midi_exporter.create_melody_midi(
                notes, 
                f"output/midi/{output_name}.mid"
            )
            results["midi_file"] = midi_file
            
            # 2. Generiere Audio
            audio_file = self.audio_exporter.export_midi_to_audio(
                midi_file,
                f"output/audio/{output_name}.wav"
            )
            results["audio_file"] = audio_file
            
            results["success"] = True
            logger.info(f"✅ Melodie erstellt: {output_name}")
            
        except Exception as e:
            logger.error(f"❌ Melodie-Erstellung fehlgeschlagen: {e}")
        
        return results
    
    def create_bass_line(self, bass_notes: List[Dict[str, Any]], 
                        output_name: str = "bass") -> Dict[str, Any]:
        """
        Erstellt eine Bass-Linie
        
        Args:
            bass_notes: Liste von Bass-Noten
            output_name: Name für Ausgabedateien
            
        Returns:
            Dictionary mit Pfaden zu generierten Dateien
        """
        results = {
            "output_name": output_name,
            "midi_file": None,
            "audio_file": None,
            "success": False
        }
        
        try:
            # 1. Erstelle MIDI
            midi_file = self.midi_exporter.create_bass_midi(
                bass_notes, 
                f"output/midi/{output_name}.mid"
            )
            results["midi_file"] = midi_file
            
            # 2. Generiere Audio
            audio_file = self.audio_exporter.export_midi_to_audio(
                midi_file,
                f"output/audio/{output_name}.wav"
            )
            results["audio_file"] = audio_file
            
            results["success"] = True
            logger.info(f"✅ Bass-Linie erstellt: {output_name}")
            
        except Exception as e:
            logger.error(f"❌ Bass-Linie-Erstellung fehlgeschlagen: {e}")
        
        return results
    
    def create_drum_pattern(self, drum_pattern: List[Dict[str, Any]], 
                           output_name: str = "drums") -> Dict[str, Any]:
        """
        Erstellt ein Drum-Pattern
        
        Args:
            drum_pattern: Liste von Drum-Hits
            output_name: Name für Ausgabedateien
            
        Returns:
            Dictionary mit Pfaden zu generierten Dateien
        """
        results = {
            "output_name": output_name,
            "midi_file": None,
            "audio_file": None,
            "success": False
        }
        
        try:
            # 1. Erstelle MIDI
            midi_file = self.midi_exporter.create_drum_midi(
                drum_pattern, 
                f"output/midi/{output_name}.mid"
            )
            results["midi_file"] = midi_file
            
            # 2. Generiere Audio
            audio_file = self.audio_exporter.export_midi_to_audio(
                midi_file,
                f"output/audio/{output_name}.wav"
            )
            results["audio_file"] = audio_file
            
            results["success"] = True
            logger.info(f"✅ Drum-Pattern erstellt: {output_name}")
            
        except Exception as e:
            logger.error(f"❌ Drum-Pattern-Erstellung fehlgeschlagen: {e}")
        
        return results
    
    def generate_dexed_patch(self, description: str, 
                            output_name: str = "patch") -> Dict[str, Any]:
        """
        Generiert einen Dexed-Patch aus einer Beschreibung
        
        Args:
            description: Beschreibung des gewünschten Sounds
            output_name: Name für Ausgabedateien
            
        Returns:
            Dictionary mit Patch-Informationen
        """
        results = {
            "output_name": output_name,
            "patch_file": None,
            "audio_file": None,
            "success": False
        }
        
        try:
            # 1. Erstelle Patch
            patch = self.dexed_api.create_patch_from_description(description)
            patch_file = f"output/dexed/{output_name}.json"
            
            with open(patch_file, 'w') as f:
                json.dump(patch, f, indent=2)
            results["patch_file"] = patch_file
            
            # 2. Teste Patch mit Audio
            audio_file = self.dexed_api.generate_test_audio(
                patch, 
                f"output/audio/{output_name}_test.wav"
            )
            results["audio_file"] = audio_file
            
            results["success"] = True
            logger.info(f"✅ Dexed-Patch erstellt: {output_name}")
            
        except Exception as e:
            logger.error(f"❌ Patch-Erstellung fehlgeschlagen: {e}")
        
        return results
    
    def combine_audio_files(self, audio_files: List[str], 
                           output_file: str) -> bool:
        """
        Kombiniert mehrere Audio-Dateien zu einer
        
        Args:
            audio_files: Liste der Audio-Dateien
            output_file: Ausgabedatei
            
        Returns:
            True wenn erfolgreich
        """
        try:
            return self.audio_exporter.combine_audio_files(audio_files, output_file)
        except Exception as e:
            logger.error(f"❌ Audio-Kombination fehlgeschlagen: {e}")
            return False
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Gibt den System-Status zurück
        
        Returns:
            Dictionary mit Status-Informationen
        """
        return {
            "dexed_available": self.dexed_api.is_available(),
            "audio_exporter_available": self.audio_exporter.is_available(),
            "output_directories": {
                "musicxml": str(self.output_dir / "musicxml"),
                "midi": str(self.output_dir / "midi"),
                "audio": str(self.output_dir / "audio"),
                "dexed": str(self.output_dir / "dexed")
            },
            "components": {
                "musicxml_translator": True,
                "midi_exporter": True,
                "audio_exporter": self.audio_exporter.is_available(),
                "dexed_api": self.dexed_api.is_available()
            }
        }

# Factory-Funktion
def get_daw_core() -> DAWCore:
    """Erstellt eine DAWCore-Instanz"""
    return DAWCore() 