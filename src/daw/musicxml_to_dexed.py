#!/usr/bin/env python3
"""
MusicXML zu Dexed Übersetzer
Konvertiert MusicXML-Instrumente automatisch in Dexed FM-Synth-Patches
"""

import xml.etree.ElementTree as ET
import json
import re
import argparse
import sys
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class InstrumentType(Enum):
    """Instrument-Typen für Dexed-Patches"""
    FLUTE = "flute"
    PIANO = "piano"
    VIOLIN = "violin"
    TRUMPET = "trumpet"
    SAXOPHONE = "saxophone"
    BASS = "bass"
    DRUMS = "drums"
    SYNTH = "synth"
    BRASS = "brass"
    STRINGS = "strings"
    WOODWIND = "woodwind"
    PERCUSSION = "percussion"

@dataclass
class DexedPatch:
    """Dexed-Patch mit allen Parametern"""
    name: str
    algorithm: int
    feedback: int = 0
    lfo_speed: int = 0
    lfo_delay: int = 0
    lfo_pitch_mod: int = 0
    lfo_amp_mod: int = 0
    lfo_sync: bool = False
    lfo_wave: int = 0
    pitch_mod_sens: int = 0
    amp_mod_sens: int = 0
    transpose: int = 0
    poly_mode: int = 1
    pitch_bend_range: int = 2
    portamento_mode: int = 0
    portamento_time: int = 0
    operators: List[Dict] = None
    
    def __post_init__(self):
        if self.operators is None:
            self.operators = [self._create_default_operator() for _ in range(6)]
    
    def _create_default_operator(self) -> Dict:
        return {
            "level": 99,
            "freq_ratio": 1.0,
            "detune": 0,
            "attack": 0,
            "decay": 0,
            "sustain": 99,
            "release": 0,
            "feedback": 0,
            "key_scale": 0,
            "velocity_sense": 0,
            "wave": 0,
            "enabled": True
        }

