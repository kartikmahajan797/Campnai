// Updated check_models.js
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Simple fetch to list models directly from API endpoint if SDK doesn't expose it easily
async function listModelsDirectly() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes('embedding')) {
                    console.log(`- ${m.name} (Supported methods: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModelsDirectly();
