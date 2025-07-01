#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

class BasicMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'open-daw-mcp-basic',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupTools()
  }

  setupTools() {
    // Tool-Definitionen
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'test_synth_loop',
            description: 'Test-Tool für Synthesizer-Loop ohne externe API',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Beschreibung des gewünschten Synthesizer-Loops'
                },
                bpm: {
                  type: 'number',
                  description: 'Beats per Minute',
                  default: 120
                },
                key: {
                  type: 'string',
                  description: 'Tonart',
                  default: 'C'
                }
              },
              required: ['description']
            }
          },
          {
            name: 'echo',
            description: 'Einfaches Echo-Tool für Tests',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Nachricht zum Echo'
                }
              },
              required: ['message']
            }
          }
        ]
      }
    })

    // Tool-Ausführung
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params

      switch (name) {
        case 'test_synth_loop':
          return await this.testSynthLoop(args)
        
        case 'echo':
          return await this.echo(args)
        
        default:
          throw new Error(`Unbekanntes Tool: ${name}`)
      }
    })
  }

  async testSynthLoop(args) {
    console.log('🎵 Test Synthesizer-Loop aufgerufen:', args.description)
    
    // Simuliere ein einfaches Pattern
    const mockPattern = {
      pattern: [
        { note: 'C4', velocity: 80, duration: 0.5, startTime: 0 },
        { note: 'E4', velocity: 75, duration: 0.5, startTime: 0.5 },
        { note: 'G4', velocity: 70, duration: 0.5, startTime: 1.0 },
        { note: 'C5', velocity: 85, duration: 0.5, startTime: 1.5 }
      ],
      bpm: args.bpm || 120,
      key: args.key || 'C',
      scale: 'major',
      description: args.description,
      suggested_plugin: 'ZynAddSubFX',
      plugin_preset: 'Analog Lead'
    }

    const audioClip = {
      id: `clip_${Date.now()}`,
      name: args.description,
      filePath: '/tmp/test_synth_loop.mid',
      duration: 2,
      bpm: mockPattern.bpm,
      key: mockPattern.key,
      scale: mockPattern.scale,
      createdAt: new Date()
    }

    return {
      success: true,
      audioClip,
      pattern: mockPattern,
      message: 'Synthesizer-Loop erfolgreich erstellt (Mock)'
    }
  }

  async echo(args) {
    console.log('📢 Echo aufgerufen:', args.message)
    return {
      success: true,
      message: `Echo: ${args.message}`,
      timestamp: new Date().toISOString()
    }
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.log('✅ Basic MCP Server gestartet')
  }
}

async function testBasicMCPServer() {
  console.log('🚀 Starte Basic MCP Server Test...')
  
  try {
    const server = new BasicMCPServer()
    await server.start()
    
    console.log('✅ MCP Server erfolgreich gestartet')
    console.log('📋 Verfügbare Tools:')
    console.log('- test_synth_loop: Test-Tool für Synthesizer-Loop')
    console.log('- echo: Einfaches Echo-Tool')
    
    // Server läuft weiter...
    console.log('🔄 Server läuft... Drücke Ctrl+C zum Beenden')
    
  } catch (error) {
    console.error('💥 MCP Server Fehler:', error)
    process.exit(1)
  }
}

// Test ausführen
testBasicMCPServer() 