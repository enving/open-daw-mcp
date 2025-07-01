#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

async function testMCPServer() {
  console.log('🚀 Starte einfachen MCP Server Test...')
  
  try {
    // Erstelle Server
    const server = new Server(
      {
        name: 'open-daw-mcp-simple',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    // Tool-Liste Handler
    server.setRequestHandler('tools/list', async () => {
      console.log('📋 Tools/List aufgerufen')
      return {
        tools: [
          {
            name: 'test_synth_loop',
            description: 'Test-Tool für Synthesizer-Loop',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Beschreibung des Loops'
                }
              },
              required: ['description']
            }
          }
        ]
      }
    })

    // Tool-Call Handler
    server.setRequestHandler('tools/call', async (request) => {
      console.log('🎵 Tools/Call aufgerufen:', request.params)
      
      const { name, arguments: args } = request.params
      
      if (name === 'test_synth_loop') {
        return {
          success: true,
          message: `Synthesizer-Loop erstellt: ${args.description}`,
          pattern: {
            bpm: 120,
            key: 'C',
            notes: ['C4', 'E4', 'G4', 'C5']
          }
        }
      }
      
      throw new Error(`Unbekanntes Tool: ${name}`)
    })

    // Server starten
    const transport = new StdioServerTransport()
    await server.connect(transport)
    
    console.log('✅ MCP Server erfolgreich gestartet')
    console.log('🔄 Server läuft... Drücke Ctrl+C zum Beenden')
    
  } catch (error) {
    console.error('💥 MCP Server Fehler:', error)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Test ausführen
testMCPServer() 