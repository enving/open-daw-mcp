#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade .env Datei
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const env = {}
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        env[key.trim()] = value.trim()
      }
    })
    
    return env
  } catch (error) {
    console.error('Fehler beim Laden der .env Datei:', error.message)
    return {}
  }
}

async function testIONOSBasic() {
  console.log('🚀 Starte IONOS API Basis-Test...')
  
  try {
    // Lade Umgebungsvariablen
    const env = loadEnv()
    const apiToken = env.IONOS_API_TOKEN
    
    console.log('📋 Konfiguration:')
    console.log('- API Token vorhanden:', !!apiToken)
    console.log('- Token Länge:', apiToken ? apiToken.length : 0)
    console.log('- Token Start:', apiToken ? apiToken.substring(0, 10) + '...' : 'N/A')
    
    if (!apiToken) {
      throw new Error('IONOS_API_TOKEN nicht in .env gefunden')
    }
    
    // Test 1: Einfache Chat-Completion
    console.log('\n🎯 Test 1: Einfache Chat-Completion')
    
    const apiUrl = 'https://openai.inference.de-txl.ionos.com/v1/chat/completions'
    
    const simpleRequest = {
      model: 'llama-3.1-8b',
      messages: [
        {
          role: 'user',
          content: 'Hallo! Antworte nur mit "Test erfolgreich"'
        }
      ],
      max_tokens: 50
    }
    
    console.log('📤 Sende einfache Anfrage:')
    console.log('URL:', apiUrl)
    console.log('Request:', JSON.stringify(simpleRequest, null, 2))
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(simpleRequest)
    })
    
    console.log('📥 Response Status:', response.status, response.statusText)
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('📥 Error Response Body:', errorText)
      throw new Error(`API Fehler: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('📥 Success Response:', JSON.stringify(data, null, 2))
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ Test erfolgreich! Antwort:', data.choices[0].message.content)
    } else {
      console.log('⚠️  Unerwartete Antwort-Struktur:', data)
    }
    
    // Test 2: Verfügbare Modelle abfragen (falls API das unterstützt)
    console.log('\n🎯 Test 2: Modelle abfragen')
    
    try {
      const modelsResponse = await fetch('https://openai.inference.de-txl.ionos.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })
      
      console.log('📥 Models Response Status:', modelsResponse.status, modelsResponse.statusText)
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        console.log('📥 Verfügbare Modelle:', JSON.stringify(modelsData, null, 2))
      } else {
        const errorText = await modelsResponse.text()
        console.log('📥 Models Error:', errorText)
      }
    } catch (modelsError) {
      console.log('⚠️  Models-Endpoint nicht verfügbar:', modelsError.message)
    }
    
  } catch (error) {
    console.error('\n💥 Test fehlgeschlagen:', error)
    
    // Zeige spezifische Fehlerinformationen
    if (error.message?.includes('IONOS_API_TOKEN')) {
      console.log('\n🔧 Konfiguration prüfen:')
      console.log('1. Kopiere env.example zu .env: cp env.example .env')
      console.log('2. Setze deinen IONOS API Token in .env')
      console.log('3. Führe den Test erneut aus')
    } else if (error.message?.includes('401')) {
      console.log('\n🔑 Authentifizierungsfehler:')
      console.log('1. Prüfe ob der API Token korrekt ist')
      console.log('2. Stelle sicher, dass der Token aktiv ist')
      console.log('3. Prüfe ob du Zugriff auf IONOS AI Model Hub hast')
    } else if (error.message?.includes('400')) {
      console.log('\n📝 Request-Fehler:')
      console.log('1. Prüfe die Request-Parameter')
      console.log('2. Stelle sicher, dass das Modell verfügbar ist')
      console.log('3. Prüfe die API-Dokumentation')
    }
  }
  
  console.log('\n🏁 IONOS API Basis-Test beendet.')
  process.exit(0)
}

// Test ausführen
testIONOSBasic() 