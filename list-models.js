import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = "YOUR_API_KEY";
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const result = await genAI.listModels();
        console.log("AVAILABLE_MODELS_START");
        result.models.forEach(m => {
            console.log(`${m.name} | ${m.displayName} | ${m.supportedGenerationMethods.join(',')}`);
        });
        console.log("AVAILABLE_MODELS_END");
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
