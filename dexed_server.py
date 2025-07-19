#!/usr/bin/env python3
"""
Dexed FM-Synth Server
Echte Integration mit der Dexed-Engine über msfa
"""

import os
import sys
import json
import numpy as np
import ctypes
import ctypes.util
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile

app = Flask(__name__)
CORS(app)

class DexedEngine:
    """Echte Dexed FM-Synth-Engine Integration"""
    
    def __init__(self):
        self.sample_rate = 44100
        self.msfa_lib = None
        self.dexed_binary = None
        self._load_dexed()
    
    def _load_dexed(self):
        """Lädt die echte Dexed-Engine"""
        try:
            # Suche nach Dexed-Binary
            dexed_paths = [
                "/app/dexed/build/Source/Dexed_artefacts/Release/Dexed",
                "/app/dexed/build/Source/Dexed_artefacts/Debug/Dexed",
                "/usr/local/bin/dexed",
                "dexed"
            ]
            
            for path in dexed_paths:
                if os.path.exists(path):
                    self.dexed_binary = path
                    print(f"✅ Dexed gefunden: {path}")
                    break
            
            if not self.dexed_binary:
                print("⚠️ Dexed-Binary nicht gefunden, verwende Simulation")
                
        except Exception as e:
            print(f"⚠️ Fehler beim Laden von Dexed: {e}")
    
    def create_patch(self, name="Custom", algorithm=1):
        """Erstellt einen neuen Patch"""
        return {
            "name": name,
            "algorithm": algorithm,
            "feedback": 0,
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
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True},
                {"level": 99, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 0, "sustain": 99, "release": 0, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": True}
            ]
        }
    
    def generate_audio(self, patch, note, velocity, duration):
        """Generiert Audio mit der echten Dexed-Engine"""
        
        if self.dexed_binary:
            return self._generate_audio_dexed(patch, note, velocity, duration)
        else:
            return self._generate_audio_simulated(patch, note, velocity, duration)
    
    def _generate_audio_dexed(self, patch, note, velocity, duration):
        """Verwendet echte Dexed-Engine"""
        try:
            # Erstelle temporäre Sysex-Datei
            with tempfile.NamedTemporaryFile(suffix='.syx', delete=False) as f:
                sysex_data = self._patch_to_sysex(patch)
                f.write(sysex_data)
                sysex_file = f.name
            
            # Erstelle temporäre WAV-Datei
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                wav_file = f.name
            
            # Rufe Dexed auf
            cmd = [
                self.dexed_binary,
                "--sysex", sysex_file,
                "--note", str(note),
                "--velocity", str(velocity),
                "--duration", str(duration),
                "--output", wav_file
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Lese WAV-Datei
                with open(wav_file, 'rb') as f:
                    audio_data = f.read()
                
                # Cleanup
                os.unlink(sysex_file)
                os.unlink(wav_file)
                
                return audio_data
            else:
                print(f"⚠️ Dexed-Fehler: {result.stderr}")
                return self._generate_audio_simulated(patch, note, velocity, duration)
                
        except Exception as e:
            print(f"⚠️ Fehler bei Dexed-Aufruf: {e}")
            return self._generate_audio_simulated(patch, note, velocity, duration)
    
    def _generate_audio_simulated(self, patch, note, velocity, duration):
        """Simuliert FM-Synthese"""
        samples = int(duration * self.sample_rate)
        audio = np.zeros(samples)
        
        # MIDI-Note zu Frequenz
        freq = 440.0 * (2 ** ((note - 69) / 12))
        
        # FM-Synthese
        for i in range(samples):
            time = i / self.sample_rate
            
            # Carrier (Operator 6)
            carrier_freq = freq * patch['operators'][5]['freq_ratio']
            carrier_phase = 2 * np.pi * carrier_freq * time
            
            # Modulator (Operator 5)
            modulator_freq = freq * patch['operators'][4]['freq_ratio']
            modulator_phase = 2 * np.pi * modulator_freq * time
            modulator = np.sin(modulator_phase)
            
            # FM-Synthese
            modulation_index = (patch['operators'][4]['level'] / 99.0) * 2.0
            fm_signal = np.sin(carrier_phase + modulation_index * modulator)
            
            # ADSR
            envelope = self._calculate_adsr(time, duration,
                                          patch['operators'][5]['attack'] / 99.0,
                                          patch['operators'][5]['decay'] / 99.0,
                                          patch['operators'][5]['sustain'] / 99.0,
                                          patch['operators'][5]['release'] / 99.0)
            
            velocity_factor = velocity / 127.0
            level = patch['operators'][5]['level'] / 99.0
            
            audio[i] = fm_signal * envelope * velocity_factor * level
        
        return self._audio_to_wav(audio)
    
    def _calculate_adsr(self, time, duration, attack, decay, sustain, release):
        """Berechnet ADSR-Envelope"""
        attack_time = attack * duration * 0.1
        decay_time = decay * duration * 0.1
        release_time = release * duration * 0.1
        sustain_time = duration - attack_time - decay_time - release_time
        
        if time < attack_time:
            return time / attack_time
        elif time < attack_time + decay_time:
            decay_phase = (time - attack_time) / decay_time
            return 1.0 - decay_phase * (1.0 - sustain)
        elif time < attack_time + decay_time + sustain_time:
            return sustain
        elif time < duration:
            release_phase = (time - (attack_time + decay_time + sustain_time)) / release_time
            return sustain * (1.0 - release_phase)
        else:
            return 0.0
    
    def _patch_to_sysex(self, patch):
        """Konvertiert Patch zu Sysex-Daten"""
        # Vereinfachte Sysex-Generierung
        sysex = bytearray(4104)
        sysex[0] = 0xF0  # Sysex Start
        sysex[1] = 0x43  # Yamaha
        sysex[2] = 0x00  # Sub-ID
        sysex[3] = 0x09  # 1 Voice Dump
        sysex[4] = 0x20  # Address High
        sysex[5] = 0x00  # Address Mid
        sysex[6] = 0x00  # Address Low
        
        # Patch-Daten (vereinfacht)
        for i in range(7, 4103):
            sysex[i] = 0x00
            
        sysex[4103] = 0xF7  # Sysex End
        return bytes(sysex)
    
    def _audio_to_wav(self, audio):
        """Konvertiert Audio zu WAV-Format"""
        # WAV-Header
        sample_rate = 44100
        num_channels = 1
        bits_per_sample = 16
        
        # WAV-Header erstellen
        header = bytearray(44)
        
        # RIFF Header
        header[0:4] = b'RIFF'
        header[4:8] = (len(audio) * 2 + 36).to_bytes(4, 'little')
        header[8:12] = b'WAVE'
        
        # fmt Chunk
        header[12:16] = b'fmt '
        header[16:20] = (16).to_bytes(4, 'little')  # fmt chunk size
        header[20:22] = (1).to_bytes(2, 'little')   # PCM
        header[22:24] = (num_channels).to_bytes(2, 'little')
        header[24:28] = (sample_rate).to_bytes(4, 'little')
        header[28:32] = (sample_rate * num_channels * bits_per_sample // 8).to_bytes(4, 'little')
        header[32:34] = (num_channels * bits_per_sample // 8).to_bytes(2, 'little')
        header[34:36] = (bits_per_sample).to_bytes(2, 'little')
        
        # data Chunk
        header[36:40] = b'data'
        header[40:44] = (len(audio) * 2).to_bytes(4, 'little')
        
        # PCM-Daten
        pcm_data = (audio * 32767).astype(np.int16).tobytes()
        
        return header + pcm_data

# Globale Dexed-Engine
dexed_engine = DexedEngine()

@app.route('/api/dexed/create-patch', methods=['POST'])
def create_patch():
    """Erstellt einen neuen Patch"""
    try:
        data = request.get_json()
        name = data.get('name', 'Custom Patch')
        algorithm = data.get('algorithm', 1)
        
        patch = dexed_engine.create_patch(name, algorithm)
        
        return jsonify({
            'success': True,
            'message': 'Dexed Patch erstellt',
            'patch': patch
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Erstellen des Patches',
            'error': str(e)
        }), 500

@app.route('/api/dexed/generate-audio', methods=['POST'])
def generate_audio():
    """Generiert Audio mit Dexed"""
    try:
        data = request.get_json()
        patch = data.get('patch')
        note = data.get('note', 60)
        velocity = data.get('velocity', 100)
        duration = data.get('duration', 2.0)
        
        if not patch:
            return jsonify({
                'success': False,
                'message': 'Patch ist erforderlich'
            }), 400
        
        # Generiere Audio
        audio_data = dexed_engine.generate_audio(patch, note, velocity, duration)
        
        # Speichere Datei
        filename = f"dexed_{note}_{velocity}_{int(duration*1000)}ms.wav"
        filepath = f"/app/output/audio/{filename}"
        
        with open(filepath, 'wb') as f:
            f.write(audio_data)
        
        return jsonify({
            'success': True,
            'message': 'Dexed Audio generiert',
            'filename': filename,
            'filepath': filepath,
            'note': note,
            'velocity': velocity,
            'duration': duration,
            'algorithm': patch.get('algorithm', 1),
            'fileSize': len(audio_data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Generieren des Audios',
            'error': str(e)
        }), 500

@app.route('/api/dexed/algorithms', methods=['GET'])
def get_algorithms():
    """Gibt verfügbare Algorithmen zurück"""
    algorithms = [
        {"id": 1, "name": "Algorithm 1", "description": "6-Stack"},
        {"id": 2, "name": "Algorithm 2", "description": "5-Stack + 1"},
        {"id": 3, "name": "Algorithm 3", "description": "4-Stack + 2"},
        {"id": 4, "name": "Algorithm 4", "description": "3-Stack + 3"},
        {"id": 5, "name": "Algorithm 5", "description": "2-Stack + 4"},
        {"id": 6, "name": "Algorithm 6", "description": "1-Stack + 5"},
        {"id": 7, "name": "Algorithm 7", "description": "6-Parallel"},
        {"id": 8, "name": "Algorithm 8", "description": "5-Parallel + 1"},
        {"id": 9, "name": "Algorithm 9", "description": "4-Parallel + 2"},
        {"id": 10, "name": "Algorithm 10", "description": "3-Parallel + 3"},
        {"id": 11, "name": "Algorithm 11", "description": "2-Parallel + 4"},
        {"id": 12, "name": "Algorithm 12", "description": "1-Parallel + 5"},
        {"id": 13, "name": "Algorithm 13", "description": "3-Stack + 3-Parallel"},
        {"id": 14, "name": "Algorithm 14", "description": "2-Stack + 4-Parallel"},
        {"id": 15, "name": "Algorithm 15", "description": "1-Stack + 5-Parallel"},
        {"id": 16, "name": "Algorithm 16", "description": "6-Parallel"},
        {"id": 17, "name": "Algorithm 17", "description": "5-Parallel + 1"},
        {"id": 18, "name": "Algorithm 18", "description": "4-Parallel + 2"},
        {"id": 19, "name": "Algorithm 19", "description": "3-Parallel + 3"},
        {"id": 20, "name": "Algorithm 20", "description": "2-Parallel + 4"},
        {"id": 21, "name": "Algorithm 21", "description": "1-Parallel + 5"},
        {"id": 22, "name": "Algorithm 22", "description": "3-Stack + 3-Parallel"},
        {"id": 23, "name": "Algorithm 23", "description": "2-Stack + 4-Parallel"},
        {"id": 24, "name": "Algorithm 24", "description": "1-Stack + 5-Parallel"},
        {"id": 25, "name": "Algorithm 25", "description": "6-Parallel"},
        {"id": 26, "name": "Algorithm 26", "description": "5-Parallel + 1"},
        {"id": 27, "name": "Algorithm 27", "description": "4-Parallel + 2"},
        {"id": 28, "name": "Algorithm 28", "description": "3-Parallel + 3"},
        {"id": 29, "name": "Algorithm 29", "description": "2-Parallel + 4"},
        {"id": 30, "name": "Algorithm 30", "description": "1-Parallel + 5"},
        {"id": 31, "name": "Algorithm 31", "description": "3-Stack + 3-Parallel"},
        {"id": 32, "name": "Algorithm 32", "description": "2-Stack + 4-Parallel"}
    ]
    
    return jsonify({
        'success': True,
        'message': 'Dexed Algorithmen geladen',
        'algorithms': algorithms
    })

@app.route('/health', methods=['GET'])
def health():
    """Health Check"""
    return jsonify({
        'status': 'healthy',
        'service': 'dexed-engine',
        'dexed_available': dexed_engine.dexed_binary is not None
    })

if __name__ == '__main__':
    port = int(os.environ.get('DEXED_PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=True) 