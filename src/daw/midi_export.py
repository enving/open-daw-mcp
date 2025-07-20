#!/usr/bin/env python3
"""
MIDI Export Module für Open DAW MCP

Konvertiert MusicXML-Noten in MIDI-Dateien für die Verarbeitung durch Synthesizer.
"""

import os
import logging
from typing import List, Dict, Any
from dataclasses import dataclass
from midiutil import MIDIFile

logger = logging.getLogger(__name__)

@dataclass
class MusicXmlNote:
    """Repräsentiert eine Note aus MusicXML"""
    pitch: int
    duration: float
    velocity: int = 100
    start_time: float = 0.0

@dataclass
class MusicXmlTrack:
    """Repräsentiert eine Spur aus MusicXML"""
    name: str
    notes: List[MusicXmlNote]
    instrument: str = "Acoustic Grand Piano"
    channel: int = 0

class MidiExporter:
    """Exportiert MusicXML-Noten in MIDI-Dateien"""
    
    def __init__(self):
        self.output_dir = "output/midi"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def export_notes_to_midi(self, notes: List[MusicXmlNote], 
                           output_file: str = None,
                           tempo: int = 120) -> str:
        """
        Exportiert eine Liste von Noten in eine MIDI-Datei
        
        Args:
            notes: Liste der zu exportierenden Noten
            output_file: Name der Ausgabedatei (optional)
            tempo: Tempo in BPM
            
        Returns:
            Pfad zur erstellten MIDI-Datei
        """
        if not output_file:
            output_file = os.path.join(self.output_dir, "exported_music.mid")
        
        # Erstelle MIDI-Datei
        midi = MIDIFile(1)  # 1 Spur
        midi.addTempo(0, 0, tempo)
        
        # Füge Noten hinzu
        current_time = 0.0
        for note in notes:
            # Konvertiere Pitch (MIDI-Note 60 = C4)
            midi_note = note.pitch
            
            # Füge Note hinzu
            midi.addNote(0, 0, midi_note, current_time, note.duration, note.velocity)
            current_time += note.duration
        
        # Speichere MIDI-Datei
        with open(output_file, "wb") as f:
            midi.writeFile(f)
        
        logger.info(f"✅ MIDI-Datei erstellt: {output_file}")
        return output_file
    
    def export_tracks_to_midi(self, tracks: List[MusicXmlTrack], 
                            output_file: str = None,
                            tempo: int = 120) -> str:
        """
        Exportiert mehrere Spuren in eine MIDI-Datei
        
        Args:
            tracks: Liste der zu exportierenden Spuren
            output_file: Name der Ausgabedatei (optional)
            tempo: Tempo in BPM
            
        Returns:
            Pfad zur erstellten MIDI-Datei
        """
        if not output_file:
            output_file = os.path.join(self.output_dir, "exported_tracks.mid")
        
        # Erstelle MIDI-Datei mit mehreren Spuren
        num_tracks = len(tracks)
        midi = MIDIFile(num_tracks)
        
        # Füge Tempo zur ersten Spur hinzu
        midi.addTempo(0, 0, tempo)
        
        # Füge Noten für jede Spur hinzu
        for track_idx, track in enumerate(tracks):
            current_time = 0.0
            for note in track.notes:
                # Konvertiere Pitch
                midi_note = note.pitch
                
                # Füge Note zur entsprechenden Spur hinzu
                midi.addNote(track_idx, track.channel, midi_note, 
                           current_time, note.duration, note.velocity)
                current_time += note.duration
        
        # Speichere MIDI-Datei
        with open(output_file, "wb") as f:
            midi.writeFile(f)
        
        logger.info(f"✅ Multi-Track MIDI-Datei erstellt: {output_file}")
        return output_file
    
    def create_melody_midi(self, melody_notes: List[Dict[str, Any]], 
                          output_file: str = None,
                          tempo: int = 120) -> str:
        """
        Erstellt eine MIDI-Datei aus Melodie-Noten
        
        Args:
            melody_notes: Liste von Melodie-Noten
            output_file: Name der Ausgabedatei (optional)
            tempo: Tempo in BPM
            
        Returns:
            Pfad zur erstellten MIDI-Datei
        """
        if not output_file:
            output_file = os.path.join(self.output_dir, "melody.mid")
        
        # Konvertiere Melodie-Noten in MusicXmlNote-Objekte
        notes = []
        current_time = 0.0
        
        for note_data in melody_notes:
            note = MusicXmlNote(
                pitch=note_data.get('pitch', 60),
                duration=note_data.get('duration', 0.5),
                velocity=note_data.get('velocity', 100),
                start_time=current_time
            )
            notes.append(note)
            current_time += note.duration
        
        return self.export_notes_to_midi(notes, output_file, tempo)
    
    def create_bass_midi(self, bass_notes: List[Dict[str, Any]], 
                        output_file: str = None,
                        tempo: int = 120) -> str:
        """
        Erstellt eine MIDI-Datei für Bass-Linien
        
        Args:
            bass_notes: Liste von Bass-Noten
            output_file: Name der Ausgabedatei (optional)
            tempo: Tempo in BPM
            
        Returns:
            Pfad zur erstellten MIDI-Datei
        """
        if not output_file:
            output_file = os.path.join(self.output_dir, "bass.mid")
        
        # Konvertiere Bass-Noten
        notes = []
        current_time = 0.0
        
        for note_data in bass_notes:
            note = MusicXmlNote(
                pitch=note_data.get('pitch', 36),  # C2 als Standard
                duration=note_data.get('duration', 1.0),
                velocity=note_data.get('velocity', 80),
                start_time=current_time
            )
            notes.append(note)
            current_time += note.duration
        
        return self.export_notes_to_midi(notes, output_file, tempo)
    
    def create_drum_midi(self, drum_pattern: List[Dict[str, Any]], 
                        output_file: str = None,
                        tempo: int = 120) -> str:
        """
        Erstellt eine MIDI-Datei für Drum-Patterns
        
        Args:
            drum_pattern: Liste von Drum-Hits
            output_file: Name der Ausgabedatei (optional)
            tempo: Tempo in BPM
            
        Returns:
            Pfad zur erstellten MIDI-Datei
        """
        if not output_file:
            output_file = os.path.join(self.output_dir, "drums.mid")
        
        # Erstelle MIDI-Datei für Drums (Kanal 9 für Drums)
        midi = MIDIFile(1)
        midi.addTempo(0, 0, tempo)
        
        # Füge Drum-Hits hinzu
        for hit in drum_pattern:
            note = hit.get('note', 36)  # Bass Drum als Standard
            time = hit.get('time', 0.0)
            duration = hit.get('duration', 0.25)
            velocity = hit.get('velocity', 100)
            
            midi.addNote(0, 9, note, time, duration, velocity)
        
        # Speichere MIDI-Datei
        with open(output_file, "wb") as f:
            midi.writeFile(f)
        
        logger.info(f"✅ Drum MIDI-Datei erstellt: {output_file}")
        return output_file

# Export-Funktionen für einfache Verwendung
def export_melody_to_midi(melody_notes: List[Dict[str, Any]], 
                          output_file: str = None) -> str:
    """Exportiert eine Melodie in MIDI"""
    exporter = MidiExporter()
    return exporter.create_melody_midi(melody_notes, output_file)

def export_bass_to_midi(bass_notes: List[Dict[str, Any]], 
                       output_file: str = None) -> str:
    """Exportiert eine Bass-Linie in MIDI"""
    exporter = MidiExporter()
    return exporter.create_bass_midi(bass_notes, output_file)

def export_drums_to_midi(drum_pattern: List[Dict[str, Any]], 
                        output_file: str = None) -> str:
    """Exportiert ein Drum-Pattern in MIDI"""
    exporter = MidiExporter()
    return exporter.create_drum_midi(drum_pattern, output_file) 