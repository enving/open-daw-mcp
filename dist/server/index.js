import { config } from 'dotenv';
import { DAWMCPServer } from './mcp-server.js';
// Lade Umgebungsvariablen
config();
async function main() {
    try {
        console.log('Starte Open DAW MCP Server...');
        const server = new DAWMCPServer();
        await server.start();
        console.log('Server erfolgreich gestartet');
    }
    catch (error) {
        console.error('Fehler beim Starten des Servers:', error);
        process.exit(1);
    }
}
main();
