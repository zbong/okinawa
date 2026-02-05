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
   * 2. gemini-flash-latest (Reliable fallback)
   * 3. gemini-2.5-flash (Cutting edge)
   */
  const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash-latest"];
  let lastError: any;

  for (const modelName of modelsToTry) {
    try {
      console.log(`📡 Attempting parsing with official model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
당신은 여행 서류 분석 전문가입니다. 주어진 텍스트나 이미지를 분석하여 항공권, 숙소 예약, 배 티켓, 또는 투어 정보를 추출하세요.
문서의 모든 맥락(항공사, 편명, 호텔 이름, 주소, 일자 등)을 이해하고 데이터를 절대 누락하지 마세요.

반드시 다음 구조의 JSON 형식으로만 응답하세요.

{
  "type": "flight" | "accommodation" | "ship" | "tour" | "unknown",
  "summary": "추출된 전체 정보를 한국어로 요약 (예: '제주항공 7C1402편으로 3월 5일 오키나와로 가는 여정입니다.')",
  "title": "문서의 짧은 제목",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "departure": "출발지",
  "arrival": "도착지",
  "flight": {
    "airline": "항공사이름",
    "flightNumber": "편명",
    "departureAirport": "출발 공항",
    "arrivalAirport": "도착 공항",
    "departureDate": "YYYY-MM-DD",
    "arrivalDate": "YYYY-MM-DD",
    "departureTime": "HH:mm",
    "arrivalTime": "HH:mm",
    "departureCoordinates": { "lat": number, "lng": number },
    "arrivalCoordinates": { "lat": number, "lng": number }
  },
  "ship": {
    "shipName": "선박명",
    "departurePort": "출발항",
    "arrivalPort": "도착항",
    "departureDate": "YYYY-MM-DD",
    "arrivalDate": "YYYY-MM-DD",
    "departureTime": "HH:mm",
    "arrivalTime": "HH:mm",
    "departureCoordinates": { "lat": number, "lng": number },
    "arrivalCoordinates": { "lat": number, "lng": number }
  },
  "accommodation": {
    "hotelName": "숙소 이름",
    "address": "전체 주소",
    "checkInDate": "YYYY-MM-DD",
    "checkOutDate": "YYYY-MM-DD",
    "checkInTime": "HH:mm",
    "coordinates": { "lat": number, "lng": number }
  }
}

[규칙]
1. 날짜/시간 논리 필독:
   - 문서에 나오는 **가장 빠른 날짜와 시간**이 무조건 '출발(departure)'입니다.
   - **가장 늦은 날짜와 시간**이 무조건 '도착(arrival)'입니다.
   - 절대 출발 날짜에 도착 날짜를 적지 마세요.
2. 시간 포맷:
   - 오후/오전(PM/AM) 표현은 반드시 24시간제 'HH:mm'으로 변환하세요. (예: 2:30 PM -> 14:30)
   - 만약 도착 시간이 문서에 '25:00'이나 '+1일'로 표기되어 있다면, 날짜를 다음 날로 조정하고 시간을 01:00으로 변환하세요.
3. 데이터 필수: 도착 시간(arrivalTime)이 명시되어 있지 않다면 비행 시간을 고려해 추정해서라도 넣으세요.
4. 좌표: 공항/호텔 이름을 기반으로 정확한 위경도를 포함하세요.
5. 출력: 오직 순수 JSON만 출력하세요.
`;

      const result = await retryWithBackoff(async () => {
        if (fileData) {
          return await model.generateContent([
            prompt,
            { inlineData: { data: fileData.base64, mimeType: fileData.mimeType } }
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
