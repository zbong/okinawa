// VERSION: 2.1.3-FULLY-RESTORED-GEMS
import { retryWithBackoff } from '../utils/ai-parser';
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PlannerData } from '../types';
import { supabase } from '../utils/supabase';

interface UsePlannerAIProps {
    plannerData: PlannerData;
    selectedPlaceIds: string[];
    setSelectedPlaceIds: React.Dispatch<React.SetStateAction<string[]>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    hotelStrategy: string;
    setHotelStrategy: React.Dispatch<React.SetStateAction<string>>;
    scheduleDensity: "여유롭게" | "보통" | "빡빡하게";
    customFiles: any[];
    dynamicAttractions: any[];
    setDynamicAttractions: React.Dispatch<React.SetStateAction<any[]>>;
    recommendedHotels: any[];
    setRecommendedHotels: React.Dispatch<React.SetStateAction<any[]>>;
    user: any;
    setPlannerData: React.Dispatch<React.SetStateAction<PlannerData>>;
}

const VALIDATION_CACHE: Record<string, any> = {};

/**
 * Authorized models based on PROJECT_STATUS.md and ai-parser.ts logic.
 * Main: gemini-2.0-flash
 * High-quality/Fallback: gemini-pro-latest (which is usually pro 1.5)
 * We skip gemini-1.5-flash as requested by user.
 */
const AUTHORIZED_MODELS = ["gemini-2.0-flash", "gemini-pro-latest"];

