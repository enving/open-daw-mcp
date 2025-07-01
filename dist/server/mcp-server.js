import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IONOSClient } from '../ionos/ionos-client.js';
import { ArdourClient } from '../ardour/ardour-client.js';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
export class DAWMCPServer {
    constructor() {
        this.server = new Server({
            name: 'open-daw-mcp',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.ionosClient = new IONOSClient();
        this.ardourClient = new ArdourClient();
        this.outputDir = process.env.AUDIO_OUTPUT_DIR || './output';
        this.setupTools();
        this.setupArdourEvents();
        this.ensureOutputDir();
    }
    async ensureOutputDir() {
        if (!existsSync(this.outputDir)) {
            await mkdir(this.outputDir, { recursive: true });
        }
    }
    setupArdourEvents() {
        this.ardourClient.on('connected', () => {
            console.log('Ardour verbunden');
        });
        this.ardourClient.on('error', (error) => {
            console.error('Ardour Fehler:', error);
        });
        this.ardourClient.on('sessionLoaded', (session) => {
            console.log('Ardour Session geladen:', session.name);
        });
        this.ardourClient.on('transportStateChanged', (state) => {
            console.log('Transport Status geändert:', state);
        });
    }
    setupTools() {
        // Tool: Synthesizer-Loop erstellen
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'create_synth_loop':
                    return await this.createSynthLoop(args);
                case 'execute_ardour_command':
                    return await this.executeArdourCommand(args);
                case 'create_audio_track':
                    return await this.createAudioTrack(args);
                case 'create_midi_track':
                    return await this.createMIDITrack(args);
                case 'play_session':
                    return await this.playSession();
                case 'stop_session':
                    return await this.stopSession();
                case 'start_recording':
                    return await this.startRecording(args);
                case 'stop_recording':
                    return await this.stopRecording();
                case 'add_plugin':
                    return await this.addPlugin(args);
                case 'get_session_info':
                    return await this.getSessionInfo();
                default:
                    throw new Error(`Unbekanntes Tool: ${name}`);
            }
        });
        // Tool-Definitionen
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'create_synth_loop',
                        description: 'Erstellt einen Synthesizer-Loop in Ardour basierend auf einer Beschreibung',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                description: {
                                    type: 'string',
                                    description: 'Beschreibung des gewünschten Synthesizer-Loops'
                                },
                                bpm: {
                                    type: 'number',
                                    description: 'Beats per Minute (Standard: 120)',
                                    default: 120
                                },
                                key: {
                                    type: 'string',
                                    description: 'Tonart (Standard: C)',
                                    default: 'C'
                                },
                                scale: {
                                    type: 'string',
                                    description: 'Skala (Standard: major)',
                                    default: 'major'
                                }
                            },
                            required: ['description']
                        }
                    },
                    {
                        name: 'execute_ardour_command',
                        description: 'Führt Ardour-Befehle basierend auf natürlicher Sprache aus',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                description: {
                                    type: 'string',
                                    description: 'Beschreibung der gewünschten Ardour-Aktion'
                                }
                            },
                            required: ['description']
                        }
                    },
                    {
                        name: 'create_audio_track',
                        description: 'Erstellt einen neuen Audio-Track in Ardour',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Name des Tracks (optional)'
                                }
                            }
                        }
                    },
                    {
                        name: 'create_midi_track',
                        description: 'Erstellt einen neuen MIDI-Track in Ardour',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Name des Tracks (optional)'
                                }
                            }
                        }
                    },
                    {
                        name: 'play_session',
                        description: 'Spielt die Ardour-Session ab',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'stop_session',
                        description: 'Stoppt die Ardour-Session',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'start_recording',
                        description: 'Startet Aufnahme in Ardour',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                trackId: {
                                    type: 'string',
                                    description: 'ID des Tracks (optional, alle Tracks wenn nicht angegeben)'
                                }
                            }
                        }
                    },
                    {
                        name: 'stop_recording',
                        description: 'Stoppt Aufnahme in Ardour',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'add_plugin',
                        description: 'Fügt ein Plugin zu einem Track hinzu',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                trackId: {
                                    type: 'string',
                                    description: 'ID des Tracks'
                                },
                                pluginName: {
                                    type: 'string',
                                    description: 'Name des Plugins'
                                }
                            },
                            required: ['trackId', 'pluginName']
                        }
                    },
                    {
                        name: 'get_session_info',
                        description: 'Gibt Informationen über die aktuelle Ardour-Session zurück',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        });
    }
    async createSynthLoop(request) {
        try {
            console.log('Erstelle Synthesizer-Loop:', request.description);
            // Generiere Pattern mit IONOS API
            const patternResponse = await this.ionosClient.generateSynthPattern(request.description, request.bpm || 120, request.key || 'C', request.scale || 'major');
            // Parse Pattern
            const patternData = await this.ionosClient.parseSynthPattern(patternResponse);
            let trackId;
            let pluginId;
            // Versuche Ardour-Verbindung (optional)
            try {
                if (!this.ardourClient.isConnectedToArdour()) {
                    await this.ardourClient.connect();
                }
                // Erstelle MIDI-Track in Ardour
                trackId = await this.ardourClient.createMIDITrack(`Synth Loop - ${patternData.description || request.description}`);
                // Füge Synthesizer-Plugin hinzu
                const pluginName = patternData.suggested_plugin || 'ZynAddSubFX';
                pluginId = await this.ardourClient.addPluginToTrack(trackId, pluginName);
                console.log('✅ Ardour-Integration erfolgreich');
            }
            catch (ardourError) {
                console.log('⚠️  Ardour nicht verfügbar - überspringe DAW-Integration');
                console.log('Ardour Fehler:', ardourError.message);
            }
            // Erstelle AudioClip Objekt
            const audioClip = {
                id: `clip_${Date.now()}`,
                name: patternData.description || request.description,
                filePath: '',
                duration: 8,
                bpm: patternData.bpm || request.bpm || 120,
                key: patternData.key || request.key || 'C',
                scale: patternData.scale || request.scale || 'major',
                createdAt: new Date()
            };
            // Speichere Metadaten
            await this.saveClipMetadata(audioClip);
            return {
                success: true,
                audioClip,
                trackId,
                pluginId
            };
        }
        catch (error) {
            console.error('Fehler beim Erstellen des Synthesizer-Loops:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            };
        }
    }
    async executeArdourCommand(request) {
        try {
            console.log('Führe Ardour-Befehl aus:', request.description);
            // Verbinde mit Ardour falls noch nicht verbunden
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            // Generiere Ardour-Befehle mit IONOS API
            const commandResponse = await this.ionosClient.generateArdourCommand(request.description);
            const commands = await this.ionosClient.parseArdourCommands(commandResponse);
            // Führe Befehle aus
            for (const command of commands.commands || []) {
                await this.executeArdourCommand(command);
            }
            return {
                success: true,
                commands: commands.commands
            };
        }
        catch (error) {
            console.error('Fehler beim Ausführen des Ardour-Befehls:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            };
        }
    }
    async executeArdourCommand(command) {
        switch (command.type) {
            case 'create_track':
                if (command.track_type === 'midi') {
                    await this.ardourClient.createMIDITrack(command.name);
                }
                else {
                    await this.ardourClient.createAudioTrack(command.name);
                }
                break;
            case 'add_plugin':
                await this.ardourClient.addPluginToTrack(command.track_id, command.plugin_name);
                break;
            case 'play':
                await this.ardourClient.play();
                break;
            case 'stop':
                await this.ardourClient.stop();
                break;
            case 'record':
                await this.ardourClient.record();
                break;
            default:
                console.warn('Unbekannter Ardour-Befehl:', command.type);
        }
    }
    async createAudioTrack(request) {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            const trackId = await this.ardourClient.createAudioTrack(request.name);
            return { success: true, trackId };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async createMIDITrack(request) {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            const trackId = await this.ardourClient.createMIDITrack(request.name);
            return { success: true, trackId };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async playSession() {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            await this.ardourClient.play();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async stopSession() {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            await this.ardourClient.stop();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async startRecording(request) {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            if (request.trackId) {
                await this.ardourClient.enableTrackRecord(request.trackId);
            }
            await this.ardourClient.record();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async stopRecording() {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            await this.ardourClient.stopRecord();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async addPlugin(request) {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            const pluginId = await this.ardourClient.addPluginToTrack(request.trackId, request.pluginName);
            return { success: true, pluginId };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async getSessionInfo() {
        try {
            if (!this.ardourClient.isConnectedToArdour()) {
                await this.ardourClient.connect();
            }
            const session = await this.ardourClient.getSessionInfo();
            return { success: true, session };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
        }
    }
    async saveClipMetadata(clip) {
        const metadataPath = join(this.outputDir, `${clip.id}.json`);
        await writeFile(metadataPath, JSON.stringify(clip, null, 2));
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('DAW MCP Server gestartet');
        // Versuche Verbindung zu Ardour
        try {
            await this.ardourClient.connect();
        }
        catch (error) {
            console.warn('Ardour nicht verfügbar, Server läuft ohne DAW-Verbindung');
        }
    }
}
