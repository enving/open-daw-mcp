#!/usr/bin/env node

/**
 * OpenWebUI DAW Integration
 * 
 * Dieses Modul integriert die Headless DAW mit OpenWebUI
 * und handhabt Audio-Dateien im Chat.
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

class OpenWebUIDawIntegration {
    constructor() {
        this.dawServerUrl = 'http://87.106.81.49:3002';
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Health Check
        this.app.get('/', (req, res) => {
            res.json({
                status: 'OK',
                service: 'OpenWebUI DAW Integration',
                dawServer: this.dawServerUrl
            });
        });

        // Melodie generieren
        this.app.post('/generate-melody', async (req, res) => {
            try {
                const { notes, duration = 5.0, style = 'classical' } = req.body;
                
                console.log('Generiere Melodie via OpenWebUI:', { notes, duration, style });
                
                const response = await fetch(`${this.dawServerUrl}/generate-melody`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ notes, duration, style })
                });

                const result = await response.json();
                
                if (result.success) {
                    // Audio-URL für OpenWebUI Chat erstellen
                    const audioUrl = `${this.dawServerUrl}${result.audioUrl}`;
                    const audioPlayer = this.createAudioPlayer(audioUrl, 'Generierte Melodie');
                    
                    res.json({
                        success: true,
                        message: 'Melodie erfolgreich generiert!',
                        audioUrl: audioUrl,
                        audioPlayer: audioPlayer,
                        rawResponse: result
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }
                
            } catch (error) {
                console.error('Fehler beim Generieren der Melodie:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Song generieren
        this.app.post('/generate-song', async (req, res) => {
            try {
                const { description, duration = 30.0, style = 'electronic' } = req.body;
                
                console.log('Generiere Song via OpenWebUI:', { description, duration, style });
                
                const response = await fetch(`${this.dawServerUrl}/generate-song`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ description, duration, style })
                });

                const result = await response.json();
                
                if (result.success) {
                    // Audio-URL für OpenWebUI Chat erstellen
                    const audioUrl = `${this.dawServerUrl}${result.audioUrl}`;
                    const audioPlayer = this.createAudioPlayer(audioUrl, 'Generierter Song');
                    
                    res.json({
                        success: true,
                        message: 'Song erfolgreich generiert!',
                        audioUrl: audioUrl,
                        audioPlayer: audioPlayer,
                        rawResponse: result
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }
                
            } catch (error) {
                console.error('Fehler beim Generieren des Songs:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Audio-Dateien auflisten
        this.app.get('/audio-files', async (req, res) => {
            try {
                const response = await fetch(`${this.dawServerUrl}/audio-files`);
                const result = await response.json();
                
                res.json({
                    success: true,
                    files: result.files,
                    count: result.count,
                    audioUrlBase: `${this.dawServerUrl}/audio/`
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Audio-Player HTML generieren
        this.app.get('/audio-player/:filename', (req, res) => {
            const { filename } = req.params;
            const audioUrl = `${this.dawServerUrl}/audio/${filename}`;
            const audioPlayer = this.createAudioPlayer(audioUrl, filename);
            
            res.send(audioPlayer);
        });
    }

    createAudioPlayer(audioUrl, title) {
        return `
<div class="daw-audio-player" style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
    <h4 style="margin: 0 0 10px 0; color: #333;">🎵 ${title}</h4>
    <audio controls style="width: 100%; max-width: 400px;">
        <source src="${audioUrl}" type="audio/wav">
        Dein Browser unterstützt keine Audio-Wiedergabe.
    </audio>
    <div style="margin-top: 10px;">
        <a href="${audioUrl}" download style="color: #007bff; text-decoration: none;">
            📥 Audio herunterladen
        </a>
    </div>
</div>
        `;
    }

    start(port = 3003) {
        this.app.listen(port, () => {
            console.log(`🎵 OpenWebUI DAW Integration läuft auf Port ${port}`);
            console.log(`📡 Endpoints:`);
            console.log(`   GET  / - Health Check`);
            console.log(`   POST /generate-melody - Melodie generieren`);
            console.log(`   POST /generate-song - Song generieren`);
            console.log(`   GET  /audio-files - Audio-Dateien auflisten`);
            console.log(`   GET  /audio-player/:filename - Audio-Player HTML`);
            console.log(`🔗 DAW Server: ${this.dawServerUrl}`);
        });
    }
}

// Server starten
const integration = new OpenWebUIDawIntegration();
integration.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Beende OpenWebUI DAW Integration...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Beende OpenWebUI DAW Integration...');
    process.exit(0);
}); 