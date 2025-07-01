export interface MCPServerConfig {
    port: number;
    host: string;
}
export interface AudioConfig {
    sampleRate: number;
    bitDepth: number;
    channels: number;
}
export interface AudioClip {
    id: string;
    name: string;
    filePath: string;
    duration: number;
    bpm: number;
    key: string;
    scale: string;
    createdAt: Date;
}
export interface SynthConfig {
    bpm: number;
    key: string;
    scale: string;
    duration: number;
    pattern: string;
}
export interface SynthNote {
    note: string;
    velocity: number;
    duration: number;
    startTime: number;
}
export interface SynthPattern {
    name: string;
    notes: SynthNote[];
    bpm: number;
    key: string;
    scale: string;
}
export interface IONOSRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
}
export interface IONOSResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}
export interface CreateSynthLoopRequest {
    description: string;
    bpm?: number;
    key?: string;
    scale?: string;
    duration?: number;
}
export interface CreateSynthLoopResponse {
    success: boolean;
    audioClip?: AudioClip;
    error?: string;
}
