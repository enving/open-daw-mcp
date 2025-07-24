# Archivierte Dateien

## Dockerfile.dexed → ARCHIVED_Dockerfile.dexed
**Grund:** VST-Plugin-Ansatz fehlgeschlagen
**Problem:** 
- Dexed VST braucht Host
- Komplexe JUCE-Abhängigkeiten
- Build-Probleme mit libvst3sdk-dev

**Ersetzt durch:** Dockerfile.msfa
**Vorteil:** 
- Echte MSFA-Engine
- Direkte C++-Kompilierung
- Kein VST-Host nötig

**Aufräumen:** Später löschen wenn MSFA funktioniert 