import { useState, useRef } from "react";
import { PlannerData } from "../../types";

interface UsePlannerStateProps {
    user: any;
    trip: any;
    setTrip: (trip: any) => void;
    allPoints: any[];
    setAllPoints: (points: any[]) => void;
    completedItems: Record<string, boolean>;
    setCompletedItems: (items: Record<string, boolean>) => void;
}

export const usePlannerState = ({
    user: _user, // Unused now
    trip: _trip,
    setTrip,
    allPoints: _allPoints, // Unused in reset
    setAllPoints,
    completedItems: _completedItems, // Unused in reset
    setCompletedItems
}: UsePlannerStateProps) => {
    // 1. Planning State
    const [isPlanning, setIsPlanning] = useState(false);
    const [plannerStep, setPlannerStep] = useState<number>(0);

    // 2. Planning Data
    const defaultData: PlannerData = {
        title: "",
        destination: "",
        startDate: "",
        endDate: "",
        arrivalTime: "10:00",
        departureTime: "18:00",
        departurePoint: "",
        entryPoint: "",
        travelMode: "plane",
        useRentalCar: false,
        companion: "",
        transport: "rental",
        accommodations: [],
        theme: "",
        pace: "normal",
        isDestinationValidated: false,
    };
    const [plannerData, setPlannerData] = useState<PlannerData>(defaultData);

    // 3. Selection & AI Results
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>([]);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
    const [hotelStrategy, setHotelStrategy] = useState<string>("");
    const [scheduleDensity, setScheduleDensity] = useState<"여유롭게" | "보통" | "빡빡하게">("보통");
    const [customAiPrompt, setCustomAiPrompt] = useState<string>("");
    const [draftId, setDraftId] = useState<string | null>(null);

    const isFirstLoad = useRef(false);

    const resetPlannerState = () => {
        const emptyData: PlannerData = {
            title: "", destination: "", startDate: "", endDate: "",
            arrivalTime: "10:00", departureTime: "18:00", departurePoint: "", entryPoint: "",
            travelMode: "plane", useRentalCar: false, companion: "", transport: "rental",
            accommodations: [], theme: "", pace: "normal",
            isDestinationValidated: false,
        };

        setPlannerStep(0);
        setIsPlanning(false);
        setPlannerData(emptyData);
        setSelectedPlaceIds([]);
        setDynamicAttractions([]);
        setRecommendedHotels([]);
        setHotelStrategy("");
        setScheduleDensity("보통");
        setCustomAiPrompt("");
        setDraftId(null);
        setTrip(null);
        setAllPoints([]);
        setCompletedItems({});
        isFirstLoad.current = false;
    };

    return {
        isPlanning, setIsPlanning,
        plannerStep, setPlannerStep,
        plannerData, setPlannerData,
        selectedPlaceIds, setSelectedPlaceIds,
        dynamicAttractions, setDynamicAttractions,
        recommendedHotels, setRecommendedHotels,
        hotelStrategy, setHotelStrategy,
        scheduleDensity, setScheduleDensity,
        customAiPrompt, setCustomAiPrompt,
        draftId, setDraftId,
        resetPlannerState
    };
};
