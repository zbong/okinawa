import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PlannerData } from '../types';

interface UsePlannerAIProps {
    plannerData: PlannerData;
    selectedPlaceIds: string[];
    setSelectedPlaceIds: React.Dispatch<React.SetStateAction<string[]>>;
    setPlannerStep: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const usePlannerAI = ({
    plannerData,
    selectedPlaceIds,
    setSelectedPlaceIds,
    setPlannerStep,
    showToast
}: UsePlannerAIProps) => {
    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>([]);
    const [isSearchingAttractions, setIsSearchingAttractions] = useState(false);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
    const [hotelAddStatus, setHotelAddStatus] = useState<"IDLE" | "VALIDATING" | "SUCCESS" | "ERROR">("IDLE");
    const [validatedHotel, setValidatedHotel] = useState<any | null>(null);
    const [isValidatingPlace, setIsValidatingPlace] = useState(false);
    const [isPlaceAddedSuccess, setIsPlaceAddedSuccess] = useState(false);
    const [isPlaceAddedError, setIsPlaceAddedError] = useState(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const fetchAttractionsWithAI = async (destination: string) => {
        if (!apiKey || !destination) return;

        const CACHE_KEY = "attraction_recommendation_cache";
        const cachedStr = localStorage.getItem(CACHE_KEY);
        const cache = cachedStr ? JSON.parse(cachedStr) : {};
        const destinationKey = destination.toLowerCase().trim();

        if (cache[destinationKey]) {
            const { timestamp, data } = cache[destinationKey];
            const now = Date.now();
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            if (now - timestamp < sevenDaysInMs) {
                setDynamicAttractions(data);
                return;
            }
        }

        setIsSearchingAttractions(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Search attractions in "${destination}" for ${plannerData.companion}. Return JSON array of objects with id, name, category, desc, longDesc, rating, reviewCount, priceLevel, attractions, tips, coordinates, link. Korean language.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const attractions = JSON.parse(jsonMatch[0]);
                setDynamicAttractions(attractions);
                cache[destinationKey] = { timestamp: Date.now(), data: attractions };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            }
        } catch (error) {
            console.error("Fetch Attractions Error:", error);
        } finally {
            setIsSearchingAttractions(false);
        }
    };

    const fetchHotelsWithAI = async (destination: string) => {
        if (!apiKey) return;
        setIsSearchingHotels(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Search 5 popular hotels in "${destination}" for "${plannerData.companion}". JSON: [{"name": "string", "desc": "string"}]`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (jsonMatch) setRecommendedHotels(JSON.parse(jsonMatch[0]));
        } catch (e) {
            console.error("Hotel search failed:", e);
        } finally {
            setIsSearchingHotels(false);
        }
    };

    const validateAndAddPlace = async (name: string) => {
        if (!name) return false;
        setIsValidatingPlace(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Check if "${name}" exists in "${plannerData.destination}". Return JSON: {"isValid": boolean, "name": "Official Name", "category": "string", "desc": "string", "coordinates": {"lat": number, "lng": number}}`;
            const result = await model.generateContent(prompt);
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
                return true;
            }
        } catch (e) {
            console.error("Place validation failed:", e);
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
            const prompt = `Hotel "${name}" in "${plannerData.destination}". JSON: {"isValid": boolean, "name": "string", "area": "string", "desc": "string"}`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(cleaned);
            if (data?.isValid) {
                setValidatedHotel({ name: data.name, area: data.area, desc: data.desc });
                setHotelAddStatus("SUCCESS");
                showToast("숙소 확인 성공");
            } else {
                setHotelAddStatus("IDLE");
            }
        } catch (e) {
            setHotelAddStatus("IDLE");
        }
    };

    const generatePlanWithAI = async (customPrompt?: string) => {
        if (!apiKey) return;
        setPlannerStep(6);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const selectedPlaces = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));
            const prompt = `Create itinerary for ${plannerData.destination} (${plannerData.startDate}~${plannerData.endDate}). Places: ${selectedPlaces.map(p => p.name).join(", ")}. Request: ${customPrompt || "none"}. Return JSON matching TripPlan structure.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const planData = JSON.parse(jsonMatch[0]);
                // Here we usually save the plan or set it somewhere. 
                // In the original code, it seemed to just return or set something.
                // Assuming it returns the plan data or sets it to some state handled by the caller or context.
                return planData;
            }
        } catch (error) {
            console.error("Plan generation failed:", error);
            return null;
        }
    };

    return {
        dynamicAttractions,
        setDynamicAttractions,
        isSearchingAttractions,
        setIsSearchingAttractions,
        isSearchingHotels,
        setIsSearchingHotels,
        recommendedHotels,
        setRecommendedHotels,
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
        generatePlanWithAI
    };
};
