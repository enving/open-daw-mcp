#!/usr/bin/env python3
"""
Audio Export Module für Open DAW MCP

Konvertiert MIDI-Dateien zu Audio mit Python-basierten Audio-Effekten.
"""

import os
import logging
import numpy as np
from typing import List, Optional
from pathlib import Path

# Audio Libraries
try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False
    logging.warning("soundfile nicht verfügbar - Audio-Export deaktiviert")

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logging.warning("librosa nicht verfügbar - Audio-Effekte deaktiviert")

logger = logging.getLogger(__name__)

class AudioExporter:
    """Exportiert MIDI zu Audio mit Python-basierten Effekten"""
    
    def __init__(self):
        self.output_dir = Path("output/audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Audio-Parameter
        self.sample_rate = 44100
        self.bit_depth = 16
        
        # Effekt-Parameter
        self.reverb_params = {
            "room_size": 0.5,
            "damping": 0.5,
            "wet_level": 0.3,
            "dry_level": 0.7
        }
        
        self.delay_params = {
            "delay_time": 0.5,
            "feedback": 0.3,
            "mix": 0.3
        }
        
        self.compressor_params = {
            "threshold": -20,
            "ratio": 4.0,
            "attack": 0.01,
            "release": 0.1
        }
        
        logger.info("✅ Audio Exporter initialisiert")
    
    def is_available(self) -> bool:
        """Prüft ob Audio-Export verfügbar ist"""
        return SOUNDFILE_AVAILABLE
    
    def export_midi_to_audio(self, midi_file: str, output_file: str = None, 
                           format: str = "wav") -> str:
        """
        Exportiert MIDI zu Audio
        
        Args:
            midi_file: Pfad zur MIDI-Datei
            output_file: Ausgabedatei (optional)
            format: Audio-Format (wav, flac)
            
        Returns:
            Pfad zur erstellten Audio-Datei
        """
        if not self.is_available():
            logger.error("❌ Audio-Export nicht verfügbar")
            return None
        
        if not output_file:
            output_file = self.output_dir / f"{Path(midi_file).stem}.{format}"
        
        try:
            # Simuliere MIDI zu Audio Konvertierung
            # In der Praxis würde hier ein MIDI-Synthesizer verwendet
            audio_data = self._synthesize_midi(midi_file)
            
            # Speichere Audio
            sf.write(str(output_file), audio_data, self.sample_rate)
            
            logger.info(f"✅ Audio exportiert: {output_file}")
            return str(output_file)
            
        except Exception as e:
            logger.error(f"❌ Audio-Export fehlgeschlagen: {e}")
            return None
    
    def _synthesize_midi(self, midi_file: str) -> np.ndarray:
        """
        Synthetisiert MIDI zu Audio (Simulation)
        
        Args:
            midi_file: Pfad zur MIDI-Datei
            
        Returns:
            Audio-Daten als numpy array
        """
        # Simuliere 5 Sekunden Audio
        duration = 5.0
        samples = int(self.sample_rate * duration)
        
        # Erstelle einfache Sinus-Welle als Platzhalter
        frequency = 440.0  # A4
        t = np.linspace(0, duration, samples)
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Füge etwas Rauschen hinzu für Realismus
        noise = np.random.normal(0, 0.01, samples)
        audio_data += noise
        
        return audio_data
    
    def apply_reverb(self, audio_data: np.ndarray) -> np.ndarray:
        """
        Wendet Reverb-Effekt an
        
        Args:
            audio_data: Eingangs-Audio
            
        Returns:
            Audio mit Reverb
        """
        if not LIBROSA_AVAILABLE:
            return audio_data
        
        try:
            # Einfacher Reverb-Effekt
            room_size = self.reverb_params["room_size"]
            damping = self.reverb_params["damping"]
            wet_level = self.reverb_params["wet_level"]
            dry_level = self.reverb_params["dry_level"]
            
            # Erstelle verzögerte Kopie
            delay_samples = int(room_size * self.sample_rate)
            delayed = np.zeros_like(audio_data)
            delayed[delay_samples:] = audio_data[:-delay_samples] * damping
            
            # Kombiniere trocken und nass
            result = dry_level * audio_data + wet_level * delayed
            
            return result
            
        except Exception as e:
            logger.error(f"Reverb-Effekt fehlgeschlagen: {e}")
            return audio_data
    
    def apply_delay(self, audio_data: np.ndarray) -> np.ndarray:
        """
        Wendet Delay-Effekt an
        
        Args:
            audio_data: Eingangs-Audio
            
        Returns:
            Audio mit Delay
        """
        try:
            delay_time = self.delay_params["delay_time"]
            feedback = self.delay_params["feedback"]
            mix = self.delay_params["mix"]
            
            # Erstelle verzögerte Kopie
            delay_samples = int(delay_time * self.sample_rate)
            delayed = np.zeros_like(audio_data)
            delayed[delay_samples:] = audio_data[:-delay_samples] * feedback
            
            # Kombiniere Original und Delay
            result = (1 - mix) * audio_data + mix * delayed
            
            return result
            
        except Exception as e:
            logger.error(f"Delay-Effekt fehlgeschlagen: {e}")
            return audio_data
    
    def apply_compression(self, audio_data: np.ndarray) -> np.ndarray:
        """
        Wendet Kompression an
        
        Args:
            audio_data: Eingangs-Audio
            
        Returns:
            Komprimiertes Audio
        """
        try:
            threshold = self.compressor_params["threshold"]
            ratio = self.compressor_params["ratio"]
            
            # Einfache Kompression
            threshold_linear = 10 ** (threshold / 20)
            
            # Berechne Amplitude
            amplitude = np.abs(audio_data)
            
            # Kompression anwenden
            compressed = np.where(amplitude > threshold_linear,
                                threshold_linear + (amplitude - threshold_linear) / ratio,
                                amplitude)
            
            # Behalte Vorzeichen bei
            result = np.sign(audio_data) * compressed
            
            return result
            
        except Exception as e:
            logger.error(f"Kompression fehlgeschlagen: {e}")
            return audio_data
    
    def apply_effects(self, audio_data: np.ndarray, effects: List[str] = None) -> np.ndarray:
        """
        Wendet mehrere Effekte an
        
        Args:
            audio_data: Eingangs-Audio
            effects: Liste der anzuwendenden Effekte
            
        Returns:
            Audio mit Effekten
        """
        if effects is None:
            effects = ["reverb", "delay", "compression"]
        
        result = audio_data.copy()
        
        for effect in effects:
            if effect == "reverb":
                result = self.apply_reverb(result)
            elif effect == "delay":
                result = self.apply_delay(result)
            elif effect == "compression":
                result = self.apply_compression(result)
        
        return result
    
    def combine_audio_files(self, audio_files: List[str], output_file: str) -> bool:
        """
        Kombiniert mehrere Audio-Dateien
        
        Args:
            audio_files: Liste der Audio-Dateien
            output_file: Ausgabedatei
            
        Returns:
            True wenn erfolgreich
        """
        if not self.is_available():
            logger.error("❌ Audio-Export nicht verfügbar")
            return False
        
        try:
            combined_audio = None
            
            for audio_file in audio_files:
                if os.path.exists(audio_file):
                    # Lade Audio
                    audio_data, sample_rate = sf.read(audio_file)
                    
                    # Konvertiere zu Mono falls nötig
                    if len(audio_data.shape) > 1:
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Kombiniere mit vorherigem Audio
                    if combined_audio is None:
                        combined_audio = audio_data
                    else:
                        # Pad kürzeres Audio
                        max_length = max(len(combined_audio), len(audio_data))
                        if len(combined_audio) < max_length:
                            combined_audio = np.pad(combined_audio, (0, max_length - len(combined_audio)))
                        if len(audio_data) < max_length:
                            audio_data = np.pad(audio_data, (0, max_length - len(audio_data)))
                        
                        # Addiere Audio (einfache Mischung)
                        combined_audio = combined_audio + audio_data
            
            if combined_audio is not None:
                # Normalisiere
                max_amplitude = np.max(np.abs(combined_audio))
                if max_amplitude > 0:
                    combined_audio = combined_audio / max_amplitude * 0.8
                
                # Speichere
                sf.write(output_file, combined_audio, self.sample_rate)
                logger.info(f"✅ Audio-Dateien kombiniert: {output_file}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Audio-Kombination fehlgeschlagen: {e}")
            return False
    
    def create_master_track(self, audio_files: List[str], output_file: str,
                          effects: List[str] = None) -> bool:
        """
        Erstellt einen Master-Track mit Effekten
        
        Args:
            audio_files: Liste der Audio-Dateien
            output_file: Ausgabedatei
            effects: Liste der anzuwendenden Effekte
            
        Returns:
            True wenn erfolgreich
        """
        try:
            # Kombiniere Audio-Dateien
            if not self.combine_audio_files(audio_files, output_file):
                return False
            
            # Lade kombiniertes Audio
            audio_data, sample_rate = sf.read(output_file)
            
            # Wende Effekte an
            if effects:
                audio_data = self.apply_effects(audio_data, effects)
                
                # Speichere mit Effekten
                sf.write(output_file, audio_data, sample_rate)
            
            logger.info(f"✅ Master-Track erstellt: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Master-Track-Erstellung fehlgeschlagen: {e}")
            return False

# Factory-Funktion
def get_audio_exporter() -> AudioExporter:
    """Erstellt eine AudioExporter-Instanz"""
    return AudioExporter() 