class MusicXMLToDexed:
    """Übersetzer von MusicXML zu Dexed-Patches"""
    
    def __init__(self):
        self.instrument_mappings = self._create_instrument_mappings()
        self.algorithm_mappings = self._create_algorithm_mappings()
    
    def _create_instrument_mappings(self) -> Dict[str, InstrumentType]:
        """Erstellt Mappings von MusicXML-Instrumenten zu Dexed-Typen"""
        return {
            # Flöten
            "flute": InstrumentType.FLUTE,
            "piccolo": InstrumentType.FLUTE,
            "alto flute": InstrumentType.FLUTE,
            "bass flute": InstrumentType.FLUTE,
            
            # Klavier
            "piano": InstrumentType.PIANO,
            "grand piano": InstrumentType.PIANO,
            "upright piano": InstrumentType.PIANO,
            "electric piano": InstrumentType.PIANO,
            "rhodes": InstrumentType.PIANO,
            
            # Violinen
            "violin": InstrumentType.VIOLIN,
            "viola": InstrumentType.VIOLIN,
            "cello": InstrumentType.VIOLIN,
            "double bass": InstrumentType.VIOLIN,
            
            # Trompeten
            "trumpet": InstrumentType.TRUMPET,
            "cornet": InstrumentType.TRUMPET,
            "flugelhorn": InstrumentType.TRUMPET,
            
            # Saxophone
            "saxophone": InstrumentType.SAXOPHONE,
            "alto sax": InstrumentType.SAXOPHONE,
            "tenor sax": InstrumentType.SAXOPHONE,
            "soprano sax": InstrumentType.SAXOPHONE,
            "baritone sax": InstrumentType.SAXOPHONE,
            
            # Bass
            "bass": InstrumentType.BASS,
            "electric bass": InstrumentType.BASS,
            "acoustic bass": InstrumentType.BASS,
            "synth bass": InstrumentType.BASS,
            
            # Drums
            "drums": InstrumentType.DRUMS,
            "drum kit": InstrumentType.DRUMS,
            "percussion": InstrumentType.DRUMS,
            
            # Synth
            "synth": InstrumentType.SYNTH,
            "synthesizer": InstrumentType.SYNTH,
            "lead": InstrumentType.SYNTH,
            "pad": InstrumentType.SYNTH,
            
            # Brass
            "brass": InstrumentType.BRASS,
            "trombone": InstrumentType.BRASS,
            "horn": InstrumentType.BRASS,
            "tuba": InstrumentType.BRASS,
            
            # Strings
            "strings": InstrumentType.STRINGS,
            "string ensemble": InstrumentType.STRINGS,
            "orchestra": InstrumentType.STRINGS,
            
            # Woodwind
            "woodwind": InstrumentType.WOODWIND,
            "clarinet": InstrumentType.WOODWIND,
            "oboe": InstrumentType.WOODWIND,
            "bassoon": InstrumentType.WOODWIND,
            
            # Percussion
            "percussion": InstrumentType.PERCUSSION,
            "timpani": InstrumentType.PERCUSSION,
            "cymbals": InstrumentType.PERCUSSION
        }
    
    def _create_algorithm_mappings(self) -> Dict[InstrumentType, int]:
        """Mappt Instrument-Typen zu DX7-Algorithmen"""
        return {
            InstrumentType.FLUTE: 1,      # 6-Stack für warme Flöten-Sounds
            InstrumentType.PIANO: 5,      # 2-Stack + 4 für Piano-Charakter
            InstrumentType.VIOLIN: 3,     # 4-Stack + 2 für Streicher
            InstrumentType.TRUMPET: 2,    # 5-Stack + 1 für Brass
            InstrumentType.SAXOPHONE: 4,  # 3-Stack + 3 für Sax
            InstrumentType.BASS: 1,       # 6-Stack für tiefe Bässe
            InstrumentType.DRUMS: 7,      # 6-Parallel für Drums
            InstrumentType.SYNTH: 8,      # 5-Parallel + 1 für Synth
            InstrumentType.BRASS: 2,      # 5-Stack + 1 für Brass
            InstrumentType.STRINGS: 3,    # 4-Stack + 2 für Strings
            InstrumentType.WOODWIND: 1,   # 6-Stack für Holzbläser
            InstrumentType.PERCUSSION: 7  # 6-Parallel für Percussion
        }
    
    def parse_musicxml(self, musicxml_content: str) -> List[DexedPatch]:
        """Parst MusicXML und erstellt Dexed-Patches"""
        try:
            root = ET.fromstring(musicxml_content)
            
            # Finde alle Instrumente
            instruments = self._extract_instruments(root)
            
            # Erstelle Patches für jedes Instrument
            patches = []
            for instrument in instruments:
                patch = self._create_patch_for_instrument(instrument)
                patches.append(patch)
            
            return patches
            
        except Exception as e:
            print(f"Fehler beim Parsen von MusicXML: {e}")
            return []
    
    def _extract_instruments(self, root: ET.Element) -> List[Dict]:
        """Extrahiert Instrumente aus MusicXML"""
        instruments = []
        
        # Suche nach Part-Elementen
        for part in root.findall(".//part"):
            part_id = part.get('id', '')
            
            # Suche nach Instrument-Namen
            instrument_name = self._find_instrument_name(part)
            
            # Suche nach MIDI-Programm
            midi_program = self._find_midi_program(part)
            
            # Suche nach Noten-Bereich
            note_range = self._find_note_range(part)
            
            instruments.append({
                'part_id': part_id,
                'name': instrument_name,
                'midi_program': midi_program,
                'note_range': note_range
            })
        
        return instruments
    
    def _find_instrument_name(self, part: ET.Element) -> str:
        """Findet den Instrument-Namen in einem Part"""
        # Suche nach instrument-name Element
        instrument_name_elem = part.find(".//instrument-name")
        if instrument_name_elem is not None:
            return instrument_name_elem.text.lower()
        
        # Suche nach part-name Element
        part_name_elem = part.find(".//part-name")
        if part_name_elem is not None:
            return part_name_elem.text.lower()
        
        # Suche nach MIDI-Instrument
        midi_instrument = part.find(".//midi-instrument")
        if midi_instrument is not None:
            instrument_name = midi_instrument.find("midi-name")
            if instrument_name is not None:
                return instrument_name.text.lower()
        
        return "unknown"
    
    def _find_midi_program(self, part: ET.Element) -> int:
        """Findet das MIDI-Programm"""
        midi_instrument = part.find(".//midi-instrument")
        if midi_instrument is not None:
            midi_program = midi_instrument.find("midi-program")
            if midi_program is not None:
                return int(midi_program.text)
        return 0
    
    def _find_note_range(self, part: ET.Element) -> Tuple[int, int]:
        """Findet den Noten-Bereich"""
        notes = []
        for note in part.findall(".//note"):
            pitch = note.find("pitch")
            if pitch is not None:
                step = pitch.find("step")
                octave = pitch.find("octave")
                if step is not None and octave is not None:
                    note_num = self._note_to_number(step.text, int(octave.text))
                    notes.append(note_num)
        
        if notes:
            return min(notes), max(notes)
        return 60, 72  # Default: C4 bis C5
    
    def _note_to_number(self, step: str, octave: int) -> int:
        """Konvertiert Note zu MIDI-Nummer"""
        note_map = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
        return note_map.get(step, 0) + (octave + 1) * 12
    
    def _create_patch_for_instrument(self, instrument: Dict) -> DexedPatch:
        """Erstellt einen Dexed-Patch für ein Instrument"""
        instrument_name = instrument['name']
        midi_program = instrument['midi_program']
        note_range = instrument['note_range']
        
        # Bestimme Instrument-Typ
        instrument_type = self._determine_instrument_type(instrument_name, midi_program)
        
        # Erstelle Patch-Name
        patch_name = f"{instrument_name.title()} ({instrument['part_id']})"
        
        # Wähle Algorithm basierend auf Instrument-Typ
        algorithm = self.algorithm_mappings.get(instrument_type, 1)
        
        # Erstelle Patch
        patch = DexedPatch(
            name=patch_name,
            algorithm=algorithm
        )
        
        # Konfiguriere Operatoren basierend auf Instrument-Typ
        self._configure_operators_for_instrument(patch, instrument_type, note_range)
        
        return patch
    
    def _determine_instrument_type(self, instrument_name: str, midi_program: int) -> InstrumentType:
        """Bestimmt den Instrument-Typ basierend auf Name und MIDI-Programm"""
        # Suche nach exakter Übereinstimmung
        for key, instrument_type in self.instrument_mappings.items():
            if key in instrument_name.lower():
                return instrument_type
        
        # Fallback basierend auf MIDI-Programm
        if 0 <= midi_program <= 7:      # Piano
            return InstrumentType.PIANO
        elif 8 <= midi_program <= 15:    # Chromatic Percussion
            return InstrumentType.PERCUSSION
        elif 16 <= midi_program <= 23:   # Organ
            return InstrumentType.SYNTH
        elif 24 <= midi_program <= 31:   # Guitar
            return InstrumentType.SYNTH
        elif 32 <= midi_program <= 39:   # Bass
            return InstrumentType.BASS
        elif 40 <= midi_program <= 47:   # Strings
            return InstrumentType.STRINGS
        elif 48 <= midi_program <= 55:   # Ensemble
            return InstrumentType.STRINGS
        elif 56 <= midi_program <= 63:   # Brass
            return InstrumentType.BRASS
        elif 64 <= midi_program <= 71:   # Reed
            return InstrumentType.WOODWIND
        elif 72 <= midi_program <= 79:   # Pipe
            return InstrumentType.FLUTE
        elif 80 <= midi_program <= 87:   # Synth Lead
            return InstrumentType.SYNTH
        elif 88 <= midi_program <= 95:   # Synth Pad
            return InstrumentType.SYNTH
        elif 96 <= midi_program <= 103:  # Synth Effects
            return InstrumentType.SYNTH
        elif 104 <= midi_program <= 111: # Ethnic
            return InstrumentType.PERCUSSION
        elif 112 <= midi_program <= 119: # Percussive
            return InstrumentType.DRUMS
        elif 120 <= midi_program <= 127: # Sound Effects
            return InstrumentType.SYNTH
        else:
            return InstrumentType.SYNTH
    
    def _configure_operators_for_instrument(self, patch: DexedPatch, 
                                          instrument_type: InstrumentType, 
                                          note_range: Tuple[int, int]):
        """Konfiguriert Operatoren basierend auf Instrument-Typ"""
        
        if instrument_type == InstrumentType.FLUTE:
            # Flöte: Warme, weiche Sounds
            patch.operators[0] = {"level": 80, "freq_ratio": 1.0, "attack": 10, "decay": 20, "sustain": 70, "release": 30, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 60, "freq_ratio": 2.0, "attack": 5, "decay": 15, "sustain": 80, "release": 25, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 40, "freq_ratio": 3.0, "attack": 0, "decay": 10, "sustain": 60, "release": 20, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        elif instrument_type == InstrumentType.PIANO:
            # Piano: Klare, perkussive Sounds
            patch.operators[0] = {"level": 99, "freq_ratio": 1.0, "attack": 0, "decay": 0, "sustain": 50, "release": 10, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 70, "freq_ratio": 2.0, "attack": 0, "decay": 0, "sustain": 40, "release": 8, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 50, "freq_ratio": 4.0, "attack": 0, "decay": 0, "sustain": 30, "release": 6, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[3] = {"level": 30, "freq_ratio": 8.0, "attack": 0, "decay": 0, "sustain": 20, "release": 4, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        elif instrument_type == InstrumentType.VIOLIN:
            # Violine: Warme, expressive Sounds
            patch.operators[0] = {"level": 85, "freq_ratio": 1.0, "attack": 15, "decay": 25, "sustain": 75, "release": 35, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 65, "freq_ratio": 2.0, "attack": 10, "decay": 20, "sustain": 80, "release": 30, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 45, "freq_ratio": 3.0, "attack": 5, "decay": 15, "sustain": 70, "release": 25, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        elif instrument_type == InstrumentType.TRUMPET:
            # Trompete: Brillante, laute Sounds
            patch.operators[0] = {"level": 99, "freq_ratio": 1.0, "attack": 5, "decay": 15, "sustain": 90, "release": 20, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 80, "freq_ratio": 2.0, "attack": 0, "decay": 10, "sustain": 85, "release": 15, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 60, "freq_ratio": 3.0, "attack": 0, "decay": 5, "sustain": 80, "release": 10, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        elif instrument_type == InstrumentType.SAXOPHONE:
            # Saxophon: Warme, expressive Sounds
            patch.operators[0] = {"level": 90, "freq_ratio": 1.0, "attack": 20, "decay": 30, "sustain": 80, "release": 40, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 70, "freq_ratio": 2.0, "attack": 15, "decay": 25, "sustain": 85, "release": 35, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 50, "freq_ratio": 3.0, "attack": 10, "decay": 20, "sustain": 75, "release": 30, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        elif instrument_type == InstrumentType.BASS:
            # Bass: Tiefe, kraftvolle Sounds
            patch.operators[0] = {"level": 99, "freq_ratio": 0.5, "attack": 0, "decay": 0, "sustain": 99, "release": 20, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 80, "freq_ratio": 1.0, "attack": 0, "decay": 0, "sustain": 99, "release": 20, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[2] = {"level": 0, "enabled": False}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
            
        else:
            # Default: Synth-Sound
            patch.operators[0] = {"level": 99, "freq_ratio": 1.0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            patch.operators[1] = {"level": 0, "enabled": False}
            patch.operators[2] = {"level": 0, "enabled": False}
            patch.operators[3] = {"level": 0, "enabled": False}
            patch.operators[4] = {"level": 0, "enabled": False}
            patch.operators[5] = {"level": 0, "enabled": False}
    
    def convert_musicxml_to_dexed_patches(self, musicxml_file: str) -> List[Dict]:
        """Konvertiert MusicXML-Datei zu Dexed-Patches"""
        try:
            with open(musicxml_file, 'r', encoding='utf-8') as f:
                musicxml_content = f.read()
            
            patches = self.parse_musicxml(musicxml_content)
            
            # Konvertiere zu JSON-kompatiblen Dicts
            patch_dicts = []
            for patch in patches:
                patch_dict = {
                    "name": patch.name,
                    "algorithm": patch.algorithm,
                    "feedback": patch.feedback,
                    "lfo_speed": patch.lfo_speed,
                    "lfo_delay": patch.lfo_delay,
                    "lfo_pitch_mod": patch.lfo_pitch_mod,
                    "lfo_amp_mod": patch.lfo_amp_mod,
                    "lfo_sync": patch.lfo_sync,
                    "lfo_wave": patch.lfo_wave,
                    "pitch_mod_sens": patch.pitch_mod_sens,
                    "amp_mod_sens": patch.amp_mod_sens,
                    "transpose": patch.transpose,
                    "poly_mode": patch.poly_mode,
                    "pitch_bend_range": patch.pitch_bend_range,
                    "portamento_mode": patch.portamento_mode,
                    "portamento_time": patch.portamento_time,
                    "operators": patch.operators
                }
                patch_dicts.append(patch_dict)
            
            return patch_dicts
            
        except Exception as e:
            print(f"Fehler beim Konvertieren von MusicXML: {e}")
            return []

def main():
    """Hauptfunktion für Kommandozeilen-Aufruf"""
    parser = argparse.ArgumentParser(description='MusicXML zu Dexed-Patches Konverter')
    parser.add_argument('--input', '-i', required=True, help='Eingabe-MusicXML-Datei')
    parser.add_argument('--output', '-o', required=True, help='Ausgabe-JSON-Datei für Patches')
    parser.add_argument('--verbose', '-v', action='store_true', help='Ausführliche Ausgabe')
    
    args = parser.parse_args()
    
    # Erstelle Konverter
    converter = MusicXMLToDexed()
    
    # Konvertiere MusicXML zu Patches
    patches = converter.convert_musicxml_to_dexed_patches(args.input)
    
    if args.verbose:
        print(f"✅ {len(patches)} Dexed-Patches erstellt:")
        for i, patch in enumerate(patches):
            print(f"  {i+1}. {patch['name']} (Algorithm {patch['algorithm']})")
    
    # Speichere Patches als JSON
    with open(args.output, "w") as f:
        json.dump(patches, f, indent=2)
    
    if args.verbose:
        print(f"✅ Patches gespeichert in {args.output}")
    
    # Exit-Code basierend auf Erfolg
    sys.exit(0 if patches else 1)

if __name__ == "__main__":
    main() 