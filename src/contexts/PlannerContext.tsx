import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { fileToBase64 } from '../utils/ocr';
import { TripPlan, LocationPoint, PlannerData, CustomFile } from '../types';
import { supabase } from '../utils/supabase';
import { usePlannerAI } from '../hooks/usePlannerAI';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useTripManager } from '../hooks/useTripManager';
import { useGoogleTTS } from '../hooks/useGoogleTTS';
import { useCurrency } from '../hooks/useCurrency';
import { useWeather } from '../hooks/useWeather';

interface PlannerContextType {
    // Navigation & View
    view: any;
    setView: React.Dispatch<React.SetStateAction<any>>;
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    overviewMode: "map" | "text";
    setOverviewMode: React.Dispatch<React.SetStateAction<"map" | "text">>;
    scheduleDay: number;
    setScheduleDay: React.Dispatch<React.SetStateAction<number>>;
    scheduleViewMode: "map" | "list";
    setScheduleViewMode: React.Dispatch<React.SetStateAction<"map" | "list">>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    toggleTheme: () => void;

    // Trip Data
    trips: TripPlan[];
    setTrips: React.Dispatch<React.SetStateAction<TripPlan[]>>;
    trip: TripPlan;
    setTrip: React.Dispatch<React.SetStateAction<TripPlan>>;
    allPoints: LocationPoint[];
    setAllPoints: React.Dispatch<React.SetStateAction<LocationPoint[]>>;
    completedItems: Record<string, boolean>;
    setCompletedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    // Selection
    selectedPoint: LocationPoint | null;
    setSelectedPoint: React.Dispatch<React.SetStateAction<LocationPoint | null>>;
    weatherIndex: number;
    setWeatherIndex: React.Dispatch<React.SetStateAction<number>>;
    selectedWeatherLocation: LocationPoint | null;
    setSelectedWeatherLocation: React.Dispatch<React.SetStateAction<LocationPoint | null>>;
    activePlannerDetail: any | null;
    setActivePlannerDetail: React.Dispatch<React.SetStateAction<any | null>>;

    // Planning
    isPlanning: boolean;
    setIsPlanning: React.Dispatch<React.SetStateAction<boolean>>;
    plannerStep: number;
    setPlannerStep: React.Dispatch<React.SetStateAction<number>>;
    plannerData: PlannerData;
    setPlannerData: React.Dispatch<React.SetStateAction<PlannerData>>;
    selectedPlaceIds: string[];
    setSelectedPlaceIds: React.Dispatch<React.SetStateAction<string[]>>;
    dynamicAttractions: any[];
    setDynamicAttractions: React.Dispatch<React.SetStateAction<any[]>>;
    isSearchingAttractions: boolean;
    setIsSearchingAttractions: React.Dispatch<React.SetStateAction<boolean>>;
    isSearchingHotels: boolean;
    setIsSearchingHotels: React.Dispatch<React.SetStateAction<boolean>>;
    recommendedHotels: any[];
    setRecommendedHotels: React.Dispatch<React.SetStateAction<any[]>>;
    hotelStrategy: string;
    setHotelStrategy: React.Dispatch<React.SetStateAction<string>>;
    hotelAddStatus: "IDLE" | "VALIDATING" | "SUCCESS" | "ERROR";
    setHotelAddStatus: React.Dispatch<React.SetStateAction<"IDLE" | "VALIDATING" | "SUCCESS" | "ERROR">>;
    validatedHotel: any | null;
    setValidatedHotel: React.Dispatch<React.SetStateAction<any | null>>;
    isValidatingPlace: boolean;
    setIsValidatingPlace: React.Dispatch<React.SetStateAction<boolean>>;
    isPlaceAddedSuccess: boolean;
    setIsPlaceAddedSuccess: React.Dispatch<React.SetStateAction<boolean>>;
    isPlaceAddedError: boolean;
    setIsPlaceAddedError: React.Dispatch<React.SetStateAction<boolean>>;

