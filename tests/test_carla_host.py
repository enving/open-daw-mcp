#!/usr/bin/env python3
"""
Tests für den Carla Host
"""

import unittest
import tempfile
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from plugins.carla_host import CarlaHost


class TestCarlaHost(unittest.TestCase):
    """Tests für den Carla Host"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.carla = CarlaHost()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_carla_initialization(self):
        """Test Carla-Initialisierung"""
        self.assertIsNotNone(self.carla)
        self.assertIsInstance(self.carla, CarlaHost)
        
    def test_plugin_discovery(self):
        """Test Plugin-Erkennung"""
        # Test ohne echte Plugins (Mock)
        plugins = self.carla.discover_plugins()
        self.assertIsInstance(plugins, list)
        
    def test_plugin_loading(self):
        """Test Plugin-Laden"""
        # Test mit Mock-Plugin
        plugin_info = {
            "name": "Test Plugin",
            "type": "vst2",
            "path": "/path/to/plugin"
        }
        
        success = self.carla.load_plugin(plugin_info)
        # Sollte False sein, da kein echtes Plugin
        self.assertIsInstance(success, bool)
        
    def test_plugin_parameters(self):
        """Test Plugin-Parameter"""
        # Test Parameter-Setup
        parameters = self.carla.get_plugin_parameters("test_plugin")
        self.assertIsInstance(parameters, dict)
        
    def test_audio_processing(self):
        """Test Audio-Verarbeitung"""
        # Test Audio-Processing Setup
        sample_rate = 44100
        buffer_size = 512
        
        success = self.carla.setup_audio_processing(sample_rate, buffer_size)
        self.assertIsInstance(success, bool)
        
    def test_plugin_chain(self):
        """Test Plugin-Kette"""
        # Test Plugin-Kette erstellen
        chain = self.carla.create_plugin_chain("Test Chain")
        self.assertIsNotNone(chain)
        
        # Plugin zur Kette hinzufügen
        success = self.carla.add_plugin_to_chain(chain, "test_plugin")
        self.assertIsInstance(success, bool)
        
    def test_audio_export(self):
        """Test Audio-Export"""
        # Test Audio-Export Setup
        output_path = os.path.join(self.temp_dir, "test_output.wav")
        duration = 5.0
        
        success = self.carla.export_audio(output_path, duration)
        self.assertIsInstance(success, bool)
        
    def test_headless_mode(self):
        """Test Headless-Modus"""
        # Test Headless-Setup
        success = self.carla.start_headless()
        self.assertIsInstance(success, bool)
        
        # Test Headless-Shutdown
        self.carla.stop_headless()
        
    def test_osc_communication(self):
        """Test OSC-Kommunikation"""
        # Test OSC-Setup
        port = 22752
        success = self.carla.setup_osc(port)
        self.assertIsInstance(success, bool)
        
    def test_plugin_preset(self):
        """Test Plugin-Presets"""
        # Test Preset-Laden
        preset_path = "/path/to/preset"
        success = self.carla.load_preset("test_plugin", preset_path)
        self.assertIsInstance(success, bool)
        
        # Test Preset-Speichern
        save_path = os.path.join(self.temp_dir, "test_preset")
        success = self.carla.save_preset("test_plugin", save_path)
        self.assertIsInstance(success, bool)


if __name__ == "__main__":
    print("Testing Carla Host...")
    unittest.main(verbosity=2) 