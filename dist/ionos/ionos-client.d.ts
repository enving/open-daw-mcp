export declare class IONOSClient {
    private apiUrl;
    private apiToken;
    constructor();
    generateSynthPattern(description: string, bpm?: number, key?: string, scale?: string): Promise<string>;
    generateArdourCommand(description: string): Promise<string>;
    parseSynthPattern(response: string): Promise<any>;
    parseArdourCommands(response: string): Promise<any>;
}
