const { GoogleGenerativeAI } = require("@google/generative-ai");

// API 설정
const API_KEY = "YOUR_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    console.log("=== 사용 가능한 Google AI 모델 목록 조회 시작 ===\n");
    try {
        // v1beta API 기준 모델 목록 조회
        const result = await genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }).listModels();
        // 참고: SDK 버전에 따라 위 방식이 안될 수 있으므로 REST 직접 호출이나 다른 유틸 확인 필요
        // 하지만 최신 SDK는 genAI 객체에서 직접 접근하거나 다른 방식을 지원할 수 있음
        // 만약 위 코드가 실패하면 fetch로 직접 호출

        console.log("모델 목록:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.log("SDK listModels 실패, REST API로 직접 조회 시도...");
        try {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
            const data = await response.json();

            if (data.models) {
                console.log("총 모델 수:", data.models.length);
                data.models.forEach(m => {
                    console.log(`- 명칭: ${m.name.replace('models/', '')}`);
                    console.log(`  ㄴ 지원기능: ${m.supportedGenerationMethods.join(", ")}`);
                });
            } else {
                console.log("조회된 모델이 없습니다.", data);
            }
        } catch (fetchErr) {
            console.error("REST API 조회도 실패:", fetchErr.message);
        }
    }
}

listModels();
