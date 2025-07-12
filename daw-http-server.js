#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/audio', express.static('/opt/open-daw-mcp/output'));

// DAW Integration
class DawHttpServer {
    constructor() {
        this.app = app;
        this.setupRoutes();
    }

    setupRoutes() {
        // Health Check
        app.get('/', (req, res) => {
            res.json({ 
                status: 'OK', 
                service: 'Open DAW HTTP Server',
                endpoints: [
                    'POST /generate-melody',
                    'POST /generate-song',
                    'GET /audio/:filename'
                ]
            });
        });

        // Melodie generieren
        app.post('/generate-melody', async (req, res) => {
            try {
                const { notes, duration = 5.0, style = 'classical' } = req.body;
                
                console.log('Generiere Melodie:', { notes, duration, style });
                
                // Python DAW aufrufen
                const audioFile = await this.generateMelody(notes, duration, style);
                
                res.json({
                    success: true,
                    audioFile: audioFile,
                    audioUrl: `/audio/${path.basename(audioFile)}`,
                    message: 'Melodie erfolgreich generiert'
                });
                
            } catch (error) {
                console.error('Fehler beim Generieren der Melodie:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Song generieren
        app.post('/generate-song', async (req, res) => {
            try {
                const { description, duration = 30.0, style = 'electronic' } = req.body;
                
                console.log('Generiere Song:', { description, duration, style });
                
                // Python DAW aufrufen
                const audioFile = await this.generateSong(description, duration, style);
                
                res.json({
                    success: true,
                    audioFile: audioFile,
                    audioUrl: `/audio/${path.basename(audioFile)}`,
                    message: 'Song erfolgreich generiert'
                });
                
            } catch (error) {
                console.error('Fehler beim Generieren des Songs:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Audio-Dateien auflisten
        app.get('/audio-files', (req, res) => {
            const outputDir = '/opt/open-daw-mcp/output';
            fs.readdir(outputDir, (err, files) => {
                if (err) {
                    res.status(500).json({ error: 'Fehler beim Lesen der Audio-Dateien' });
                    return;
                }
                
                const audioFiles = files.filter(file => 
                    file.endsWith('.wav') || file.endsWith('.mp3') || file.endsWith('.mid')
                );
                
                res.json({
                    files: audioFiles,
                    count: audioFiles.length
                });
            });
        });

        // OpenAPI Spezifikation
        app.get('/openapi.json', (req, res) => {
            const openapiPath = path.join(__dirname, 'openapi.json');
            fs.readFile(openapiPath, 'utf8', (err, data) => {
                if (err) {
                    res.status(500).json({ error: 'OpenAPI Spezifikation nicht gefunden' });
                    return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(data);
            });
        });
    }

    async generateMelody(notes, duration, style) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const outputFile = `/opt/open-daw-mcp/output/melody_${timestamp}.wav`;
            
            const pythonScript = `
import sys
sys.path.append('/opt/open-daw-mcp/src')
from daw.core import HeadlessDaw
import numpy as np
import soundfile as sf

# DAW initialisieren
daw = HeadlessDaw()

# Projekt erstellen
project_id = daw.create_project('HTTP Melody', 120.0)
daw.load_project(project_id)

# MIDI Track hinzufügen
track_id = daw.add_track('Melody', 'midi')

# Audio generieren basierend auf Notes
sample_rate = 44100
audio_data = np.array([])

notes = ${JSON.stringify(notes)}
duration_per_note = ${duration} / len(notes)

for frequency in notes:
    t = np.linspace(0, duration_per_note, int(sample_rate * duration_per_note))
    note = np.sin(2 * np.pi * frequency * t) * 0.2
    audio_data = np.concatenate([audio_data, note])

# Audio speichern
sf.write('${outputFile}', audio_data, sample_rate)
print('${outputFile}')
`;

            const pythonProcess = spawn('python3', ['-c', pythonScript], {
                cwd: '/opt/open-daw-mcp',
                env: { ...process.env, PYTHONPATH: '/opt/open-daw-mcp/src' }
            });

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    const generatedFile = output.trim();
                    resolve(generatedFile);
                } else {
                    reject(new Error(`Python process failed: ${error}`));
                }
            });
        });
    }

    async generateSong(description, duration, style) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const outputFile = `/opt/open-daw-mcp/output/song_${timestamp}.wav`;
            
            const pythonScript = `
import sys
sys.path.append('/opt/open-daw-mcp/src')
from daw.core import HeadlessDaw
import numpy as np
import soundfile as sf

# DAW initialisieren
daw = HeadlessDaw()

# Projekt erstellen
project_id = daw.create_project('HTTP Song', 120.0)
daw.load_project(project_id)

# MIDI Track hinzufügen
track_id = daw.add_track('Song', 'midi')

# Basierend auf Beschreibung Audio generieren
sample_rate = 44100
audio_data = np.array([])

# Einfache Melodie basierend auf Style
if '${style}' == 'electronic':
    frequencies = [440, 554, 659, 880]  # A, C#, E, A
elif '${style}' == 'classical':
    frequencies = [261, 293, 329, 349, 392, 440, 493, 523]  # C-Dur Skala
else:
    frequencies = [440, 523, 659, 784]  # A, C, E, G

duration_per_note = ${duration} / len(frequencies)

for frequency in frequencies:
    t = np.linspace(0, duration_per_note, int(sample_rate * duration_per_note))
    note = np.sin(2 * np.pi * frequency * t) * 0.15
    audio_data = np.concatenate([audio_data, note])

# Audio speichern
sf.write('${outputFile}', audio_data, sample_rate)
print('${outputFile}')
`;

            const pythonProcess = spawn('python3', ['-c', pythonScript], {
                cwd: '/opt/open-daw-mcp',
                env: { ...process.env, PYTHONPATH: '/opt/open-daw-mcp/src' }
            });

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    const generatedFile = output.trim();
                    resolve(generatedFile);
                } else {
                    reject(new Error(`Python process failed: ${error}`));
                }
            });
        });
    }

    start() {
        this.app.listen(PORT, '0.0.0.0', () => {
            console.log(`🎵 Open DAW HTTP Server läuft auf Port ${PORT}`);
            console.log(`📡 Endpoints:`);
            console.log(`   GET  / - Health Check`);
            console.log(`   POST /generate-melody - Melodie generieren`);
            console.log(`   POST /generate-song - Song generieren`);
            console.log(`   GET  /audio-files - Audio-Dateien auflisten`);
            console.log(`   GET  /audio/:filename - Audio-Datei abrufen`);
            console.log(`   GET  /openapi.json - OpenAPI Spezifikation`);
        });
    }

    stop() {
        console.log('🛑 Stoppe HTTP Server...');
    }
}

// Server starten
const server = new DawHttpServer();
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Beende Server...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Beende Server...');
    server.stop();
    process.exit(0);
}); 