#!/usr/bin/env python3
"""
Dexed MCP Server - LLM-basierte FM-Synth-Steuerung
Verwendet LLM für intelligente Patch-Generierung basierend auf Instrument-Beschreibungen
"""

import json
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import os

class DexedParameter(Enum):
    """Dexed-Parameter für LLM-Steuerung"""
    # Algorithm
    ALGORITHM = "algorithm"  # 1-32
    
    # LFO
    LFO_SPEED = "lfo_speed"  # 0-99
    LFO_DELAY = "lfo_delay"  # 0-99
    LFO_PITCH_MOD = "lfo_pitch_mod"  # 0-99
    LFO_AMP_MOD = "lfo_amp_mod"  # 0-99
    LFO_SYNC = "lfo_sync"  # true/false
    LFO_WAVE = "lfo_wave"  # 0-3
    
    # Modulation
    PITCH_MOD_SENS = "pitch_mod_sens"  # 0-7
    AMP_MOD_SENS = "amp_mod_sens"  # 0-3
    
    # Performance
    TRANSPOSE = "transpose"  # -24 bis +24
    POLY_MODE = "poly_mode"  # 0=Mono, 1=Poly
    PITCH_BEND_RANGE = "pitch_bend_range"  # 0-12
    PORTAMENTO_MODE = "portamento_mode"  # 0=Off, 1=On
    PORTAMENTO_TIME = "portamento_time"  # 0-99
    
    # Operator-Parameter
    OP_LEVEL = "op_level"  # 0-99
    OP_FREQ_RATIO = "op_freq_ratio"  # 0.5-32.0
    OP_DETUNE = "op_detune"  # -7 bis +7
    OP_ATTACK = "op_attack"  # 0-99
    OP_DECAY = "op_decay"  # 0-99
    OP_SUSTAIN = "op_sustain"  # 0-99
    OP_RELEASE = "op_release"  # 0-99
    OP_FEEDBACK = "op_feedback"  # 0-7
    OP_KEY_SCALE = "op_key_scale"  # 0-3
    OP_VELOCITY_SENSE = "op_velocity_sense"  # 0-7
    OP_WAVE = "op_wave"  # 0-3
    OP_ENABLED = "op_enabled"  # true/false

@dataclass
class DexedPatch:
    """Dexed-Patch mit allen Parametern"""
    name: str
    algorithm: int = 1
    feedback: int = 0
    lfo_speed: int = 0
    lfo_delay: int = 0
    lfo_pitch_mod: int = 0
    lfo_amp_mod: int = 0
    lfo_sync: bool = False
    lfo_wave: int = 0
    pitch_mod_sens: int = 0
    amp_mod_sens: int = 0
    transpose: int = 0
    poly_mode: int = 1
    pitch_bend_range: int = 2
    portamento_mode: int = 0
    portamento_time: int = 0
    operators: List[Dict] = None
    
    def __post_init__(self):
        if self.operators is None:
            self.operators = [self._create_default_operator() for _ in range(6)]
    
    def _create_default_operator(self) -> Dict:
        return {
            "level": 99,
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
            "enabled": True
        }