export const usePlannerAI = ({
    plannerData,
    selectedPlaceIds,
    setSelectedPlaceIds,
    showToast,
    hotelStrategy,
    setHotelStrategy,
    scheduleDensity,
    customFiles,
    dynamicAttractions,
    setDynamicAttractions,
    recommendedHotels,
    setRecommendedHotels,
    user,
    setPlannerData
}: UsePlannerAIProps) => {
    const [isValidatingDestination, setIsValidatingDestination] = useState(false);
    const [isDestinationValidated, setIsDestinationValidated] = useState(() => {
        return !!(plannerData && plannerData.destination && plannerData.destinationInfo);
    });
    const [isSearchingAttractions, setIsSearchingAttractions] = useState(false);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [hotelAddStatus, setHotelAddStatus] = useState<"IDLE" | "VALIDATING" | "SUCCESS" | "ERROR">("IDLE");
    const [validatedHotel, setValidatedHotel] = useState<any | null>(null);
    const [isValidatingPlace, setIsValidatingPlace] = useState(false);
    const [isPlaceAddedSuccess, setIsPlaceAddedSuccess] = useState(false);
    const [isPlaceAddedError, setIsPlaceAddedError] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const isGeneratingRef = useRef(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Sync validation state with data (important for resuming drafts and resetting)
    useEffect(() => {
        if (plannerData?.isDestinationValidated || (plannerData?.destination && plannerData?.destinationInfo)) {
            setIsDestinationValidated(true);
        } else {
            setIsDestinationValidated(false);
        }
    }, [plannerData?.isDestinationValidated, plannerData?.destination, plannerData?.destinationInfo]);

    // Suppress unused warnings
    void user;
    void hotelStrategy;
    void recommendedHotels;

    const parsePartialJsonArray = (text: string): any[] => {
        try {
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const firstBracket = cleaned.indexOf('[');
            if (firstBracket === -1) return [];
            let jsonStr = cleaned.substring(firstBracket);
            const items: any[] = [];
            let braceCount = 0;
            let startIdx = -1;
            let inString = false;
            for (let i = 0; i < jsonStr.length; i++) {
                const char = jsonStr[i];
                if (char === '"' && jsonStr[i - 1] !== '\\') inString = !inString;
                if (inString) continue;
                if (char === '{') {
                    if (braceCount === 0) startIdx = i;
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0 && startIdx !== -1) {
                        const objStr = jsonStr.substring(startIdx, i + 1);
                        try {
                            const sanitized = objStr.replace(/[\u0000-\u001F]+/g, " ");
                            items.push(JSON.parse(sanitized));
                        } catch (e) { }
                    }
                }
            }
            return items;
        } catch (e) { return []; }
    };

    const fetchAttractionsWithAI = useCallback(async (destination: string, forceRefresh: boolean = false) => {
        if (!apiKey || !destination) return;
        setDynamicAttractions([]);
        const destinationKey = (destination.toLowerCase().trim()) + "_v5";

        try {
            const { data: cached } = await supabase.from('attraction_cache').select('*').eq('destination', destinationKey).maybeSingle();
            if (!forceRefresh && cached) {
                const now = new Date();
                const updatedAt = new Date(cached.updated_at);
                if (now.getTime() - updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
                    setDynamicAttractions(cached.attractions);
                    return;
                }
            }
        } catch (e) { }

        setIsSearchingAttractions(true);
        const globalTimeout = setTimeout(() => setIsSearchingAttractions(false), 60000);

        try {
            let lastError: any;
            for (const modelName of AUTHORIZED_MODELS) {
                try {
                    console.log(`📡 [fetchAttractions] Attempting with model: ${modelName}`);
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const prompt = `Return a raw JSON array of 25 must-visit places in "${destination}" for a traveler with "${plannerData.companion}". 
                    Include a diverse mix of sightseeing, food/restaurants, cafes, and activities.
                    FORMAT: [{"name": "Name", "category": "sightseeing | food | cafe | activity", "desc": "One line summary", "rating": 4.5, "reviewCount": 1000, "coordinates": {"lat": 35.6895, "lng": 139.6917}}]
                    RULES: 1. ONLY raw JSON array. 2. Output Korean. 3. Be specific with categories.`;

                    const result = await retryWithBackoff(() => model.generateContent(prompt), 1, 500);
                    const text = result.response.text();
                    const jsonMatch = text.match(/\[[\s\S]*\]/);
                    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : parsePartialJsonArray(text);

                    if (items.length > 0) {
                        const sessionId = Date.now();
                        const processed = items.map((item: any, idx: number) => {
                            const rawCat = (item.category || '').toLowerCase().trim();
                            const name = (item.name || '').toLowerCase();
                            const desc = (item.desc || '').toLowerCase();
                            let fc = 'sightseeing';
                            if (['cafe', '카페', '커피', '디저트'].some(k => rawCat.includes(k) || name.includes(k) || desc.includes(k))) fc = 'cafe';
                            else if (['food', 'dining', 'restaurant', '식당', '맛집', '요리'].some(k => rawCat.includes(k) || name.includes(k) || desc.includes(k))) fc = 'food';
                            else if (['activity', 'experience', '체험', '활동', '공원', '해변'].some(k => rawCat.includes(k) || name.includes(k) || desc.includes(k))) fc = 'activity';
                            return { ...item, id: `ai-${sessionId}-${idx}`, category: fc };
                        });
                        setDynamicAttractions(processed);
                        await supabase.from('attraction_cache').upsert({ destination: destinationKey, attractions: processed, updated_at: new Date().toISOString() });
                        return;
                    }
                } catch (error: any) {
                    lastError = error;
                    const msg = error.message || '';
                    if (msg.includes('429') || msg.includes('Quota')) {
                        console.warn(`⏳ [fetchAttractions] Quota exceeded for ${modelName}. Trying next...`);
                        showToast(`API 할당량 초과로 다른 모델을 시도합니다...`, "info");
                        continue;
                    }
                    break;
                }
            }
            console.error("[fetchAttractions] All models failed:", lastError);
            showToast("추천 정보를 가져오는 중 오류가 발생했습니다.", "error");
        } finally {
            clearTimeout(globalTimeout);
            setIsSearchingAttractions(false);
        }
    }, [apiKey, plannerData.companion, setDynamicAttractions, setIsSearchingAttractions, showToast]);

    const fetchAttractionDetailWithAI = useCallback(async (attractionId: string) => {
        if (!apiKey) return;
        const target = dynamicAttractions.find(a => a.id === attractionId);
        if (!target || target.longDesc) return;

        setIsFetchingDetail(true);
        const detailTimeout = setTimeout(() => setIsFetchingDetail(false), 60000);

        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [fetchDetail] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `
[장소: "${target.name}", 목적지: "${plannerData.destination}", 동행자: "${plannerData.companion}"]
위 장소에 대해 전문 여행 가이드북 작가처럼 핵심적이고 알찬 에세이를 작성해주세요.
요구사항:
1. 분량: 공백 제외 500자 내외로 풍성하게 작성.
2. 내용: 이 장소의 역사적 배경, 문화적 가치, 그리고 왜 이곳이 "${plannerData.companion}"(와)과 함께 가기에 완벽한지 구체적으로 기술하세요.
3. 말투: 신뢰감 있고 감성적인 문체 (한국어).
4. 실용적인 꿀팁 2개 포함.
출력 형식:
DESC: (여기에 본문 작성)
TIP1: (첫 번째 팁)
TIP2: (두 번째 팁)
            `;
                const result = await retryWithBackoff(() => model.generateContent(prompt), 1);
                const fullText = result.response.text().trim();
                const d = fullText.match(/DESC:\s*([\s\S]*?)(?=TIP1:|$)/i);
                const t1 = fullText.match(/TIP1:\s*([\s\S]*?)(?=TIP2:|$)/i);
                const t2 = fullText.match(/TIP2:\s*([\s\S]*?)$/i);
                if (d) {
                    const longDesc = d[1].trim();
                    const tips = [t1 ? t1[1].trim() : "", t2 ? t2[1].trim() : ""].filter(t => t !== "");
                    setDynamicAttractions((prev: any[]) => {
                        const next = prev.map(a => a.id === attractionId ? { ...a, longDesc, tips } : a);

                        // Side effect (DB update) using IIFE to avoid blocking state update
                        (async () => {
                            if (plannerData.destination) {
                                try {
                                    const { supabase } = await import('../utils/supabase');
                                    const destinationKey = (plannerData.destination.toLowerCase().trim()) + "_v5";
                                    await supabase.from('attraction_cache').upsert({
                                        destination: destinationKey,
                                        attractions: next,
                                        updated_at: new Date().toISOString()
                                    });
                                    console.log('✅ 상세 설명 캐싱 완료:', target.name);
                                } catch (e) {
                                    console.warn('상세 설명 캐싱 실패:', e);
                                }
                            }
                        })();

                        return next;
                    });
                    clearTimeout(detailTimeout);
                    setIsFetchingDetail(false);
                    return;
                }
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    continue;
                }
                break;
            }
        }
        console.error("[fetchDetail] All models failed:", lastError);
        clearTimeout(detailTimeout);
        setIsFetchingDetail(false);
    }, [apiKey, dynamicAttractions, plannerData.companion, plannerData.destination, setDynamicAttractions]);

    const fetchHotelsWithAI = useCallback(async (destination: string) => {
        if (!apiKey || !destination) return;
        const destinationKey = (destination.toLowerCase().trim()) + "_hotels";
        try {
            const { data: cached } = await supabase.from('attraction_cache').select('*').eq('destination', destinationKey).maybeSingle();
            if (cached) {
                if (cached.attractions.strategy) setHotelStrategy(cached.attractions.strategy);
                if (cached.attractions.hotels) setRecommendedHotels(cached.attractions.hotels);
                return;
            }
        } catch (e) { }

        setIsSearchingHotels(true);
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [fetchHotels] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });
                const sp = dynamicAttractions.filter(p => selectedPlaceIds.includes(p.id)).map(p => p.name).join(", ");
                const prompt = `Plan a trip to "${destination}" with "${plannerData.companion}". 
                Selected places: [${sp}].
                Task:
                1. Analyze logic and provide a "strategy" (e.g., "North for 1 night, Naha for 2 nights to minimize travel time").
                2. Recommend 10 best hotels.
                Return JSON in Korean:
                {"strategy": "string", "hotels": [{"name": "string", "desc": "string", "area": "string", "reason": "string", "priceLevel": "Expensive/Moderate/Cheap", "rating": number, "reviewCount": number, "tags": ["string"]}]}`;
                const result = await retryWithBackoff(() => model.generateContent(prompt));
                const text = result.response.text();
                const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
                const data = JSON.parse(match ? match[0] : text);
                if (data.strategy) setHotelStrategy(data.strategy);
                if (data.hotels) setRecommendedHotels(data.hotels);
                await supabase.from('attraction_cache').upsert({ destination: destinationKey, attractions: data, updated_at: new Date().toISOString() });
                setIsSearchingHotels(false);
                return;
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    continue;
                }
                break;
            }
        }
        console.error("[fetchHotels] All models failed:", lastError);
        setIsSearchingHotels(false);
    }, [apiKey, dynamicAttractions, plannerData.companion, selectedPlaceIds, setHotelStrategy, setRecommendedHotels]);

    const validateAndAddPlace = useCallback(async (name: string) => {
        if (!name || !apiKey) return false;
        const exists = dynamicAttractions.find(a => a.name.includes(name) || name.includes(a.name));
        if (exists) {
            if (!selectedPlaceIds.includes(exists.id)) setSelectedPlaceIds(prev => [...prev, exists.id]);
            return true;
        }
        setIsValidatingPlace(true);
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [validatePlace] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `Check if "${name}" exists in "${plannerData.destination}". Return JSON in Korean: {"isValid": boolean, "name": "Official Name", "category": "string", "desc": "summary", "coordinates": {"lat": 실좌표, "lng": 실좌표}}. MUST provide real Google Maps coordinates. DO NOT use 0,0.`;
                const result = await retryWithBackoff(() => model.generateContent(prompt));
                const text = result.response.text();
                const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
                const parsed = JSON.parse(match ? match[0] : text);
                const data = Array.isArray(parsed) ? parsed[0] : parsed;
                if (data?.isValid) {
                    const np = { id: `manual-${Date.now()}`, ...data, longDesc: data.desc, rating: 0, reviewCount: 0 };
                    setDynamicAttractions((prev: any[]) => [np, ...prev]);
                    setSelectedPlaceIds((prev: string[]) => [...prev, np.id]);
                    setIsPlaceAddedSuccess(true); setTimeout(() => setIsPlaceAddedSuccess(false), 2000);
                    setIsValidatingPlace(false);
                    return true;
                }
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    continue;
                }
                break;
            }
        }
        console.error("[validatePlace] All models failed:", lastError);
        setIsPlaceAddedError(true);
        setTimeout(() => setIsPlaceAddedError(false), 2000);
        setIsValidatingPlace(false);
        return false;
    }, [apiKey, dynamicAttractions, plannerData.destination, setDynamicAttractions, setIsPlaceAddedError, setIsPlaceAddedSuccess, setIsValidatingPlace, setSelectedPlaceIds]);

    const validateHotel = useCallback(async (name: string) => {
        if (!name || !apiKey) return;
        setHotelAddStatus("VALIDATING");
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [validateHotel] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `Hotel "${name}" in "${plannerData.destination}". JSON: {"isValid": boolean, "name": "string", "area": "string", "desc": "string", "priceLevel": "string", "rating": number}`;
                const result = await retryWithBackoff(() => model.generateContent(prompt));
                const text = result.response.text();
                const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
                const parsed = JSON.parse(match ? match[0] : text);
                const data = Array.isArray(parsed) ? parsed[0] : parsed;
                if (data?.isValid) {
                    setValidatedHotel(data);
                    setHotelAddStatus("SUCCESS");
                    return;
                }
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    continue;
                }
                break;
            }
        }
        console.error("[validateHotel] All models failed:", lastError);
        setHotelAddStatus("IDLE");
    }, [apiKey, plannerData.destination, setHotelAddStatus, setValidatedHotel]);

    const generatePlanWithAI = useCallback(async (_customPrompt?: string) => {
        if (!apiKey || isGeneratingRef.current) return null;
        isGeneratingRef.current = true;
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [generatePlan] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
                });
                const sp = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));
                // ✅ Deep Deduplication of accommodations (Cross-language merge)
                const rawAccs = plannerData.accommodations || [];
                const dedupedAccs: any[] = [];
                const getStableId = (name: string, addr: string, date: string) => {
                    const n = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                    const a = (addr || "").replace(/[^a-z0-9]/gi, '').toLowerCase();
                    const d = date || "nodate";
                    return a.length > 8 ? `ST-${a.substring(0, 20)}-${d}` : `ST-${n.substring(0, 15)}-${d}`;
                };

                rawAccs.forEach(acc => {
                    const newId = getStableId(acc.name, (acc as any).address || "", acc.startDate);
                    const existingIdx = dedupedAccs.findIndex(existing => {
                        const existingId = getStableId(existing.name, (existing as any).address || "", existing.startDate);
                        if (existingId === newId) return true;

                        const alphaE = existing.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                        const alphaN = acc.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                        const nameMatch = (alphaE.length > 5 && alphaN.length > 5) && (alphaE.includes(alphaN) || alphaN.includes(alphaE));
                        return nameMatch && acc.startDate === existing.startDate;
                    });

                    if (existingIdx > -1) {
                        if (acc.isConfirmed) dedupedAccs[existingIdx].isConfirmed = true;
                    } else {
                        dedupedAccs.push({ ...acc });
                    }
                });

                const allAccs = dedupedAccs.map(a => ({
                    ...a,
                    isConfirmed: !!a.isConfirmed // missing is false
                }));
                const bookedHotels = allAccs.filter(a => a.isConfirmed === true);
                const candidateList = allAccs.filter(a => a.isConfirmed === false);

                const confirmed = bookedHotels.map(a => `[확정] ${a.name}(${a.startDate || "미정"}~${a.endDate || "미정"})`).join(", ");
                const candidateNames = candidateList.map(a => `[추천] ${a.name}`).join(", ");
                const out = (plannerData.outboundFlights || []).map(f => `${f.airline} (${f.departureContext.airport} ${f.departureContext.time} → ${f.arrivalContext.airport} ${f.arrivalContext.time})`).join(", ");
                const inc = (plannerData.inboundFlights || []).map(f => `${f.airline} (${f.departureContext.airport} ${f.departureContext.time} → ${f.arrivalContext.airport} ${f.arrivalContext.time})`).join(", ");

                // --- 프론트엔드 단에서 비어있는 날짜(미예약 숙박일) 계산 ---
                let unusedCandidatesText = "";
                let missingDatesMsg = "";

                // UTC 기준 날짜 파싱 헬퍼
                const parseDateLocal = (dateStr: string) => {
                    if (!dateStr) return new Date();
                    const match = String(dateStr).match(/(\d{4})[\-\.\/]\s*(\d{1,2})[\-\.\/]\s*(\d{1,2})/);
                    if (match) {
                        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
                    }
                    return new Date(dateStr);
                };
                const formatISO = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };

                if (plannerData.startDate && plannerData.endDate) {
                    const tripStart = parseDateLocal(plannerData.startDate);
                    const tripEnd = parseDateLocal(plannerData.endDate);
                    const totalNights = Math.round((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));

                    if (totalNights > 0) {
                        // 비교의 정확성을 위해 모든 날짜를 "YYYY-MM-DD" 로컬 포맷으로 변환하여 Set으로 관리합니다.
                        const allNights = new Set<string>();
                        for (let i = 0; i < totalNights; i++) {
                            const d = new Date(tripStart);
                            d.setDate(d.getDate() + i);
                            allNights.add(formatISO(d));
                        }

                        bookedHotels.forEach(h => {
                            if (h.startDate && h.endDate) {
                                const hStart = parseDateLocal(h.startDate);
                                const hEnd = parseDateLocal(h.endDate);
                                const hNights = Math.round((hEnd.getTime() - hStart.getTime()) / (1000 * 60 * 60 * 24));
                                // 혹시 hNights가 음수거나 0이면 최소 1박이라도 지우도록 강제 (당일치기 예약 예외처리)
                                const actualNights = hNights > 0 ? hNights : 1;
                                for (let i = 0; i < actualNights; i++) {
                                    const d = new Date(hStart);
                                    d.setDate(d.getDate() + i);
                                    allNights.delete(formatISO(d));
                                }
                            }
                        });

                        const missingNights = Array.from(allNights);
                        if (missingNights.length > 0) {
                            // 후보군이 있을때만 텍스트 생성
                            if (candidateList.length > 0) {
                                const candidatesWithTag = candidateList.map(a => `[추천] ${a.name}`).join(", ");
                                missingDatesMsg = `\n    (⚠️ 미예약 기간: ${missingNights.join(", ")})`;
                                unusedCandidatesText = `확정되지 않은 날짜(${missingNights.join(", ")})에 대해서만 후보 숙소([${candidatesWithTag}]) 중 하나를 선택해 배정하세요.`;
                            }
                        }
                    }
                } else {
                    // 날짜 계산 불가능 예외 처리
                    if (candidateList.length > 0 && !confirmed) {
                        const candidatesWithTag = candidateList.map(a => `[추천] ${a.name}`).join(", ");
                        unusedCandidatesText = `현재 확정된 숙소가 없습니다. 후보 숙소([${candidatesWithTag}])들 중 전체 일정에 가장 적합한 한 곳을 골라 배정하세요.`;
                    }
                }
                // ---------------------

                // ---------------------
                // 기존 상세 설명이 있는 항목들을 별도로 수집
                const existingDetails = dynamicAttractions
                    .filter(a => a.longDesc)
                    .map(a => `- ${a.name}: ${a.longDesc}`)
                    .join("\n");

                const prompt = `당신은 세계 최고의 여행 가이드 AI 'Antigravity'입니다.
    
    ### [시스템 지침: 숙소 배정 원칙]
    - **예약 확정 숙소**: 이미 결제가 완료된 곳입니다. 해당 날짜에는 **반드시** 이 숙소에 머물러야 하며, 다른 곳을 추천하거나 일정을 변경하지 마세요.
    - **관심 후보 숙소**: 사용자가 관심을 가졌거나 시스템이 추천한 후보입니다. **확정 숙소가 없는 날짜**에 대해서만 이 후보들 중 동선에 최적인 곳을 선택하여 배정하세요.
    - **중복 방지**: 확정 숙소가 있는 날에 후보 숙소를 중첩해서 배정하지 마세요.
 
    ### 1. 전제 조건
    - 목적지: ${plannerData.destination}
    - 일정: ${plannerData.startDate} ~ ${plannerData.endDate}
    
    ### 2. 숙소 상세 리스트
    - **[예약 확정 리스트]**: ${confirmed || "없음"} ${missingDatesMsg}
    - **[관심 후보 리스트]**: ${candidateNames || "없음"}
    
    ${unusedCandidatesText ? `### 3. 숙박 배정 가이드\n    ${unusedCandidatesText}` : ""}
 
    ### 4. 방문 장소 (동선 설계용)
    [${sp.map(p => p.name).join(", ")}]

    ${existingDetails ? `### 5. 기존 상세 설명\n- 아래 장소들은 이미 상세 설명이 있으므로 'longDesc' 필드를 ""(빈 문자열)로 남겨두세요.\n${existingDetails}` : ""}
    
    ### 6. 일정 운영 규칙 (일관성 및 로지스틱스)
    - **첫째 날 시작**: 공항으로 이동하여 출발하는 여정(logistics)부터 시작하세요.
    - **중간 날 일정**: 하루의 시작은 "숙소 출발", 마지막은 "숙소 체크인/휴식"으로 구성하세요.
    - **마지막 날 종료**: 공항으로 이동하여 귀가하는 여정(logistics)으로 마무리하세요.
    - 명칭 규칙: 
      - 체크인: "[숙소이름] (체크인 및 휴식)"
      - 출발: "[숙소이름] (출발)"
    - **절대 주의**: 첫날 공항 이동 및 비행기 탑승 여정을 생략하지 마세요. (예: "인천국제공항 출발", "오키나와 도착")
    
    ### 7. 추가 정보
    - 항공편: 가는편[${out}], 오는편[${inc}]
    - 이동수단: ${plannerData.useRentalCar ? "렌터카 (운전)" : "대중교통"}
    
    ### 8. 언어 및 출력 규칙 (중요)
    - **언어**: 모든 항목은 반드시 **한국어**로 작성하세요.
    - **설명(desc)**: 일정표 목록에서 보여줄 **1~2문장의 짧고 핵심적인 요약 설명**을 작성하세요.
    - **상세설명(longDesc)**: **기존 설명이 없는 장소에 한해**, 전문 가이드북처럼 특징, 매력, 방문 가치를 포함하여 **공백 제외 300자 이상의 매우 상세한 본문**으로 새로 작성하세요. 기존 설명이 있다고 명시된 장소는 필드를 빈 문자열("")로 두세요.
    - **상태 명시**: 투숙(stay) 타입의 경우 "[숙소이름] (체크인)" 또는 "[숙소이름] (휴식)"과 같이 상태를 명시하세요.
    - **좌표(coordinates)**: 공항, 숙소 등 새롭게 추가되는 모든 장소에 대해 실제 구글 맵 기준의 정확하고 유효한 위도(lat), 경도(lng)를 반드시 포함하세요. 절대 0,0을 사용하지 마세요.
    
    Return JSON: {"points": [{"name": "장소명", "desc": "짧은 1~2문장 요약", "longDesc": "새로 작성한 아주 상세한 긴 설명 또는 빈 문자열", "type": "stay|visit|logistics", "day": 1, "time": "09:00", "coordinates": {"lat": 35.6895, "lng": 139.6917}}], "recommendations": []}`;

                const result = await retryWithBackoff(() => model.generateContent(prompt));
                const text = result.response.text();
                const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
                const data = JSON.parse(match ? match[0] : text);

                // ✅ 후처리: 생성된 결과에 기존 고퀄리티 설명이 있다면 강제로 보존/병합 (desc에는 덮어쓰지 않음)
                if (data && data.points) {
                    data.points = data.points.map((p: any) => {
                        const existing = dynamicAttractions.find(a => {
                            const pName = p.name.replace(/\s+/g, '');
                            const aName = a.name.replace(/\s+/g, '');
                            if (pName === aName) return true;
                            if (pName.length > 2 && aName.length > 2) {
                                return pName.includes(aName) || aName.includes(pName);
                            }
                            return false;
                        });
                        if (existing && existing.longDesc) {
                            return {
                                ...p,
                                longDesc: existing.longDesc,
                                tips: existing.tips,
                                history: existing.history,
                                attractions: existing.attractions,
                                access: existing.access
                            };
                        }
                        return p;
                    });
                }

                console.log(`[usePlannerAI] 📥 Raw AI Response from ${modelName}:`, text);
                isGeneratingRef.current = false;
                return data;
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    console.warn(`⏳ [generatePlan] Quota exceeded for ${modelName}. Trying next...`);
                    showToast(`일정 생성 중 할당량 초과로 다른 모델을 시도합니다...`, "info");
                    continue;
                }
                break;
            }
        }
        const errMsg = lastError?.message || "알 수 없는 오류";
        showToast(`AI 일정 생성 중 오류가 발생했습니다: ${errMsg} `, "error");
        isGeneratingRef.current = false;
        return null;
    }, [apiKey, customFiles, dynamicAttractions, plannerData, scheduleDensity, selectedPlaceIds]);

    const validateDestination = useCallback(async (destination: string) => {
        if (!apiKey || !destination) return false;
        const td = destination.trim().toLowerCase();

        if (VALIDATION_CACHE[td]) {
            setPlannerData(prev => ({
                ...prev,
                destination: VALIDATION_CACHE[td].correctedName,
                destinationInfo: VALIDATION_CACHE[td].dInfo,
                isDestinationValidated: true
            }));
            setIsDestinationValidated(true);
            showToast(`${VALIDATION_CACHE[td].correctedName}로 확인되었습니다.`, "success");
            return true;
        }
        setIsValidatingDestination(true);
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [validateDestination] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json", temperature: 0 }
                });
                const prompt = `Validate destination "${destination}".Precise JSON: {
                    "isValid": boolean,
                        "correctedName": "Official Name",
                            "country": "string",
                                "language": "string",
                                    "languageName": "string",
                                        "currency": "string (e.g., JPY, IDR, EUR)",
                                            "currencySymbol": "string (e.g., ¥, Rp, €)",
                                                "currencyName": "string (e.g., 엔, 루피아, 유로)",
                                                    "flag": "string"
                }.CRITICAL: Use the actual primary LOCAL currency of the destination.`;
                console.log(`[validateDestination] 📡 Requesting validation for: ${destination} `);
                const result = await retryWithBackoff(() => model.generateContent(prompt), 1, 300);
                const rawText = result.response.text();
                console.log(`[validateDestination] 📥 Raw AI Response from ${modelName}: `, rawText);
                const match = rawText.match(/[\{\[]([\s\S]*)[\}\]]/);
                const parsed = JSON.parse(match ? match[0] : rawText);
                const data = Array.isArray(parsed) ? parsed[0] : parsed;
                if (data.isValid) {
                    const di = {
                        country: data.country || "Unknown",
                        language: data.language || "en-US",
                        languageName: data.languageName || "Unknown",
                        currency: data.currency || "???",
                        currencySymbol: data.currencySymbol || "",
                        currencyName: data.currencyName || "Unknown",
                        flag: data.flag || "📍",
                        defaultRate: 1.0
                    };
                    VALIDATION_CACHE[td] = { correctedName: data.correctedName, dInfo: di };
                    setPlannerData((prev: PlannerData) => ({
                        ...prev,
                        destination: data.correctedName,
                        destinationInfo: di,
                        isDestinationValidated: true
                    }));
                    setIsDestinationValidated(true);
                    showToast(`${data.correctedName}로 확인되었습니다.`, "success");
                    setIsValidatingDestination(false);
                    return true;
                } else {
                    showToast(`'${destination}'은(는) 유효한 여행지가 아닙니다. 다시 입력해 주세요.`, "info");
                    setIsValidatingDestination(false);
                    return false;
                }
            } catch (e: any) {
                lastError = e;
                const msg = e.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    console.warn(`⏳ [validateDestination] Quota exceeded for ${modelName}. Trying next...`);
                    showToast(`API 할당량 초과로 다른 모델을 시도합니다...`, "info");
                    continue;
                }
                break; // Don't retry for non-quota errors
            }
        }
        console.error("[validateDestination] All models failed:", lastError);
        showToast("목적지 확인 중 오류가 발생했습니다.", "error");
        setIsValidatingDestination(false);
        return false;
    }, [apiKey, setIsDestinationValidated, setIsValidatingDestination, setPlannerData]);

    const generateChecklistWithAI = useCallback(async () => {
        if (!apiKey) return null;
        let lastError: any;
        for (const modelName of AUTHORIZED_MODELS) {
            try {
                console.log(`📡 [generateChecklist] Attempting with model: ${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });

                const sp = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));
                const placesNames = sp.map(p => p.name).join(", ");
                const period = `${plannerData.startDate} ~ ${plannerData.endDate}`;

                const prompt = `여행 정보: 목적지(${plannerData.destination}), 기간(${period}), 동행(${plannerData.companion}), 주요 방문예정지(${placesNames}), 렌터카사용여부(${plannerData.useRentalCar ? '예' : '아니오'}).
이 정보를 바탕으로 이 여행에서 반드시 준비해야 할 세부 준비물 및 체크리스트(ChecklistItem)를 카테고리별로 추천해주세요. 카테고리는 마음대로 생성해도 됩니다(예: 필수서류, 의류/시즌, 액티비티, 렌터카, 기타 등등).
반드시 JSON 형태의 배열로 반환하세요.
예시: {"checklists": [{"category": "필수 서류", "items": ["여권", "항공권 바우처", "해외결제 가능 카드"]}, {"category": "렌터카", "items": ["국제운전면허증", "국내운전면허증", "렌터카 바우처"]}]}
`;
                const result = await retryWithBackoff(() => model.generateContent(prompt));
                const text = result.response.text();
                const match = text.match(/[\{\[]([\s\S]*)[\}\]]/);
                const data = JSON.parse(match ? match[0] : text);

                // transform into our flat ChecklistItem layout
                const formattedChecklists: import('../types').ChecklistItem[] = [];
                if (data && data.checklists && Array.isArray(data.checklists)) {
                    data.checklists.forEach((catBlock: any) => {
                        if (catBlock.items && Array.isArray(catBlock.items)) {
                            catBlock.items.forEach((itemName: string) => {
                                formattedChecklists.push({
                                    id: 'chk-' + Math.random().toString(36).substr(2, 9),
                                    category: catBlock.category || "기본",
                                    text: itemName,
                                    isChecked: false
                                });
                            });
                        }
                    });
                }
                return formattedChecklists;
            } catch (error: any) {
                lastError = error;
                const msg = error.message || '';
                if (msg.includes('429') || msg.includes('Quota')) {
                    console.warn(`⏳ [generateChecklist] Quota exceeded for ${modelName}. Trying next...`);
                    continue;
                }
                break;
            }
        }
        console.error("[generateChecklist] All models failed:", lastError);
        return null;
    }, [apiKey, plannerData.destination, plannerData.startDate, plannerData.endDate, plannerData.companion, plannerData.useRentalCar, dynamicAttractions, selectedPlaceIds]);

    return {
        isSearchingAttractions, setIsSearchingAttractions, isSearchingHotels, setIsSearchingHotels,
        hotelAddStatus, setHotelAddStatus, validatedHotel, setValidatedHotel,
        isValidatingPlace, setIsValidatingPlace, isPlaceAddedSuccess, setIsPlaceAddedSuccess,
        isPlaceAddedError, setIsPlaceAddedError, fetchAttractionsWithAI, fetchHotelsWithAI,
        validateAndAddPlace, validateHotel, generatePlanWithAI, validateDestination,
        isValidatingDestination, isDestinationValidated, setIsDestinationValidated,
        fetchAttractionDetailWithAI, isFetchingDetail, generateChecklistWithAI
    };
};
