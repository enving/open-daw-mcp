#!/usr/bin/env python3
"""
Test Script für MusicXML Parsing
"""

from src.daw.reaper import ReaperIntegration

def test_musicxml_parsing():
    """Testet das MusicXML Parsing"""
    ri = ReaperIntegration()
    tracks = ri.parse_musicxml('output/musicxml/tame_impala_song.musicxml')
    
    print(f"Tracks gefunden: {len(tracks)}")
    
    for track in tracks:
        print(f"\nTrack: {track.name}")
        print(f"Notes: {len(track.notes)}")
        
        for i, note in enumerate(track.notes[:5]):  # Erste 5 Noten
            print(f"  Note {i+1}: {note.pitch}, Duration: {note.duration}, Start: {note.start_time}")

if __name__ == "__main__":
    test_musicxml_parsing() 