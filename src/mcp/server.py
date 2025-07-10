#!/usr/bin/env python3
"""
Open DAW MCP - Model Context Protocol Server

MCP Server für KI-Integration mit der Headless-DAW.
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# DAW Integration
from ..daw.core import get_daw, HeadlessDaw
from ..llm.ionos_bridge import get_ionos_bridge, SongRequest, SongResponse

logger = logging.getLogger(__name__)

class ToolType(Enum):
    """MCP Tool Typen"""
    CREATE_SONG = "create_song"
    LIST_SONGS = "list_songs"
    GET_SONG = "get_song"
    DELETE_SONG = "delete_song"
    LIST_STYLES = "list_styles"
    EXPORT_AUDIO = "export_audio"
    EXPORT_MIDI = "export_midi"

@dataclass
class MCPTool:
    """MCP Tool Definition"""
    name: str
    description: str
    input_schema: Dict
    output_schema: Dict

class MCPServer:
    """
    MCP Server für die Headless-DAW
    
    Verantwortlich für:
    - MCP Protocol Implementation
    - Tool Registration und Management
    - DAW Integration
    - LLM Bridge Integration
    """
    
    def __init__(self):
        self.daw: HeadlessDaw = get_daw()
        self.ionos_bridge = get_ionos_bridge()
        self.tools: Dict[str, MCPTool] = {}
        self.songs: Dict[str, Dict] = {}
        
        # Tool Registration
        self._register_tools()
        
        logger.info("MCP Server initialisiert")
    
    def _register_tools(self):
        """Registriert alle verfügbaren Tools"""
        tools = [
            MCPTool(
                name="create_song_from_description",
                description="Erstellt einen Song aus einer natürlichen Sprachbeschreibung",
                input_schema={
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "Beschreibung des gewünschten Songs"
                        },
                        "style": {
                            "type": "string",
                            "description": "Musikstil (optional)",
                            "enum": ["tame_impala", "ambient", "techno", "house", "trance", "drum_and_bass"]
                        },
                        "artist_reference": {
                            "type": "string",
                            "description": "Artist-Referenz (optional)"
                        },
                        "duration": {
                            "type": "number",
                            "description": "Dauer in Sekunden (optional)"
                        },
                        "bpm": {
                            "type": "number",
                            "description": "BPM (optional)"
                        },
                        "key": {
                            "type": "string",
                            "description": "Tonart (optional)"
                        }
                    },
                    "required": ["description"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "song_id": {"type": "string"},
                        "description": {"type": "string"},
                        "style": {"type": "string"},
                        "duration": {"type": "number"},
                        "bpm": {"type": "number"},
                        "key": {"type": "string"}
                    }
                }
            ),
            MCPTool(
                name="list_available_tools",
                description="Listet alle verfügbaren Tools auf",
                input_schema={
                    "type": "object",
                    "properties": {}
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "tools": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            ),
            MCPTool(
                name="list_music_styles",
                description="Listet alle unterstützten Musikstile auf",
                input_schema={
                    "type": "object",
                    "properties": {}
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "styles": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "characteristics": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            ),
            MCPTool(
                name="list_songs",
                description="Listet alle erstellten Songs auf",
                input_schema={
                    "type": "object",
                    "properties": {}
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "songs": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "style": {"type": "string"},
                                    "created_at": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            ),
            MCPTool(
                name="get_song",
                description="Holt Details eines spezifischen Songs",
                input_schema={
                    "type": "object",
                    "properties": {
                        "song_id": {
                            "type": "string",
                            "description": "ID des Songs"
                        }
                    },
                    "required": ["song_id"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "song": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "style": {"type": "string"},
                                "duration": {"type": "number"},
                                "bpm": {"type": "number"},
                                "key": {"type": "string"},
                                "tracks": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {"type": "string"},
                                            "channel": {"type": "number"},
                                            "instrument": {"type": "number"},
                                            "note_count": {"type": "number"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ),
            MCPTool(
                name="delete_song",
                description="Löscht einen Song und seine Dateien",
                input_schema={
                    "type": "object",
                    "properties": {
                        "song_id": {
                            "type": "string",
                            "description": "ID des Songs"
                        }
                    },
                    "required": ["song_id"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "message": {"type": "string"}
                    }
                }
            ),
            MCPTool(
                name="export_audio",
                description="Exportiert einen Song als Audio-Datei",
                input_schema={
                    "type": "object",
                    "properties": {
                        "song_id": {
                            "type": "string",
                            "description": "ID des Songs"
                        },
                        "format": {
                            "type": "string",
                            "description": "Audio-Format",
                            "enum": ["wav", "mp3", "flac"],
                            "default": "wav"
                        },
                        "duration": {
                            "type": "number",
                            "description": "Dauer in Sekunden",
                            "default": 30.0
                        }
                    },
                    "required": ["song_id"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "audio_file": {"type": "string"},
                        "duration": {"type": "number"}
                    }
                }
            ),
            MCPTool(
                name="export_midi",
                description="Exportiert einen Song als MIDI-Datei",
                input_schema={
                    "type": "object",
                    "properties": {
                        "song_id": {
                            "type": "string",
                            "description": "ID des Songs"
                        }
                    },
                    "required": ["song_id"]
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "midi_file": {"type": "string"}
                    }
                }
            )
        ]
        
        for tool in tools:
            self.tools[tool.name] = tool
        
        logger.info(f"{len(tools)} Tools registriert")
    
    # Tool Execution
    async def execute_tool(self, tool_name: str, parameters: Dict) -> Dict:
        """Führt ein Tool aus"""
        if tool_name not in self.tools:
            return {
                "success": False,
                "error": f"Tool nicht gefunden: {tool_name}"
            }
        
        try:
            if tool_name == "create_song_from_description":
                return await self._create_song_from_description(parameters)
            elif tool_name == "list_available_tools":
                return self._list_available_tools(parameters)
            elif tool_name == "list_music_styles":
                return self._list_music_styles(parameters)
            elif tool_name == "list_songs":
                return self._list_songs(parameters)
            elif tool_name == "get_song":
                return self._get_song(parameters)
            elif tool_name == "delete_song":
                return self._delete_song(parameters)
            elif tool_name == "export_audio":
                return await self._export_audio(parameters)
            elif tool_name == "export_midi":
                return await self._export_midi(parameters)
            else:
                return {
                    "success": False,
                    "error": f"Tool nicht implementiert: {tool_name}"
                }
                
        except Exception as e:
            logger.error(f"Tool Execution fehlgeschlagen: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Tool Implementations
    async def _create_song_from_description(self, parameters: Dict) -> Dict:
        """Erstellt einen Song aus einer Beschreibung"""
        try:
            # SongRequest erstellen
            request = SongRequest(
                description=parameters["description"],
                style=parameters.get("style"),
                artist_reference=parameters.get("artist_reference"),
                duration=parameters.get("duration"),
                bpm=parameters.get("bpm"),
                key=parameters.get("key")
            )
            
            # Beschreibung verbessern
            request = self.ionos_bridge.enhance_description(request)
            
            # Song erstellen
            response = await self.ionos_bridge.create_song_from_description(request)
            
            if response.success:
                # Song in DAW laden
                song_id = response.song_id
                self.songs[song_id] = {
                    "id": song_id,
                    "description": request.description,
                    "style": request.style,
                    "duration": request.duration or 30.0,
                    "bpm": request.bpm,
                    "key": request.key,
                    "midi_data": response.midi_data,
                    "created_at": time.time()
                }
                
                # MIDI-Daten in DAW laden
                await self._load_midi_to_daw(song_id, response.midi_data)
                
                return {
                    "success": True,
                    "song_id": song_id,
                    "description": request.description,
                    "style": request.style,
                    "duration": request.duration or 30.0,
                    "bpm": request.bpm,
                    "key": request.key
                }
            else:
                return {
                    "success": False,
                    "error": response.error_message
                }
                
        except Exception as e:
            logger.error(f"Song-Erstellung fehlgeschlagen: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _load_midi_to_daw(self, song_id: str, midi_data: Dict):
        """Lädt MIDI-Daten in die DAW"""
        try:
            # Projekt erstellen
            project_id = self.daw.create_project(f"Song_{song_id}", midi_data.get("bpm", 120))
            self.daw.load_project(project_id)
            
            # Tracks erstellen
            for i, track_data in enumerate(midi_data["tracks"]):
                track_id = self.daw.add_track(track_data["name"], "midi")
                
                # Instrument setzen
                if track_data.get("instrument"):
                    self.daw.midi_engine.add_program_change(track_id, track_data["instrument"], 0.0)
                
                # Noten hinzufügen
                for note in track_data["notes"]:
                    self.daw.midi_engine.add_note(
                        track_id,
                        note["note"],
                        note["velocity"],
                        note["start_time"],
                        note["duration"]
                    )
            
            logger.info(f"MIDI-Daten in DAW geladen: {song_id}")
            
        except Exception as e:
            logger.error(f"MIDI-DAW Loading fehlgeschlagen: {e}")
    
    def _list_available_tools(self, parameters: Dict) -> Dict:
        """Listet verfügbare Tools"""
        tools = []
        for tool_name, tool in self.tools.items():
            tools.append({
                "name": tool_name,
                "description": tool.description
            })
        
        return {
            "tools": tools
        }
    
    def _list_music_styles(self, parameters: Dict) -> Dict:
        """Listet Musikstile"""
        styles = []
        for style_name, template in self.ionos_bridge.song_templates.items():
            styles.append({
                "name": style_name,
                "description": template["description"],
                "characteristics": template["characteristics"]
            })
        
        return {
            "styles": styles
        }
    
    def _list_songs(self, parameters: Dict) -> Dict:
        """Listet Songs"""
        songs = []
        for song_id, song_data in self.songs.items():
            songs.append({
                "id": song_id,
                "name": f"Song_{song_id}",
                "description": song_data["description"],
                "style": song_data["style"],
                "created_at": song_data["created_at"]
            })
        
        return {
            "songs": songs
        }
    
    def _get_song(self, parameters: Dict) -> Dict:
        """Holt Song-Details"""
        song_id = parameters["song_id"]
        
        if song_id not in self.songs:
            return {
                "success": False,
                "error": f"Song nicht gefunden: {song_id}"
            }
        
        song_data = self.songs[song_id]
        midi_data = song_data.get("midi_data", {})
        
        tracks = []
        for track_data in midi_data.get("tracks", []):
            tracks.append({
                "name": track_data["name"],
                "channel": track_data.get("channel", 0),
                "instrument": track_data.get("instrument", 0),
                "note_count": len(track_data.get("notes", []))
            })
        
        return {
            "song": {
                "id": song_id,
                "name": f"Song_{song_id}",
                "description": song_data["description"],
                "style": song_data["style"],
                "duration": song_data["duration"],
                "bpm": song_data["bpm"],
                "key": song_data["key"],
                "tracks": tracks
            }
        }
    
    def _delete_song(self, parameters: Dict) -> Dict:
        """Löscht einen Song"""
        song_id = parameters["song_id"]
        
        if song_id not in self.songs:
            return {
                "success": False,
                "error": f"Song nicht gefunden: {song_id}"
            }
        
        # Song-Daten löschen
        del self.songs[song_id]
        
        # Audio/MIDI-Dateien löschen
        import os
        audio_file = f"output/{song_id}.wav"
        midi_file = f"output/{song_id}.mid"
        
        if os.path.exists(audio_file):
            os.remove(audio_file)
        if os.path.exists(midi_file):
            os.remove(midi_file)
        
        return {
            "success": True,
            "message": f"Song gelöscht: {song_id}"
        }
    
    async def _export_audio(self, parameters: Dict) -> Dict:
        """Exportiert Audio"""
        song_id = parameters["song_id"]
        format = parameters.get("format", "wav")
        duration = parameters.get("duration", 30.0)
        
        if song_id not in self.songs:
            return {
                "success": False,
                "error": f"Song nicht gefunden: {song_id}"
            }
        
        try:
            # Audio exportieren
            filename = f"output/{song_id}.{format}"
            success = self.daw.export_audio(filename, duration)
            
            if success:
                return {
                    "success": True,
                    "audio_file": filename,
                    "duration": duration
                }
            else:
                return {
                    "success": False,
                    "error": "Audio-Export fehlgeschlagen"
                }
                
        except Exception as e:
            logger.error(f"Audio-Export fehlgeschlagen: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _export_midi(self, parameters: Dict) -> Dict:
        """Exportiert MIDI"""
        song_id = parameters["song_id"]
        
        if song_id not in self.songs:
            return {
                "success": False,
                "error": f"Song nicht gefunden: {song_id}"
            }
        
        try:
            # MIDI exportieren
            filename = f"output/{song_id}.mid"
            success = self.daw.export_midi(filename)
            
            if success:
                return {
                    "success": True,
                    "midi_file": filename
                }
            else:
                return {
                    "success": False,
                    "error": "MIDI-Export fehlgeschlagen"
                }
                
        except Exception as e:
            logger.error(f"MIDI-Export fehlgeschlagen: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # MCP Protocol Methods
    def get_tools(self) -> List[Dict]:
        """Gibt alle Tools zurück"""
        tools = []
        for tool_name, tool in self.tools.items():
            tools.append({
                "name": tool_name,
                "description": tool.description,
                "inputSchema": tool.input_schema,
                "outputSchema": tool.output_schema
            })
        return tools
    
    def get_tool(self, tool_name: str) -> Optional[Dict]:
        """Gibt ein spezifisches Tool zurück"""
        if tool_name in self.tools:
            tool = self.tools[tool_name]
            return {
                "name": tool_name,
                "description": tool.description,
                "inputSchema": tool.input_schema,
                "outputSchema": tool.output_schema
            }
        return None
    
    # Cleanup
    def shutdown(self):
        """Beendet den MCP Server sauber"""
        self.daw.shutdown()
        logger.info("MCP Server heruntergefahren")

# Global MCP Server Instance
mcp_server_instance = None

def get_mcp_server() -> MCPServer:
    """Gibt die globale MCP Server Instanz zurück"""
    global mcp_server_instance
    if mcp_server_instance is None:
        mcp_server_instance = MCPServer()
    return mcp_server_instance

if __name__ == "__main__":
    # Test des MCP Servers
    async def test_mcp_server():
        server = get_mcp_server()
        
        # Tools auflisten
        tools_result = server._list_available_tools({})
        print(f"Verfügbare Tools: {len(tools_result['tools'])}")
        
        # Stile auflisten
        styles_result = server._list_music_styles({})
        print(f"Verfügbare Stile: {len(styles_result['styles'])}")
        
        # Song erstellen
        song_result = await server._create_song_from_description({
            "description": "Erstelle einen psychedelischen Song im Stil von Tame Impala",
            "style": "tame_impala",
            "duration": 30.0
        })
        
        if song_result["success"]:
            print(f"Song erstellt: {song_result['song_id']}")
        else:
            print(f"Fehler: {song_result['error']}")
        
        # Cleanup
        server.shutdown()
    
    # Test ausführen
    asyncio.run(test_mcp_server()) 