#!/usr/bin/env python3
"""
Tests für die Audio Engine
"""

import unittest
import tempfile
import os
import sys
import numpy as np
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from audio.engine import AudioEngine


class TestAudioEngine(unittest.TestCase):
    """Tests für die Audio Engine"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.audio_engine = AudioEngine()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_audio_engine_initialization(self):
        """Test Audio Engine-Initialisierung"""
        self.assertIsNotNone(self.audio_engine)
        self.assertIsInstance(self.audio_engine, AudioEngine)
        
    def test_jack_setup(self):
        """Test JACK Audio Server Setup"""
        # Test JACK-Setup
        success = self.audio_engine.setup_jack()
        self.assertIsInstance(success, bool)
        
    def test_audio_parameters(self):
        """Test Audio-Parameter"""
        # Test Parameter-Setup
        sample_rate = 44100
        buffer_size = 512
        channels = 2
        
        success = self.audio_engine.set_audio_parameters(sample_rate, buffer_size, channels)
        self.assertIsInstance(success, bool)
        
    def test_audio_generation(self):
        """Test Audio-Generierung"""
        # Test Sinus-Welle generieren
        frequency = 440.0  # A4
        duration = 1.0
        sample_rate = 44100
        
        audio_data = self.audio_engine.generate_sine_wave(frequency, duration, sample_rate)
        self.assertIsInstance(audio_data, np.ndarray)
        self.assertEqual(len(audio_data), int(duration * sample_rate))
        
    def test_audio_mixing(self):
        """Test Audio-Mixing"""
        # Test Audio-Mixing
        audio1 = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 44100))
        audio2 = np.sin(2 * np.pi * 880 * np.linspace(0, 1, 44100))
        
        mixed_audio = self.audio_engine.mix_audio([audio1, audio2])
        self.assertIsInstance(mixed_audio, np.ndarray)
        self.assertEqual(len(mixed_audio), len(audio1))
        
    def test_audio_effects(self):
        """Test Audio-Effekte"""
        # Test Reverb
        audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 44100))
        reverb_audio = self.audio_engine.apply_reverb(audio, room_size=0.5)
        self.assertIsInstance(reverb_audio, np.ndarray)
        
        # Test Delay
        delay_audio = self.audio_engine.apply_delay(audio, delay_time=0.1, feedback=0.3)
        self.assertIsInstance(delay_audio, np.ndarray)
        
        # Test Distortion
        distortion_audio = self.audio_engine.apply_distortion(audio, amount=0.5)
        self.assertIsInstance(distortion_audio, np.ndarray)
        
    def test_audio_export(self):
        """Test Audio-Export"""
        # Test WAV-Export
        audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 44100))
        output_path = os.path.join(self.temp_dir, "test_output.wav")
        
        success = self.audio_engine.export_wav(audio, output_path, sample_rate=44100)
        self.assertIsInstance(success, bool)
        
        # Prüfen ob Datei existiert
        if success:
            self.assertTrue(os.path.exists(output_path))
            
    def test_real_time_processing(self):
        """Test Real-time Audio Processing"""
        # Test Real-time Setup
        success = self.audio_engine.start_real_time_processing()
        self.assertIsInstance(success, bool)
        
        # Test Real-time Shutdown
        self.audio_engine.stop_real_time_processing()
        
    def test_audio_analysis(self):
        """Test Audio-Analyse"""
        # Test Frequenz-Analyse
        audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 44100))
        frequencies = self.audio_engine.analyze_frequencies(audio, sample_rate=44100)
        self.assertIsInstance(frequencies, np.ndarray)
        
        # Test Spektral-Analyse
        spectrum = self.audio_engine.get_spectrum(audio)
        self.assertIsInstance(spectrum, np.ndarray)
        
    def test_audio_conversion(self):
        """Test Audio-Konvertierung"""
        # Test MIDI zu Audio
        midi_notes = [60, 62, 64, 65, 67, 69, 71, 72]  # C-Dur Skala
        audio = self.audio_engine.midi_to_audio(midi_notes, duration=0.5)
        self.assertIsInstance(audio, np.ndarray)
        
    def test_audio_normalization(self):
        """Test Audio-Normalisierung"""
        # Test Audio normalisieren
        audio = np.random.rand(44100) * 0.5
        normalized_audio = self.audio_engine.normalize_audio(audio)
        self.assertIsInstance(normalized_audio, np.ndarray)
        
        # Prüfen ob normalisiert
        max_amplitude = np.max(np.abs(normalized_audio))
        self.assertLessEqual(max_amplitude, 1.0)


if __name__ == "__main__":
    print("Testing Audio Engine...")
    unittest.main(verbosity=2) 