#!/usr/bin/env python3
"""
Dexed API - Python-Bindings für die Dexed FM-Synth-Engine
Basierend auf der msfa (music-synthesizer-for-android) Engine
"""

import ctypes
import ctypes.util
import numpy as np
import json
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class Algorithm(Enum):
    """DX7 Algorithmen (1-32)"""
    ALGO_1 = 1
    ALGO_2 = 2
    ALGO_3 = 3
    ALGO_4 = 4
    ALGO_5 = 5
    ALGO_6 = 6
    ALGO_7 = 7
    ALGO_8 = 8
    ALGO_9 = 9
    ALGO_10 = 10
    ALGO_11 = 11
    ALGO_12 = 12
    ALGO_13 = 13
    ALGO_14 = 14
    ALGO_15 = 15
    ALGO_16 = 16
    ALGO_17 = 17
    ALGO_18 = 18
    ALGO_19 = 19
    ALGO_20 = 20
    ALGO_21 = 21
    ALGO_22 = 22
    ALGO_23 = 23
    ALGO_24 = 24
    ALGO_25 = 25
    ALGO_26 = 26
    ALGO_27 = 27
    ALGO_28 = 28
    ALGO_29 = 29
    ALGO_30 = 30
    ALGO_31 = 31
    ALGO_32 = 32

@dataclass
class OperatorParams:
    """Parameter für einen FM-Operator"""
    level: int = 99  # 0-99
    freq_ratio: float = 1.0  # Frequenz-Verhältnis
    detune: int = 0  # -7 bis +7
    attack: int = 0  # 0-99
    decay: int = 0  # 0-99
    sustain: int = 99  # 0-99
    release: int = 0  # 0-99
    feedback: int = 0  # 0-7
    key_scale: int = 0  # 0-3
    velocity_sense: int = 0  # 0-7
    wave: int = 0  # 0-3 (Sinus, Halbsinus, etc.)
    enabled: bool = True

@dataclass
class DexedPatch:
    """Ein kompletter Dexed-Patch mit allen Parametern"""
    name: str = "Default"
    algorithm: Algorithm = Algorithm.ALGO_1
    feedback: int = 0  # 0-7
    lfo_speed: int = 0  # 0-99
    lfo_delay: int = 0  # 0-99
    lfo_pitch_mod: int = 0  # 0-99
    lfo_amp_mod: int = 0  # 0-99
    lfo_sync: bool = False
    lfo_wave: int = 0  # 0-3
    pitch_mod_sens: int = 0  # 0-7
    amp_mod_sens: int = 0  # 0-3
    transpose: int = 0  # -24 bis +24
    poly_mode: int = 0  # 0=Mono, 1=Poly
    pitch_bend_range: int = 2  # 0-12
    portamento_mode: int = 0  # 0=Off, 1=On
    portamento_time: int = 0  # 0-99
    operators: List[OperatorParams] = None
    
    def __post_init__(self):
        if self.operators is None:
            self.operators = [OperatorParams() for _ in range(6)]

