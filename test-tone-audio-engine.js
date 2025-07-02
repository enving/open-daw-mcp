import ToneAudioEngine from './src/audio/tone-audio-engine.js'
import { join } from 'path'

async function main() {
  const engine = new ToneAudioEngine()

  // Beispiel-Pattern
  const pattern = {
    bpm: 110,
    key: 'C',
    scale: 'major'
  }

  const style = 'psychedelic_rock'
  const outputPath = join('output', `tone_test_${Date.now()}.wav`)

  await engine.createSong(pattern, style, outputPath)
  engine.dispose()

  console.log('✅ Test abgeschlossen. Datei:', outputPath)
}

main().catch(console.error) 