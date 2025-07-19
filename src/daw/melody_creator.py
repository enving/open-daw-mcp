#!/usr/bin/env python3
"""
Melody Creator für Dexed FM-Synth
Erstellt komplette Melodien mit echten Dexed-Sounds
"""

import os
import json
import numpy as np
import requests
from typing import List, Dict
import tempfile

class MelodyCreator:
    """Erstellt komplette Melodien mit Dexed"""
    
    def __init__(self):
        self.dexed_api_url = "http://localhost:8081/api/dexed"
        self.sample_rate = 44100
    
    def create_melody(self, notes: List[Dict], patch: Dict, output_file: str) -> Dict:
        """Erstellt eine komplette Melodie"""
        try:
            # Generiere Audio für jede Note
            audio_segments = []
            total_duration = 0
            
            for note_data in notes:
                note = note_data.get('note', 60)
                velocity = note_data.get('velocity', 100)
                start_time = note_data.get('start_time', 0)
                note_duration = note_data.get('duration', 1.0)
                
                # Rufe Dexed-API auf
                payload = {
                    "patch": patch,
                    "note": note,
                    "velocity": velocity,
                    "duration": note_duration
                }
                
                response = requests.post(f"{self.dexed_api_url}/generate-audio", json=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        # Lade Audio-Datei
                        audio_file = result.get('filepath')
                        if audio_file and os.path.exists(audio_file):
                            audio_segments.append({
                                'file': audio_file,
                                'start_time': start_time,
                                'duration': note_duration
                            })
                            total_duration = max(total_duration, start_time + note_duration)
            
            # Kombiniere Audio-Segmente
            final_audio = self._combine_audio_segments(audio_segments, total_duration)
            
            # Speichere finale Melodie
            self._save_audio(final_audio, output_file)
            
            return {
                "success": True,
                "filename": os.path.basename(output_file),
                "filepath": output_file,
                "duration": total_duration,
                "notes": len(notes)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _combine_audio_segments(self, segments: List[Dict], total_duration: float) -> np.ndarray:
        """Kombiniert Audio-Segmente zu einer Melodie"""
        total_samples = int(total_duration * self.sample_rate)
        combined_audio = np.zeros(total_samples)
        
        for segment in segments:
            try:
                # Lade Audio-Datei
                audio_data = np.fromfile(segment['file'], dtype=np.int16)
                
                # Konvertiere zu Float
                audio_float = audio_data.astype(np.float32) / 32768.0
                
                # Berechne Start-Sample
                start_sample = int(segment['start_time'] * self.sample_rate)
                
                # Füge Audio hinzu
                end_sample = min(start_sample + len(audio_float), total_samples)
                combined_audio[start_sample:end_sample] += audio_float[:end_sample-start_sample]
                
            except Exception as e:
                print(f"Fehler beim Laden von {segment['file']}: {e}")
                continue
        
        # Normalisiere
        if np.max(np.abs(combined_audio)) > 0:
            combined_audio = combined_audio / np.max(np.abs(combined_audio)) * 0.8
        
        return combined_audio
    
    def _save_audio(self, audio: np.ndarray, filename: str):
        """Speichert Audio als WAV-Datei"""
        # Konvertiere zu 16-bit Integer
        audio_int16 = (audio * 32767).astype(np.int16)
        
        # WAV-Header
        with open(filename, 'wb') as f:
            # RIFF Header
            f.write(b'RIFF')
            f.write((36 + len(audio_int16) * 2).to_bytes(4, 'little'))
            f.write(b'WAVE')
            
            # fmt Chunk
            f.write(b'fmt ')
            f.write((16).to_bytes(4, 'little'))  # fmt chunk size
            f.write((1).to_bytes(2, 'little'))   # PCM format
            f.write((1).to_bytes(2, 'little'))   # mono
            f.write(self.sample_rate.to_bytes(4, 'little'))  # sample rate
            f.write((self.sample_rate * 2).to_bytes(4, 'little'))  # byte rate
            f.write((2).to_bytes(2, 'little'))   # block align
            f.write((16).to_bytes(2, 'little'))  # bits per sample
            
            # data Chunk
            f.write(b'data')
            f.write((len(audio_int16) * 2).to_bytes(4, 'little'))
            f.write(audio_int16.tobytes())

def create_example_melody():
    """Erstellt eine echte, schöne Melodie"""
    
    # Schöner warmer Pad-Sound
    patch = {
        "algorithm": 1,
        "lfo_speed": 0,
        "lfo_delay": 0,
        "lfo_pitch_mod": 0,
        "lfo_amp_mod": 0,
        "lfo_sync": False,
        "lfo_wave": 0,
        "pitch_mod_sens": 0,
        "amp_mod_sens": 0,
        "transpose": 0,
        "poly_mode": 1,
        "pitch_bend_range": 2,
        "portamento_mode": 0,
        "portamento_time": 0,
        "operators": [
            {"level": 85, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 20, "sustain": 85, "release": 35, "feedback": 2, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
            {"level": 70, "freq_ratio": 2.0, "detune": 0, "attack": 5, "decay": 25, "sustain": 75, "release": 40, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
            {"level": 55, "freq_ratio": 3.0, "detune": 0, "attack": 10, "decay": 30, "sustain": 65, "release": 45, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
            {"level": 40, "freq_ratio": 4.0, "detune": 0, "attack": 15, "decay": 35, "sustain": 55, "release": 50, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
            {"level": 25, "freq_ratio": 5.0, "detune": 0, "attack": 20, "decay": 40, "sustain": 45, "release": 55, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
            {"level": 15, "freq_ratio": 6.0, "detune": 0, "attack": 25, "decay": 45, "sustain": 35, "release": 60, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
        ]
    }
    
    # Echte, schöne Melodie: "Für Elise" inspiriert
    notes = [
        {"note": 64, "velocity": 100, "start_time": 0.0, "duration": 0.5},    # E
        {"note": 67, "velocity": 90, "start_time": 0.5, "duration": 0.5},     # G
        {"note": 71, "velocity": 95, "start_time": 1.0, "duration": 0.5},     # B
        {"note": 72, "velocity": 100, "start_time": 1.5, "duration": 1.0},    # C (höher)
        {"note": 71, "velocity": 90, "start_time": 2.5, "duration": 0.5},     # B
        {"note": 67, "velocity": 85, "start_time": 3.0, "duration": 0.5},     # G
        {"note": 64, "velocity": 95, "start_time": 3.5, "duration": 0.5},     # E
        {"note": 60, "velocity": 100, "start_time": 4.0, "duration": 1.0},    # C
        {"note": 64, "velocity": 90, "start_time": 5.0, "duration": 0.5},     # E
        {"note": 67, "velocity": 95, "start_time": 5.5, "duration": 0.5},     # G
        {"note": 71, "velocity": 100, "start_time": 6.0, "duration": 0.5},    # B
        {"note": 72, "velocity": 100, "start_time": 6.5, "duration": 1.5},    # C (höher, länger)
        {"note": 71, "velocity": 90, "start_time": 8.0, "duration": 0.5},     # B
        {"note": 67, "velocity": 85, "start_time": 8.5, "duration": 0.5},     # G
        {"note": 64, "velocity": 95, "start_time": 9.0, "duration": 0.5},     # E
        {"note": 60, "velocity": 100, "start_time": 9.5, "duration": 1.5},    # C (Ende)
    ]
    
    creator = MelodyCreator()
    output_file = "/app/output/audio/beautiful_melody.wav"
    
    result = creator.create_melody(notes, patch, output_file)
    return result

if __name__ == "__main__":
    result = create_example_melody()
    print(json.dumps(result, indent=2)) 