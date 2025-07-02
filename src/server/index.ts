import express from 'express'
import cors from 'cors'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { OpenWebUIMCPBridge } from '../integration/openwebui-mcp-bridge.js'

const app = express()
const PORT = process.env.PORT || 3001

// CORS für OpenWebUI
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}))

app.use(express.json())

// OpenWebUI MCP Bridge
const bridge = new OpenWebUIMCPBridge()

// Audio-Dateien bereitstellen
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params
  const audioPath = join(process.cwd(), 'output', 'audio', filename)
  
  if (!existsSync(audioPath)) {
    return res.status(404).json({ error: 'Audio-Datei nicht gefunden' })
  }
  
  try {
    const audioBuffer = readFileSync(audioPath)
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Content-Length', audioBuffer.length)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.send(audioBuffer)
  } catch (error) {
    console.error('❌ Fehler beim Bereitstellen der Audio-Datei:', error)
    res.status(500).json({ error: 'Fehler beim Laden der Audio-Datei' })
  }
})

// OpenWebUI Function Calling Endpoint
app.post('/api/openwebui/functions', async (req, res) => {
  try {
    const { function_name, parameters } = req.body
    
    if (!function_name) {
      return res.status(400).json({ error: 'function_name ist erforderlich' })
    }
    
    console.log('🎵 OpenWebUI Function Call:', function_name, parameters)
    
    const result = await bridge.handleFunctionCall(function_name, parameters || {})
    
    res.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error('❌ Fehler bei Function Call:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Function Definitions Endpoint
app.get('/api/openwebui/functions', (req, res) => {
  try {
    const functions = bridge.getFunctionDefinitions()
    res.json({
      success: true,
      functions: functions
    })
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Function Definitions:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpenWebUI MCP Bridge',
    timestamp: new Date().toISOString()
  })
})

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 OpenWebUI MCP Bridge Server läuft auf Port ${PORT}`)
  console.log(`📡 Audio-Endpoint: http://localhost:${PORT}/api/audio/`)
  console.log(`🔧 Function Endpoint: http://localhost:${PORT}/api/openwebui/functions`)
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`)
}) 