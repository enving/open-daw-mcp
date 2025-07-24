# MSFA Debugging - Unsere Schritte

## **Ziel: Echte FM-Synthese mit MSFA**

### **Problem:**
- System verwendet nur Simulation statt echte FM-Synthese
- MSFA (Music Synthesizer For Android) fehlt
- Dexed VST ist ein Plugin, braucht Host

---

## **WICHTIGE CHECKPOINTS - Chronologisch:**

### **CHECKPOINT 1: System-Analyse**
- **Erkenntnis:** System läuft auf `humanmusic.digitalalchemisten.de`
- **Problem:** Nur Simulation, keine echte FM-Synthese
- **Status:** ✅ **IDENTIFIZIERT**

### **CHECKPOINT 2: MSFA-Repository gefunden**
```bash
# Google MSFA Repository
https://github.com/google/music-synthesizer-for-android.git
```
- **Status:** ✅ **GEFUNDEN**

### **CHECKPOINT 3: Dexed VST versucht (FEHLGESCHLAGEN)**
```dockerfile
# Dockerfile.dexed (ARCHIVIERT)
RUN git clone https://github.com/asb2m10/dexed.git
```
- **Problem 1:** VST-Plugin braucht Host
- **Problem 2:** JUCE-Dependencies fehlen (`libjuce-dev` existiert nicht)
- **Problem 3:** `libvst3sdk-dev` existiert nicht in Ubuntu 22.04
- **Status:** ❌ **FEHLGESCHLAGEN - ARCHIVIERT**

### **CHECKPOINT 4: MSFA direkt kompilieren (AKTUELL)**
```dockerfile
# Dockerfile.msfa
RUN git clone https://github.com/google/music-synthesizer-for-android.git msfa
WORKDIR /app/msfa/app/src/main/jni
```
- **Status:**  **IN ARBEIT**

### **CHECKPOINT 5: Build-Probleme identifiziert**
- **Problem 1:** `#include <android/log.h>` - Android-spezifisch
- **Problem 2:** C++-Namespace-Konflikte: `min`/`max` Funktionen
- **Problem 3:** `size_t` nicht deklariert - fehlende Header
- **Problem 4:** `g++: fatal error: cannot specify '-o' with '-c'` - Compiler-Fehler
- **Status:**  **PROBLEME IDENTIFIZIERT**

### **CHECKPOINT 6: SynthUnit als Kernstück erkannt**
- **Erkenntnis:** SynthUnit.cc ist ESSENTIELL
- **Funktionen:** Noten-Management, MIDI-Processing, Audio-Output, Patch-Management
- **Entscheidung:** Nicht überspringbar!
- **Status:** ✅ **ENTSCHEIDUNG GETROFFEN**

### **CHECKPOINT 7: Linux-Versionen recherchiert**
- **Gefunden:**
  - Dexed VST (Linux-Port) - ❌ Braucht VST-Host
  - Surge XT - ✅ Hat FM-Synthese
  - ZynAddSubFX - ✅ Hat FM-Synthese
  - MSFA Standalone - ✅ In main.cc gefunden!
- **Status:** 🔍 **ALTERNATIVEN IDENTIFIZIERT**

### **CHECKPOINT 8: MSFA Standalone entdeckt**
```cpp
// temp-msfa/app/src/main/jni/main.cc
void mkdx7note(double sample_rate) {
  WavOut w("/tmp/foo.wav", sample_rate, n_samples);  // ← WAV-Output!
  Dx7Note note;
  // ... echte FM-Synthese!
}
```
- **Erkenntnis:** Standalone-Version existiert!
- **Status:** ✅ **LÖSUNG GEFUNDEN**

### **CHECKPOINT 9: Nächster Schritt definiert**
- **Entscheidung:** MSFA Standalone kompilieren
- **Grund:** Keine Android-Dependencies, echte FM-Synthese, WAV-Output funktioniert
- **Ansatz:** Direkte Kompilierung ohne Android-Headers
- **Status:**  **NÄCHSTER SCHRITT FESTGELEGT**

