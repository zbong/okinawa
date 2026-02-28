
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

// Read from .env if it exists, or just use process.env
const env = fs.readFileSync(".env", "utf8");
const apiKey = env.match(/VITE_GEMINI_API_KEY=(.*)/)?.[1]?.trim();

if (!apiKey) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModels() {
    try {
        const result = await genAI.listModels();
        console.log("AVAILABLE MODELS:");
        result.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName}) [Streams: ${m.supportedGenerationMethods.includes('generateContent')}]`);
        });
    } catch (e) {
        console.error("Failed to list models:", e.message);
    }
}

checkModels();
