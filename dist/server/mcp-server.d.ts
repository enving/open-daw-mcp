import { CreateSynthLoopRequest, CreateSynthLoopResponse } from '../types/index.js';
export declare class DAWMCPServer {
    private server;
    private ionosClient;
    private ardourClient;
    private outputDir;
    constructor();
    private ensureOutputDir;
    private setupArdourEvents;
    private setupTools;
    createSynthLoop(request: CreateSynthLoopRequest): Promise<CreateSynthLoopResponse>;
    private executeArdourCommand;
    private createAudioTrack;
    private createMIDITrack;
    private playSession;
    private stopSession;
    private startRecording;
    private stopRecording;
    private addPlugin;
    private getSessionInfo;
    private saveClipMetadata;
    start(): Promise<void>;
}