class DexedMCPServer:
    """MCP-Server für Dexed FM-Synth-Steuerung"""
    
    def __init__(self, llm_endpoint: str = "https://openai.inference.de-txl.ionos.com/v1/chat/completions"):
        self.llm_endpoint = llm_endpoint
        self.patches = {}
        self.current_patch_id = 0
        # Ionos API Key aus Umgebungsvariable oder Default
        self.api_key = os.environ.get('IONOS_API_KEY', 'eyJ0eXAiOiJKV1QiLCJraWQiOiIwYzdlNjgyMi0yNDI1LTRlYWQtODQ1MC05N2ZiMTY4YzE1MjYiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpb25vc2Nsb3VkIiwiaWF0IjoxNzUyMzM5OTIyLCJjbGllbnQiOiJVU0VSIiwiaWRlbnRpdHkiOnsicmVzZWxsZXJJZCI6MSwicmVnRG9tYWluIjoiaW9ub3MuZGUiLCJyb2xlIjoib3duZXIiLCJjb250cmFjdE51bWJlciI6MzQ5MDE5MDIsImlzUGFyZW50IjpmYWxzZSwicHJpdmlsZWdlcyI6WyJEQVRBX0NFTlRFUl9DUkVBVEUiLCJTTkFQU0hPVF9DUkVBVEUiLCJJUF9CTE9DS19SRVNFUlZFIiwiTUFOQUdFX0RBVEFQTEFURk9STSIsIkFDQ0VTU19BQ1RJVklUWV9MT0ciLCJQQ0NfQ1JFQVRFIiwiQUNDRVNTX1MzX09CSkVDVF9TVE9SQUdFIiwiQkFDS1VQX1VOSVRfQ1JFQVRFIiwiQ1JFQVRFX0lOVEVSTkVUX0FDQ0VTUyIsIks4U19DTFVTVEVSX0NSRUFURSIsIkZMT1dfTE9HX0NSRUFURSIsIkFDQ0VTU19BTkRfTUFOQUdFX01PTklUT1JJTkciLCJBQ0NFU1NfQU5EX01BTkFHRV9DRVJUSUZJQ0FURVMiLCJBQ0NFU1NfQU5EX01BTkFHRV9MT0dHSU5HIiwiTUFOQUdFX0RCQUFTIiwiQUNDRVNTX0FORF9NQU5BR0VfRE5TIiwiQUNDRVNTX0FORF9NQU5BR0VfQ0ROIiwiQUNDRVNTX0FORF9NQU5BR0VfVlBOIiwiQUNDRVNTX0FORF9NQU5BR0VfQVBJX0dBVEVXQVkiLCJBQ0NFU1NfQU5EX01BTkFHRV9OR1MiLCJBQ0NFU1NfQU5EX01BTkFHRV9LQUFTIiwiQUNDRVNTX0FORF9NQU5BR0VfTkVUV09SS19GSUxFX1NUT1JBR0UiLCJBQ0NFU1NfQU5EX01BTkFHRV9BSV9NT0RFTF9IVUIiLCJDUkVBVEVfTkVUV09SS19TRUNVUklUWV9HUk9VUFMiLCJBQ0NFU1NfQU5EX01BTkFHRV9JQU1fUkVTT1VSQ0VTIl0sInV1aWQiOiI2YmI3YzQ2Zi0wNGI1LTRlNjYtOTY2Ni0wMTRhNDk1ZTJlODMifSwiZXhwIjoxNzYwMTE1OTIyfQ.Bu2uY9G5FClUcNAmwmN3arQoiYt90cGm0OANpPQUuAAKN6e8KfrC7ZMgOfDGyHujVGQug86KFDG2z1q1Pd0KWdqUO26-n1z2csCzct9FVgOq69SvGieuV1GrVqXySxgPU_xR3BqmW_85FFNJsU7eocIzDZ7eJLJdXa9ctLDf9kxvLWH9b0F-jI9J3qglfbjQvbImOS9Kc8HbG__JpyLMxRwgmp0wBwl3OgWbGeypB8UqP23UxgVbHGh_DoNbfJ4tv2xxiW-1dGsrmmfOnIb_6oiP4TVTUUt-j3T4IUhEi2oLbI2W5QGW5k4iVQa7_xd9VdTMZ3iUcTY96s3-xrh3Iw')
    
    def create_patch_from_description(self, description: str) -> Dict:
        """Erstellt Patch basierend auf LLM-Beschreibung"""
        
        # LLM-Prompt für Patch-Generierung
        prompt = self._create_llm_prompt(description)
        
        # Rufe LLM auf
        llm_response = self._call_llm(prompt)
        
        # Parse LLM-Antwort
        patch_config = self._parse_llm_response(llm_response)
        
        # Erstelle Patch
        patch = DexedPatch(
            name=description,
            **patch_config
        )
        
        # Speichere Patch
        patch_id = f"patch_{self.current_patch_id}"
        self.patches[patch_id] = patch
        self.current_patch_id += 1
        
        return {
            "patch_id": patch_id,
            "patch": self._patch_to_dict(patch),
            "description": description
        }
    
    def _create_llm_prompt(self, description: str) -> str:
        """Erstellt einen LLM-Prompt für Patch-Generierung"""
        return f"""Erstelle einen schönen, warmen FM-Synthesizer-Patch für Dexed basierend auf dieser Beschreibung: "{description}"

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt, ohne zusätzlichen Text!

Verwende diese JSON-Vorlage und passe die Werte an:

{{
  "algorithm": 1,
  "lfo_speed": 0,
  "lfo_delay": 0,
  "lfo_pitch_mod": 0,
  "lfo_amp_mod": 0,
  "lfo_sync": false,
  "lfo_wave": 0,
  "pitch_mod_sens": 0,
  "amp_mod_sens": 0,
  "transpose": 0,
  "poly_mode": 1,
  "pitch_bend_range": 2,
  "portamento_mode": 0,
  "portamento_time": 0,
  "operators": [
    {{
      "level": 85,
      "freq_ratio": 1.0,
      "detune": 0,
      "attack": 0,
      "decay": 20,
      "sustain": 85,
      "release": 35,
      "feedback": 2,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }},
    {{
      "level": 70,
      "freq_ratio": 2.0,
      "detune": 0,
      "attack": 5,
      "decay": 25,
      "sustain": 75,
      "release": 40,
      "feedback": 0,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }},
    {{
      "level": 55,
      "freq_ratio": 3.0,
      "detune": 0,
      "attack": 10,
      "decay": 30,
      "sustain": 65,
      "release": 45,
      "feedback": 0,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }},
    {{
      "level": 40,
      "freq_ratio": 4.0,
      "detune": 0,
      "attack": 15,
      "decay": 35,
      "sustain": 55,
      "release": 50,
      "feedback": 0,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }},
    {{
      "level": 25,
      "freq_ratio": 5.0,
      "detune": 0,
      "attack": 20,
      "decay": 40,
      "sustain": 45,
      "release": 55,
      "feedback": 0,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }},
    {{
      "level": 15,
      "freq_ratio": 6.0,
      "detune": 0,
      "attack": 25,
      "decay": 45,
      "sustain": 35,
      "release": 60,
      "feedback": 0,
      "key_scale": 0,
      "velocity_sense": 0,
      "wave": 0,
      "enabled": true
    }}
  ]
}}

MÖGLICHE WERTE:
- algorithm: 1-32 (DX7-Algorithmen)
- lfo_speed: 0-99
- lfo_delay: 0-99
- lfo_pitch_mod: 0-99
- lfo_amp_mod: 0-99
- lfo_wave: 0-3 (0=Sine, 1=Triangle, 2=Square, 3=Saw)
- pitch_mod_sens: 0-7
- amp_mod_sens: 0-3
- transpose: -24 bis +24
- poly_mode: 0=Mono, 1=Poly
- pitch_bend_range: 0-12
- portamento_mode: 0=Off, 1=On
- portamento_time: 0-99

Für jeden Operator:
- level: 0-99
- freq_ratio: 0.5-32.0
- detune: -7 bis +7
- attack: 0-99
- decay: 0-99
- sustain: 0-99
- release: 0-99
- feedback: 0-7
- key_scale: 0-3
- velocity_sense: 0-7
- wave: 0-3 (0=Sine, 1=Triangle, 2=Square, 3=Saw)
- enabled: true/false

Antworte NUR mit einem gültigen JSON-Objekt für den Dexed-Patch, ohne zusätzlichen Text oder Erklärungen!"""
    
    def _call_llm(self, prompt: str) -> str:
        """Ruft Ionos LLM-API auf"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            }
            
            payload = {
                "model": "meta-llama/Llama-3.3-70B-Instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": "Du bist ein FM-Synthesizer-Experte. Erstelle komplexe, realistische Sounds mit mehreren aktiven Operatoren. Antworte nur mit gültigem JSON."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 1500
            }
            
            response = requests.post(self.llm_endpoint, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('choices', [{}])[0].get('message', {}).get('content', '')
            else:
                print(f"Ionos API-Fehler: {response.status_code}")
                return self._get_fallback_patch()
                        
        except Exception as e:
            print(f"Fehler beim Ionos API-Aufruf: {e}")
            return self._get_fallback_patch()
    
    def _get_fallback_patch(self) -> str:
        """Fallback-Patch für schöne Sounds wenn LLM nicht verfügbar"""
        return '''{
  "algorithm": 5,
  "lfo_speed": 0,
  "lfo_delay": 0,
  "lfo_pitch_mod": 0,
  "lfo_amp_mod": 0,
  "lfo_sync": false,
  "lfo_wave": 0,
  "pitch_mod_sens": 0,
  "amp_mod_sens": 0,
  "transpose": 0,
  "poly_mode": 1,
  "pitch_bend_range": 2,
  "portamento_mode": 0,
  "portamento_time": 0,
  "operators": [
    {"level": 90, "freq_ratio": 1.0, "detune": 0, "attack": 0, "decay": 8, "sustain": 95, "release": 25, "feedback": 1, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true},
    {"level": 75, "freq_ratio": 1.25, "detune": 0, "attack": 2, "decay": 12, "sustain": 88, "release": 30, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true},
    {"level": 60, "freq_ratio": 1.5, "detune": 0, "attack": 4, "decay": 16, "sustain": 80, "release": 35, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true},
    {"level": 45, "freq_ratio": 2.0, "detune": 0, "attack": 6, "decay": 20, "sustain": 70, "release": 40, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true},
    {"level": 30, "freq_ratio": 2.5, "detune": 0, "attack": 8, "decay": 24, "sustain": 60, "release": 45, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true},
    {"level": 20, "freq_ratio": 3.0, "detune": 0, "attack": 10, "decay": 28, "sustain": 50, "release": 50, "feedback": 0, "key_scale": 0, "velocity_sense": 0, "wave": 0, "enabled": true}
  ]
}'''
    
    def _parse_llm_response(self, response: str) -> Dict:
        """Parst LLM-Antwort zu Patch-Konfiguration"""
        try:
            # Extrahiere JSON aus LLM-Antwort
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start != -1 and json_end != 0:
                json_str = response[json_start:json_end]
                patch_config = json.loads(json_str)
                
                # Konvertiere freq_ratio zu Float für alle Operatoren
                if 'operators' in patch_config:
                    for operator in patch_config['operators']:
                        if 'freq_ratio' in operator:
                            operator['freq_ratio'] = float(operator['freq_ratio'])
                
                return patch_config
            else:
                print("Kein JSON in LLM-Antwort gefunden")
                return json.loads(self._get_fallback_patch())
                
        except Exception as e:
            print(f"Fehler beim Parsen der LLM-Antwort: {e}")
            return json.loads(self._get_fallback_patch())
    
    def _patch_to_dict(self, patch: DexedPatch) -> Dict:
        """Konvertiert Patch zu Dict"""
        return {
            "name": patch.name,
            "algorithm": patch.algorithm,
            "feedback": patch.feedback,
            "lfo_speed": patch.lfo_speed,
            "lfo_delay": patch.lfo_delay,
            "lfo_pitch_mod": patch.lfo_pitch_mod,
            "lfo_amp_mod": patch.lfo_amp_mod,
            "lfo_sync": patch.lfo_sync,
            "lfo_wave": patch.lfo_wave,
            "pitch_mod_sens": patch.pitch_mod_sens,
            "amp_mod_sens": patch.amp_mod_sens,
            "transpose": patch.transpose,
            "poly_mode": patch.poly_mode,
            "pitch_bend_range": patch.pitch_bend_range,
            "portamento_mode": patch.portamento_mode,
            "portamento_time": patch.portamento_time,
            "operators": patch.operators
        }
    
    def generate_audio(self, patch_id: str, note: int = 60, velocity: int = 100, duration: float = 2.0) -> Dict:
        """Generiert Audio für einen Patch"""
        if patch_id not in self.patches:
            return {"success": False, "error": "Patch nicht gefunden"}
        
        patch = self.patches[patch_id]
        
        # Rufe Dexed-API auf
        try:
            payload = {
                "patch": self._patch_to_dict(patch),
                "note": note,
                "velocity": velocity,
                "duration": duration
            }
            
            response = requests.post('http://dexed-engine:8081/api/dexed/generate-audio', 
                                  json=payload, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": f"Dexed-API-Fehler: {response.status_code}"}
                        
        except Exception as e:
            return {"success": False, "error": f"Fehler: {e}"}
    
    def get_patch(self, patch_id: str) -> Optional[Dict]:
        """Gibt Patch zurück"""
        if patch_id in self.patches:
            return self._patch_to_dict(self.patches[patch_id])
        return None
    
    def list_patches(self) -> List[Dict]:
        """Listet alle Patches"""
        return [
            {
                "patch_id": patch_id,
                "name": patch.name,
                "algorithm": patch.algorithm
            }
            for patch_id, patch in self.patches.items()
        ]

# Flask-Server für REST-API
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Globale MCP-Server-Instanz
mcp_server = DexedMCPServer()

@app.route('/api/mcp/create-patch', methods=['POST'])
def create_patch():
    """Erstellt Patch basierend auf LLM-Beschreibung"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        
        if not description:
            return jsonify({
                'success': False,
                'message': 'Beschreibung ist erforderlich'
            }), 400
        
        # Erstelle Patch mit LLM
        result = mcp_server.create_patch_from_description(description)
        
        return jsonify({
            'success': True,
            'message': 'Patch mit LLM erstellt',
            **result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Erstellen des Patches',
            'error': str(e)
        }), 500

