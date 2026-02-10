import { useState, useEffect, useRef } from "react";
import { PlannerData } from "../../types";
import { supabase } from "../../utils/supabase";

interface UsePlannerStateProps {
    user: any;
    trip: any;
    setTrip: (trip: any) => void;
}

export const usePlannerState = ({ user, trip, setTrip }: UsePlannerStateProps) => {
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
    };
    const [plannerData, setPlannerData] = useState<PlannerData>(defaultData);

    // 3. Selection & AI Results
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>([]);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
    const [hotelStrategy, setHotelStrategy] = useState<string>("");

    // 4. Files
    const [customFiles, setCustomFiles] = useState<any[]>([]);
    const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);

    const [isInitialized, setIsInitialized] = useState(false);
    const isFirstLoad = useRef(true);

    // 🔄 Load Draft Effect
    useEffect(() => {
        const loadInitialDraft = async () => {
            let draft: any = null;

            // 1. Try LocalStorage first (Fastest / Offline)
            const localDraft = localStorage.getItem("trip_draft_v1");
            if (localDraft) {
                try {
                    draft = JSON.parse(localDraft);
                    console.log("📂 Loaded draft from LocalStorage");
                } catch (e) {
                    console.error("Failed to parse local draft:", e);
                }
            }

            // 2. Try Supabase if logged in (Cloud Sync)
            if (user && !draft) {
                try {
                    const { data: dbDraft } = await supabase
                        .from('planner_drafts')
                        .select('planner_data')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (dbDraft?.planner_data) {
                        draft = dbDraft.planner_data;
                        console.log("📂 Loaded draft from Supabase");
                    }
                } catch (e) {
                    console.error("Failed to load draft from Supabase:", e);
                }
            }

            // 3. Apply draft
            if (draft) {
                if (draft.step !== undefined) setPlannerStep(draft.step);
                if (draft.data) setPlannerData(prev => ({ ...prev, ...draft.data }));
                if (draft.selectedIds) setSelectedPlaceIds(draft.selectedIds);
                if (draft.attractions) setDynamicAttractions(draft.attractions);
                if (draft.hotels) setRecommendedHotels(draft.hotels);
                if (draft.hotelStrategy) setHotelStrategy(draft.hotelStrategy);
                if (draft.customFiles) setCustomFiles(draft.customFiles);
                if (draft.analyzedFiles) setAnalyzedFiles(draft.analyzedFiles);
                if (draft.trip) setTrip(draft.trip);
                // setIsPlanning(true); // ❌ Remove this: Prevents auto-redirect on load
            }
            isFirstLoad.current = false;
            setIsInitialized(true);
        };

        loadInitialDraft();
    }, [user, setTrip]);

    // 💾 Debounced Auto-Save Effect
    useEffect(() => {
        if (!isInitialized || !isPlanning) return;

        const timer = setTimeout(async () => {
            const draft = {
                step: plannerStep,
                data: plannerData,
                selectedIds: selectedPlaceIds,
                attractions: dynamicAttractions,
                hotels: recommendedHotels,
                hotelStrategy: hotelStrategy,
                customFiles,
                analyzedFiles,
                trip // MUST INCLUDE AI GENERATED TRIP
            };

            // Local save for immediate recovery
            localStorage.setItem("trip_draft_v1", JSON.stringify(draft));

            // Save to Supabase if logged in
            if (user) {
                try {
                    await supabase.from('planner_drafts').upsert({
                        user_id: user.id,
                        last_step: plannerStep,
                        planner_data: draft,
                        selected_place_ids: selectedPlaceIds,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                    // console.log("☁️ Draft synced to Supabase");
                } catch (e) {
                    console.error("Failed to sync draft to Supabase:", e);
                }
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timer);
    }, [
        user,
        isPlanning,
        plannerStep,
        plannerData,
        selectedPlaceIds,
        dynamicAttractions,
        recommendedHotels,
        hotelStrategy,
        customFiles,
        analyzedFiles,
        trip,
        isInitialized
    ]);

    const resetPlannerState = async () => {
        const emptyData: PlannerData = {
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
        if (user) {
            try {
                await supabase.from('planner_drafts').delete().eq('user_id', user.id);
            } catch (e) {
                console.error("Failed to clear DB draft:", e);
            }
        }

        setPlannerStep(0);
        setPlannerData(emptyData);
        setSelectedPlaceIds([]);
        setDynamicAttractions([]);
        setRecommendedHotels([]);
        setHotelStrategy("");
        setCustomFiles([]);
        setAnalyzedFiles([]);
        setTrip(null);
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
        customFiles, setCustomFiles,
        analyzedFiles, setAnalyzedFiles,
        resetPlannerState
    };
};

