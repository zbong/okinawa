import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize at module level to allow exports
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = new GoogleGenerativeAI(apiKey || 'missing-key');

/**
 * Utility to retry a function with exponential backoff
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err.message || '';

      // If it's a 404 (Model not found), don't retry same model - throw so caller can try another model
      if (msg.includes('404') || msg.includes('not found')) {
        throw err;
      }

      // 429: Rate Limit, 503: Service Unavailable, 500: Internal Error
      const shouldRetry = msg.includes('429') || msg.includes('503') || msg.includes('500') || msg.includes('Resource exhausted');

      if (shouldRetry && i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        // Only log warning if it's not the first standard backoff (reduce noise)
        if (i > 0) {
          console.warn(`⏳ Gemini API Rate Limit. Waiting ${delay}ms before retry...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * AI-powered parser for OCR text or images using Gemini (Multimodal)
 */
export const parseWithAI = async (text: string, fileData?: { base64: string, mimeType: string }) => {
  if (!apiKey || apiKey === 'missing-key') {
    throw new Error('Gemini API Key is not configured');
  }

  // genAI is now imported from module scope

  /**
   * Verified model list for this account:
   * 1. gemini-2.0-flash (Strongest stable)
   * 2. gemini-1.5-flash (Reliable stable)
   * 3. gemini-1.5-flash-8b (Lightweight fallback)
   */
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  let lastError: any;

  for (const modelName of modelsToTry) {
    try {
      console.log(`📡 Attempting parsing with official model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
당신은 전 세계 항공권 및 여행 서류를 수만 건 분석해본 **데이터 추출 전문가**입니다. 
당신의 임무는 이미지/텍스트에서 정보를 뽑아 정확한 JSON을 만드는 것입니다. 

**[가장 중요한 임무: 시간(TIME) 추출]**
사용자는 현재 "요약은 잘 되는데 데이터 칸이 비어있다"는 점에 매우 실망하고 있습니다. 
당신이 'summary'에 시간을 적을 수 있다면, 그 시간은 반드시 'flight.departureTime'과 'flight.arrivalTime'에도 존재해야 합니다. 

**[시간 추출 가이드라인]**
1. **모든 숫자 스캔**: 문서 내의 모든 4자리 숫자(1430), 콜론 포함 숫자(10:45), AM/PM 포함 숫자(02:30 PM)를 검색하세요.
2. **키워드 기반 매핑**:
   - 출발 관련: DEP, Departure, Boarding, From, ST(Scheduled Time), 出発, 🛫
   - 도착 관련: ARR, Arrival, To, Landing, AT(Actual Time), 到着, 🛬
3. **포맷 변환**: 발견된 모든 시간은 반드시 'HH:mm' (24시간제)로 변환하세요. (예: 2:15 PM -> 14:15, 0900 -> 09:00)
4. **절대 규칙**: 요약문(summary)에 시간이 언급되었다면, 데이터 필드(departureTime 등)는 **절대로** null이나 빈 문자열이어서는 안 됩니다. 확신이 없다면 가장 유력한 시간 후보를 넣으세요.

**[응답 형식: JSON]**
{
  "type": "flight" | "accommodation" | "unknown",
  "summary": "전체 여정 요약 (반드시 항공사, 편명, 출발/도착 시간을 포함하세요)",
  "title": "요약 제목",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "flight": {
    "airline": "항공사",
    "flightNumber": "편명",
    "departureAirport": "출발공항",
    "arrivalAirport": "도착공항",
    "departureDate": "YYYY-MM-DD",
    "arrivalDate": "YYYY-MM-DD",
    "departureTime": "HH:mm",
    "arrivalTime": "HH:mm"
  },
  "accommodation": {
    "hotelName": "숙소명",
    "address": "주소",
    "checkInDate": "YYYY-MM-DD",
    "checkOutDate": "YYYY-MM-DD",
    "checkInTime": "HH:mm"
  }
}

**[데이터 무결성 규칙]**
- 날짜와 시간이 분리되어 표기된 경우(예: 15JAN 14:30), 이를 결합하여 분석하세요.
- 도착 시간이 다음 날인 경우(+1) arrivalDate를 하루 뒤로 설정하세요.
- 오직 순수 JSON만 출력하세요. 텍스트 설명은 불필요합니다.
`;

      const result = await retryWithBackoff(async () => {
        if (fileData) {
          const rawBase64 = fileData.base64.includes(',') ? fileData.base64.split(',')[1] : fileData.base64;
          return await model.generateContent([
            prompt,
            { inlineData: { data: rawBase64, mimeType: fileData.mimeType } }
          ]);
        } else {
          return await model.generateContent(prompt + "\n\n[DOCUMENT CONTENT]\n" + text.slice(0, 15000));
        }
      });

      const responseText = result.response.text().trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("---------------------------------------------------");
        console.log("🤖 AI PARSED RESULT (DEBUG):");
        console.log(JSON.stringify(parsed, null, 2)); // Pretty print critical for debugging
        console.log("---------------------------------------------------");

        // Simple validation to ensure we got real content
        if (parsed.summary || parsed.flight?.airline || parsed.accommodation?.hotelName) {
          console.log(`✅ AI Parsing Successful with model: ${modelName}`);
          return parsed;
        }
      }
      console.warn(`⚠️ Model ${modelName} returned incomplete result, falling back...`);
    } catch (err: any) {
      lastError = err;
      console.warn(`❌ Model ${modelName} failed:`, err.message);
      // Wait a bit before trying next model to avoid cascading 429
      if (err.message.includes('429')) await new Promise(r => setTimeout(r, 2000));
    }
  }

  throw lastError || new Error("All authorized AI models failed to parse. Please check your API Quota.");
};