class DexedAPI:
    """API für die Dexed FM-Synth-Engine"""
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.engine = None
        self.current_patch = None
        self.active_notes = {}
        
        # Versuche msfa-Bibliothek zu laden
        self._load_msfa_library()
        
    def _load_msfa_library(self):
        """Lädt die msfa-Bibliothek"""
        try:
            # Versuche verschiedene Pfade für die msfa-Bibliothek
            lib_paths = [
                "libmsfa.so",
                "libmsfa.dylib", 
                "msfa.dll",
                ctypes.util.find_library("msfa")
            ]
            
            for lib_path in lib_paths:
                if lib_path and os.path.exists(lib_path):
                    self.msfa_lib = ctypes.CDLL(lib_path)
                    print(f"✅ msfa-Bibliothek geladen: {lib_path}")
                    return
                    
            # Fallback: Simuliere msfa-Funktionen
            print("⚠️ msfa-Bibliothek nicht gefunden, verwende Simulation")
            self.msfa_lib = None
            
        except Exception as e:
            print(f"⚠️ Fehler beim Laden der msfa-Bibliothek: {e}")
            self.msfa_lib = None
    
    def create_patch(self, name: str = "Custom") -> DexedPatch:
        """Erstellt einen neuen Patch"""
        return DexedPatch(name=name)
    
    def load_patch_from_sysex(self, sysex_data: bytes) -> DexedPatch:
        """Lädt einen Patch aus Sysex-Daten"""
        if len(sysex_data) < 4104:
            raise ValueError("Ungültige Sysex-Daten")
            
        patch = DexedPatch()
        
        # Parse Sysex-Daten (vereinfacht)
        # In der Praxis würde hier eine vollständige Sysex-Parser-Implementierung stehen
        patch.name = "Sysex Patch"
        
        return patch
    
    def save_patch_to_sysex(self, patch: DexedPatch) -> bytes:
        """Speichert einen Patch als Sysex-Daten"""
        # Simuliere Sysex-Generierung
        sysex_data = bytearray(4104)
        sysex_data[0] = 0xF0  # Sysex Start
        sysex_data[1] = 0x43  # Yamaha
        sysex_data[2] = 0x00  # Sub-ID
        sysex_data[3] = 0x09  # 1 Voice Dump
        sysex_data[4] = 0x20  # Address High
        sysex_data[5] = 0x00  # Address Mid
        sysex_data[6] = 0x00  # Address Low
        
        # Patch-Daten (vereinfacht)
        for i in range(7, 4103):
            sysex_data[i] = 0x00
            
        sysex_data[4103] = 0xF7  # Sysex End
        
        return bytes(sysex_data)
    
    def generate_audio(self, patch: DexedPatch, note: int, velocity: int, 
                      duration: float) -> np.ndarray:
        """Generiert Audio für eine Note mit dem gegebenen Patch"""
        
        if self.msfa_lib:
            # Verwende echte msfa-Engine
            return self._generate_audio_msfa(patch, note, velocity, duration)
        else:
            # Verwende Simulation
            return self._generate_audio_simulated(patch, note, velocity, duration)
    
    def _generate_audio_msfa(self, patch: DexedPatch, note: int, velocity: int, 
                            duration: float) -> np.ndarray:
        """Generiert Audio mit der echten msfa-Engine"""
        # Hier würde die echte msfa-Integration stehen
        # Für jetzt verwende Simulation
        return self._generate_audio_simulated(patch, note, velocity, duration)
    
    def _generate_audio_simulated(self, patch: DexedPatch, note: int, velocity: int, 
                                 duration: float) -> np.ndarray:
        """Simuliert FM-Synthese basierend auf Dexed-Parametern"""
        
        samples = int(duration * self.sample_rate)
        audio = np.zeros(samples)
        
        # Konvertiere MIDI-Note zu Frequenz
        freq = 440.0 * (2 ** ((note - 69) / 12))
        
        # FM-Synthese Simulation
        for i in range(samples):
            time = i / self.sample_rate
            
            # Carrier (Operator 6)
            carrier_freq = freq * patch.operators[5].freq_ratio
            carrier_phase = 2 * np.pi * carrier_freq * time
            
            # Modulator (Operator 5)
            modulator_freq = freq * patch.operators[4].freq_ratio
            modulator_phase = 2 * np.pi * modulator_freq * time
            modulator = np.sin(modulator_phase)
            
            # FM-Synthese
            modulation_index = patch.operators[4].level / 99.0 * 2.0
            fm_signal = np.sin(carrier_phase + modulation_index * modulator)
            
            # ADSR Envelope
            envelope = self._calculate_adsr(time, duration, 
                                         patch.operators[5].attack / 99.0,
                                         patch.operators[5].decay / 99.0,
                                         patch.operators[5].sustain / 99.0,
                                         patch.operators[5].release / 99.0)
            
            # Velocity
            velocity_factor = velocity / 127.0
            
            # Level
            level = patch.operators[5].level / 99.0
            
            audio[i] = fm_signal * envelope * velocity_factor * level
        
        return audio
    
    def _calculate_adsr(self, time: float, duration: float, 
                       attack: float, decay: float, sustain: float, release: float) -> float:
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
    
    def play_note(self, patch: DexedPatch, note: int, velocity: int) -> str:
        """Spielt eine Note und gibt eine ID zurück"""
        note_id = f"note_{note}_{velocity}_{id(patch)}"
        self.active_notes[note_id] = {
            'patch': patch,
            'note': note,
            'velocity': velocity,
            'start_time': self._get_current_time()
        }
        return note_id
    
    def stop_note(self, note_id: str):
        """Stoppt eine Note"""
        if note_id in self.active_notes:
            del self.active_notes[note_id]
    
    def _get_current_time(self) -> float:
        """Gibt aktuelle Zeit zurück (für Simulation)"""
        import time
        return time.time()
    
    def get_patch_as_json(self, patch: DexedPatch) -> str:
        """Konvertiert Patch zu JSON"""
        return json.dumps({
            'name': patch.name,
            'algorithm': patch.algorithm.value,
            'feedback': patch.feedback,
            'lfo_speed': patch.lfo_speed,
            'lfo_delay': patch.lfo_delay,
            'lfo_pitch_mod': patch.lfo_pitch_mod,
            'lfo_amp_mod': patch.lfo_amp_mod,
            'lfo_sync': patch.lfo_sync,
            'lfo_wave': patch.lfo_wave,
            'pitch_mod_sens': patch.pitch_mod_sens,
            'amp_mod_sens': patch.amp_mod_sens,
            'transpose': patch.transpose,
            'poly_mode': patch.poly_mode,
            'pitch_bend_range': patch.pitch_bend_range,
            'portamento_mode': patch.portamento_mode,
            'portamento_time': patch.portamento_time,
            'operators': [
                {
                    'level': op.level,
                    'freq_ratio': op.freq_ratio,
                    'detune': op.detune,
                    'attack': op.attack,
                    'decay': op.decay,
                    'sustain': op.sustain,
                    'release': op.release,
                    'feedback': op.feedback,
                    'key_scale': op.key_scale,
                    'velocity_sense': op.velocity_sense,
                    'wave': op.wave,
                    'enabled': op.enabled
                } for op in patch.operators
            ]
        }, indent=2)
    
    def load_patch_from_json(self, json_data: str) -> DexedPatch:
        """Lädt Patch aus JSON"""
        data = json.loads(json_data)
        
        patch = DexedPatch()
        patch.name = data.get('name', 'JSON Patch')
        patch.algorithm = Algorithm(data.get('algorithm', 1))
        patch.feedback = data.get('feedback', 0)
        patch.lfo_speed = data.get('lfo_speed', 0)
        patch.lfo_delay = data.get('lfo_delay', 0)
        patch.lfo_pitch_mod = data.get('lfo_pitch_mod', 0)
        patch.lfo_amp_mod = data.get('lfo_amp_mod', 0)
        patch.lfo_sync = data.get('lfo_sync', False)
        patch.lfo_wave = data.get('lfo_wave', 0)
        patch.pitch_mod_sens = data.get('pitch_mod_sens', 0)
        patch.amp_mod_sens = data.get('amp_mod_sens', 0)
        patch.transpose = data.get('transpose', 0)
        patch.poly_mode = data.get('poly_mode', 0)
        patch.pitch_bend_range = data.get('pitch_bend_range', 2)
        patch.portamento_mode = data.get('portamento_mode', 0)
        patch.portamento_time = data.get('portamento_time', 0)
        
        # Load operators
        operators_data = data.get('operators', [])
        for i, op_data in enumerate(operators_data):
            if i < len(patch.operators):
                op = patch.operators[i]
                op.level = op_data.get('level', 99)
                op.freq_ratio = op_data.get('freq_ratio', 1.0)
                op.detune = op_data.get('detune', 0)
                op.attack = op_data.get('attack', 0)
                op.decay = op_data.get('decay', 0)
                op.sustain = op_data.get('sustain', 99)
                op.release = op_data.get('release', 0)
                op.feedback = op_data.get('feedback', 0)
                op.key_scale = op_data.get('key_scale', 0)
                op.velocity_sense = op_data.get('velocity_sense', 0)
                op.wave = op_data.get('wave', 0)
                op.enabled = op_data.get('enabled', True)
        
        return patch

# Beispiel-Verwendung
if __name__ == "__main__":
    # Erstelle Dexed API
    dexed = DexedAPI()
    
    # Erstelle einen Patch
    patch = dexed.create_patch("Test Patch")
    patch.algorithm = Algorithm.ALGO_1
    patch.operators[0].level = 80
    patch.operators[0].freq_ratio = 1.0
    patch.operators[0].attack = 10
    patch.operators[0].decay = 20
    patch.operators[0].sustain = 70
    patch.operators[0].release = 30
    
    # Generiere Audio
    audio = dexed.generate_audio(patch, 60, 100, 2.0)  # C4, Velocity 100, 2 Sekunden
    
    print(f"✅ Audio generiert: {len(audio)} Samples")
    print(f"📊 Patch JSON: {dexed.get_patch_as_json(patch)[:200]}...") 