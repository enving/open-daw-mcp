#!/usr/bin/env python3
"""
Tests für die LLM Bridge
"""

import unittest
import tempfile
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from llm.ionos_bridge import IONOSBridge


class TestIONOSBridge(unittest.TestCase):
    """Tests für die IONOS Bridge"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.llm_bridge = IONOSBridge()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_llm_bridge_initialization(self):
        """Test LLM Bridge-Initialisierung"""
        self.assertIsNotNone(self.llm_bridge)
        self.assertIsInstance(self.llm_bridge, IONOSBridge)
        
    def test_api_connection(self):
        """Test API-Verbindung"""
        # Test API-Verbindung (ohne echte API)
        success = self.llm_bridge.test_connection()
        self.assertIsInstance(success, bool)
        
    def test_text_to_music_prompt(self):
        """Test Text-zu-Musik-Prompt"""
        # Test Prompt-Generierung
        description = "Erstelle einen psychedelischen Song im Stil von Tame Impala"
        prompt = self.llm_bridge.create_music_prompt(description)
        self.assertIsInstance(prompt, str)
        self.assertIn("psychedelisch", prompt.lower())
        self.assertIn("tame impala", prompt.lower())
        
    def test_style_extraction(self):
        """Test Stil-Extraktion"""
        # Test Stil aus Beschreibung extrahieren
        description = "Erstelle einen Jazz-Song mit Swing-Rhythmus"
        style = self.llm_bridge.extract_style(description)
        self.assertIsInstance(style, str)
        self.assertIn("jazz", style.lower())
        
    def test_music_structure_generation(self):
        """Test Musik-Struktur-Generierung"""
        # Test Song-Struktur generieren
        description = "Erstelle einen Pop-Song mit Intro, Vers, Chorus, Bridge"
        structure = self.llm_bridge.generate_music_structure(description)
        self.assertIsInstance(structure, dict)
        self.assertIn("sections", structure)
        
    def test_melody_generation(self):
        """Test Melodie-Generierung"""
        # Test Melodie aus Beschreibung generieren
        description = "Erstelle eine melancholische Melodie in C-Dur"
        melody = self.llm_bridge.generate_melody(description)
        self.assertIsInstance(melody, dict)
        self.assertIn("notes", melody)
        
    def test_chord_progression_generation(self):
        """Test Akkord-Progression-Generierung"""
        # Test Akkord-Progression generieren
        style = "pop"
        key = "C"
        progression = self.llm_bridge.generate_chord_progression(style, key)
        self.assertIsInstance(progression, list)
        self.assertGreater(len(progression), 0)
        
    def test_rhythm_pattern_generation(self):
        """Test Rhythmus-Pattern-Generierung"""
        # Test Rhythmus-Pattern generieren
        style = "rock"
        tempo = 120
        pattern = self.llm_bridge.generate_rhythm_pattern(style, tempo)
        self.assertIsInstance(pattern, dict)
        self.assertIn("beats", pattern)
        
    def test_complete_song_generation(self):
        """Test vollständige Song-Generierung"""
        # Test vollständigen Song generieren
        description = "Erstelle einen 3-minütigen Pop-Song"
        song_data = self.llm_bridge.generate_complete_song(description)
        self.assertIsInstance(song_data, dict)
        self.assertIn("tracks", song_data)
        self.assertIn("duration", song_data)
        
    def test_music_analysis(self):
        """Test Musik-Analyse"""
        # Test Musik-Analyse
        midi_data = [60, 62, 64, 65, 67, 69, 71, 72]  # C-Dur Skala
        analysis = self.llm_bridge.analyze_music(midi_data)
        self.assertIsInstance(analysis, dict)
        self.assertIn("key", analysis)
        self.assertIn("scale", analysis)
        
    def test_emotion_to_music_mapping(self):
        """Test Emotion-zu-Musik-Mapping"""
        # Test Emotion zu Musik mappen
        emotion = "melancholisch"
        music_params = self.llm_bridge.map_emotion_to_music(emotion)
        self.assertIsInstance(music_params, dict)
        self.assertIn("key", music_params)
        self.assertIn("tempo", music_params)
        
    def test_music_style_classification(self):
        """Test Musik-Stil-Klassifikation"""
        # Test Stil-Klassifikation
        description = "Ein elektronischer Track mit Synthesizern und Drum Machine"
        style = self.llm_bridge.classify_music_style(description)
        self.assertIsInstance(style, str)
        self.assertIn("electronic", style.lower())
        
    def test_lyrics_generation(self):
        """Test Text-Generierung"""
        # Test Text generieren
        theme = "Liebe und Verlust"
        style = "pop"
        lyrics = self.llm_bridge.generate_lyrics(theme, style)
        self.assertIsInstance(lyrics, str)
        self.assertGreater(len(lyrics), 0)
        
    def test_music_parameter_optimization(self):
        """Test Musik-Parameter-Optimierung"""
        # Test Parameter optimieren
        initial_params = {
            "tempo": 120,
            "key": "C",
            "style": "pop"
        }
        optimized_params = self.llm_bridge.optimize_music_parameters(initial_params)
        self.assertIsInstance(optimized_params, dict)
        self.assertIn("tempo", optimized_params)
        
    def test_music_variation_generation(self):
        """Test Musik-Variations-Generierung"""
        # Test Variationen generieren
        base_melody = [60, 62, 64, 65]
        variations = self.llm_bridge.generate_music_variations(base_melody, count=3)
        self.assertIsInstance(variations, list)
        self.assertEqual(len(variations), 3)
        
    def test_music_export_formats(self):
        """Test Musik-Export-Formate"""
        # Test verschiedene Export-Formate
        song_data = {
            "tracks": [],
            "duration": 180.0,
            "bpm": 120
        }
        
        # MIDI Export
        midi_data = self.llm_bridge.export_to_midi(song_data)
        self.assertIsInstance(midi_data, bytes)
        
        # JSON Export
        json_data = self.llm_bridge.export_to_json(song_data)
        self.assertIsInstance(json_data, str)
        
    def test_error_handling(self):
        """Test Fehlerbehandlung"""
        # Test mit ungültiger Beschreibung
        invalid_description = ""
        result = self.llm_bridge.create_music_prompt(invalid_description)
        self.assertIsInstance(result, str)
        
        # Test mit ungültigem Stil
        invalid_style = "ungültiger_stil"
        result = self.llm_bridge.generate_chord_progression(invalid_style, "C")
        self.assertIsInstance(result, list)


if __name__ == "__main__":
    print("Testing LLM Bridge...")
    unittest.main(verbosity=2) 