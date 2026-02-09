import { useState, useEffect } from "react";
import { PlannerData } from "../../types";

export const usePlannerState = () => {
    // 1. Planning State
    const [isPlanning, setIsPlanning] = useState(false);
    const [plannerStep, setPlannerStep] = useState<number>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).step : 0;
        } catch { return 0; }
    });

    // 2. Planning Data
    const [plannerData, setPlannerData] = useState<PlannerData>(() => {
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
        };
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? { ...defaultData, ...JSON.parse(saved).data } : defaultData;
        } catch { return defaultData; }
    });

    // 3. Selection & AI Results
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).selectedIds || [] : [];
        } catch { return []; }
    });
    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).attractions || [] : [];
        } catch { return []; }
    });
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).hotels || [] : [];
        } catch { return []; }
    });
    const [hotelStrategy, setHotelStrategy] = useState<string>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).hotelStrategy || "" : "";
        } catch { return ""; }
    });

    // 4. Files
    const [customFiles, setCustomFiles] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).customFiles || [] : [];
        } catch { return []; }
    });
    const [analyzedFiles, setAnalyzedFiles] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            return saved ? JSON.parse(saved).analyzedFiles || [] : [];
        } catch { return []; }
    });

    // Auto-Save Effect
    useEffect(() => {
        if (isPlanning) {
            const hasData = plannerData.destination.trim() !== "" || plannerData.title.trim() !== "";
            if (!hasData && plannerStep === 0) return;

            const draft = {
                step: plannerStep,
                data: plannerData,
                selectedIds: selectedPlaceIds,
                attractions: dynamicAttractions,
                hotels: recommendedHotels,
                hotelStrategy: hotelStrategy,
                customFiles,
                analyzedFiles
            };
            try {
                localStorage.setItem("trip_draft_v1", JSON.stringify(draft));
            } catch (e) {
                console.warn("Auto-save failed: Storage quota exceeded", e);
            }
        }
    }, [
        isPlanning,
        plannerStep,
        plannerData,
        selectedPlaceIds,
        dynamicAttractions,
        recommendedHotels,
        hotelStrategy,
        customFiles,
        analyzedFiles
    ]);

    // Restore Effect (Optional if initializers handle it, but sometimes useful for re-render sync)
    // In this case, initializers handle most restoration. But if we need to force reload:
    // We can keep the logic simple and rely on initializers + set functions.

    const resetPlannerState = () => {
        localStorage.removeItem("trip_draft_v1");
        setIsPlanning(true);
        setPlannerStep(0);
        setPlannerData({
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
        });
        setSelectedPlaceIds([]);
        setDynamicAttractions([]);
        setRecommendedHotels([]);
        setHotelStrategy("");
        setCustomFiles([]); // Reset planner files
        setAnalyzedFiles([]);
    };

    return {
        isPlanning, setIsPlanning,
        plannerStep, setPlannerStep,
        plannerData, setPlannerData,
        selectedPlaceIds, setSelectedPlaceIds,
        dynamicAttractions, setDynamicAttractions,
        recommendedHotels, setRecommendedHotels,
        hotelStrategy, setHotelStrategy,
        customFiles, setCustomFiles,
        analyzedFiles, setAnalyzedFiles,
        resetPlannerState
    };
};
