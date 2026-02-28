const { GoogleGenerativeAI } = require("@google/generative-ai");

// API 설정
const API_KEY = "AIzaSyDiJD96_L1slI5PFZpkmy4_hxGJyorVI-8";
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-3-flash-preview"
];

const testDest = "방콕";
const iterations = 3;

async function runComparison() {
    console.log(`\n🚀 모델별 응답 속도 비교 테스트 시작 (${iterations}회 반복, 대상: "${testDest}")\n`);

    let summary = [];

    for (const modelName of modelsToTest) {
        console.log(`\n[모델: ${modelName}] 테스트 중...`);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0
            }
        });

        let durations = [];
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            try {
                const prompt = `Check if "${testDest}" is a valid travel destination. 
Return a JSON object ONLY:
{
  "isValid": boolean,
  "correctedName": "Official Name (Korean)",
  "country": "Country Name (Korean)",
  "language": "ISO Language Code",
  "languageName": "Language Name",
  "currencySymbol": "Symbol",
  "currencyName": "Currency Name",
  "flag": "Flag Emoji"
}`;
                await model.generateContent(prompt);
                const duration = (Date.now() - start) / 1000;
                console.log(`   ㄴ ${i + 1}회차: ${duration.toFixed(2)}초`);
                durations.push(duration);
            } catch (err) {
                console.error(`   ㄴ ${i + 1}회차 실패:`, err.message);
            }
        }

        if (durations.length > 0) {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            summary.push({ model: modelName, avg, success: durations.length });
        } else {
            summary.push({ model: modelName, avg: 0, success: 0 });
        }
    }

    console.log("\n" + "=".repeat(40));
    console.log("🏆 최종 비교 결과 (평균 시간 순)");
    console.log("=".repeat(40));

    summary.sort((a, b) => (a.avg || 999) - (b.avg || 999));

    summary.forEach((s, i) => {
        const timeStr = s.success > 0 ? `${s.avg.toFixed(2)}초` : "전부 실패";
        console.log(`${i + 1}. ${s.model.padEnd(25)}: ${timeStr} (${s.success}/${iterations} 성공)`);
    });
    console.log("=".repeat(40) + "\n");
}

runComparison();
