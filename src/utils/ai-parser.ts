import { GoogleGenerativeAI } from '@google/generative-ai';

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
        console.warn(`⚠️ Gemini API Issue (Rate Limit/Server). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

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
1. 날짜 형식: YYYY-MM-DD (연도 정보가 없는 문서라면 올해인 2026년으로 적용)
2. 좌표 필수: 공항/호텔 이름을 기반으로 위경도 좌표(lat/lng)를 당신의 지식을 활용해 반드시 포함하세요. 
3. 출력: 오직 순수 JSON만 출력하세요. (마크다운 불필요)
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
