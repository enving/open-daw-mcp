/// <reference types="node" />
import { EventEmitter } from 'events';
export interface ArdourTrack {
    id: string;
    name: string;
    type: 'audio' | 'midi' | 'bus' | 'master';
    muted: boolean;
    soloed: boolean;
    recordEnabled: boolean;
    gain: number;
    pan: number;
}
export interface ArdourSession {
    name: string;
    sampleRate: number;
    frameRate: number;
    isPlaying: boolean;
    isRecording: boolean;
    transportFrame: number;
    tracks: ArdourTrack[];
}
export interface ArdourState {
    playbackStatus: 'stopped' | 'playing' | 'unknown';
    transportFrame: number | null;
    stripList: ArdourTrack[];
}
export declare class ArdourClient extends EventEmitter {
    private client;
    private host;
    private port;
    private sendPort;
    private isConnected;
    private session;
    private state;
    constructor();
    private setupEventHandlers;
    private handleOSCMessage;
    private handleTransportState;
    private handleTransportFrame;
    private handleStripPlay;
    private handleStripName;
    private handleStripType;
    connect(): Promise<void>;
    private sendOSCSetup;
    disconnect(): Promise<void>;
    play(): Promise<void>;
    stop(): Promise<void>;
    record(): Promise<void>;
    stopRecord(): Promise<void>;
    setTransportSpeed(speed: number): Promise<void>;
    createAudioTrack(name?: string): Promise<string>;
    createMIDITrack(name?: string): Promise<string>;
    setTrackMute(trackId: string, muted: boolean): Promise<void>;
    setTrackSolo(trackId: string, soloed: boolean): Promise<void>;
    setTrackRecordEnable(trackId: string, enabled: boolean): Promise<void>;
    setTrackGain(trackId: string, gain: number): Promise<void>;
    setTrackGainDB(trackId: string, gainDB: number): Promise<void>;
    setTrackPan(trackId: string, pan: number): Promise<void>;
    selectTrack(trackId: string): Promise<void>;
    addPluginToTrack(trackId: string, pluginName: string): Promise<string>;
    setPluginActive(trackId: string, pluginSlot: number, active: boolean): Promise<void>;
    setPluginParameter(trackId: string, pluginSlot: number, paramId: number, value: number): Promise<void>;
    loadSession(sessionPath: string): Promise<void>;
    saveSession(): Promise<void>;
    getSessionInfo(): Promise<ArdourSession | null>;
    executeAction(actionName: string): Promise<void>;
    private sendOSC;
    isConnectedToArdour(): boolean;
    getCurrentSession(): ArdourSession | null;
    getCurrentState(): ArdourState;
    getTracks(): ArdourTrack[];
}
