#!/usr/bin/env python3
"""
Headless Reaper Setup für Open DAW MCP

Basierend auf WildFX Pipeline für Reaper Headless-Betrieb.
"""

import logging
import os
import subprocess
import time
import signal
import psutil
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class HeadlessReaperManager:
    """
    Verwaltet Headless Reaper Setup
    
    Funktionen:
    - JACK Audio Server Start/Stop
    - Reaper Headless Start/Stop
    - ReaPy Konfiguration
    - Health Checks
    """
    
    def __init__(self):
        self.jack_process: Optional[subprocess.Popen] = None
        self.reaper_process: Optional[subprocess.Popen] = None
        self.xvfb_process: Optional[subprocess.Popen] = None
        self.is_running = False
        
    def start_jack_server(self) -> bool:
        """Startet JACK Audio Server"""
        try:
            # Kill existing JACK processes
            self._kill_jack_processes()
            
            # Start JACK with dummy driver
            logger.info("Starte JACK Audio Server...")
            self.jack_process = subprocess.Popen([
                "jackd", "-d", "dummy", "-r", "44100", "-p", "1024"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for JACK to initialize
            time.sleep(2)
            
            if self.jack_process.poll() is None:
                logger.info("JACK Audio Server gestartet")
                return True
            else:
                logger.error("JACK Audio Server konnte nicht gestartet werden")
                return False
                
        except Exception as e:
            logger.error(f"JACK Start fehlgeschlagen: {e}")
            return False
    
    def start_xvfb(self) -> bool:
        """Startet Xvfb für Headless-Modus"""
        try:
            logger.info("Starte Xvfb...")
            self.xvfb_process = subprocess.Popen([
                "Xvfb", ":99", "-screen", "0", "1024x768x24"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Set DISPLAY environment
            os.environ["DISPLAY"] = ":99"
            
            time.sleep(1)
            
            if self.xvfb_process.poll() is None:
                logger.info("Xvfb gestartet")
                return True
            else:
                logger.error("Xvfb konnte nicht gestartet werden")
                return False
                
        except Exception as e:
            logger.error(f"Xvfb Start fehlgeschlagen: {e}")
            return False
    
    def start_reaper(self) -> bool:
        """Startet Reaper Headless"""
        try:
            # Kill existing Reaper processes
            self._kill_reaper_processes()
            
            logger.info("Starte Reaper Headless...")
            self.reaper_process = subprocess.Popen([
                "reaper", "-nosplash", "-nonewinst"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for Reaper to initialize
            logger.info("Warte auf Reaper Initialisierung...")
            for i in range(30):
                if self.reaper_process.poll() is None:
                    # Check if Reaper is responding
                    try:
                        import reapy
                        reapy.configure_reaper()
                        logger.info("Reaper erfolgreich gestartet und konfiguriert")
                        return True
                    except Exception as e:
                        logger.debug(f"Reaper noch nicht bereit ({i+1}/30): {e}")
                        time.sleep(1)
                else:
                    logger.error("Reaper Prozess beendet")
                    return False
            
            logger.error("Reaper Initialisierung Timeout")
            return False
            
        except Exception as e:
            logger.error(f"Reaper Start fehlgeschlagen: {e}")
            return False
    
    def setup_headless_environment(self) -> bool:
        """Komplettes Headless Setup"""
        try:
            logger.info("Starte Headless Reaper Environment...")
            
            # 1. Start Xvfb
            if not self.start_xvfb():
                return False
            
            # 2. Start JACK
            if not self.start_jack_server():
                return False
            
            # 3. Start Reaper
            if not self.start_reaper():
                return False
            
            self.is_running = True
            logger.info("Headless Reaper Environment erfolgreich gestartet")
            return True
            
        except Exception as e:
            logger.error(f"Headless Setup fehlgeschlagen: {e}")
            return False
    
    def stop_all(self):
        """Stoppt alle Prozesse"""
        try:
            logger.info("Stoppe Headless Environment...")
            
            # Stop Reaper
            if self.reaper_process:
                self.reaper_process.terminate()
                self.reaper_process.wait(timeout=10)
                logger.info("Reaper gestoppt")
            
            # Stop JACK
            if self.jack_process:
                self.jack_process.terminate()
                self.jack_process.wait(timeout=5)
                logger.info("JACK gestoppt")
            
            # Stop Xvfb
            if self.xvfb_process:
                self.xvfb_process.terminate()
                self.xvfb_process.wait(timeout=5)
                logger.info("Xvfb gestoppt")
            
            # Kill any remaining processes
            self._kill_jack_processes()
            self._kill_reaper_processes()
            
            self.is_running = False
            logger.info("Headless Environment gestoppt")
            
        except Exception as e:
            logger.error(f"Stop fehlgeschlagen: {e}")
    
    def _kill_jack_processes(self):
        """Killt alle JACK Prozesse"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                if 'jackd' in proc.info['name']:
                    proc.terminate()
        except Exception as e:
            logger.debug(f"JACK Kill fehlgeschlagen: {e}")
    
    def _kill_reaper_processes(self):
        """Killt alle Reaper Prozesse"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                if 'reaper' in proc.info['name']:
                    proc.terminate()
        except Exception as e:
            logger.debug(f"Reaper Kill fehlgeschlagen: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Gibt Status aller Komponenten zurück"""
        return {
            "is_running": self.is_running,
            "jack_running": self.jack_process and self.jack_process.poll() is None,
            "reaper_running": self.reaper_process and self.reaper_process.poll() is None,
            "xvfb_running": self.xvfb_process and self.xvfb_process.poll() is None
        }

def get_headless_reaper_manager() -> HeadlessReaperManager:
    """Factory-Funktion für HeadlessReaperManager"""
    return HeadlessReaperManager() 