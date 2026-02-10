import { retryWithBackoff } from '../utils/ai-parser';
import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PlannerData } from '../types';
import { supabase } from '../utils/supabase';

interface UsePlannerAIProps {
    plannerData: PlannerData;
    selectedPlaceIds: string[];
    setSelectedPlaceIds: React.Dispatch<React.SetStateAction<string[]>>;
    setPlannerStep: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    hotelStrategy: string;
    setHotelStrategy: React.Dispatch<React.SetStateAction<string>>;
    customFiles: any[];
    dynamicAttractions: any[];
    setDynamicAttractions: React.Dispatch<React.SetStateAction<any[]>>;
    recommendedHotels: any[];
    setRecommendedHotels: React.Dispatch<React.SetStateAction<any[]>>;
    user: any;
}

export const usePlannerAI = ({
    plannerData,
    selectedPlaceIds,
    setSelectedPlaceIds,
    setPlannerStep,
    showToast,
    hotelStrategy,
    setHotelStrategy,
    customFiles,
    dynamicAttractions,
    setDynamicAttractions,
    recommendedHotels,
    setRecommendedHotels,
    user
}: UsePlannerAIProps) => {
    const [isValidatingDestination, setIsValidatingDestination] = useState(false);
    const [isDestinationValidated, setIsDestinationValidated] = useState(() => {
        return !!(plannerData && plannerData.destination && plannerData.destination.trim().length > 0);
    });
    const [isSearchingAttractions, setIsSearchingAttractions] = useState(false);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    // dynamicAttractions and recommendedHotels are now props
    const [hotelAddStatus, setHotelAddStatus] = useState<"IDLE" | "VALIDATING" | "SUCCESS" | "ERROR">("IDLE");
    const [validatedHotel, setValidatedHotel] = useState<any | null>(null);
    const [isValidatingPlace, setIsValidatingPlace] = useState(false);
    const [isPlaceAddedSuccess, setIsPlaceAddedSuccess] = useState(false);
    const [isPlaceAddedError, setIsPlaceAddedError] = useState(false);

    // Suppress unused warnings for future use
    void hotelStrategy;
    void recommendedHotels;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const fetchAttractionsWithAI = async (destination: string, forceRefresh: boolean = false) => {
        if (!apiKey || !destination) return;

        const destinationKey = destination.toLowerCase().trim();

        // 🛡️ Supabase Cache Check
        try {
            const { data: cached } = await supabase
                .from('attraction_cache')
                .select('*')
                .eq('destination', destinationKey)
                .maybeSingle();

            if (!forceRefresh && cached) {
                const now = new Date();
                const updatedAt = new Date(cached.updated_at);
                const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

                if (now.getTime() - updatedAt.getTime() < sevenDaysInMs) {
                    console.log("🏙️ Using attraction cache from Supabase");
                    setDynamicAttractions(cached.attractions);
                    return;
                }
            }
        } catch (e) {
            console.warn("Cache fetch failed, proceeding with AI...", e);
        }

        setIsSearchingAttractions(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
Act as a professional travel planner for "${destination}" with companion "${plannerData.companion}".
I need a diverse list of recommendations across 3 specific categories in a SINGLE JSON array.

Please generate exactly:
1. 10 Sightseeing spots (Landmarks, Nature, Historical sites) -> set category="sightseeing"
2. 6 Activities/Tours (Snorkeling, Diving, Island Tours like Kerama/Ishigaki, Cultural experiences) -> set category="activity"
3. 8 Dining spots (Local food like Soba/Agu Pork, Ocean view cafes, Night markets) -> set category="dining"

For EACH item, return this object structure:
{
    "id": "unique_string",
    "name": "Official Name (Korean)",
    "category": "sightseeing" | "activity" | "dining",
    "desc": "Short description (Korean)",
    "longDesc": "Detailed reason to visit (Korean)",
    "rating": 4.5,
    "reviewCount": 100,
    "priceLevel": "Cheap/Moderate/Expensive",
    "tips": ["Tip 1", "Tip 2"],
    "coordinates": { "lat": number, "lng": number },
    "link": "google map url or homepage"
}

Ensure all descriptions are in Korean. Return ONLY the JSON array. Do not include markdown code blocks.
            `;

            console.log("Creating unified attraction request...");
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text().trim();

            // 🛠️ Robust JSON Extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                let jsonStr = jsonMatch[0];

                // Remove some common AI-generated JSON mistakes (like comments or trailing commas)
                jsonStr = jsonStr.replace(/\/\/.*$/gm, ""); // Remove // comments
                jsonStr = jsonStr.replace(/,(\s*[\]}])/g, "$1"); // Remove trailing commas

                try {
                    const items = JSON.parse(jsonStr);

                    const processed = items.map((item: any, idx: number) => ({
                        ...item,
                        id: `unified-${Date.now()}-${idx}`,
                        category: ["sightseeing", "activity", "dining", "food", "cafe"].includes(item.category) ? item.category : 'sightseeing'
                    }));

                    const uniqueAttractions = processed.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.name === v.name) === i);

                    setDynamicAttractions(uniqueAttractions);

                    // 💾 Save to Supabase Cache
                    await supabase.from('attraction_cache').upsert({
                        destination: destinationKey,
                        attractions: uniqueAttractions,
                        updated_at: new Date().toISOString()
                    });
                } catch (parseError) {
                    console.error("JSON Parse Error after cleanup:", parseError, "Raw string:", jsonStr);
                    throw new Error("AI가 생성한 데이터의 형식이 올바르지 않습니다.");
                }
            } else {
                throw new Error("추천 정보를 찾을 수 없습니다.");
            }

        } catch (error: any) {
            console.error("Fetch Attractions Error:", error);
            if (error.message?.includes("429") || error.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            } else {
                showToast("추천 정보를 가져오는 중 오류가 발생했습니다.", "error");
            }
        } finally {
            setIsSearchingAttractions(false);
        }
    };


    const fetchHotelsWithAI = async (destination: string) => {
        if (!apiKey || !destination) return;

        const destinationKey = (destination.toLowerCase().trim()) + "_hotels";

        // 🛡️ Supabase Cache Check
        try {
            const { data: cached } = await supabase
                .from('attraction_cache')
                .select('*')
                .eq('destination', destinationKey)
                .maybeSingle();

            if (cached) {
                const now = new Date();
                const updatedAt = new Date(cached.updated_at);
                if (now.getTime() - updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
                    console.log("🏨 Using hotel cache from Supabase");
                    if (cached.attractions.strategy) setHotelStrategy(cached.attractions.strategy);
                    if (cached.attractions.hotels) setRecommendedHotels(cached.attractions.hotels);
                    return;
                }
            }
        } catch (e) {
            console.warn("Hotel cache fetch failed", e);
        }


        setIsSearchingHotels(true);
        setRecommendedHotels([]);
        setHotelStrategy("");
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Get selected places names for context
            const selectedPlaces = dynamicAttractions
                .filter(p => selectedPlaceIds.includes(p.id))
                .map(p => p.name)
                .join(", ");

            const prompt = `Plan a trip to "${destination}" with "${plannerData.companion}". 
            Selected places: [${selectedPlaces}]. 
            Task:
            1. Analyze the itinerary and provide a "strategy" (e.g., "North for 1 night, Naha for 2 nights to minimize travel time").
            2. Recommend 10 hotels based on this strategy.

            Return JSON in Korean: 
            {
              "strategy": "string (Accommodation Strategy Guide)",
              "hotels": [{"name": "string", "desc": "string", "area": "string", "reason": "string", "priceLevel": "Expensive/Moderate/Cheap", "priceRange": "string (e.g. 15~20만원)", "rating": number, "reviewCount": number, "tags": ["string"]}]
            }`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.strategy) setHotelStrategy(data.strategy);
                if (data.hotels) setRecommendedHotels(data.hotels);

                // 💾 Save to Supabase
                await supabase.from('attraction_cache').upsert({
                    destination: destinationKey,
                    attractions: data,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e: any) {
            console.error("Hotel search failed:", e);
            if (e.message?.includes("429") || e.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            }
        } finally {
            setIsSearchingHotels(false);
        }
    };

    const validateAndAddPlace = async (name: string) => {
        if (!name) return false;

        setIsPlaceAddedError(false);
        setIsPlaceAddedSuccess(false);

        // Simple duplicate check before AI call
        const existing = dynamicAttractions.find(a => a.name.includes(name) || name.includes(a.name));
        if (existing) {
            if (!selectedPlaceIds.includes(existing.id)) {
                setSelectedPlaceIds(prev => [...prev, existing.id]);
                showToast(`${existing.name}을(를) 선택 목록에 추가했습니다.`, "success");
                setIsPlaceAddedSuccess(true);
                setTimeout(() => setIsPlaceAddedSuccess(false), 2000);
                return true;
            }
            setIsPlaceAddedError(true);
            showToast(`"${existing.name}"은(는) 이미 추가된 장소입니다.`, "info");
            setTimeout(() => setIsPlaceAddedError(false), 2000);
            return true;
        }

        setIsValidatingPlace(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Check if "${name}" exists in "${plannerData.destination}". Return JSON in Korean: {"isValid": boolean, "name": "Official Name (Korean)", "category": "string (Korean)", "desc": "string (Korean summary)", "coordinates": {"lat": number, "lng": number}}`;
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(cleaned);
            if (data?.isValid) {
                const newPlace = {
                    id: `manual-${Date.now()}`,
                    name: data.name,
                    category: data.category,
                    desc: data.desc,
                    longDesc: data.desc,
                    rating: 0,
                    reviewCount: 0,
                    priceLevel: "",
                    coordinates: data.coordinates,
                };
                setDynamicAttractions((prev) => [newPlace, ...prev]);
                setSelectedPlaceIds((prev) => [...prev, newPlace.id]);
                showToast(`${data.name}이(가) 추가되었습니다.`, "success");
                setIsPlaceAddedSuccess(true);
                setTimeout(() => setIsPlaceAddedSuccess(false), 2000);
                return true;
            }
        } catch (e: any) {
            console.error("Place validation failed:", e);
            if (e.message?.includes("429") || e.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            }
        } finally {
            setIsValidatingPlace(false);
        }
        return false;
    };

    const validateHotel = async (name: string) => {
        if (!name) return;
        setHotelAddStatus("VALIDATING");
        try {
            const genAI = new GoogleGenerativeAI(apiKey!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Hotel "${name}" in "${plannerData.destination}". Return JSON in Korean: {"isValid": boolean, "name": "Official Name (Korean)", "area": "string (Korean)", "desc": "string (Korean summary)", "priceLevel": "string", "rating": number}`;
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(cleaned);
            if (data?.isValid) {
                setValidatedHotel({ name: data.name, area: data.area, desc: data.desc, priceLevel: data.priceLevel, rating: data.rating });
                setHotelAddStatus("SUCCESS");
                showToast("숙소 확인 성공");
            } else {
                setHotelAddStatus("IDLE");
            }
        } catch (e: any) {
            setHotelAddStatus("IDLE");
            if (e.message?.includes("429") || e.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            }
        }
    };

    const generatePlanWithAI = async (customPrompt?: string) => {
        if (!apiKey) return;
        setPlannerStep(7);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const selectedPlaces = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));

            // Separate confirmed and candidate accommodations
            const accs = plannerData.accommodations || [];
            const confirmedAccs = accs.filter(a => a.isConfirmed).map(a => a.name).join(", ");
            const candidateAccs = accs.filter(a => !a.isConfirmed).map(a => a.name).join(", ");

            const outboundStr = (plannerData.outboundFlights || []).map(f => `${f.airline} (${f.departureContext.airport} ${f.departureContext.time} → ${f.arrivalContext.airport} ${f.arrivalContext.time})`).join(", ");
            const inboundStr = (plannerData.inboundFlights || []).map(f => `${f.airline} (${f.departureContext.airport} ${f.departureContext.time} → ${f.arrivalContext.airport} ${f.arrivalContext.time})`).join(", ");
            const docsStr = customFiles.map(f => `[Category: ${f.linkedTo}] ${f.name}: ${f.parsedData?.summary || f.summary || "No analysis available"}`).join("\n");

            const visitList = selectedPlaces.length > 0 ? selectedPlaces.map(p => p.name).join(", ") : "None selected. Please SUGGEST 3-4 top attractions for this destination and companion.";

            const prompt = `Create a CONCISE and READABLE sequential itinerary for ${plannerData.destination} (${plannerData.startDate}~${plannerData.endDate}). 
            - Departure Point: [${plannerData.departurePoint || "우리집"}]
            - Outbound Flights: [${outboundStr || "Not provided"}]
            - Inbound Flights: [${inboundStr || "Not provided"}]
            - Places to VISIT: [${visitList}]
            - MANDATORY Accommodations (Confirmed): [${confirmedAccs || "Not provided"}]
            - CANDIDATE Accommodations (Recommendations): [${candidateAccs || "Not provided"}]
            - Transport: ${plannerData.useRentalCar ? "Rental Car (Included)" : "Public Transport"}
            - Additional Documents (Vouchers/Tours): [${docsStr || "None"}]
            - User Special Request: ${customPrompt || "none"}
            
            Task: Construct a point-by-point timeline in Korean. 
            RULES:
            0. Starting Point: The itinerary MUST START with "우리집(출발)" as the very first point on Day 1. Use the Departure Point provided above as the label if it's specific, otherwise use "우리집".
            1. If "Places to VISIT" is empty, you MUST suggest 3-4 best-fit attractions for "${plannerData.companion}" in "${plannerData.destination}".
            2. Flight Movement: DO NOT simply list "Airport Arrival". Use movement-based phrasing like "{Departure Airport}에서 {Arrival Airport}(으)로 이동" (e.g., "인천공항에서 오키나와공항으로 이동"). Apply this logic to both outbound and inbound journeys.
            3. Accommodation MERGE: For each hotel, create only ONE single "type: stay" point. DO NOT split it into 'Check-in', 'Stay', and 'Check-out'. Include any specific check-in times or details within the single point's description.
            4. Distinct Logistical Points: Keep 'Rental Car Pickup' as a separate logistics point if applicable as it takes time.
            5. Chronological Order: Points must be in sequential order starting from Day 1.
            6. Include all confirmed accommodations as "type: stay" points.
            
            Key Points to include:
            1. Home Point: The preparation and departure segment.
            2. Flight Points: Movement from departure to arrival.
            3. Visit Points: Selected or Suggested attractions.
            4. Stay Points: Single point per hotel stay.
            5. Return Journey: Final movement back to the starting point.
            
            COORDINATES:
            - "우리집(출발)": Use latitude 37.5665, longitude 126.9780 (approximate Seoul area) if not specified.
            - Others: You MUST provide APPROXIMATE but REALISTIC lat/lng for each point based on its location in ${plannerData.destination} or South Korea (for airports).
            
            Return JSON matching:
            { 
              "points": [{ "name": "string", "desc": "string", "type": "stay" | "visit" | "logistics", "day": number, "time": "HH:mm (optional)", "coordinates": { "lat": number, "lng": number } }],
              "recommendations": [{ "name": "string", "reason": "string", "area": "string" }] 
            }
            - Ensure points are strictly in chronological order.`;
            console.log("📡 AI Plan Generation Prompt:", prompt);
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text().trim();
            console.log("📡 AI Plan Raw Response:", text);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const planData = JSON.parse(jsonMatch[0]);
                if (!planData.points || planData.points.length === 0) {
                    console.warn("⚠️ AI returned empty points array.");
                }
                return planData;
            } else {
                console.error("❌ Failed to find JSON in AI response.");
                return null;
            }
        } catch (error: any) {
            console.error("Plan generation failed:", error);
            if (error.message?.includes("429") || error.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            }
            return null;
        }
    };

    const validateDestination = async (destination: string): Promise<boolean> => {
        if (!apiKey || !destination) return false;
        setIsValidatingDestination(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Check if "${destination}" is a valid travel destination. Return JSON: {"isValid": boolean, "correctedName": "Official Name (Korean)", "country": "Country Name", "description": "Short description about 50 chars"}`;
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.isValid) {
                    showToast(`${data.correctedName} (${data.country}) 확인 완료!`, "success");
                    setIsDestinationValidated(true);
                    return true;
                } else {
                    showToast("유효한 여행지가 아닌 것 같습니다. 다시 확인해 주세요.", "error");
                    setIsDestinationValidated(false);
                    return false;
                }
            }
        } catch (e: any) {
            console.error("Destination validation failed:", e);
            if (e.message?.includes("429") || e.toString().includes("429")) {
                showToast("AI 요청량이 많아 잠시 후 다시 시도해주세요.", "error");
            } else {
                showToast("여행지 확인 중 오류가 발생했습니다.", "error");
            }
            setIsDestinationValidated(false);
        } finally {
            setIsValidatingDestination(false);
        }
        return false;
    };

    return {
        isSearchingAttractions,
        setIsSearchingAttractions,
        isSearchingHotels,
        setIsSearchingHotels,
        // Data states removed from return as they are managed by parent
        hotelAddStatus,
        setHotelAddStatus,
        validatedHotel,
        setValidatedHotel,
        isValidatingPlace,
        setIsValidatingPlace,
        isPlaceAddedSuccess,
        setIsPlaceAddedSuccess,
        isPlaceAddedError,
        setIsPlaceAddedError,
        fetchAttractionsWithAI,
        fetchHotelsWithAI,
        validateAndAddPlace,
        validateHotel,
        generatePlanWithAI,
        validateDestination,
        isValidatingDestination,
        isDestinationValidated,
        setIsDestinationValidated
    };
};
