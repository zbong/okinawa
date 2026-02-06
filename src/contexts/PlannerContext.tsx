import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TripPlan, LocationPoint, PlannerData, CustomFile } from '../types';
import { okinawaTrip } from '../data';
import {
    fileToBase64
} from '../utils/ocr';
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
    };
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>;

    // Auth
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;

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
    handleFileAnalysis: (files: File[]) => Promise<void>;
    handleTicketOcr: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleMultipleOcr: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => Promise<void>;
    deleteFile: (id: string, e?: React.MouseEvent) => void;
    saveAttractionsToCache: (destination: string, attractions: any[]) => void;
    validateDestination: (destination: string) => Promise<boolean>;
    isValidatingDestination: boolean;
    isDestinationValidated: boolean;
    setIsDestinationValidated: React.Dispatch<React.SetStateAction<boolean>>;
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
    const [toasts, setToasts] = useState<any[]>([]);
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 700);
    };

    const closeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const [deleteConfirmModal, setDeleteConfirmModal] = useState<any>({
        isOpen: false,
        title: "",
        message: "",
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
        showToast
    });

    useEffect(() => {
        const saved = localStorage.getItem("trip_draft_v1");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.attractions && parsed.attractions.length > 0) {
                    setDynamicAttractions(parsed.attractions);
                }
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
            };
            localStorage.setItem("trip_draft_v1", JSON.stringify(draft));
        }
    }, [isPlanning, plannerStep, plannerData, selectedPlaceIds, dynamicAttractions]);

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
                points: (planData.points || []).map((p: any) => ({
                    ...p,
                    id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                    isCompleted: false,
                    images: p.images || []
                }))
            };
            setTrip(finalPlan);
            setAllPoints(finalPlan.points);
            setPlannerStep(7);
        }
    };









    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await fileToBase64(file);
            const newFile: any = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: file.type.includes("pdf") ? "pdf" : "image",
                data: base64,
                linkedTo,
                date: new Date().toISOString(),
            };
            setCustomFiles((prev: any) => [...prev, newFile]);
            showToast("서류가 업로드되었습니다.", "success");
        } catch (err) {
            showToast("파일 업로드 실패", "error");
        }
    };

    const deleteFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCustomFiles((prev: any) => prev.filter((f: any) => f.id !== id));
    };

    const value = {
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
        isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser,
        calendarDate, setCalendarDate, prevMonth, nextMonth,
        isDraggingRef, calculateProgress, getPoints,
        toggleComplete, updateReview, updateLog, speak, convert,
        handleReorder, deletePoint, addPoint, addAccommodation, deleteAccommodation,
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI, closeToast,
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
        validateDestination, isValidatingDestination, isDestinationValidated, setIsDestinationValidated,
        saveAttractionsToCache: () => { } // Placeholder implementation
    };

    return <PlannerContext.Provider value={value} > {children}</PlannerContext.Provider >;
};

export const usePlanner = () => {
    const context = useContext(PlannerContext);
    if (context === undefined) {
        throw new Error('usePlanner must be used within a PlannerProvider');
    }
    return context;
};
