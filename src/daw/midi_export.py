#!/usr/bin/env python3
"""
MIDI Export Funktionalität für Open DAW MCP

Konvertiert geparste MusicXML-Noten in MIDI-Dateien.
"""

import logging
import os
from typing import List, Optional
import mido
from mido import Message, MidiFile, MidiTrack
from .reaper import MusicXmlNote, MusicXmlTrack

logger = logging.getLogger(__name__)

class MidiExporter:
    """
    MIDI Export für MusicXML-Noten
    
    Funktionen:
    - Konvertiert MusicXmlNote zu MIDI-Messages
    - Erstellt MIDI-Dateien mit mehreren Tracks
    - Exportiert in verschiedene MIDI-Formate
    """
    
    def __init__(self):
        self.tempo = 120  # BPM
        self.time_signature = (4, 4)  # 4/4 time
        self.ticks_per_beat = 480  # Standard MIDI ticks
    
    def export_tracks_to_midi(self, tracks: List[MusicXmlTrack], output_file: str) -> bool:
        """
        Exportiert eine Liste von Tracks zu einer MIDI-Datei
        
        Args:
            tracks: Liste von MusicXmlTrack Objekten
            output_file: Pfad zur Ausgabe-MIDI-Datei
            
        Returns:
            True wenn erfolgreich
        """
        try:
            # Erstelle MIDI-Datei
            midi_file = MidiFile(type=1)  # Multi-track
            
            # Setze Tempo und Time Signature
            tempo_track = MidiTrack()
            tempo_track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.tempo), time=0))
            tempo_track.append(mido.MetaMessage('time_signature', numerator=self.time_signature[0], 
                                              denominator=self.time_signature[1], time=0))
            midi_file.tracks.append(tempo_track)
            
            # Erstelle Tracks für jeden MusicXML-Track
            for track_index, track in enumerate(tracks):
                midi_track = self._create_midi_track(track, track_index)
                midi_file.tracks.append(midi_track)
            
            # Speichere MIDI-Datei
            midi_file.save(output_file)
            
            logger.info(f"MIDI-Datei erfolgreich erstellt: {output_file}")
            logger.info(f"Tracks: {len(tracks)}, Gesamt-Tracks: {len(midi_file.tracks)}")
            
            return True
            
        except Exception as e:
            logger.error(f"MIDI-Export fehlgeschlagen: {e}")
            return False
    
    def _create_midi_track(self, track: MusicXmlTrack, track_index: int) -> MidiTrack:
        """Erstellt einen MIDI-Track aus einem MusicXmlTrack"""
        midi_track = MidiTrack()
        
        # Track Name setzen
        midi_track.append(mido.MetaMessage('track_name', name=track.name, time=0))
        
        # Program Change (Instrument)
        program = self._get_program_for_instrument(track.instrument)
        midi_track.append(Message('program_change', program=program, channel=track.channel))
        
        # Noten hinzufügen
        for note in track.notes:
            # Note On
            midi_note = self._pitch_to_midi_note(note.pitch)
            if midi_note is not None:
                midi_track.append(Message('note_on', note=midi_note, 
                                        velocity=note.velocity, 
                                        time=note.start_time, 
                                        channel=track.channel))
                
                # Note Off
                midi_track.append(Message('note_off', note=midi_note, 
                                        velocity=0, 
                                        time=note.duration, 
                                        channel=track.channel))
        
        # Track End
        midi_track.append(mido.MetaMessage('end_of_track', time=0))
        
        return midi_track
    
    def _pitch_to_midi_note(self, pitch: str) -> Optional[int]:
        """Konvertiert Pitch-String zu MIDI-Note-Nummer"""
        try:
            # Pitch-Format: "C4", "F#5", "Bb3"
            if len(pitch) < 2:
                return None
            
            # Extrahiere Note und Oktave
            note_part = pitch[:-1]
            octave = int(pitch[-1])
            
            # Note-Mapping
            note_map = {
                'C': 0, 'C#': 1, 'Db': 1,
                'D': 2, 'D#': 3, 'Eb': 3,
                'E': 4,
                'F': 5, 'F#': 6, 'Gb': 6,
                'G': 7, 'G#': 8, 'Ab': 8,
                'A': 9, 'A#': 10, 'Bb': 10,
                'B': 11
            }
            
            # Handle Enharmonische Noten
            if note_part in note_map:
                note_num = note_map[note_part]
            else:
                # Versuche ohne #/b
                base_note = note_part[0]
                if base_note in note_map:
                    note_num = note_map[base_note]
                    # Handle Accidentals
                    if len(note_part) > 1:
                        if note_part[1] == '#':
                            note_num += 1
                        elif note_part[1] == 'b':
                            note_num -= 1
                else:
                    return None
            
            # MIDI-Note berechnen
            midi_note = note_num + (octave + 1) * 12
            return midi_note
            
        except Exception as e:
            logger.error(f"Pitch-Konvertierung fehlgeschlagen für '{pitch}': {e}")
            return None
    
    def _get_program_for_instrument(self, instrument: str) -> int:
        """Gibt MIDI-Programm-Nummer für Instrument zurück"""
        instrument_map = {
            'Piano': 0,
            'Acoustic Grand Piano': 0,
            'Bright Acoustic Piano': 1,
            'Electric Grand Piano': 2,
            'Honky-tonk Piano': 3,
            'Electric Piano 1': 4,
            'Electric Piano 2': 5,
            'Harpsichord': 6,
            'Clavi': 7,
            'Guitar': 24,
            'Acoustic Guitar (nylon)': 24,
            'Acoustic Guitar (steel)': 25,
            'Electric Guitar (jazz)': 26,
            'Electric Guitar (clean)': 27,
            'Electric Guitar (muted)': 28,
            'Overdriven Guitar': 29,
            'Distortion Guitar': 30,
            'Guitar harmonics': 31,
            'Violin': 40,
            'Viola': 41,
            'Cello': 42,
            'Contrabass': 43,
            'Trumpet': 56,
            'Trombone': 57,
            'Tuba': 58,
            'Flute': 73,
            'Clarinet': 71,
            'Oboe': 68,
            'Bassoon': 70,
            'Drums': 9,
            'Percussion': 9
        }
        
        return instrument_map.get(instrument, 0)  # Default: Piano

def get_midi_exporter() -> MidiExporter:
    """Factory-Funktion für MidiExporter"""
    return MidiExporter() 