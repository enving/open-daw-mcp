#!/usr/bin/env node

import OpenWebUIIntegration from './src/web/openwebui-integration.js'

const server = new OpenWebUIIntegration()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Beende Server...')
  server.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Beende Server...')
  server.stop()
  process.exit(0)
})

// Server starten
server.start(3001) 