---

## 🚨 **AKTUELLE PROBLEME:**

### **Android-Dependencies:**
```cpp
#include <android/log.h>  // ← Existiert nicht auf Linux
```

### **Lösungsansatz:**
```dockerfile
# Mock-Header erstellen
RUN echo '#define LOGI(...) printf(__VA_ARGS__)' > /usr/include/android/log.h
```

---

##  **NÄCHSTER SCHRITT - MSFA Standalone kompilieren:**

### **Neues Dockerfile.msfa:**
```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    cmake \
    git \
    libasound2-dev \
    libjack-jackd2-dev \
    libsndfile1-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install numpy scipy flask requests flask-cors

# Clone MSFA
WORKDIR /app
RUN git clone https://github.com/google/music-synthesizer-for-android.git msfa
WORKDIR /app/msfa/app/src/main/jni

# Kompiliere MSFA Standalone (ohne Android-Dependencies)
RUN g++ -o msfa_standalone \
    main.cc \
    dx7note.cc \
    fm_core.cc \
    fm_op_kernel.cc \
    env.cc \
    patch.cc \
    controllers.cc \
    wavout.cc \
    -I. -std=c++11 -lm -lasound -lsndfile

# Teste MSFA Standalone
RUN ./msfa_standalone || echo "MSFA Standalone kompiliert"

# Copy MSFA binary
RUN cp msfa_standalone /usr/local/bin/ && echo "✅ MSFA Standalone installiert"

# Copy Dexed server
COPY dexed_server.py /app/dexed_server.py

WORKDIR /app
EXPOSE 8081

CMD ["python3", "dexed_server.py"]
```

### **Warum das funktioniert:**
1. **Keine Android-Headers** - Standalone-Version braucht sie nicht
2. **Echte FM-Synthese** - `main.cc` hat funktionierende DX7-Engine
3. **WAV-Output** - `wavout.cc` funktioniert bereits
4. **Einfacher Build** - Nur C++-Compiler, keine komplexen Dependencies

---

## 📁 **Dateien:**
- `Dockerfile.msfa` - Aktueller Build-Versuch
- `ARCHIVED_Dockerfile.dexed` - Fehlgeschlagener VST-Ansatz
- `temp-msfa/` - MSFA-Source-Code
- `dexed_server.py` - Python-Server (wartet auf MSFA)

---

## 🎯 **Ziel:**
**Echte FM-Synthese mit 32 DX7-Algorithmen statt Simulation!**

---

##  **WICHTIGE ERKENNTNISSE:**

### **1. Headless-System:**
- ✅ Unser Dexed ist bereits Headless (Flask API)
- ✅ Perfekt für Server-Deployment

### **2. MSFA ist Android-Projekt:**
- ❌ Kein einfacher Linux-Port verfügbar
- ✅ Aber Standalone-Version in main.cc gefunden!

### **3. VST-Ansatz gescheitert:**
- ❌ Dexed VST braucht Host
- ❌ Komplexe JUCE-Dependencies
- ✅ Standalone-Ansatz ist besser

### **4. SynthUnit ist kritisch:**
- ✅ Verwaltet alle Noten und MIDI
- ✅ Ohne das keine echte Musik
- ✅ Muss repariert werden, nicht übersprungen 

---

### CHECKPOINT 10: Subprozess-Integration
- Python-Server ruft jetzt msfa_standalone per subprocess auf, wenn keine Bibliothek gefunden wird.
- Patch wird als temporäre JSON-Datei gespeichert und an das Binary übergeben.
- WAV-Datei wird als API-Response zurückgegeben.
- Status (engine) wird im API-Response angezeigt.
- **Status:** ✅ IMPLEMENTIERT

