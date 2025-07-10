#!/usr/bin/env python3
"""
Tests für die MIDI Engine
"""

import unittest
import tempfile
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from midi.engine import MIDIEngine


class TestMIDIEngine(unittest.TestCase):
    """Tests für die MIDI Engine"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.midi_engine = MIDIEngine()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_midi_engine_initialization(self):
        """Test MIDI Engine-Initialisierung"""
        self.assertIsNotNone(self.midi_engine)
        self.assertIsInstance(self.midi_engine, MIDIEngine)
        
    def test_midi_note_creation(self):
        """Test MIDI-Note-Erstellung"""
        # Test einzelne Note
        note = self.midi_engine.create_note(60, velocity=100, duration=1.0)
        self.assertIsNotNone(note)
        self.assertEqual(note.note, 60)  # C4
        self.assertEqual(note.velocity, 100)
        self.assertEqual(note.duration, 1.0)
        
    def test_midi_chord_creation(self):
        """Test MIDI-Akkord-Erstellung"""
        # Test C-Dur Akkord
        chord_notes = [60, 64, 67]  # C, E, G
        chord = self.midi_engine.create_chord(chord_notes, velocity=80, duration=2.0)
        self.assertIsNotNone(chord)
        self.assertEqual(len(chord.notes), 3)
        
    def test_midi_scale_generation(self):
        """Test MIDI-Skalen-Generierung"""
        # Test C-Dur Skala
        scale = self.midi_engine.generate_scale(root=60, scale_type="major")
        self.assertIsInstance(scale, list)
        self.assertEqual(len(scale), 8)  # Oktave
        self.assertEqual(scale[0], 60)  # C
        self.assertEqual(scale[7], 72)  # C eine Oktave höher
        
    def test_midi_sequence_creation(self):
        """Test MIDI-Sequenz-Erstellung"""
        # Test einfache Sequenz
        notes = [60, 62, 64, 65]  # C, D, E, F
        sequence = self.midi_engine.create_sequence(notes, velocity=90, note_duration=0.5)
        self.assertIsNotNone(sequence)
        self.assertEqual(len(sequence.notes), 4)
        
    def test_mpe_support(self):
        """Test MPE (MIDI Polyphonic Expression) Support"""
        # Test MPE-Note mit Expression
        mpe_note = self.midi_engine.create_mpe_note(
            note=60,
            velocity=100,
            pressure=64,
            timbre=32,
            pitch_bend=8192  # Center
        )
        self.assertIsNotNone(mpe_note)
        self.assertEqual(mpe_note.pressure, 64)
        self.assertEqual(mpe_note.timbre, 32)
        
    def test_midi_file_export(self):
        """Test MIDI-Datei-Export"""
        # Test MIDI-Datei erstellen
        notes = [60, 62, 64, 65, 67, 69, 71, 72]  # C-Dur Skala
        sequence = self.midi_engine.create_sequence(notes, velocity=80, note_duration=0.5)
        
        output_path = os.path.join(self.temp_dir, "test_sequence.mid")
        success = self.midi_engine.export_midi(sequence, output_path)
        self.assertIsInstance(success, bool)
        
        # Prüfen ob Datei existiert
        if success:
            self.assertTrue(os.path.exists(output_path))
            
    def test_midi_file_import(self):
        """Test MIDI-Datei-Import"""
        # Erst MIDI-Datei erstellen
        notes = [60, 62, 64, 65]
        sequence = self.midi_engine.create_sequence(notes, velocity=80, note_duration=0.5)
        
        midi_path = os.path.join(self.temp_dir, "test_import.mid")
        self.midi_engine.export_midi(sequence, midi_path)
        
        # Dann importieren
        imported_sequence = self.midi_engine.import_midi(midi_path)
        self.assertIsNotNone(imported_sequence)
        self.assertEqual(len(imported_sequence.notes), 4)
        
    def test_midi_timing(self):
        """Test MIDI-Timing"""
        # Test BPM-Setup
        bpm = 120
        self.midi_engine.set_bpm(bpm)
        self.assertEqual(self.midi_engine.get_bpm(), bpm)
        
        # Test Takt-Setup
        time_signature = (4, 4)  # 4/4 Takt
        self.midi_engine.set_time_signature(time_signature)
        self.assertEqual(self.midi_engine.get_time_signature(), time_signature)
        
    def test_midi_quantization(self):
        """Test MIDI-Quantisierung"""
        # Test unquantisierte Sequenz
        notes = [60, 62, 64, 65]
        sequence = self.midi_engine.create_sequence(notes, velocity=80, note_duration=0.5)
        
        # Quantisieren
        quantized_sequence = self.midi_engine.quantize_sequence(sequence, grid_size=0.25)
        self.assertIsNotNone(quantized_sequence)
        
    def test_midi_transposition(self):
        """Test MIDI-Transposition"""
        # Test Sequenz transponieren
        notes = [60, 62, 64, 65]
        sequence = self.midi_engine.create_sequence(notes, velocity=80, note_duration=0.5)
        
        # Um 2 Halbtöne nach oben transponieren
        transposed_sequence = self.midi_engine.transpose_sequence(sequence, semitones=2)
        self.assertIsNotNone(transposed_sequence)
        
        # Prüfen ob transponiert
        self.assertEqual(transposed_sequence.notes[0].note, 62)  # D statt C
        
    def test_midi_velocity_mapping(self):
        """Test MIDI-Velocity-Mapping"""
        # Test Velocity-Mapping
        notes = [60, 62, 64, 65]
        sequence = self.midi_engine.create_sequence(notes, velocity=80, note_duration=0.5)
        
        # Velocity-Mapping anwenden
        mapped_sequence = self.midi_engine.apply_velocity_mapping(sequence, mapping="crescendo")
        self.assertIsNotNone(mapped_sequence)
        
    def test_midi_arpeggiator(self):
        """Test MIDI-Arpeggiator"""
        # Test Arpeggiator
        chord_notes = [60, 64, 67]  # C-Dur Akkord
        arpeggio = self.midi_engine.create_arpeggio(chord_notes, pattern="up", velocity=80)
        self.assertIsNotNone(arpeggio)
        self.assertGreater(len(arpeggio.notes), len(chord_notes))
        
    def test_midi_drum_pattern(self):
        """Test MIDI-Drum-Pattern"""
        # Test Drum-Pattern erstellen
        drum_pattern = self.midi_engine.create_drum_pattern(
            pattern="basic_rock",
            velocity=100,
            duration=4.0
        )
        self.assertIsNotNone(drum_pattern)
        self.assertGreater(len(drum_pattern.notes), 0)


if __name__ == "__main__":
    print("Testing MIDI Engine...")
    unittest.main(verbosity=2) 