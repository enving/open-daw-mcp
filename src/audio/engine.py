#!/usr/bin/env python3
"""
Open DAW MCP - Audio Engine

Real-time Audio Processing Engine für die Headless-DAW.
"""

import logging
import numpy as np
import soundfile as sf
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# JACK Audio
import jack

logger = logging.getLogger(__name__)

class AudioFormat(Enum):
    """Audio Formate"""
    FLOAT32 = "float32"
    INT16 = "int16"
    INT24 = "int24"

@dataclass
class AudioBuffer:
    """Audio Buffer für Real-time Processing"""
    data: np.ndarray
    sample_rate: int
    channels: int
    format: AudioFormat

class AudioEngine:
    """
    Audio Engine für Real-time Audio Processing
    
    Verantwortlich für:
    - Audio Buffer Management
    - Real-time Audio Processing
    - Audio Export/Import
    - Sample Rate Conversion
    - Audio Effects Processing
    """
    
    def __init__(self, sample_rate: int = 44100, buffer_size: int = 512):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.channels = 2  # Stereo
        
        # JACK Client
        self.jack_client = None
        self.input_ports = []
        self.output_ports = []
        
        # Audio Buffers
        self.audio_buffers: Dict[str, AudioBuffer] = {}
        
        # Effects Chain
        self.effects_chain: List[str] = []
        
        logger.info("Audio Engine initialisiert")
    
    def setup_jack(self, client_name: str = "OpenDAW_Audio"):
        """JACK Audio Setup"""
        try:
            self.jack_client = jack.Client(client_name)
            
            # Input Ports erstellen
            for i in range(self.channels):
                port_name = f"input_{i+1}"
                port = self.jack_client.inports.register(port_name)
                self.input_ports.append(port)
            
            # Output Ports erstellen
            for i in range(self.channels):
                port_name = f"output_{i+1}"
                port = self.jack_client.outports.register(port_name)
                self.output_ports.append(port)
            
            # Process Callback setzen
            self.jack_client.set_process_callback(self._process_callback)
            
            # Client aktivieren
            self.jack_client.activate()
            
            logger.info("JACK Audio Setup erfolgreich")
            return True
            
        except Exception as e:
            logger.error(f"JACK Audio Setup fehlgeschlagen: {e}")
            return False
    
    def _process_callback(self, frames: int) -> int:
        """JACK Audio Processing Callback"""
        try:
            # Audio Processing Pipeline
            for buffer_id, audio_buffer in self.audio_buffers.items():
                if audio_buffer.data is not None:
                    # Process audio buffer
                    processed_data = self._process_audio_buffer(audio_buffer, frames)
                    
                    # Apply effects chain
                    for effect_id in self.effects_chain:
                        processed_data = self._apply_effect(effect_id, processed_data)
                    
                    # Output to JACK ports
                    for i, output_port in enumerate(self.output_ports):
                        if i < processed_data.shape[1]:
                            output_port.get_array()[:] = processed_data[:, i]
            
            return 0
            
        except Exception as e:
            logger.error(f"Audio Processing fehlgeschlagen: {e}")
            return 0
    
    def _process_audio_buffer(self, audio_buffer: AudioBuffer, frames: int) -> np.ndarray:
        """Verarbeitet einen Audio Buffer"""
        # Sample Rate Conversion falls nötig
        if audio_buffer.sample_rate != self.sample_rate:
            audio_buffer.data = self._resample_audio(
                audio_buffer.data, 
                audio_buffer.sample_rate, 
                self.sample_rate
            )
        
        # Buffer Size Anpassung
        if len(audio_buffer.data) < frames:
            # Buffer mit Nullen auffüllen
            padding = np.zeros((frames - len(audio_buffer.data), audio_buffer.channels))
            audio_buffer.data = np.vstack([audio_buffer.data, padding])
        elif len(audio_buffer.data) > frames:
            # Buffer kürzen
            audio_buffer.data = audio_buffer.data[:frames]
        
        return audio_buffer.data
    
    def _resample_audio(self, audio_data: np.ndarray, src_rate: int, dst_rate: int) -> np.ndarray:
        """Resamples Audio auf neue Sample Rate"""
        if src_rate == dst_rate:
            return audio_data
        
        # Einfache Resampling (Linear Interpolation)
        ratio = dst_rate / src_rate
        new_length = int(len(audio_data) * ratio)
        
        # Indizes für Interpolation
        indices = np.arange(new_length) / ratio
        indices_floor = np.floor(indices).astype(int)
        indices_ceil = np.minimum(indices_floor + 1, len(audio_data) - 1)
        
        # Interpolation
        fraction = indices - indices_floor
        resampled = (1 - fraction[:, np.newaxis]) * audio_data[indices_floor] + \
                   fraction[:, np.newaxis] * audio_data[indices_ceil]
        
        return resampled
    
    def _apply_effect(self, effect_id: str, audio_data: np.ndarray) -> np.ndarray:
        """Wendet einen Audio Effect an"""
        # TODO: Implement effect processing
        # Für jetzt: Pass-through
        return audio_data
    
    # Audio Buffer Management
    def create_audio_buffer(self, buffer_id: str, data: np.ndarray, 
                          sample_rate: int = None) -> bool:
        """Erstellt einen neuen Audio Buffer"""
        if sample_rate is None:
            sample_rate = self.sample_rate
        
        audio_buffer = AudioBuffer(
            data=data,
            sample_rate=sample_rate,
            channels=data.shape[1] if len(data.shape) > 1 else 1,
            format=AudioFormat.FLOAT32
        )
        
        self.audio_buffers[buffer_id] = audio_buffer
        logger.info(f"Audio Buffer erstellt: {buffer_id}")
        return True
    
    def remove_audio_buffer(self, buffer_id: str) -> bool:
        """Entfernt einen Audio Buffer"""
        if buffer_id in self.audio_buffers:
            del self.audio_buffers[buffer_id]
            logger.info(f"Audio Buffer entfernt: {buffer_id}")
            return True
        return False
    
    def get_audio_buffer(self, buffer_id: str) -> Optional[AudioBuffer]:
        """Holt einen Audio Buffer"""
        return self.audio_buffers.get(buffer_id)
    
    # Audio Import/Export
    def load_audio_file(self, filepath: str, buffer_id: str = None) -> Optional[str]:
        """Lädt eine Audio-Datei"""
        try:
            # Audio-Datei laden
            audio_data, sample_rate = sf.read(filepath)
            
            # Mono zu Stereo konvertieren falls nötig
            if len(audio_data.shape) == 1:
                audio_data = audio_data.reshape(-1, 1)
            
            # Buffer ID generieren falls nicht angegeben
            if buffer_id is None:
                buffer_id = f"audio_{len(self.audio_buffers) + 1}"
            
            # Audio Buffer erstellen
            self.create_audio_buffer(buffer_id, audio_data, sample_rate)
            
            logger.info(f"Audio-Datei geladen: {filepath} -> {buffer_id}")
            return buffer_id
            
        except Exception as e:
            logger.error(f"Audio-Datei Laden fehlgeschlagen: {e}")
            return None
    
    def save_audio_file(self, buffer_id: str, filepath: str, 
                       format: str = "WAV", subtype: str = "PCM_16") -> bool:
        """Speichert einen Audio Buffer als Datei"""
        try:
            audio_buffer = self.get_audio_buffer(buffer_id)
            if not audio_buffer:
                logger.error(f"Audio Buffer nicht gefunden: {buffer_id}")
                return False
            
            # Audio-Datei speichern
            sf.write(filepath, audio_buffer.data, audio_buffer.sample_rate, 
                    format=format, subtype=subtype)
            
            logger.info(f"Audio-Datei gespeichert: {buffer_id} -> {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Audio-Datei Speichern fehlgeschlagen: {e}")
            return False
    
    # Effects Chain Management
    def add_effect(self, effect_id: str) -> bool:
        """Fügt einen Effect zur Effects Chain hinzu"""
        if effect_id not in self.effects_chain:
            self.effects_chain.append(effect_id)
            logger.info(f"Effect hinzugefügt: {effect_id}")
            return True
        return False
    
    def remove_effect(self, effect_id: str) -> bool:
        """Entfernt einen Effect aus der Effects Chain"""
        if effect_id in self.effects_chain:
            self.effects_chain.remove(effect_id)
            logger.info(f"Effect entfernt: {effect_id}")
            return True
        return False
    
    # Audio Processing
    def process_track(self, track, frames: int) -> np.ndarray:
        """Verarbeitet einen Track"""
        # TODO: Implement track-specific processing
        # Für jetzt: Leerer Buffer
        return np.zeros((frames, self.channels))
    
    # Utility Functions
    def generate_sine_wave(self, frequency: float, duration: float, 
                          amplitude: float = 0.5) -> np.ndarray:
        """Generiert eine Sinus-Welle"""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        sine_wave = amplitude * np.sin(2 * np.pi * frequency * t)
        return sine_wave.reshape(-1, 1)
    
    def generate_noise(self, duration: float, amplitude: float = 0.5) -> np.ndarray:
        """Generiert weißes Rauschen"""
        samples = int(duration * self.sample_rate)
        noise = amplitude * np.random.randn(samples)
        return noise.reshape(-1, 1)
    
    def mix_audio(self, audio_buffers: List[np.ndarray], 
                  volumes: List[float] = None) -> np.ndarray:
        """Mischt mehrere Audio Buffers"""
        if not audio_buffers:
            return np.array([])
        
        # Volumes standardisieren
        if volumes is None:
            volumes = [1.0] * len(audio_buffers)
        
        # Längsten Buffer finden
        max_length = max(len(buffer) for buffer in audio_buffers)
        
        # Alle Buffers auf gleiche Länge bringen
        mixed = np.zeros((max_length, self.channels))
        
        for i, (buffer, volume) in enumerate(zip(audio_buffers, volumes)):
            # Buffer auf Stereo konvertieren falls nötig
            if len(buffer.shape) == 1:
                buffer = buffer.reshape(-1, 1)
            
            # Buffer auf gleiche Länge bringen
            if len(buffer) < max_length:
                padding = np.zeros((max_length - len(buffer), buffer.shape[1]))
                buffer = np.vstack([buffer, padding])
            elif len(buffer) > max_length:
                buffer = buffer[:max_length]
            
            # Zum Mix hinzufügen
            mixed += buffer * volume
        
        # Clipping vermeiden
        mixed = np.clip(mixed, -1.0, 1.0)
        
        return mixed
    
    # Cleanup
    def shutdown(self):
        """Beendet die Audio Engine sauber"""
        if self.jack_client:
            self.jack_client.deactivate()
            self.jack_client.close()
        logger.info("Audio Engine heruntergefahren")

# Global Audio Engine Instance
audio_engine_instance = None

def get_audio_engine() -> AudioEngine:
    """Gibt die globale Audio Engine Instanz zurück"""
    global audio_engine_instance
    if audio_engine_instance is None:
        audio_engine_instance = AudioEngine()
    return audio_engine_instance

if __name__ == "__main__":
    # Test der Audio Engine
    audio_engine = get_audio_engine()
    
    # JACK Setup
    if audio_engine.setup_jack():
        # Test Audio generieren
        sine_wave = audio_engine.generate_sine_wave(440.0, 1.0)  # 1s A4
        noise = audio_engine.generate_noise(1.0)  # 1s Rauschen
        
        # Audio Buffers erstellen
        audio_engine.create_audio_buffer("sine", sine_wave)
        audio_engine.create_audio_buffer("noise", noise)
        
        # Audio mischen
        mixed = audio_engine.mix_audio([sine_wave, noise], [0.7, 0.3])
        audio_engine.create_audio_buffer("mixed", mixed)
        
        # Audio speichern
        audio_engine.save_audio_file("mixed", "test_output.wav")
        
        # Cleanup
        audio_engine.shutdown() 