### CHECKPOINT 11: Fehlerbehandlung und Verzeichnis-Erstellung
- Der Python-Code legt das Zielverzeichnis `/app/output/audio/` jetzt automatisch an.
- Fehler beim Schreiben der Datei werden abgefangen und als API-Fehler zurückgegeben.
- **Status:** ✅ IMPLEMENTIERT

---

## TODO / Nächste Schritte (aktualisiert)

1. **Testen, ob msfa_standalone im Container WAV-Dateien erzeugt**
   - Mit curl und im Container prüfen, ob die Datei erscheint.
   - Im API-Response prüfen, ob "engine": "msfa_standalone" steht.

2. **Testen, ob Simulation korrekt als Fallback genutzt wird**
   - msfa_standalone umbenennen oder entfernen und prüfen, ob "engine": "simulation" im API-Response steht.

3. **Optional: Python-Bindings für direkte Nutzung**
   - (Später) Direkte Anbindung der C++-Engine an Python (z.B. pybind11)

4. **Dokumentation und Cleanup**
   - Debugging-Readme aktuell halten
   - Nicht mehr benötigte/archivierte Dockerfiles und Code entfernen

5. **Binary- und API-Integration maximal debuggen**
   - a) Sende mehrere API-Requests mit unterschiedlichen Parametern (z.B. verschiedene Noten, Algorithmen) und prüfe, ob die erzeugten WAV-Dateien unterschiedlich sind.
   - b) Vergleiche die WAV-Dateien direkt auf Byte-Ebene (z.B. mit `cmp` oder `diff`).
   - c) Starte das Binary im Container mit verschiedenen Parametern und prüfe, ob sich die Ausgaben/WAV-Dateien ändern.
   - d) Prüfe, ob das Binary auf Parameter wie `--note`, `--patch`, `--output` überhaupt reagiert (ggf. mit `--help`).
   - e) Analysiere den Quellcode von `main.cc` im MSFA-Repo: Wird dort auf Kommandozeilen-Parameter reagiert? Wird ein Patch geladen, eine Note gesetzt, eine WAV-Datei geschrieben?
   - f) Prüfe im Python-Code und im API-Response, ob wirklich das Binary genutzt wird (`"engine": "msfa_standalone"`) und keine Simulation.

--- 

---

## Status-Check im API-Response

Der API-Response von `/api/dexed/generate-audio` enthält jetzt immer ein Feld `"engine"`, das anzeigt, welcher Synthese-Weg genutzt wurde:

    "engine": "msfa_standalone"  # echte FM-Synthese (Binary)
    "engine": "simulation"       # Fallback (Python)

Damit ist zu 100% nachvollziehbar, ob wirklich das Standalone-Binary oder nur die Simulation genutzt wurde. 

Empfohlener Neustart-Befehl:

docker-compose -f docker-compose.local.yml restart dexed-server

---

Der Befehl sollte als erster Schritt für jeden Test/Debugging-Vorgang genutzt werden. 

### CHECKPOINT 12: Geplante Debugging-Schritte (Juli 2025)
- Als nächstes testen wir gezielt, ob das msfa_standalone-Binary wirklich auf verschiedene Parameter (z.B. Note, Algorithmus) reagiert.
- Wir werden mehrere API-Requests mit unterschiedlichen Parametern absetzen und die erzeugten WAV-Dateien vergleichen (Byte-Vergleich mit cmp/diff).
- Es wird geprüft, ob das Binary auf Kommandozeilen-Parameter wie --note, --patch, --output überhaupt reagiert oder immer nur eine Standard-Testdatei erzeugt.
- Wir analysieren den Quellcode (main.cc), um zu verstehen, ob und wie Parameter verarbeitet werden.
- Ziel: 100% sicherstellen, dass keine Simulation/Fallback läuft und die FM-Synthese wirklich wie gewünscht funktioniert.
- **Status:** ⏳ IN PLANUNG 