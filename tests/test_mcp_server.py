#!/usr/bin/env python3
"""
Tests für den MCP Server
"""

import unittest
import tempfile
import os
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from mcp.server import MCPServer


class TestMCPServer(unittest.TestCase):
    """Tests für den MCP Server"""
    
    def setUp(self):
        """Setup für jeden Test"""
        self.temp_dir = tempfile.mkdtemp()
        self.mcp_server = MCPServer()
        
    def tearDown(self):
        """Cleanup nach jedem Test"""
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_mcp_server_initialization(self):
        """Test MCP Server-Initialisierung"""
        self.assertIsNotNone(self.mcp_server)
        self.assertIsInstance(self.mcp_server, MCPServer)
        
    def test_tool_registration(self):
        """Test Tool-Registrierung"""
        # Test Tool registrieren
        tool_name = "create_song_from_description"
        success = self.mcp_server.register_tool(tool_name)
        self.assertIsInstance(success, bool)
        
        # Prüfen ob Tool registriert ist
        tools = self.mcp_server.get_registered_tools()
        self.assertIn(tool_name, tools)
        
    def test_tool_execution(self):
        """Test Tool-Ausführung"""
        # Test Tool ausführen
        tool_name = "create_song_from_description"
        params = {
            "description": "Erstelle einen Pop-Song",
            "duration": 30.0
        }
        
        # Async Test
        async def test_tool():
            result = await self.mcp_server.execute_tool(tool_name, params)
            return result
            
        result = asyncio.run(test_tool())
        self.assertIsInstance(result, dict)
        
    def test_song_creation_tool(self):
        """Test Song-Erstellungs-Tool"""
        # Test Song-Erstellung
        params = {
            "description": "Erstelle einen psychedelischen Song im Stil von Tame Impala",
            "style": "tame_impala",
            "duration": 30.0
        }
        
        async def test_song_creation():
            result = await self.mcp_server.create_song_from_description(params)
            return result
            
        result = asyncio.run(test_song_creation())
        self.assertIsInstance(result, dict)
        self.assertIn("song_id", result)
        
    def test_midi_generation_tool(self):
        """Test MIDI-Generierungs-Tool"""
        # Test MIDI-Generierung
        params = {
            "melody": "C D E F G A B C",
            "duration": 10.0,
            "tempo": 120
        }
        
        async def test_midi_generation():
            result = await self.mcp_server.generate_midi_from_melody(params)
            return result
            
        result = asyncio.run(test_midi_generation())
        self.assertIsInstance(result, dict)
        self.assertIn("midi_file", result)
        
    def test_audio_export_tool(self):
        """Test Audio-Export-Tool"""
        # Test Audio-Export
        params = {
            "song_id": "test_song_123",
            "format": "wav",
            "quality": "high"
        }
        
        async def test_audio_export():
            result = await self.mcp_server.export_audio(params)
            return result
            
        result = asyncio.run(test_audio_export())
        self.assertIsInstance(result, dict)
        self.assertIn("audio_file", result)
        
    def test_plugin_management_tool(self):
        """Test Plugin-Management-Tool"""
        # Test Plugin-Management
        params = {
            "action": "list_plugins",
            "plugin_type": "vst2"
        }
        
        async def test_plugin_management():
            result = await self.mcp_server.manage_plugins(params)
            return result
            
        result = asyncio.run(test_plugin_management())
        self.assertIsInstance(result, dict)
        self.assertIn("plugins", result)
        
    def test_project_management_tool(self):
        """Test Projekt-Management-Tool"""
        # Test Projekt-Management
        params = {
            "action": "create_project",
            "name": "Test Project",
            "description": "Ein Test-Projekt"
        }
        
        async def test_project_management():
            result = await self.mcp_server.manage_project(params)
            return result
            
        result = asyncio.run(test_project_management())
        self.assertIsInstance(result, dict)
        self.assertIn("project_id", result)
        
    def test_music_analysis_tool(self):
        """Test Musik-Analyse-Tool"""
        # Test Musik-Analyse
        params = {
            "audio_file": "test_audio.wav",
            "analysis_type": "spectral"
        }
        
        async def test_music_analysis():
            result = await self.mcp_server.analyze_music(params)
            return result
            
        result = asyncio.run(test_music_analysis())
        self.assertIsInstance(result, dict)
        self.assertIn("analysis", result)
        
    def test_error_handling(self):
        """Test Fehlerbehandlung"""
        # Test mit ungültigem Tool
        invalid_tool = "invalid_tool"
        params = {}
        
        async def test_error_handling():
            try:
                result = await self.mcp_server.execute_tool(invalid_tool, params)
                return result
            except Exception as e:
                return str(e)
            
        result = asyncio.run(test_error_handling())
        self.assertIsInstance(result, str)
        
    def test_parameter_validation(self):
        """Test Parameter-Validierung"""
        # Test mit ungültigen Parametern
        tool_name = "create_song_from_description"
        invalid_params = {
            "description": "",  # Leere Beschreibung
            "duration": -1  # Ungültige Dauer
        }
        
        async def test_parameter_validation():
            try:
                result = await self.mcp_server.execute_tool(tool_name, invalid_params)
                return result
            except Exception as e:
                return str(e)
            
        result = asyncio.run(test_parameter_validation())
        self.assertIsInstance(result, str)
        
    def test_concurrent_execution(self):
        """Test gleichzeitige Ausführung"""
        # Test mehrere Tools gleichzeitig
        tools = [
            ("create_song_from_description", {"description": "Song 1", "duration": 10.0}),
            ("create_song_from_description", {"description": "Song 2", "duration": 15.0}),
            ("create_song_from_description", {"description": "Song 3", "duration": 20.0})
        ]
        
        async def test_concurrent_execution():
            tasks = []
            for tool_name, params in tools:
                task = self.mcp_server.execute_tool(tool_name, params)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return results
            
        results = asyncio.run(test_concurrent_execution())
        self.assertEqual(len(results), 3)
        
    def test_server_startup(self):
        """Test Server-Startup"""
        # Test Server starten
        success = self.mcp_server.start()
        self.assertIsInstance(success, bool)
        
        # Test Server stoppen
        self.mcp_server.stop()
        
    def test_websocket_communication(self):
        """Test WebSocket-Kommunikation"""
        # Test WebSocket-Setup
        port = 8080
        success = self.mcp_server.setup_websocket(port)
        self.assertIsInstance(success, bool)
        
    def test_api_endpoints(self):
        """Test API-Endpoints"""
        # Test Endpoint-Registrierung
        endpoints = self.mcp_server.get_api_endpoints()
        self.assertIsInstance(endpoints, list)
        self.assertGreater(len(endpoints), 0)
        
    def test_logging(self):
        """Test Logging"""
        # Test Logging-Setup
        log_level = "INFO"
        success = self.mcp_server.setup_logging(log_level)
        self.assertIsInstance(success, bool)
        
        # Test Log-Nachricht
        message = "Test log message"
        self.mcp_server.log(message, "INFO")
        
    def test_metrics_collection(self):
        """Test Metriken-Sammlung"""
        # Test Metriken sammeln
        metrics = self.mcp_server.collect_metrics()
        self.assertIsInstance(metrics, dict)
        self.assertIn("tools_executed", metrics)
        self.assertIn("execution_time", metrics)


if __name__ == "__main__":
    print("Testing MCP Server...")
    unittest.main(verbosity=2) 