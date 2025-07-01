import { Client } from 'node-osc';
import { EventEmitter } from 'events';
export class ArdourClient extends EventEmitter {
    constructor() {
        super();
        this.isConnected = false;
        this.session = null;
        this.state = {
            playbackStatus: 'unknown',
            transportFrame: null,
            stripList: []
        };
        this.host = process.env.ARDOUR_OSC_HOST || 'localhost';
        this.port = parseInt(process.env.ARDOUR_OSC_PORT || '3819');
        this.sendPort = parseInt(process.env.ARDOUR_OSC_SEND_PORT || '3818');
        this.client = new Client(this.host, this.port);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('ready', () => {
            console.log('Ardour OSC Client bereit');
            this.isConnected = true;
            this.emit('connected');
        });
        this.client.on('error', (error) => {
            console.error('Ardour OSC Fehler:', error);
            this.isConnected = false;
            this.emit('error', error);
        });
        this.client.on('message', (message) => {
            this.handleOSCMessage(message);
        });
    }
    handleOSCMessage(message) {
        const [address, ...args] = message;
        console.log('OSC Nachricht empfangen:', address, args);
        switch (address) {
            case '/transport_state':
                this.handleTransportState(args);
                break;
            case '/transport_frame':
                this.handleTransportFrame(args);
                break;
            case '/strip/play':
                this.handleStripPlay(args);
                break;
            default:
                if (address.startsWith('/strip/name/')) {
                    this.handleStripName(address, args);
                }
                else if (address.startsWith('/strip/type/')) {
                    this.handleStripType(address, args);
                }
                else {
                    console.debug('Unbekannte OSC-Nachricht:', address, args);
                }
        }
    }
    handleTransportState(args) {
        if (args.length >= 2) {
            const state = args[0];
            const speed = args[1];
            switch (state) {
                case 0:
                    this.state.playbackStatus = 'stopped';
                    break;
                case 1:
                case 2:
                    this.state.playbackStatus = 'playing';
                    break;
                default:
                    this.state.playbackStatus = 'unknown';
            }
            this.emit('transportStateChanged', {
                status: this.state.playbackStatus,
                speed: speed
            });
        }
    }
    handleTransportFrame(args) {
        if (args.length >= 1) {
            this.state.transportFrame = args[0];
            this.emit('transportFrameChanged', this.state.transportFrame);
        }
    }
    handleStripPlay(args) {
        if (args.length >= 1) {
            const isPlaying = args[0] === 1;
            this.state.playbackStatus = isPlaying ? 'playing' : 'stopped';
            this.emit('playbackStatusChanged', this.state.playbackStatus);
        }
    }
    handleStripName(address, args) {
        const parts = address.split('/');
        if (parts.length === 4 && args.length >= 1) {
            const stripId = parseInt(parts[3]);
            const name = args[0];
            if (stripId > 0) {
                let track = this.state.stripList.find(t => t.id === stripId.toString());
                if (!track) {
                    track = {
                        id: stripId.toString(),
                        name: name,
                        type: 'audio',
                        muted: false,
                        soloed: false,
                        recordEnabled: false,
                        gain: 1.0,
                        pan: 0.5
                    };
                    this.state.stripList.push(track);
                }
                else {
                    track.name = name;
                }
                this.emit('trackUpdated', track);
            }
        }
    }
    handleStripType(address, args) {
        const parts = address.split('/');
        if (parts.length === 4 && args.length >= 1) {
            const stripId = parseInt(parts[3]);
            const type = args[0];
            if (stripId > 0) {
                const track = this.state.stripList.find(t => t.id === stripId.toString());
                if (track) {
                    track.type = type;
                    this.emit('trackUpdated', track);
                }
            }
        }
    }
    // Ardour-Steuerungsfunktionen basierend auf ardour-mcp
    async connect() {
        try {
            await this.client.connect();
            console.log(`Verbunden mit Ardour auf ${this.host}:${this.port}`);
            // Sende initiale OSC-Setup-Nachrichten
            await this.sendOSCSetup();
        }
        catch (error) {
            console.error('Fehler beim Verbinden mit Ardour:', error);
            throw error;
        }
    }
    async sendOSCSetup() {
        // Sende Setup-Nachrichten für Feedback
        this.sendOSC('/strip/list');
        this.sendOSC('/transport_state');
        this.sendOSC('/transport_frame');
    }
    async disconnect() {
        this.client.close();
        this.isConnected = false;
        console.log('Verbindung zu Ardour getrennt');
    }
    // Transport-Steuerung (basierend auf ardour-mcp)
    async play() {
        this.sendOSC('/transport_play');
    }
    async stop() {
        this.sendOSC('/transport_stop');
    }
    async record() {
        this.sendOSC('/transport_record');
    }
    async stopRecord() {
        this.sendOSC('/transport_record_stop');
    }
    async setTransportSpeed(speed) {
        if (speed < 0.1 || speed > 4.0) {
            throw new Error('Transport speed must be between 0.1 and 4.0');
        }
        this.sendOSC('/transport_speed', speed);
    }
    // Track-Management (basierend auf ardour-mcp)
    async createAudioTrack(name) {
        const trackName = name || `Audio Track ${Date.now()}`;
        this.sendOSC('/add_audio_track', trackName);
        return `audio_track_${Date.now()}`;
    }
    async createMIDITrack(name) {
        const trackName = name || `MIDI Track ${Date.now()}`;
        this.sendOSC('/add_midi_track', trackName);
        return `midi_track_${Date.now()}`;
    }
    async setTrackMute(trackId, muted) {
        this.sendOSC('/strip/mute', parseInt(trackId), muted ? 1 : 0);
    }
    async setTrackSolo(trackId, soloed) {
        this.sendOSC('/strip/solo', parseInt(trackId), soloed ? 1 : 0);
    }
    async setTrackRecordEnable(trackId, enabled) {
        this.sendOSC('/strip/recenable', parseInt(trackId), enabled ? 1 : 0);
    }
    async setTrackGain(trackId, gain) {
        if (gain < 0.0 || gain > 2.0) {
            throw new Error('Gain must be between 0.0 and 2.0');
        }
        // Konvertiere zu Fader-Position (0.0-1.0)
        const faderPosition = (gain / 2.0).clamp(0.0, 1.0);
        this.sendOSC('/strip/fader', parseInt(trackId), faderPosition);
    }
    async setTrackGainDB(trackId, gainDB) {
        if (gainDB < -400.0 || gainDB > 6.0) {
            throw new Error('Gain DB must be between -400.0 and 6.0');
        }
        this.sendOSC('/strip/gain', parseInt(trackId), gainDB);
    }
    async setTrackPan(trackId, pan) {
        if (pan < 0.0 || pan > 1.0) {
            throw new Error('Pan must be between 0.0 and 1.0');
        }
        this.sendOSC('/strip/pan_stereo_position', parseInt(trackId), pan);
    }
    async selectTrack(trackId) {
        this.sendOSC('/strip/select', parseInt(trackId), 1);
    }
    // Plugin-Management (basierend auf ardour-mcp)
    async addPluginToTrack(trackId, pluginName) {
        this.sendOSC('/strip/plugin/insert', parseInt(trackId), pluginName);
        return `plugin_${Date.now()}`;
    }
    async setPluginActive(trackId, pluginSlot, active) {
        const address = active ? '/strip/plugin/activate' : '/strip/plugin/deactivate';
        this.sendOSC(address, parseInt(trackId), pluginSlot);
    }
    async setPluginParameter(trackId, pluginSlot, paramId, value) {
        if (value < 0.0 || value > 1.0) {
            throw new Error('Parameter value must be between 0.0 and 1.0');
        }
        this.sendOSC('/strip/plugin/parameter', parseInt(trackId), pluginSlot, paramId, value);
    }
    // Session-Management
    async loadSession(sessionPath) {
        this.sendOSC('/session/load', sessionPath);
    }
    async saveSession() {
        this.sendOSC('/session/save');
    }
    async getSessionInfo() {
        this.sendOSC('/session/info');
        return this.session;
    }
    // Ardour Actions (basierend auf ardour-mcp)
    async executeAction(actionName) {
        this.sendOSC('/access_action', actionName);
    }
    // Hilfsfunktionen
    sendOSC(address, ...args) {
        if (!this.isConnected) {
            console.warn('Ardour nicht verbunden, OSC-Nachricht nicht gesendet:', address);
            return;
        }
        try {
            this.client.send(address, ...args);
            console.log('OSC gesendet:', address, args);
        }
        catch (error) {
            console.error('Fehler beim Senden OSC-Nachricht:', error);
        }
    }
    isConnectedToArdour() {
        return this.isConnected;
    }
    getCurrentSession() {
        return this.session;
    }
    getCurrentState() {
        return { ...this.state };
    }
    getTracks() {
        return [...this.state.stripList];
    }
}
