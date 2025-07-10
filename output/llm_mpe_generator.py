#!/usr/bin/env python3
"""
LLM MPE Generator
Generiert MPE-Daten basierend auf LLM-Song-Beschreibungen
"""

import json
import random
import time
from typing import Dict, List, Tuple

class LLMMPEGenerator:
    def __init__(self):
        self.styles = {
            'tame_impala': {
                'notes': [60, 64, 67, 72, 76, 79],  # C4, E4, G4, C5, E5, G5
                'velocity_range': (70, 90),
                'pressure_range': (60, 80),
                'timbre_range': (50, 70),
                'tempo': 120,
                'description': 'Psychedelic Rock mit Synth-Pads'
            },
            'ambient': {
                'notes': [48, 52, 55, 60, 64, 67],  # C3, E3, G3, C4, E4, G4
                'velocity_range': (40, 60),
                'pressure_range': (30, 50),
                'timbre_range': (20, 40),
                'tempo': 80,
                'description': 'Atmosphärische Ambient-Klänge'
            },
            'techno': {
                'notes': [36, 42, 48, 54, 60, 66],  # C2, F#2, C3, F#3, C4, F#4
                'velocity_range': (80, 100),
                'pressure_range': (70, 90),
                'timbre_range': (60, 80),
                'tempo': 140,
                'description': 'Energetischer Techno mit Bass'
            },
            'house': {
                'notes': [48, 52, 55, 60, 64, 67],  # C3, E3, G3, C4, E4, G4
                'velocity_range': (60, 80),
                'pressure_range': (50, 70),
                'timbre_range': (40, 60),
                'tempo': 128,
                'description': 'Groovy House mit Soul'
            },
            'trance': {
                'notes': [60, 64, 67, 72, 76, 79],  # C4, E4, G4, C5, E5, G5
                'velocity_range': (70, 90),
                'pressure_range': (60, 80),
                'timbre_range': (50, 70),
                'tempo': 138,
                'description': 'Uplifting Trance mit Leads'
            }
        }
    
    def detect_style_from_description(self, description: str) -> str:
        """Erkennt Musikstil aus Beschreibung"""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ['tame impala', 'psychedelic', 'psych', 'indie']):
            return 'tame_impala'
        elif any(word in description_lower for word in ['ambient', 'atmospheric', 'chill', 'relaxing']):
            return 'ambient'
        elif any(word in description_lower for word in ['techno', 'electronic', 'industrial', 'dark']):
            return 'techno'
        elif any(word in description_lower for word in ['house', 'groove', 'soul', 'disco']):
            return 'house'
        elif any(word in description_lower for word in ['trance', 'uplifting', 'euphoric', 'melodic']):
            return 'trance'
        else:
            return 'tame_impala'  # Default
    
    def generate_mpe_data(self, style: str, duration: int = 10) -> List[Dict]:
        """Generiert MPE-Daten für einen Stil"""
        if style not in self.styles:
            style = 'tame_impala'
        
        style_config = self.styles[style]
        mpe_data = []
        
        # Anzahl Noten basierend auf Tempo und Dauer
        num_notes = int((style_config['tempo'] / 60) * duration)
        
        for i in range(num_notes):
            # Zufällige Note aus Stil-Konfiguration
            note = random.choice(style_config['notes'])
            
            # Velocity, Pressure, Timbre basierend auf Stil
            velocity = random.randint(*style_config['velocity_range'])
            pressure = random.randint(*style_config['pressure_range'])
            timbre = random.randint(*style_config['timbre_range'])
            
            # Pitch Bend für Expressivität
            pitch_bend = 8192 + random.randint(-1000, 1000)
            
            # Zeitstempel
            timestamp = (i / num_notes) * duration
            
            mpe_data.append({
                'timestamp': timestamp,
                'note': note,
                'velocity': velocity,
                'pressure': pressure,
                'timbre': timbre,
                'pitch_bend': pitch_bend,
                'channel': i % 3  # Verschiedene Kanäle
            })
        
        return mpe_data
    
    def generate_from_llm_description(self, description: str, duration: int = 10) -> Dict:
        """Generiert MPE-Daten aus LLM-Beschreibung"""
        print(f"🎵 Analysiere Beschreibung: {description}")
        
        # Stil erkennen
        style = self.detect_style_from_description(description)
        style_config = self.styles[style]
        
        print(f"🎛️ Erkannt: {style_config['description']}")
        
        # MPE-Daten generieren
        mpe_data = self.generate_mpe_data(style, duration)
        
        return {
            'style': style,
            'description': style_config['description'],
            'tempo': style_config['tempo'],
            'duration': duration,
            'mpe_data': mpe_data
        }

def main():
    """Hauptfunktion"""
    print("🤖 LLM MPE Generator Start")
    print("===========================")
    
    generator = LLMMPEGenerator()
    
    # Test-Beschreibungen
    test_descriptions = [
        "Erstelle einen Tame Impala ähnlichen Song mit psychedelischen Synth-Pads",
        "Mache einen entspannenden Ambient-Track mit atmosphärischen Klängen",
        "Generiere einen energetischen Techno-Song mit dunklen Bass-Linien",
        "Erstelle einen groovy House-Track mit Soul-Elementen",
        "Mache einen euphorischen Trance-Song mit uplifting Melodien"
    ]
    
    for description in test_descriptions:
        print(f"\n🎵 Teste: {description}")
        
        # MPE-Daten generieren
        result = generator.generate_from_llm_description(description, 5)
        
        print(f"✅ Generiert: {result['style']} - {result['description']}")
        print(f"📊 {len(result['mpe_data'])} MPE-Events")
        
        # Erste paar Events anzeigen
        for i, event in enumerate(result['mpe_data'][:3]):
            print(f"  Event {i+1}: Note={event['note']}, Velocity={event['velocity']}, Pressure={event['pressure']}")
    
    print("\n✅ LLM MPE Generator Tests abgeschlossen")

if __name__ == "__main__":
    main()