    // User Content
    userReviews: Record<string, { rating: number; text: string }>;
    setUserReviews: React.Dispatch<React.SetStateAction<Record<string, { rating: number; text: string }>>>;
    userLogs: Record<string, string>;
    setUserLogs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    customFiles: CustomFile[];
    setCustomFiles: React.Dispatch<React.SetStateAction<CustomFile[]>>;

    // OCR Lab
    isOcrLoading: boolean;
    setIsOcrLoading: React.Dispatch<React.SetStateAction<boolean>>;
    analyzedFiles: any[];
    setAnalyzedFiles: React.Dispatch<React.SetStateAction<any[]>>;
    ticketFileInputRef: React.RefObject<HTMLInputElement>;
    customAiPrompt: string;
    setCustomAiPrompt: React.Dispatch<React.SetStateAction<string>>;

    // App Local But Moved to Context
    isEditingPoint: boolean;
    setIsEditingPoint: React.Dispatch<React.SetStateAction<boolean>>;
    attractionCategoryFilter: "all" | "sightseeing" | "food" | "cafe";
    setAttractionCategoryFilter: React.Dispatch<React.SetStateAction<"all" | "sightseeing" | "food" | "cafe">>;
    isDragging: boolean;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;

    // Weather Data
    weatherData: any;
    isLoadingWeather: boolean;
    weatherError: string | null;
    fetchWeatherData: (location: string, coordinates?: { lat: number; lng: number }) => Promise<any>;
    getWeatherForDay: (dayIndex: number) => any;
    getFormattedDate: (daysOffset?: number) => string;

    // JPY/KRW
    jpyAmount: string;
    setJpyAmount: React.Dispatch<React.SetStateAction<string>>;
    krwAmount: string;
    setKrwAmount: React.Dispatch<React.SetStateAction<string>>;
    rate: number;
    setRate: React.Dispatch<React.SetStateAction<number>>;

