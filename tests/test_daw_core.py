#!/usr/bin/env python3
"""
Tests für den DAW Core
"""

import unittest
import tempfile
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from daw.core import DAWCore, Project, Track


class TestDAWCore(unittest.TestCase):
    """Tests für den DAW Core"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.daw = DAWCore()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_project_creation(self):
        """Test Projekt-Erstellung"""
        project = self.daw.create_project("Test Project")
        self.assertIsInstance(project, Project)
        self.assertEqual(project.name, "Test Project")
        
    def test_track_creation(self):
        """Test Track-Erstellung"""
        project = self.daw.create_project("Test Project")
        track = project.add_track("Test Track", "midi")
        self.assertIsInstance(track, Track)
        self.assertEqual(track.name, "Test Track")
        self.assertEqual(track.type, "midi")
        
    def test_project_save_load(self):
        """Test Projekt-Speichern und Laden"""
        project = self.daw.create_project("Test Project")
        track = project.add_track("Test Track", "midi")
        
        # Projekt speichern
        project_path = os.path.join(self.temp_dir, "test_project.json")
        project.save(project_path)
        
        # Projekt laden
        loaded_project = self.daw.load_project(project_path)
        self.assertEqual(loaded_project.name, "Test Project")
        self.assertEqual(len(loaded_project.tracks), 1)
        self.assertEqual(loaded_project.tracks[0].name, "Test Track")
        
    def test_multiple_tracks(self):
        """Test mehrere Tracks"""
        project = self.daw.create_project("Multi Track Project")
        
        # Verschiedene Track-Typen hinzufügen
        midi_track = project.add_track("MIDI Track", "midi")
        audio_track = project.add_track("Audio Track", "audio")
        
        self.assertEqual(len(project.tracks), 2)
        self.assertEqual(project.tracks[0].type, "midi")
        self.assertEqual(project.tracks[1].type, "audio")


class TestProject(unittest.TestCase):
    """Tests für das Project Modul"""
    
    def test_project_initialization(self):
        """Test Projekt-Initialisierung"""
        project = Project("Test Project")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(len(project.tracks), 0)
        self.assertIsNotNone(project.created_at)
        
    def test_project_metadata(self):
        """Test Projekt-Metadaten"""
        project = Project("Test Project")
        project.set_metadata("bpm", 120)
        project.set_metadata("key", "C")
        
        self.assertEqual(project.get_metadata("bpm"), 120)
        self.assertEqual(project.get_metadata("key"), "C")


class TestTrack(unittest.TestCase):
    """Tests für das Track Modul"""
    
    def test_track_initialization(self):
        """Test Track-Initialisierung"""
        track = Track("Test Track", "midi")
        self.assertEqual(track.name, "Test Track")
        self.assertEqual(track.type, "midi")
        self.assertEqual(len(track.clips), 0)
        
    def test_track_clips(self):
        """Test Track-Clips"""
        track = Track("Test Track", "midi")
        
        # Clip hinzufügen
        clip = track.add_clip("Test Clip", 0, 4.0)
        self.assertEqual(len(track.clips), 1)
        self.assertEqual(clip.name, "Test Clip")
        self.assertEqual(clip.start_time, 0)
        self.assertEqual(clip.duration, 4.0)


if __name__ == "__main__":
    print("Testing DAW Core...")
    unittest.main(verbosity=2) 