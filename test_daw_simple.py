#!/usr/bin/env python3
"""
Einfacher Test für die DAW-Komponenten
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import logging
logging.basicConfig(level=logging.INFO)

def test_daw_core():
    """Testet die DAW Core Funktionalität"""
    print("=== Testing DAW Core ===")
    
    try:
        from daw.core import HeadlessDaw
        
        # DAW erstellen
        daw = HeadlessDaw()
        print("✅ DAW Core erfolgreich initialisiert")
        
        # Projekt erstellen
        project_id = daw.create_project("Test Projekt", bpm=120.0)
        print(f"✅ Projekt erstellt: {project_id}")
        
        # Projekt laden
        success = daw.load_project(project_id)
        print(f"✅ Projekt geladen: {success}")
        
        # Track hinzufügen
        track_id = daw.add_track("Test Track", "midi")
        print(f"✅ Track hinzugefügt: {track_id}")
        
        print("✅ DAW Core Test erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ DAW Core Test fehlgeschlagen: {e}")
        return False

def test_midi_engine():
    """Testet die MIDI Engine"""
    print("\n=== Testing MIDI Engine ===")
    
    try:
        from midi.engine import MidiEngine
        
        # MIDI Engine erstellen
        midi_engine = MidiEngine(bpm=120.0)
        print("✅ MIDI Engine erfolgreich initialisiert")
        
        # Track erstellen
        track_id = midi_engine.create_track("Test MIDI Track")
        print(f"✅ MIDI Track erstellt: {track_id}")
        
        # Note hinzufügen
        success = midi_engine.add_note(track_id, 60, 64, 0.0, 1.0)
        print(f"✅ Note hinzugefügt: {success}")
        
        print("✅ MIDI Engine Test erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ MIDI Engine Test fehlgeschlagen: {e}")
        return False

def test_audio_engine():
    """Testet die Audio Engine"""
    print("\n=== Testing Audio Engine ===")
    
    try:
        from audio.engine import AudioEngine
        
        # Audio Engine erstellen
        audio_engine = AudioEngine()
        print("✅ Audio Engine erfolgreich initialisiert")
        
        # Sine Wave generieren
        sine_wave = audio_engine.generate_sine_wave(440.0, 1.0)
        print(f"✅ Sine Wave generiert: {sine_wave.shape}")
        
        print("✅ Audio Engine Test erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ Audio Engine Test fehlgeschlagen: {e}")
        return False

def test_mcp_server():
    """Testet den MCP Server"""
    print("\n=== Testing MCP Server ===")
    
    try:
        from mcp.server import MCPServer
        
        # MCP Server erstellen
        mcp_server = MCPServer()
        print("✅ MCP Server erfolgreich initialisiert")
        
        # Tools auflisten
        tools = mcp_server.get_tools()
        print(f"✅ Tools verfügbar: {len(tools)}")
        
        print("✅ MCP Server Test erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ MCP Server Test fehlgeschlagen: {e}")
        return False

def main():
    """Hauptfunktion für alle Tests"""
    print("🚀 Starte Open DAW MCP Tests...\n")
    
    tests = [
        test_daw_core,
        test_midi_engine,
        test_audio_engine,
        test_mcp_server
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test fehlgeschlagen: {e}")
            results.append(False)
    
    # Zusammenfassung
    print("\n" + "="*50)
    print("📊 TEST ZUSAMMENFASSUNG")
    print("="*50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Bestanden: {passed}/{total}")
    print(f"❌ Fehlgeschlagen: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 Alle Tests erfolgreich!")
        return True
    else:
        print("⚠️  Einige Tests fehlgeschlagen")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 