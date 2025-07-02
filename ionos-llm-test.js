import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.IONOS_API_URL;
const API_TOKEN = process.env.IONOS_API_TOKEN;
const MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct'; // Beispielmodell

async function runLLMQuery(prompt) {
  const response = await fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Du bist ein Musik-KI-Assistent.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await response.json();
  console.log('Antwort:', JSON.stringify(data, null, 2));
}

runLLMQuery('Erstelle einen Song im Stil von Tame Impala mit dreamy Synths und Reverb.'); 