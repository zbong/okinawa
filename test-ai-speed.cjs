const { GoogleGenerativeAI } = require("@google/generative-ai");

// API 설정 (사용자 .env에서 가져온 키)
const API_KEY = "AIzaSyDiJD96_L1slI5PFZpkmy4_hxGJyorVI-8";
const MODEL_NAME = "gemini-2.0-flash";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0
    }
});

const destinations = ["발리", "bali", "방콕", "벙쿡", "오키나와"];

async function runTest() {
    console.log(`\n=== AI 응답 시간 측정 테스트 시작 (모델: ${MODEL_NAME}) ===\n`);

    let totalTime = 0;
    let results = [];

    for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
        const prompt = `Check if "${dest}" is a valid travel destination. 
Return a JSON object ONLY:
{
  "isValid": boolean,
  "correctedName": "Official Name (Korean)",
  "country": "Country Name (Korean)",
  "language": "ISO Language Code (e.g., ja-JP)",
  "languageName": "Language Name (Korean)",
  "currencySymbol": "Symbol (e.g., ¥)",
  "currencyName": "Currency Name (Korean)",
  "flag": "Flag Emoji"
}`;

        console.log(`[테스트 ${i + 1}] 목적지: "${dest}" 호출 중...`);
        const start = Date.now();

        try {
            const result = await model.generateContent(prompt);
            const duration = (Date.now() - start) / 1000;
            const text = result.response.text();

            console.log(`   ㄴ 응답 완료: ${duration.toFixed(2)}초`);
            results.push({ dest, duration, success: true });
            totalTime += duration;
        } catch (err) {
            const duration = (Date.now() - start) / 1000;
            console.error(`   ㄴ 에러 발생 (${duration.toFixed(2)}초):`, err.message);
            results.push({ dest, duration, success: false, error: err.message });
        }
    }

    console.log("\n=== 최종 결과 요약 ===");
    results.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.dest.padEnd(8)}: ${r.success ? r.duration.toFixed(2) + "초 ✅" : "실패 ❌ (" + r.error + ")"}`);
    });
    console.log(`\n평균 응답 시간: ${(totalTime / results.filter(r => r.success).length).toFixed(2)}초`);
    console.log("=====================\n");
}

runTest();