    // Global UI
    toasts: any[];
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    isReviewModalOpen: boolean;
    setIsReviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isReEditModalOpen: boolean;
    setIsReEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    tripToEdit: any;
    setTripToEdit: React.Dispatch<React.SetStateAction<any>>;
    deleteConfirmModal: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
    };
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>;

    // Auth
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    selectedFile: any | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<any | null>>;

    // Calendar
    calendarDate: Date;
    setCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
    prevMonth: () => void;
    nextMonth: () => void;
    closeToast: (id: string) => void;

    // Utils
    isDraggingRef: React.MutableRefObject<boolean>;
    calculateProgress: () => number;
    getPoints: () => LocationPoint[];
    toggleComplete: (id: string, e: React.MouseEvent) => void;
    updateReview: (id: string, rating: number, text: string) => void;
    updateLog: (id: string, text: string) => void;
    speak: (text: string) => void;
    convert: (val: string, type: "jpy" | "krw") => void;
    handleReorder: (newOrder: LocationPoint[]) => void;
    deletePoint: (id: string, e?: React.MouseEvent) => void;
    addPoint: (day: number, point: any) => void;
    addAccommodation: (acc: any) => void;
    deleteAccommodation: (index: number) => void;
    fetchAttractionsWithAI: (destination: string) => Promise<void>;
    fetchHotelsWithAI: (destination: string) => Promise<void>;
    validateAndAddPlace: (name: string) => Promise<boolean>;
    validateHotel: (name: string) => Promise<void>;
    generatePlanWithAI: (customPrompt?: string) => Promise<void>;
    handleFileAnalysis: (files: File[], linkedTo?: string) => Promise<void>;
    handleTicketOcr: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleMultipleOcr: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement> | File[], linkedTo?: string) => Promise<void>;
    deleteFile: (id: string, e?: React.MouseEvent) => void;
    validateDestination: (destination: string) => Promise<boolean>;
    isValidatingDestination: boolean;
    isDestinationValidated: boolean;
    setIsDestinationValidated: React.Dispatch<React.SetStateAction<boolean>>;
    startNewPlanning: () => void;
    saveDraft: (step: number, customData?: any) => boolean;
    exportTrip: () => void;
    importTrip: (file: File) => Promise<void>;
    isPreparingOffline: boolean;
    offlineProgress: number;
    prepareOfflineMap: () => Promise<void>;
    shareToKakao: (targetTrip?: any) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Theme
    const [theme, setTheme] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") || "dark";
        }
        return "dark";
    });

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // View
    const [view, setView] = useState<any>("landing");
    const [activeTab, setActiveTab] = useState<string>("summary");
    const [overviewMode, setOverviewMode] = useState<"map" | "text">("map");
    const [scheduleDay, setScheduleDay] = useState<number>(1);
    const [scheduleViewMode, setScheduleViewMode] = useState<"map" | "list">("list");

    // Global UI States (Declared early for hooks)
    const [hotelStrategy, setHotelStrategy] = useState<string>("");
    const [toasts, setToasts] = useState<any[]>([]);
    const showToast = React.useCallback((message: string, type: "success" | "error" | "info" = "info") => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 1500); // Increased duration slightly for better readability
    }, []);

    const closeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const [deleteConfirmModal, setDeleteConfirmModal] = useState<any>({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "삭제",
        cancelText: "취소",
        onConfirm: () => { }
    });

    // Trips & Data (Extracted to useTripManager)
    const {
        trips, setTrips,
        trip, setTrip,
        allPoints, setAllPoints,
        completedItems, setCompletedItems,
        userReviews, setUserReviews,
        userLogs, setUserLogs,
        customFiles, setCustomFiles,
        handleReorder: handleReorderBase,
        deletePoint,
        addPoint,
        toggleComplete,
        updateReview,
        updateLog,
        getPoints: getPointsBase,
        calculateProgress
    } = useTripManager({ showToast, setDeleteConfirmModal });

    // Wrappers to match context signature
    // Wrappers to match context signature
    const handleReorder = (newOrder: LocationPoint[]) => handleReorderBase(newOrder, scheduleDay);
    const getPoints = () => getPointsBase(scheduleDay);

    const isDraggingRef = useRef(false);

    // Selection
    const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
    const [activePlannerDetail, setActivePlannerDetail] = useState<any | null>(null);

    // Planning
    const [isPlanning, setIsPlanning] = useState(false);
    const [plannerStep, setPlannerStep] = useState(() => {
        const saved = localStorage.getItem("trip_draft_v1");
        if (saved) {
            try {
                return JSON.parse(saved).step;
            } catch (e) { return 0; }
        }
        return 0;
    });

    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(() => {
        const saved = localStorage.getItem("trip_draft_v1");
        if (saved) {
            try {
                return JSON.parse(saved).selectedIds || [];
            } catch (e) { return []; }
        }
        return [];
    });

    const [plannerData, setPlannerData] = useState<PlannerData>(() => {
        const saved = localStorage.getItem("trip_draft_v1");
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
        if (saved) {
            try {
                return { ...defaultData, ...JSON.parse(saved).data };
            } catch (e) { return defaultData; }
        }
        return defaultData;
    });

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);

    // Auth
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<any | null>(null);

    // Calendar
    const [calendarDate, setCalendarDate] = useState(new Date());

    // AI Logic (Extracted to usePlannerAI)
    const {
        dynamicAttractions, setDynamicAttractions,
        isSearchingAttractions, setIsSearchingAttractions,
        isSearchingHotels, setIsSearchingHotels,
        recommendedHotels, setRecommendedHotels,
        hotelAddStatus, setHotelAddStatus,
        validatedHotel, setValidatedHotel,
        isValidatingPlace, setIsValidatingPlace,
        isPlaceAddedSuccess, setIsPlaceAddedSuccess,
        isPlaceAddedError, setIsPlaceAddedError,
        fetchAttractionsWithAI,
        fetchHotelsWithAI,
        validateAndAddPlace,
        validateHotel,
        generatePlanWithAI: generatePlan,
        validateDestination,
        isValidatingDestination,
        isDestinationValidated,
        setIsDestinationValidated
    } = usePlannerAI({
        plannerData,
        selectedPlaceIds,
        setSelectedPlaceIds,
        setPlannerStep,
        showToast,
        hotelStrategy,
        setHotelStrategy,
        customFiles
    });

    useEffect(() => {
        const saved = localStorage.getItem("trip_draft_v1");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.data) setPlannerData(parsed.data);
                if (parsed.selectedIds) setSelectedPlaceIds(parsed.selectedIds);
                if (parsed.attractions) setDynamicAttractions(parsed.attractions);
                if (parsed.hotels) setRecommendedHotels(parsed.hotels);
                if (parsed.hotelStrategy) setHotelStrategy(parsed.hotelStrategy);
                if (parsed.customFiles) setCustomFiles(parsed.customFiles);
                if (parsed.analyzedFiles) setAnalyzedFiles(parsed.analyzedFiles);
                if (parsed.step !== undefined) setPlannerStep(parsed.step);


            } catch (e) { }
        }
    }, []);

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
    }, [isPlanning, plannerStep, plannerData, selectedPlaceIds, dynamicAttractions, recommendedHotels, hotelStrategy, customFiles]);

    // Sync planner destination to active trip for correct data storage (files, logs)
    // ONLY sync when destination is validated to avoid creating dozens of localStorage entries while typing
    useEffect(() => {
        if (isPlanning && isDestinationValidated && plannerData.destination && trip?.metadata?.destination !== plannerData.destination) {
            setTrip((prev: any) => ({
                ...prev,
                metadata: {
                    ...(prev?.metadata || {}),
                    destination: plannerData.destination
                }
            }));
        }
    }, [isPlanning, isDestinationValidated, plannerData.destination, trip?.metadata?.destination, setTrip]);

    // Reset day and point on destination change
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        setScheduleDay(1);
        setSelectedPoint(null);
    }, [trip?.metadata?.destination]);


    // OCR Lab (Extracted to useDocumentAnalysis)
    const {
        isOcrLoading,
        setIsOcrLoading,
        analyzedFiles,
        setAnalyzedFiles,
        ticketFileInputRef,
        customAiPrompt,
        setCustomAiPrompt,
        handleFileAnalysis,
        handleTicketOcr,
        handleMultipleOcr
    } = useDocumentAnalysis({
        plannerData,
        setPlannerData,
        setCustomFiles,
        showToast
    });

    // App Local But Moved to Context
    const [isEditingPoint, setIsEditingPoint] = useState(false);
    const [attractionCategoryFilter, setAttractionCategoryFilter] = useState<"all" | "sightseeing" | "food" | "cafe">("all");
    const [isDragging, setIsDragging] = useState(false);


    // Weather Logic (Extracted to useWeather)
    const {
        weatherData,
        isLoadingWeather,
        weatherError,
        fetchWeatherData,
        getWeatherForDay: getLocationWeather,
        getFormattedDate,
        weatherIndex,
        setWeatherIndex,
        selectedWeatherLocation,
        setSelectedWeatherLocation
    } = useWeather();

    // specific wrapper to match Context Type signature
    const getWeatherForDay = (dayIndex: number) => {
        return getLocationWeather(dayIndex, trip?.metadata?.destination || "오키나와 (나하)");
    };

    // Currency (Extracted to useCurrency)
    const {
        jpyAmount, setJpyAmount,
        krwAmount, setKrwAmount,
        rate, setRate,
        convert
    } = useCurrency();


    // Currency


    const { speak } = useGoogleTTS();

    const prevMonth = () => {
        setCalendarDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const nextMonth = () => {
        setCalendarDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };



    const addAccommodation = (acc: any) => {
        setPlannerData((prev) => ({
            ...prev,
            accommodations: [...(prev.accommodations || []), acc],
        }));
        showToast("숙소가 추가되었습니다.", "success");
    };

    const deleteAccommodation = (index: number) => {
        setPlannerData((prev) => ({
            ...prev,
            accommodations: prev.accommodations.filter((_: any, i: number) => i !== index),
        }));
        showToast("숙소가 삭제되었습니다.");
    };

    const generatePlanWithAI = async (customPrompt?: string) => {
        const planData = await generatePlan(customPrompt);
        if (planData) {
            const mappedPoints = (planData.points || []).map((p: any) => {
                // Try to find matching source data to get reliable coordinates
                const sourceAttr = dynamicAttractions.find(a => a.name === p.name);
                const sourceAcc = plannerData.accommodations.find(a => a.name === p.name);

                return {
                    ...p,
                    id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                    // Prioritize coordinates from source data, then AI, then fallback
                    coordinates: sourceAttr?.coordinates || sourceAcc?.coordinates || p.coordinates || { lat: 26.2124, lng: 127.6809 },
                    category: sourceAttr?.category || (sourceAcc ? 'stay' : (p.type || p.category || 'sightseeing')),
                    isCompleted: false,
                    images: p.images || []
                };
            });

            // Group points into days structure for the tab UI
            const daysMap: Record<number, LocationPoint[]> = {};
            mappedPoints.forEach((p: any) => {
                const d = p.day || 1;
                if (!daysMap[d]) daysMap[d] = [];
                daysMap[d].push(p);
            });

            // Calculate duration
            let dayCount = 3; // Default
            if (plannerData.startDate && plannerData.endDate) {
                const start = new Date(plannerData.startDate);
                const end = new Date(plannerData.endDate);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                }
            }

            const days = Array.from({ length: dayCount }).map((_, i) => ({
                day: i + 1,
                points: daysMap[i + 1] || []
            }));

            const finalPlan: TripPlan = {
                metadata: {
                    title: plannerData.title || `${plannerData.destination} 여행`,
                    destination: plannerData.destination,
                    period: `${plannerData.startDate} ~ ${plannerData.endDate}`,
                    startDate: plannerData.startDate,
                    endDate: plannerData.endDate,
                    useRentalCar: plannerData.useRentalCar,
                },
                id: `trip-${Date.now()}`,
                speechData: [],
                defaultFiles: [],
                points: mappedPoints,
                days: days,
                customFiles: [...customFiles],
                recommendations: planData.recommendations || []
            };
            // Clear previous points order for this destination to prevent stale localStorage data overwriting new AI results
            if (plannerData.destination) {
                localStorage.removeItem(`points_order_${plannerData.destination}`);
            }

            setTrip(finalPlan);
            setAllPoints(finalPlan.points);
            setPlannerStep(8);
        }
    };









    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | File[], linkedTo?: string) => {
        let files: File[] = [];
        if (Array.isArray(e)) {
            files = e;
        } else if (e && "target" in e && e.target.files) {
            files = Array.from(e.target.files);
        }

        if (files.length === 0) return;

        const newFiles: any[] = [];
        for (const file of files) {
            try {
                const base64 = await fileToBase64(file);
                newFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: file.type.includes("pdf") ? "pdf" : "image",
                    data: base64,
                    linkedTo,
                    date: new Date().toISOString(),
                });
            } catch (err) {
                showToast(`${file.name} 업로드 실패`, "error");
            }
        }

        if (newFiles.length > 0) {
            setCustomFiles((prev: any) => [...prev, ...newFiles]);
            showToast(`${newFiles.length}건의 서류가 업로드되었습니다.`, "success");
        }
    };

    const deleteFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCustomFiles((prev: any) => prev.filter((f: any) => f.id !== id));
    };

    const startNewPlanning = () => {
        // 1. Clear LocalStorage Draft
        localStorage.removeItem("trip_draft_v1");

        // 2. Fundamental UI State
        setIsPlanning(true);
        setPlannerStep(0);

        // 3. Planning Data
        setPlannerData({
            title: "",
            destination: "",
            startDate: "",
            endDate: "",
            arrivalTime: "10:00",
            departureTime: "18:00",
            departurePoint: currentUser?.homeAddress || "",
            entryPoint: "",
            travelMode: "plane",
            useRentalCar: false,
            companion: "",
            transport: "rental",
            accommodations: [],
            theme: "",
            pace: "normal",
        });

        // 4. Selections & AI Results
        setSelectedPlaceIds([]);
        setDynamicAttractions([]);
        setRecommendedHotels([]);

        // 5. OCR / Documents
        setAnalyzedFiles([]);
        setCustomAiPrompt("");

        // 6. Detailed States
        setHotelStrategy("");
        setValidatedHotel(null);
        setActivePlannerDetail(null);
    };

    const saveDraft = (step: number, customData: any = {}) => {
        const draft = {
            step,
            data: plannerData,
            selectedIds: selectedPlaceIds,
            attractions: dynamicAttractions,
            hotels: recommendedHotels,
            hotelStrategy: hotelStrategy,
            customFiles,
            analyzedFiles,
            updated: Date.now(),
            ...customData
        };
        try {
            localStorage.setItem("trip_draft_v1", JSON.stringify(draft));
            return true;
        } catch (e) {
            console.error("Save draft failed:", e);
            showToast("용량이 부족하여 저장하지 못했습니다. 불필요한 파일을 삭제해주세요.", "error");
            return false;
        }
    };

    const exportTrip = () => {
        const data = {
            version: "2.0",
            trip,
            points: allPoints,
            checklist: completedItems,
            reviews: userReviews,
            logs: userLogs,
            files: customFiles,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${trip.metadata?.title || "okinawa_trip"}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("여행 데이터가 파일로 추출되었습니다.", "success");
    };

    const importTrip = async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.trip && data.points) {
                setTrip(data.trip);
                setAllPoints(data.points);
                if (data.checklist) setCompletedItems(data.checklist);
                if (data.reviews) setUserReviews(data.reviews);
                if (data.logs) setUserLogs(data.logs);
                if (data.files) setCustomFiles(data.files);

                showToast("여행 가이드를 성공적으로 불러왔습니다.", "success");
                setActiveTab("summary");
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            console.error("Import failed:", err);
            showToast("파일 형식이 올바르지 않거나 손상되었습니다.", "error");
        }
    };

    const [isPreparingOffline, setIsPreparingOffline] = useState(false);
    const [offlineProgress, setOfflineProgress] = useState(0);

    const prepareOfflineMap = async () => {
        if (!allPoints.length) {
            showToast("먼저 여행 일정을 만들어주세요.", "info");
            return;
        }

        setIsPreparingOffline(true);
        setOfflineProgress(0);

        const zooms = [13, 15, 17];
        const totalSteps = allPoints.length * zooms.length;
        let completedSteps = 0;

        const latLngToTile = (lat: number, lng: number, zoom: number) => {
            const n = Math.pow(2, zoom);
            const x = Math.floor((lng + 180) / 360 * n);
            const lat_rad = lat * Math.PI / 180;
            const y = Math.floor((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2 * n);
            return { x, y };
        };

        const fetchTile = (x: number, y: number, z: number) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                const server = Math.floor(Math.random() * 4);
                img.src = `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
            });
        };

        try {
            for (const point of allPoints) {
                const lat = Number(point.coordinates?.lat);
                const lng = Number(point.coordinates?.lng);
                if (isNaN(lat) || isNaN(lng)) continue;

                for (const z of zooms) {
                    const { x, y } = latLngToTile(lat, lng, z);
                    const promises = [];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            promises.push(fetchTile(x + dx, y + dy, z));
                        }
                    }
                    await Promise.all(promises);
                    completedSteps++;
                    setOfflineProgress(Math.round((completedSteps / totalSteps) * 100));
                }
            }
            showToast("오프라인 지도 데이터가 준비되었습니다.", "success");
        } catch (err) {
            console.error("Map pre-fetch failed:", err);
            showToast("지도 준비 중 오류가 발생했습니다.", "error");
        } finally {
            setIsPreparingOffline(false);
            setOfflineProgress(100);
        }
    };

    const shareToKakao = async (targetTrip?: any) => {
        const kakao = (window as any).Kakao;
        const KAKAO_KEY = import.meta.env.VITE_KAKAO_API_KEY || "976a30104e3434c15beb775ff1a8d7c3";

        if (!kakao) {
            showToast("카카오 설정을 불러올 수 없습니다.", "error");
            return;
        }

        if (!kakao.isInitialized()) {
            try {
                kakao.init(KAKAO_KEY);
            } catch (e) {
                console.error("Kakao init failed:", e);
            }
        }

        const tripData = targetTrip || trip;
        const metadata = tripData.metadata || tripData;
        const title = metadata.title || "오키나와 가족 여행";
        const description = metadata.startDate
            ? `${metadata.startDate} ~ ${metadata.endDate || ""} 오키나와 여행 가이드`
            : "오키나와 여행 가이드";

        // Save to DB first to avoid URL length issues
        showToast("공유 링크를 생성 중입니다...", "info");

        const shareData = {
            metadata: metadata,
            points: tripData.points || allPoints.filter((p: any) => p.day > 0),
            customFiles: tripData.customFiles || [] // Now we can include files because it's DB!
        };

        try {
            const { data, error } = await supabase
                .from('shared_trips')
                .insert([
                    {
                        trip_data: shareData,
                        title: title,
                        destination: metadata.destination || ""
                    }
                ])
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No data returned from DB");

            const shareId = data[0].id;
            // Generate full URL (Dedicated Vercel domain)
            const VERCEL_DOMAIN = "https://okinawa-lime.vercel.app";

            // 1. Generate Link and inform user
            const shareUrl = `${VERCEL_DOMAIN}/?id=${shareId}`;

            // Clipboard attempt
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showToast("링크가 복사되었습니다! 카카오톡에 붙여넣으세요.", "success");
                }).catch(() => {
                    showToast("링크 생성 완료", "success");
                });
            } else {
                showToast("링크 생성 완료", "success");
            }

            // 2. Open Kakao Share (Removed alert to prevent popup blocking)
            try {
                kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: title,
                        description: description,
                        imageUrl: 'https://images.unsplash.com/photo-1576675784432-994941412b3d?auto=format&fit=crop&q=80&w=1000',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '가이드 보기',
                            link: {
                                mobileWebUrl: shareUrl,
                                webUrl: shareUrl,
                            },
                        },
                    ],
                });
            } catch (kakaoError) {
                console.warn("Kakao share failed:", kakaoError);
            }
        } catch (dbError) {
            console.error("Supabase error:", dbError);
            showToast("공유 링크 생성 중 오류가 발생했습니다.", "error");
        }
    };

    // Shared trip injection (OLD URL-based) removed in favor of Supabase ID

    const value = useMemo(() => ({
        view, setView, activeTab, setActiveTab, overviewMode, setOverviewMode,
        scheduleDay, setScheduleDay, scheduleViewMode, setScheduleViewMode,
        theme, setTheme, toggleTheme, trips, setTrips, trip, setTrip,
        allPoints, setAllPoints, completedItems, setCompletedItems,
        selectedPoint, setSelectedPoint, weatherIndex, setWeatherIndex,
        selectedWeatherLocation, setSelectedWeatherLocation,
        activePlannerDetail, setActivePlannerDetail, isPlanning, setIsPlanning,
        plannerStep, setPlannerStep, plannerData, setPlannerData,
        selectedPlaceIds, setSelectedPlaceIds, dynamicAttractions, setDynamicAttractions,
        isSearchingAttractions, setIsSearchingAttractions,
        isSearchingHotels, setIsSearchingHotels,
        recommendedHotels, setRecommendedHotels,
        hotelStrategy, setHotelStrategy,
        hotelAddStatus, setHotelAddStatus,
        validatedHotel, setValidatedHotel,
        isValidatingPlace, setIsValidatingPlace,
        isPlaceAddedSuccess, setIsPlaceAddedSuccess,
        isPlaceAddedError, setIsPlaceAddedError,
        userReviews, setUserReviews, userLogs, setUserLogs, customFiles, setCustomFiles,
        weatherData, isLoadingWeather, weatherError, fetchWeatherData, getWeatherForDay, getFormattedDate,
        jpyAmount, setJpyAmount, krwAmount, setKrwAmount, rate, setRate,
        isOcrLoading, setIsOcrLoading, analyzedFiles, setAnalyzedFiles, ticketFileInputRef,
        customAiPrompt, setCustomAiPrompt, isEditingPoint, setIsEditingPoint,
        attractionCategoryFilter, setAttractionCategoryFilter, isDragging, setIsDragging,
        toasts, showToast, isReviewModalOpen, setIsReviewModalOpen,
        isReEditModalOpen, setIsReEditModalOpen, tripToEdit, setTripToEdit,
        deleteConfirmModal, setDeleteConfirmModal,
        isLoggedIn, setIsLoggedIn,
        currentUser, setCurrentUser,
        selectedFile, setSelectedFile,
        calendarDate, setCalendarDate, prevMonth, nextMonth,
        isDraggingRef, calculateProgress, getPoints,
        toggleComplete, updateReview, updateLog, speak, convert,
        handleReorder, deletePoint, addPoint, addAccommodation, deleteAccommodation,
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI, closeToast,
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
        validateDestination, isValidatingDestination, isDestinationValidated, setIsDestinationValidated,
        saveAttractionsToCache: () => { },
        startNewPlanning,
        saveDraft,
        exportTrip,
        importTrip,
        isPreparingOffline,
        offlineProgress,
        prepareOfflineMap,
        shareToKakao
    }), [
        view, activeTab, overviewMode, scheduleDay, scheduleViewMode, theme, trips, trip,
        allPoints, completedItems, selectedPoint, weatherIndex, selectedWeatherLocation,
        activePlannerDetail, isPlanning, plannerStep, plannerData, selectedPlaceIds,
        dynamicAttractions, isSearchingAttractions, isSearchingHotels, recommendedHotels,
        hotelStrategy, hotelAddStatus, validatedHotel, isValidatingPlace, isPlaceAddedSuccess,
        isPlaceAddedError, userReviews, userLogs, customFiles, weatherData, isLoadingWeather,
        weatherError, jpyAmount, krwAmount, rate, isOcrLoading, analyzedFiles, customAiPrompt,
        isEditingPoint, attractionCategoryFilter, isDragging, toasts, isReviewModalOpen,
        isReEditModalOpen, tripToEdit, deleteConfirmModal, isLoggedIn, currentUser,
        selectedFile, calendarDate, isDestinationValidated, isValidatingDestination,
        isPreparingOffline, offlineProgress
    ]);

    return <PlannerContext.Provider value={value} > {children}</PlannerContext.Provider >;
};

export const usePlanner = () => {
    const context = useContext(PlannerContext);
    if (context === undefined) {
        throw new Error('usePlanner must be used within a PlannerProvider');
    }
    return context;
};
