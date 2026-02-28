const { GoogleGenerativeAI } = require("@google/generative-ai");

// API 설정
const API_KEY = "YOUR_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODEL_NAME = "gemini-2.0-flash";
const destination = "방콕";
const companion = "가족";
const iterations = 3;

async function runRecommendationTest() {
    console.log(`\n🚀 [장소 추천] 응답 속도 테스트 시작 (모델: ${MODEL_NAME}, 대상: "${destination}")\n`);

    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1 // 추천에는 약간의 다양성을 위해 0.1 사용
        }
    });

    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
        console.log(`[${i + 1}회차] 25개 장소 추천 생성 중...`);
        const start = Date.now();

        const prompt = `Return a raw JSON array of 25 must-visit places in "${destination}" for a traveler with "${companion}".
FORMAT: [{"name": "Name", "category": "sightseeing", "desc": "One line", "rating": 4.5, "reviewCount": 1000, "coordinates": {"lat": 0, "lng": 0}}]
RULES:
1. ONLY output the JSON array.
2. Start with "[" immediately.
3. Category must be sightseeing, activity, or dining.
4. Output in Korean.`;

        try {
            const result = await model.generateContent(prompt);
            const duration = (Date.now() - start) / 1000;
            const text = result.response.text();
            const items = JSON.parse(text);

            console.log(`   ㄴ 응답 완료: ${duration.toFixed(2)}초 (${items.length}개 장소 수신)`);
            totalTime += duration;
        } catch (err) {
            console.error(`   ㄴ 실패:`, err.message);
        }
    }

    console.log(`\n평균 장소 추천 시간: ${(totalTime / iterations).toFixed(2)}초`);
    console.log("=====================\n");
}

runRecommendationTest();
