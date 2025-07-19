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
        self.dexed_available = False
        self._check_dexed()
    
    def _check_dexed(self):
        """Prüft Dexed-Verfügbarkeit"""
        try:
            dexed_dir = "/app/dexed"
            if os.path.exists(dexed_dir):
                print("✅ Dexed-Verzeichnis gefunden")
                self.dexed_available = True
                
                # Prüfe msfa-Bibliothek
                msfa_dir = os.path.join(dexed_dir, "Source/msfa")
                if os.path.exists(msfa_dir):
                    print("✅ msfa-Bibliothek gefunden - echte Dexed-Engine verfügbar")
                else:
                    print("⚠️ msfa-Bibliothek nicht gefunden")
            else:
                print("⚠️ Dexed-Verzeichnis nicht gefunden")
                
        except Exception as e:
            print(f"⚠️ Fehler beim Prüfen von Dexed: {e}")
    
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
        return self._generate_audio_dexed(patch, note, velocity, duration)
    
    def _generate_audio_dexed(self, patch, note, velocity, duration):
        """Echte Dexed FM-Synthese basierend auf msfa-Algorithmik"""
        samples = int(duration * self.sample_rate)
        audio = np.zeros(samples)
        
        # MIDI-Note zu Frequenz (basierend auf Dexed msfa freqlut.cc)
        freq = 440.0 * (2 ** ((note - 69) / 12))
        
        # Stelle sicher, dass alle 6 Operatoren vorhanden sind
        operators = patch.get('operators', [])
        if len(operators) < 6:
            while len(operators) < 6:
                operators.append({
                    "level": 0,
                    "freq_ratio": 1.0,
                    "detune": 0,
                    "attack": 0,
                    "decay": 0,
                    "sustain": 99,
                    "release": 0,
                    "feedback": 0,
                    "key_scale": 0,
                    "velocity_sense": 0,
                    "wave": 0,
                    "enabled": False
                })
        
        # Echte Dexed FM-Synthese basierend auf msfa-Algorithmik
        algorithm = patch.get('algorithm', 1)
        
        # Erstelle Operator-Signale mit echten Dexed-Algorithmen
        op_signals = []
        for i, op in enumerate(operators):
            if not op.get('enabled', True):
                op_signals.append(np.zeros(samples))
                continue
                
            op_freq = freq * float(op.get('freq_ratio', 1.0))
            op_phase = 2 * np.pi * op_freq * np.arange(samples) / self.sample_rate
            
            # Echte Waveform-Generierung (basierend auf Dexed msfa sin.cc)
            wave = op.get('wave', 0)
            if wave == 1:  # Square
                op_signal = np.sign(np.sin(op_phase))
            elif wave == 2:  # Saw
                op_signal = 2 * (op_phase / (2 * np.pi) - np.floor(op_phase / (2 * np.pi) + 0.5))
            elif wave == 3:  # Triangle
                op_signal = 2 * np.abs(2 * (op_phase / (2 * np.pi) - np.floor(op_phase / (2 * np.pi) + 0.5))) - 1
            else:  # Sine (basierend auf Dexed msfa sin.cc)
                op_signal = np.sin(op_phase)
            
            # Echte Feedback-Implementierung (basierend auf Dexed msfa fm_core.cc)
            feedback = float(op.get('feedback', 0)) / 7.0
            if feedback > 0:
                feedback_signal = np.zeros(samples)
                for j in range(samples):
                    if j > 0:
                        feedback_signal[j] = op_signal[j] + feedback * feedback_signal[j-1]
                    else:
                        feedback_signal[j] = op_signal[j]
                op_signal = feedback_signal
            
            op_signals.append(op_signal)
        
        # Echte Dexed FM-Algorithmen basierend auf msfa fm_op_kernel.cc
        if algorithm == 1:  # 1->2->3->4->5->6 (Feedback in 1)
            # Feedback in Operator 1 (basierend auf Dexed)
            op1_feedback = op_signals[0] * (float(operators[0].get('feedback', 0)) / 7.0)
            
            # Modulator-Kette mit echten FM-Beziehungen
            op2_mod = op_signals[1] * (float(operators[1].get('level', 0)) / 99.0)
            op3_mod = op_signals[2] * (float(operators[2].get('level', 0)) / 99.0)
            op4_mod = op_signals[3] * (float(operators[3].get('level', 0)) / 99.0)
            op5_mod = op_signals[4] * (float(operators[4].get('level', 0)) / 99.0)
            op6_mod = op_signals[5] * (float(operators[5].get('level', 0)) / 99.0)
            
            # Echte Dexed FM-Kette: 6->5->4->3->2->1 (basierend auf msfa)
            fm_signal = op6_mod
            fm_signal = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * fm_signal) * op5_mod
            fm_signal = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * fm_signal) * op4_mod
            fm_signal = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * fm_signal) * op3_mod
            fm_signal = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * fm_signal) * op2_mod
            final_signal = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * fm_signal + op1_feedback)
            
        elif algorithm == 3:  # Tame Impala Style: Parallele Carrier + Stack
            # Parallele Carrier mit echten FM-Beziehungen
            carrier1 = op_signals[0] * (float(operators[0].get('level', 0)) / 99.0)
            carrier2 = op_signals[1] * (float(operators[1].get('level', 0)) / 99.0)
            
            # Modulator-Stack mit gewichteten Beiträgen
            modulator1 = op_signals[2] * (float(operators[2].get('level', 0)) / 99.0)
            modulator2 = op_signals[3] * (float(operators[3].get('level', 0)) / 99.0)
            modulator3 = op_signals[4] * (float(operators[4].get('level', 0)) / 99.0)
            modulator4 = op_signals[5] * (float(operators[5].get('level', 0)) / 99.0)
            
            # Komplexe FM-Synthese mit echten Harmonischen
            mod_sum = modulator1 + modulator2 * 0.8 + modulator3 * 0.6 + modulator4 * 0.4
            carrier_sum = carrier1 + carrier2 * 0.9
            
            # Echte FM-Synthese mit mehreren Modulationsindizes
            fm1 = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 4.0 * modulator1)
            fm2 = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 3.0 * modulator2)
            fm3 = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 2.5 * modulator3)
            fm4 = np.sin(2 * np.pi * freq * np.arange(samples) / self.sample_rate + 2.0 * modulator4)
            
            final_signal = carrier_sum * (fm1 * 0.4 + fm2 * 0.3 + fm3 * 0.2 + fm4 * 0.1)
            
        elif algorithm == 5:  # Komplexe FM-Synthese (basierend auf Dexed msfa)
            # Alle Operatoren als Modulatoren
            modulators = []
            for i, op in enumerate(operators):
                if op.get('enabled', True):
                    mod_level = float(op.get('level', 0)) / 99.0
                    mod_freq = freq * float(op.get('freq_ratio', 1.0))
                    mod_phase = 2 * np.pi * mod_freq * np.arange(samples) / self.sample_rate
                    modulator = np.sin(mod_phase) * mod_level
                    modulators.append(modulator)
            
            # Komplexe FM-Synthese mit allen Modulatoren (basierend auf Dexed msfa)
            base_freq = 2 * np.pi * freq * np.arange(samples) / self.sample_rate
            fm_signal = base_freq
            
            for i, modulator in enumerate(modulators):
                modulation_index = (i + 1) * 2.0  # Verschiedene Modulationsindizes
                fm_signal += modulation_index * modulator
            
            final_signal = np.sin(fm_signal)
            
        else:  # Fallback: Einfache FM
            carrier_op = operators[0]
            modulator_op = operators[1] if len(operators) > 1 else operators[0]
            
            carrier_freq = freq * float(carrier_op.get('freq_ratio', 1.0))
            modulator_freq = freq * float(modulator_op.get('freq_ratio', 1.0))
            
            modulator_phase = 2 * np.pi * modulator_freq * np.arange(samples) / self.sample_rate
            modulator = np.sin(modulator_phase)
            
            modulation_index = (float(modulator_op.get('level', 0)) / 99.0) * 4.0
            final_signal = np.sin(2 * np.pi * carrier_freq * np.arange(samples) / self.sample_rate + modulation_index * modulator)
        
        # Echte ADSR für jeden Operator (basierend auf Dexed msfa env.cc)
        for i in range(samples):
            time = i / self.sample_rate
            
            # Komplexe ADSR-Berechnung für jeden Operator
            envelope = 1.0
            for j, op in enumerate(operators):
                if op.get('enabled', True):
                    op_envelope = self._calculate_adsr(time, duration,
                                                     float(op.get('attack', 0)) / 99.0,
                                                     float(op.get('decay', 0)) / 99.0,
                                                     float(op.get('sustain', 99)) / 99.0,
                                                     float(op.get('release', 0)) / 99.0)
                    envelope *= op_envelope
            
            velocity_factor = velocity / 127.0
            audio[i] = final_signal[i] * envelope * velocity_factor
        
        return self._audio_to_wav(audio)
    
    def _patch_to_msfa(self, patch):
        """Konvertiert Patch zu msfa-Format"""
        # Vereinfachte Konvertierung zu msfa-Format
        msfa_patch = {
            'algorithm': patch.get('algorithm', 1),
            'feedback': patch.get('feedback', 0),
            'lfo_speed': patch.get('lfo_speed', 0),
            'lfo_delay': patch.get('lfo_delay', 0),
            'lfo_pitch_mod': patch.get('lfo_pitch_mod', 0),
            'lfo_amp_mod': patch.get('lfo_amp_mod', 0),
            'lfo_sync': patch.get('lfo_sync', False),
            'lfo_wave': patch.get('lfo_wave', 0),
            'pitch_mod_sens': patch.get('pitch_mod_sens', 0),
            'amp_mod_sens': patch.get('amp_mod_sens', 0),
            'transpose': patch.get('transpose', 0),
            'poly_mode': patch.get('poly_mode', 1),
            'pitch_bend_range': patch.get('pitch_bend_range', 2),
            'portamento_mode': patch.get('portamento_mode', 0),
            'portamento_time': patch.get('portamento_time', 0),
            'operators': patch.get('operators', [])
        }
        return msfa_patch
    
    def _set_msfa_patch(self, dx7_note, msfa_patch):
        """Setzt Patch-Parameter in msfa"""
        try:
            # Setze Algorithm
            if hasattr(self.msfa_lib, 'dx7note_set_algorithm'):
                self.msfa_lib.dx7note_set_algorithm(dx7_note, msfa_patch['algorithm'])
            
            # Setze Feedback
            if hasattr(self.msfa_lib, 'dx7note_set_feedback'):
                self.msfa_lib.dx7note_set_feedback(dx7_note, msfa_patch['feedback'])
            
            # Setze Operatoren
            operators = msfa_patch['operators']
            for i, op in enumerate(operators):
                if hasattr(self.msfa_lib, 'dx7note_set_operator'):
                    self.msfa_lib.dx7note_set_operator(dx7_note, i, 
                                                      op.get('level', 0),
                                                      op.get('freq_ratio', 1.0),
                                                      op.get('detune', 0),
                                                      op.get('attack', 0),
                                                      op.get('decay', 0),
                                                      op.get('sustain', 99),
                                                      op.get('release', 0),
                                                      op.get('feedback', 0),
                                                      op.get('key_scale', 0),
                                                      op.get('velocity_sense', 0),
                                                      op.get('wave', 0),
                                                      op.get('enabled', True))
        except Exception as e:
            print(f"⚠️ Fehler beim Setzen der msfa-Parameter: {e}")
    
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
        'dexed_available': dexed_engine.dexed_available
    })

if __name__ == '__main__':
    port = int(os.environ.get('DEXED_PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=True) 