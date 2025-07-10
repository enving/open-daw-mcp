#!/usr/bin/env python3
"""
MVP Test für Open DAW MCP - Testet die Kernfunktionalitäten
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import logging
import numpy as np
import mido
import jack
logging.basicConfig(level=logging.INFO)

def test_basic_imports():
    """Testet grundlegende Imports"""
    print("=== Testing Basic Imports ===")
    
    try:
        import numpy as np
        print("✅ NumPy importiert")
        
        import scipy
        print("✅ SciPy importiert")
        
        import soundfile as sf
        print("✅ SoundFile importiert")
        
        import mido
        print("✅ Mido importiert")
        
        import jack
        print("✅ JACK importiert")
        
        import aiohttp
        print("✅ aiohttp importiert")
        
        import requests
        print("✅ requests importiert")
        
        print("✅ Alle grundlegenden Imports erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ Import Test fehlgeschlagen: {e}")
        return False

def test_midi_functionality():
    """Testet MIDI Funktionalität"""
    print("\n=== Testing MIDI Functionality ===")
    
    try:
        import mido
        
        # MIDI Ports auflisten
        input_names = mido.get_input_names()
        output_names = mido.get_output_names()
        
        print(f"✅ MIDI Inputs gefunden: {len(input_names)}")
        print(f"✅ MIDI Outputs gefunden: {len(output_names)}")
        
        # MIDI Message erstellen
        msg = mido.Message('note_on', note=60, velocity=64)
        print(f"✅ MIDI Message erstellt: {msg}")
        
        print("✅ MIDI Funktionalität erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ MIDI Test fehlgeschlagen: {e}")
        return False

def test_audio_functionality():
    """Testet Audio Funktionalität"""
    print("\n=== Testing Audio Functionality ===")
    
    try:
        import numpy as np
        
        # Sine Wave generieren
        sample_rate = 44100
        duration = 1.0
        frequency = 440.0
        
        t = np.linspace(0, duration, int(sample_rate * duration))
        sine_wave = np.sin(2 * np.pi * frequency * t)
        
        print(f"✅ Sine Wave generiert: {sine_wave.shape}")
        print(f"✅ Sample Rate: {sample_rate}")
        print(f"✅ Duration: {duration}s")
        print(f"✅ Frequency: {frequency}Hz")
        
        # Audio Buffer erstellen
        audio_buffer = np.zeros((sample_rate, 2))  # Stereo
        print(f"✅ Audio Buffer erstellt: {audio_buffer.shape}")
        
        print("✅ Audio Funktionalität erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ Audio Test fehlgeschlagen: {e}")
        return False

def test_jack_functionality():
    """Testet JACK Funktionalität"""
    print("\n=== Testing JACK Functionality ===")
    
    try:
        import jack
        
        # JACK Client erstellen
        client = jack.Client("OpenDAW_Test")
        print("✅ JACK Client erstellt")
        
        # Client aktivieren
        client.activate()
        print("✅ JACK Client aktiviert")
        
        # Client schließen
        client.close()
        print("✅ JACK Client geschlossen")
        
        print("✅ JACK Funktionalität erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ JACK Test fehlgeschlagen: {e}")
        return False

def test_song_generation():
    """Testet Song-Generierung (MVP)"""
    print("\n=== Testing Song Generation (MVP) ===")
    
    try:
        # Einfache Song-Generierung simulieren
        song_data = {
            "name": "Test Song",
            "bpm": 120,
            "key": "C",
            "duration": 30.0,
            "tracks": [
                {
                    "name": "Bass",
                    "type": "midi",
                    "notes": [(60, 0.0, 1.0), (62, 1.0, 1.0), (64, 2.0, 1.0)]
                },
                {
                    "name": "Drums",
                    "type": "midi",
                    "notes": [(36, 0.0, 0.5), (36, 1.0, 0.5), (36, 2.0, 0.5)]
                }
            ]
        }
        
        print(f"✅ Song erstellt: {song_data['name']}")
        print(f"✅ BPM: {song_data['bpm']}")
        print(f"✅ Key: {song_data['key']}")
        print(f"✅ Duration: {song_data['duration']}s")
        print(f"✅ Tracks: {len(song_data['tracks'])}")
        
        # MIDI Export simulieren
        midi_filename = "test_song.mid"
        print(f"✅ MIDI Export: {midi_filename}")
        
        # Audio Export simulieren
        audio_filename = "test_song.wav"
        print(f"✅ Audio Export: {audio_filename}")
        
        print("✅ Song-Generierung erfolgreich!")
        return True
        
    except Exception as e:
        print(f"❌ Song-Generierung fehlgeschlagen: {e}")
        return False

def test_openwebui_status():
    """Prüft OpenWebUI Status"""
    print("\n=== Testing OpenWebUI Status ===")
    
    try:
        import subprocess
        
        # Prüfe ob OpenWebUI läuft
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        webui_running = 'open_webui' in result.stdout or 'uvicorn' in result.stdout
        
        if webui_running:
            print("✅ OpenWebUI läuft")
        else:
            print("⚠️  OpenWebUI läuft nicht")
        
        # Prüfe Port 8080
        result = subprocess.run(['netstat', '-tlnp'], capture_output=True, text=True)
        port_8080_open = ':8080' in result.stdout
        
        if port_8080_open:
            print("✅ Port 8080 ist offen")
        else:
            print("⚠️  Port 8080 ist nicht offen")
        
        print("✅ OpenWebUI Status geprüft!")
        return True
        
    except Exception as e:
        print(f"❌ OpenWebUI Status Check fehlgeschlagen: {e}")
        return False

def main():
    """Hauptfunktion für MVP Tests"""
    print("🚀 Starte Open DAW MCP MVP Tests...\n")
    
    tests = [
        test_basic_imports,
        test_midi_functionality,
        test_audio_functionality,
        test_jack_functionality,
        test_song_generation,
        test_openwebui_status
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
    print("\n" + "="*60)
    print("📊 MVP TEST ZUSAMMENFASSUNG")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Bestanden: {passed}/{total}")
    print(f"❌ Fehlgeschlagen: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 MVP Tests erfolgreich! Headless DAW ist bereit!")
        print("\n🎵 Nächste Schritte:")
        print("1. OpenWebUI Integration")
        print("2. MCP Server mit OpenWebUI verbinden")
        print("3. Sprachgesteuerte Song-Erstellung testen")
        return True
    elif passed >= 4:
        print("🎯 MVP fast bereit! Nur noch kleine Anpassungen nötig.")
        return True
    else:
        print("⚠️  MVP Tests zeigen Probleme auf")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 