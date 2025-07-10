#!/usr/bin/env python3
"""
Open DAW MCP - MIDI Engine

MIDI Sequencing und Processing Engine für die Headless-DAW.
"""

import logging
import mido
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import time

logger = logging.getLogger(__name__)

class MidiEventType(Enum):
    """MIDI Event Typen"""
    NOTE_ON = "note_on"
    NOTE_OFF = "note_off"
    CONTROL_CHANGE = "control_change"
    PROGRAM_CHANGE = "program_change"
    PITCH_BEND = "pitch_bend"
    AFTERTOUCH = "aftertouch"

@dataclass
class MidiEvent:
    """MIDI Event"""
    type: MidiEventType
    channel: int
    note: Optional[int] = None
    velocity: Optional[int] = None
    control: Optional[int] = None
    value: Optional[int] = None
    time: float = 0.0

@dataclass
class MidiTrack:
    """MIDI Track"""
    id: str
    name: str
    events: List[MidiEvent]
    channel: int = 0
    instrument: int = 0  # Program Change
    volume: int = 100    # Control Change 7
    pan: int = 64       # Control Change 10

class MidiEngine:
    """
    MIDI Engine für Sequencing und Processing
    
    Verantwortlich für:
    - MIDI Event Processing
    - MIDI Sequencing
    - MPE Support
    - MIDI Clock Synchronization
    - MIDI Export/Import
    """
    
    def __init__(self, bpm: float = 120.0):
        self.bpm = bpm
        self.tracks: Dict[str, MidiTrack] = {}
        self.current_time = 0.0
        self.is_playing = False
        
        # MIDI Ports
        self.input_ports = []
        self.output_ports = []
        
        # MIDI Clock
        self.clock_tick = 0
        self.ticks_per_beat = 24
        
        logger.info("MIDI Engine initialisiert")
    
    def setup_midi_ports(self):
        """MIDI Ports Setup"""
        try:
            # Available MIDI ports
            input_names = mido.get_input_names()
            output_names = mido.get_output_names()
            
            logger.info(f"Verfügbare MIDI Inputs: {input_names}")
            logger.info(f"Verfügbare MIDI Outputs: {output_names}")
            
            # Input ports öffnen
            for name in input_names:
                try:
                    port = mido.open_input(name)
                    self.input_ports.append(port)
                    logger.info(f"MIDI Input geöffnet: {name}")
                except Exception as e:
                    logger.warning(f"MIDI Input fehlgeschlagen: {name} - {e}")
            
            # Output ports öffnen
            for name in output_names:
                try:
                    port = mido.open_output(name)
                    self.output_ports.append(port)
                    logger.info(f"MIDI Output geöffnet: {name}")
                except Exception as e:
                    logger.warning(f"MIDI Output fehlgeschlagen: {name} - {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"MIDI Ports Setup fehlgeschlagen: {e}")
            return False
    
    # Track Management
    def create_track(self, name: str, channel: int = 0) -> str:
        """Erstellt einen neuen MIDI Track"""
        track_id = f"track_{len(self.tracks) + 1}"
        track = MidiTrack(
            id=track_id,
            name=name,
            events=[],
            channel=channel
        )
        self.tracks[track_id] = track
        logger.info(f"MIDI Track erstellt: {track_id}")
        return track_id
    
    def remove_track(self, track_id: str) -> bool:
        """Entfernt einen MIDI Track"""
        if track_id in self.tracks:
            del self.tracks[track_id]
            logger.info(f"MIDI Track entfernt: {track_id}")
            return True
        return False
    
    def get_track(self, track_id: str) -> Optional[MidiTrack]:
        """Holt einen MIDI Track"""
        return self.tracks.get(track_id)
    
    # Event Management
    def add_note(self, track_id: str, note: int, velocity: int, 
                 start_time: float, duration: float) -> bool:
        """Fügt eine Note zu einem Track hinzu"""
        track = self.get_track(track_id)
        if not track:
            return False
        
        # Note On Event
        note_on = MidiEvent(
            type=MidiEventType.NOTE_ON,
            channel=track.channel,
            note=note,
            velocity=velocity,
            time=start_time
        )
        
        # Note Off Event
        note_off = MidiEvent(
            type=MidiEventType.NOTE_OFF,
            channel=track.channel,
            note=note,
            velocity=0,
            time=start_time + duration
        )
        
        track.events.extend([note_on, note_off])
        track.events.sort(key=lambda e: e.time)
        
        logger.debug(f"Note hinzugefügt: Track {track_id}, Note {note}")
        return True
    
    def add_control_change(self, track_id: str, control: int, value: int, 
                          time: float) -> bool:
        """Fügt einen Control Change zu einem Track hinzu"""
        track = self.get_track(track_id)
        if not track:
            return False
        
        event = MidiEvent(
            type=MidiEventType.CONTROL_CHANGE,
            channel=track.channel,
            control=control,
            value=value,
            time=time
        )
        
        track.events.append(event)
        track.events.sort(key=lambda e: e.time)
        
        logger.debug(f"Control Change hinzugefügt: Track {track_id}, CC {control}")
        return True
    
    def add_program_change(self, track_id: str, program: int, time: float) -> bool:
        """Fügt einen Program Change zu einem Track hinzu"""
        track = self.get_track(track_id)
        if not track:
            return False
        
        event = MidiEvent(
            type=MidiEventType.PROGRAM_CHANGE,
            channel=track.channel,
            value=program,
            time=time
        )
        
        track.events.append(event)
        track.events.sort(key=lambda e: e.time)
        
        logger.debug(f"Program Change hinzugefügt: Track {track_id}, Program {program}")
        return True
    
    # MPE Support
    def add_mpe_note(self, track_id: str, note: int, velocity: int,
                     pressure: int, timbre: int, pitch_bend: int,
                     start_time: float, duration: float) -> bool:
        """Fügt eine MPE Note hinzu"""
        track = self.get_track(track_id)
        if not track:
            return False
        
        # MPE Channel berechnen (für MPE wird Channel 1-15 verwendet)
        mpe_channel = (note % 14) + 1
        
        # Note On mit MPE Daten
        note_on = MidiEvent(
            type=MidiEventType.NOTE_ON,
            channel=mpe_channel,
            note=note,
            velocity=velocity,
            time=start_time
        )
        
        # Pressure (Aftertouch)
        pressure_event = MidiEvent(
            type=MidiEventType.AFTERTOUCH,
            channel=mpe_channel,
            note=note,
            value=pressure,
            time=start_time
        )
        
        # Timbre (CC 74)
        timbre_event = MidiEvent(
            type=MidiEventType.CONTROL_CHANGE,
            channel=mpe_channel,
            control=74,
            value=timbre,
            time=start_time
        )
        
        # Pitch Bend
        pitch_bend_event = MidiEvent(
            type=MidiEventType.PITCH_BEND,
            channel=mpe_channel,
            value=pitch_bend,
            time=start_time
        )
        
        # Note Off
        note_off = MidiEvent(
            type=MidiEventType.NOTE_OFF,
            channel=mpe_channel,
            note=note,
            velocity=0,
            time=start_time + duration
        )
        
        # Events hinzufügen
        track.events.extend([note_on, pressure_event, timbre_event, 
                           pitch_bend_event, note_off])
        track.events.sort(key=lambda e: e.time)
        
        logger.debug(f"MPE Note hinzugefügt: Track {track_id}, Note {note}")
        return True
    
    # Playback Control
    def play(self):
        """Startet die MIDI Wiedergabe"""
        self.is_playing = True
        self.current_time = 0.0
        self.clock_tick = 0
        logger.info("MIDI Wiedergabe gestartet")
    
    def stop(self):
        """Stoppt die MIDI Wiedergabe"""
        self.is_playing = False
        self.current_time = 0.0
        self.clock_tick = 0
        logger.info("MIDI Wiedergabe gestoppt")
    
    def pause(self):
        """Pausiert die MIDI Wiedergabe"""
        self.is_playing = False
        logger.info("MIDI Wiedergabe pausiert")
    
    def resume(self):
        """Setzt die MIDI Wiedergabe fort"""
        self.is_playing = True
        logger.info("MIDI Wiedergabe fortgesetzt")
    
    # MIDI Processing
    def process_track(self, track, frames: int) -> List[MidiEvent]:
        """Verarbeitet einen MIDI Track"""
        if not self.is_playing or not track:
            return []
        
        # Zeit für diesen Frame berechnen
        frame_time = frames / 44100.0  # Sample Rate
        end_time = self.current_time + frame_time
        
        # Events in diesem Zeitfenster finden
        events = []
        for event in track.events:
            if self.current_time <= event.time < end_time:
                events.append(event)
        
        # Zeit vorrücken
        self.current_time = end_time
        
        return events
    
    def send_midi_event(self, event: MidiEvent):
        """Sendet ein MIDI Event an alle Output Ports"""
        try:
            # Event zu mido Message konvertieren
            if event.type == MidiEventType.NOTE_ON:
                msg = mido.Message('note_on', note=event.note, 
                                 velocity=event.velocity, channel=event.channel)
            elif event.type == MidiEventType.NOTE_OFF:
                msg = mido.Message('note_off', note=event.note, 
                                 velocity=event.velocity, channel=event.channel)
            elif event.type == MidiEventType.CONTROL_CHANGE:
                msg = mido.Message('control_change', control=event.control, 
                                 value=event.value, channel=event.channel)
            elif event.type == MidiEventType.PROGRAM_CHANGE:
                msg = mido.Message('program_change', program=event.value, 
                                 channel=event.channel)
            elif event.type == MidiEventType.PITCH_BEND:
                msg = mido.Message('pitch_bend', value=event.value, 
                                 channel=event.channel)
            elif event.type == MidiEventType.AFTERTOUCH:
                msg = mido.Message('aftertouch', note=event.note, 
                                 value=event.value, channel=event.channel)
            else:
                logger.warning(f"Unbekannter MIDI Event Typ: {event.type}")
                return
            
            # An alle Output Ports senden
            for port in self.output_ports:
                try:
                    port.send(msg)
                except Exception as e:
                    logger.warning(f"MIDI Send fehlgeschlagen: {e}")
            
            logger.debug(f"MIDI Event gesendet: {event.type} auf Channel {event.channel}")
            
        except Exception as e:
            logger.error(f"MIDI Event Processing fehlgeschlagen: {e}")
    
    # MIDI Import/Export
    def load_midi_file(self, filepath: str) -> bool:
        """Lädt eine MIDI-Datei"""
        try:
            midi_file = mido.MidiFile(filepath)
            
            # Tracks aus MIDI-Datei extrahieren
            for i, track in enumerate(midi_file.tracks):
                track_id = f"imported_track_{i+1}"
                midi_track = MidiTrack(
                    id=track_id,
                    name=f"Track {i+1}",
                    events=[],
                    channel=i % 16
                )
                
                # Events aus MIDI-Track extrahieren
                current_time = 0.0
                for msg in track:
                    current_time += mido.tick2second(msg.time, midi_file.ticks_per_beat, 
                                                   mido.bpm2tempo(self.bpm))
                    
                    event = self._convert_mido_message(msg, current_time)
                    if event:
                        midi_track.events.append(event)
                
                self.tracks[track_id] = midi_track
                logger.info(f"MIDI Track geladen: {track_id}")
            
            logger.info(f"MIDI-Datei geladen: {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"MIDI-Datei Laden fehlgeschlagen: {e}")
            return False
    
    def save_midi_file(self, filepath: str) -> bool:
        """Speichert alle Tracks als MIDI-Datei"""
        try:
            midi_file = mido.MidiFile()
            
            # Alle Tracks zu MIDI-Datei hinzufügen
            for track_id, track in self.tracks.items():
                midi_track = mido.MidiTrack()
                
                # Program Change am Anfang
                if track.instrument > 0:
                    midi_track.append(mido.Message('program_change', 
                                                 program=track.instrument, 
                                                 channel=track.channel))
                
                # Control Changes
                if track.volume != 100:
                    midi_track.append(mido.Message('control_change', 
                                                 control=7, value=track.volume, 
                                                 channel=track.channel))
                if track.pan != 64:
                    midi_track.append(mido.Message('control_change', 
                                                 control=10, value=track.pan, 
                                                 channel=track.channel))
                
                # Events konvertieren
                last_time = 0
                for event in track.events:
                    mido_msg = self._convert_to_mido_message(event)
                    if mido_msg:
                        # Delta Time berechnen
                        delta_ticks = int((event.time - last_time) * 
                                        midi_file.ticks_per_beat * self.bpm / 60)
                        mido_msg.time = delta_ticks
                        midi_track.append(mido_msg)
                        last_time = event.time
                
                midi_file.tracks.append(midi_track)
            
            # MIDI-Datei speichern
            midi_file.save(filepath)
            logger.info(f"MIDI-Datei gespeichert: {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"MIDI-Datei Speichern fehlgeschlagen: {e}")
            return False
    
    def _convert_mido_message(self, msg: mido.Message, time: float) -> Optional[MidiEvent]:
        """Konvertiert mido Message zu MidiEvent"""
        try:
            if msg.type == 'note_on':
                return MidiEvent(
                    type=MidiEventType.NOTE_ON,
                    channel=msg.channel,
                    note=msg.note,
                    velocity=msg.velocity,
                    time=time
                )
            elif msg.type == 'note_off':
                return MidiEvent(
                    type=MidiEventType.NOTE_OFF,
                    channel=msg.channel,
                    note=msg.note,
                    velocity=msg.velocity,
                    time=time
                )
            elif msg.type == 'control_change':
                return MidiEvent(
                    type=MidiEventType.CONTROL_CHANGE,
                    channel=msg.channel,
                    control=msg.control,
                    value=msg.value,
                    time=time
                )
            elif msg.type == 'program_change':
                return MidiEvent(
                    type=MidiEventType.PROGRAM_CHANGE,
                    channel=msg.channel,
                    value=msg.program,
                    time=time
                )
            elif msg.type == 'pitch_bend':
                return MidiEvent(
                    type=MidiEventType.PITCH_BEND,
                    channel=msg.channel,
                    value=msg.pitch,
                    time=time
                )
            elif msg.type == 'aftertouch':
                return MidiEvent(
                    type=MidiEventType.AFTERTOUCH,
                    channel=msg.channel,
                    note=msg.note,
                    value=msg.value,
                    time=time
                )
            
            return None
            
        except Exception as e:
            logger.error(f"MIDI Message Konvertierung fehlgeschlagen: {e}")
            return None
    
    def _convert_to_mido_message(self, event: MidiEvent) -> Optional[mido.Message]:
        """Konvertiert MidiEvent zu mido Message"""
        try:
            if event.type == MidiEventType.NOTE_ON:
                return mido.Message('note_on', note=event.note, 
                                  velocity=event.velocity, channel=event.channel)
            elif event.type == MidiEventType.NOTE_OFF:
                return mido.Message('note_off', note=event.note, 
                                  velocity=event.velocity, channel=event.channel)
            elif event.type == MidiEventType.CONTROL_CHANGE:
                return mido.Message('control_change', control=event.control, 
                                  value=event.value, channel=event.channel)
            elif event.type == MidiEventType.PROGRAM_CHANGE:
                return mido.Message('program_change', program=event.value, 
                                  channel=event.channel)
            elif event.type == MidiEventType.PITCH_BEND:
                return mido.Message('pitch_bend', value=event.value, 
                                  channel=event.channel)
            elif event.type == MidiEventType.AFTERTOUCH:
                return mido.Message('aftertouch', note=event.note, 
                                  value=event.value, channel=event.channel)
            
            return None
            
        except Exception as e:
            logger.error(f"MidiEvent Konvertierung fehlgeschlagen: {e}")
            return None
    
    # Utility Functions
    def generate_scale(self, track_id: str, root_note: int, scale_type: str = "major",
                      octaves: int = 2, velocity: int = 64, duration: float = 0.5) -> bool:
        """Generiert eine Tonleiter"""
        # Scale patterns
        scales = {
            "major": [0, 2, 4, 5, 7, 9, 11, 12],
            "minor": [0, 2, 3, 5, 7, 8, 10, 12],
            "pentatonic": [0, 2, 4, 7, 9, 12],
            "blues": [0, 3, 5, 6, 7, 10, 12]
        }
        
        if scale_type not in scales:
            logger.error(f"Unbekannte Tonleiter: {scale_type}")
            return False
        
        scale_pattern = scales[scale_type]
        current_time = 0.0
        
        for octave in range(octaves):
            for note_offset in scale_pattern:
                note = root_note + note_offset + (octave * 12)
                self.add_note(track_id, note, velocity, current_time, duration)
                current_time += duration
        
        logger.info(f"Tonleiter generiert: {scale_type} auf {root_note}")
        return True
    
    def generate_arpeggio(self, track_id: str, chord_notes: List[int], 
                         pattern: str = "up", velocity: int = 64, 
                         duration: float = 0.25) -> bool:
        """Generiert ein Arpeggio"""
        current_time = 0.0
        
        if pattern == "up":
            notes = chord_notes
        elif pattern == "down":
            notes = list(reversed(chord_notes))
        elif pattern == "updown":
            notes = chord_notes + list(reversed(chord_notes[1:-1]))
        else:
            logger.error(f"Unbekanntes Arpeggio-Pattern: {pattern}")
            return False
        
        for note in notes:
            self.add_note(track_id, note, velocity, current_time, duration)
            current_time += duration
        
        logger.info(f"Arpeggio generiert: {pattern} Pattern")
        return True
    
    # Cleanup
    def shutdown(self):
        """Beendet die MIDI Engine sauber"""
        self.stop()
        
        # MIDI Ports schließen
        for port in self.input_ports:
            port.close()
        for port in self.output_ports:
            port.close()
        
        logger.info("MIDI Engine heruntergefahren")

# Global MIDI Engine Instance
midi_engine_instance = None

def get_midi_engine() -> MidiEngine:
    """Gibt die globale MIDI Engine Instanz zurück"""
    global midi_engine_instance
    if midi_engine_instance is None:
        midi_engine_instance = MidiEngine()
    return midi_engine_instance

if __name__ == "__main__":
    # Test der MIDI Engine
    midi_engine = get_midi_engine()
    
    # MIDI Ports Setup
    midi_engine.setup_midi_ports()
    
    # Track erstellen
    track_id = midi_engine.create_track("Test Track")
    
    # Einige Noten hinzufügen
    midi_engine.add_note(track_id, 60, 64, 0.0, 0.5)  # C4
    midi_engine.add_note(track_id, 64, 64, 0.5, 0.5)  # E4
    midi_engine.add_note(track_id, 67, 64, 1.0, 0.5)  # G4
    
    # Tonleiter generieren
    midi_engine.generate_scale(track_id, 60, "major", 1)
    
    # MIDI-Datei speichern
    midi_engine.save_midi_file("test_output.mid")
    
    # Cleanup
    midi_engine.shutdown() 