@app.route('/api/mcp/generate-audio', methods=['POST'])
def generate_audio():
    """Generiert Audio für einen Patch"""
    try:
        data = request.get_json()
        patch_id = data.get('patch_id')
        note = data.get('note', 60)
        velocity = data.get('velocity', 100)
        duration = data.get('duration', 2.0)
        
        if not patch_id:
            return jsonify({
                'success': False,
                'message': 'Patch-ID ist erforderlich'
            }), 400
        
        # Generiere Audio
        result = mcp_server.generate_audio(patch_id, note, velocity, duration)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Generieren des Audios',
            'error': str(e)
        }), 500

@app.route('/api/mcp/patches', methods=['GET'])
def list_patches():
    """Listet alle Patches"""
    try:
        patches = mcp_server.list_patches()
        
        return jsonify({
            'success': True,
            'message': 'Patches geladen',
            'patches': patches
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Laden der Patches',
            'error': str(e)
        }), 500

@app.route('/api/mcp/patch/<patch_id>', methods=['GET'])
def get_patch(patch_id):
    """Gibt Patch zurück"""
    try:
        patch = mcp_server.get_patch(patch_id)
        
        if patch:
            return jsonify({
                'success': True,
                'message': 'Patch geladen',
                'patch': patch
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Patch nicht gefunden'
            }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Fehler beim Laden des Patches',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('MCP_PORT', 8082))
    app.run(host='0.0.0.0', port=port, debug=True) 