
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

async function verifyGemini() {
    console.log("--- Testing Gemini API Key ---");
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ Gemini API Key not found in environment variables.");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello, verify this key.");
        const text = result.response.text();
        console.log("✅ Gemini API Key is working!");
        console.log("Response Preview:", text.substring(0, 50) + "...");
    } catch (error) {
        console.error("❌ Gemini API Key Error:", error.message);
    }
}

async function verifyGoogleMaps() {
    console.log("\n--- Testing Google Maps API Key ---");
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("❌ Google Maps API Key not found in environment variables.");
        return;
    }

    try {
        // Geocoding API test (standard)
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Okinawa&key=${apiKey}`);
        const data = await response.json();

        if (data.status === "OK") {
            console.log("✅ Google Maps API Key is working!");
            console.log("Status:", data.status);
        } else {
            console.log("❌ Google Maps API Key Error Status:", data.status);
            if (data.error_message) console.log("Message:", data.error_message);
        }
    } catch (error) {
        console.error("❌ Google Maps API Error:", error.message);
    }
}

async function run() {
    await verifyGemini();
    await verifyGoogleMaps();
}

run();
