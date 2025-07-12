"""
Plugin Host für die Headless DAW
"""
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class PluginType(Enum):
    VST2 = "vst2"
    VST3 = "vst3"
    LV2 = "lv2"
    LADSPA = "ladspa"

@dataclass
class Plugin:
    id: str
    name: str
    type: PluginType
    path: str
    parameters: Dict[str, float]
    active: bool = True

class PluginHost:
    """
    Plugin Host für die DAW
    """
    
    def __init__(self):
        self.plugins: Dict[str, Plugin] = {}
        logger.info("Plugin Host initialisiert")
    
    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        """Gibt ein Plugin zurück"""
        return self.plugins.get(plugin_id)
    
    def add_plugin(self, plugin: Plugin) -> bool:
        """Fügt ein Plugin hinzu"""
        self.plugins[plugin.id] = plugin
        logger.info(f"Plugin hinzugefügt: {plugin.id}")
        return True
    
    def remove_plugin(self, plugin_id: str) -> bool:
        """Entfernt ein Plugin"""
        if plugin_id in self.plugins:
            del self.plugins[plugin_id]
            logger.info(f"Plugin entfernt: {plugin_id}")
            return True
        return False
