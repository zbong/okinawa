import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { TripPlan, LocationPoint, PlannerData, CustomFile } from '../types';
import { usePlannerAI } from '../hooks/usePlannerAI';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useTripManager } from '../hooks/useTripManager';
import { useGoogleTTS } from '../hooks/useGoogleTTS';
import { useCurrency, useLiveRate } from '../hooks/useCurrency';
import { useWeather } from '../hooks/useWeather';
import { usePlannerState } from '../hooks/planner/usePlannerState';
import { useFileActions } from '../hooks/planner/useFileActions';
import { usePlannerActions } from '../hooks/planner/usePlannerActions';
import { useOfflineMap } from '../hooks/useOfflineMap';
import { useAuth } from '../hooks/useAuth';

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
    trip: TripPlan | null;
    setTrip: React.Dispatch<React.SetStateAction<TripPlan | null>>;
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
    scheduleDensity: "여유롭게" | "보통" | "빡빡하게";
    setScheduleDensity: React.Dispatch<React.SetStateAction<"여유롭게" | "보통" | "빡빡하게">>;
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
    draftId: string | null;
    setDraftId: React.Dispatch<React.SetStateAction<string | null>>;
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

    // Exchange
    foreignAmount: string;
    setForeignAmount: React.Dispatch<React.SetStateAction<string>>;
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
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    };
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>;

    // Auth (REAL)
    isAuthLoading: boolean; // Add this
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>; // Keep for compatibility if needed, or mock
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>; // Keep for compatibility
    user: any; // Real Supabase User
    signInWithEmail: (email: string) => Promise<boolean>;
    signInWithGoogle: () => Promise<void>;
    signUpWithPassword: (email: string, password: string) => Promise<any>;
    signInWithPassword: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;

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
    getPoints: (day?: number) => LocationPoint[];
    toggleComplete: (id: string, e: React.MouseEvent) => void;
    updateReview: (id: string, rating: number, text: string) => void;
    updateLog: (id: string, text: string) => void;
    speak: (text: string, lang?: string, audioBase64?: string) => void;
    convert: (val: string, type: "foreign" | "krw") => void;
    handleReorder: (newOrder: LocationPoint[]) => void;
    deletePoint: (id: string, e?: React.MouseEvent) => void;
    addPoint: (day: number, point: any) => void;
    addAccommodation: (acc: any) => void;
    deleteAccommodation: (index: number) => void;
    fetchAttractionsWithAI: (destination: string, force?: boolean) => Promise<void>;
    fetchHotelsWithAI: (destination: string) => Promise<void>;
    validateAndAddPlace: (name: string) => Promise<boolean>;
    validateHotel: (name: string) => Promise<void>;
    generatePlanWithAI: (customPrompt?: string) => Promise<void>;
    generateChecklistWithAI: () => Promise<any[]>;
    handleFileAnalysis: (files: File[], linkedTo?: string) => Promise<void>;
    handleTicketOcr: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleMultipleOcr: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement> | File[], linkedTo?: string) => Promise<void>;
    deleteFile: (id: string, e?: React.MouseEvent) => void;
    validateDestination: (destination: string) => Promise<boolean>;
    isValidatingDestination: boolean;
    isDestinationValidated: boolean;
    setIsDestinationValidated: React.Dispatch<React.SetStateAction<boolean>>;
    fetchAttractionDetailWithAI: (attractionId: string) => Promise<void>;
    isFetchingDetail: boolean;
    startNewPlanning: () => void;
    saveDraft: (step: number, customData?: any) => Promise<string | null>;
    exportTrip: () => void;
    importTrip: (file: File) => Promise<void>;
    copyShareLink: (targetTrip?: any) => Promise<void>;
    isPreparingOffline: boolean;
    offlineProgress: number;
    offlinePhase: 'files' | 'map' | 'idle';
    prepareOfflineMap: () => Promise<void>;
    publishTrip: (newTrip: TripPlan) => Promise<void>;
    saveTripToSupabase: (targetTrip: TripPlan, isImmediate?: boolean, overrides?: any) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    resetPlannerState: () => Promise<void>;
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
        setTheme(prev => {
            const newTheme = prev === "dark" ? "light" : "dark";
            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // View State
    const [view, setView] = useState("landing");
    const [activeTab, setActiveTab] = useState("schedule");
    const [overviewMode, setOverviewMode] = useState<"map" | "text">("map");
    const [scheduleDay, setScheduleDay] = useState(1);
    const [scheduleViewMode, setScheduleViewMode] = useState<"map" | "list">("list");

    // Core dependencies
    const [toasts, setToasts] = useState<any[]>([]);
    const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        const duration = type === "error" ? 5000 : type === "success" ? 3000 : 2000;
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);
    const closeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        onCancel: undefined as (() => void) | undefined,
        confirmText: "삭제",
        cancelText: "취소"
    });

    // Auth (REAL)
    const { user, loading: isAuthLoading, signInWithEmail, signInWithGoogle, signUpWithPassword, signInWithPassword, signOut } = useAuth();
    // Maintain compatibility with existing code
    const isLoggedIn = !!user;
    const currentUser = user ? { name: user.email?.split('@')[0] || "User", email: user.email, ...user } : null;
    // Mock setters for compatibility (do nothing or warn)
    const setIsLoggedIn = () => { };
    const setCurrentUser = () => { };

    // Validated Trip Manager
    const {
        trips, setTrips,
        trip, setTrip,
        allPoints, setAllPoints,
        completedItems, setCompletedItems,
        userReviews, setUserReviews,
        userLogs, setUserLogs,
        customFiles, setCustomFiles,
        analyzedFiles, setAnalyzedFiles,
        handleReorder: handleReorderBase,
        deletePoint,
        deleteTrip,
        addPoint,
        toggleComplete,
        updateReview,
        updateLog,
        getPoints: getPointsBase,
        calculateProgress,
        publishTrip,
        saveTripToSupabase
    } = useTripManager({ showToast, setDeleteConfirmModal, user });

    // Wrappers
    const handleReorder = (newOrder: LocationPoint[]) => handleReorderBase(newOrder, scheduleDay);
    const getPoints = () => getPointsBase(scheduleDay);

    const isDraggingRef = useRef(false);

    // Selection
    const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
    const [activePlannerDetail, setActivePlannerDetail] = useState<any | null>(null);

    // Planning State
    const plannerState = usePlannerState({
        user,
        trip,
        setTrip,
        allPoints,
        setAllPoints,
        completedItems,
        setCompletedItems
    });
    const {
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
        resetPlannerState: resetPlannerStateBase
    } = plannerState;

    const resetPlannerState = useCallback(async () => {
        resetPlannerStateBase();
        setView("landing");
    }, [resetPlannerStateBase, setView]);

    // Unified File State (Single Source of Truth)
    // No more switching between duplicate lists.


    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);

    const [selectedFile, setSelectedFile] = useState<any | null>(null);

    // Calendar
    const [calendarDate, setCalendarDate] = useState(new Date());

    const {
        isSearchingAttractions, setIsSearchingAttractions,
        isSearchingHotels, setIsSearchingHotels,
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
        setIsDestinationValidated,
        fetchAttractionDetailWithAI,
        isFetchingDetail,
        generateChecklistWithAI
    } = usePlannerAI({
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
    });

    const activeTripId = trip?.id ?? 'new-trip';

    const {
        isOcrLoading,
        setIsOcrLoading,
        ticketFileInputRef,
        handleFileAnalysis,
        handleTicketOcr,
        handleMultipleOcr
    } = useDocumentAnalysis({
        plannerData,
        setPlannerData,
        setCustomFiles,
        analyzedFiles,
        setAnalyzedFiles,
        showToast,
        setDeleteConfirmModal,
        user,
        tripId: activeTripId
    });

    // Sync planner destination
    useEffect(() => {
        if (isPlanning && isDestinationValidated && plannerData.destination && trip?.metadata?.destination !== plannerData.destination) {
            setTrip((prev: any) => ({
                ...prev,
                metadata: {
                    ...(prev?.metadata || {}),
                    destination: plannerData.destination,
                    destinationInfo: plannerData.destinationInfo // Sync this too
                }
            }));
        }
    }, [isPlanning, isDestinationValidated, plannerData.destination, plannerData.destinationInfo, trip?.metadata?.destination, setTrip]);

    // Reset day on destination change
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        setScheduleDay(1);
        setSelectedPoint(null);
    }, [trip?.metadata?.destination]);

    // Safety net: If planner is closed but no trip exists in app view, go back to landing
    useEffect(() => {
        if (!isPlanning && !trip && view === "app") {
            console.log("[PlannerContext] No active trip and planning ended, returning to landing.");
            setView("landing");
        }
    }, [isPlanning, trip, view]);

    const [isEditingPoint, setIsEditingPoint] = useState(false);
    const [attractionCategoryFilter, setAttractionCategoryFilter] = useState<"all" | "sightseeing" | "food" | "cafe">("all");
    const [isDragging, setIsDragging] = useState(false);

    // Weather
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

    const getWeatherForDay = (dayIndex: number) => {
        return getLocationWeather(dayIndex, trip?.metadata?.destination || "오키나와 (나하)");
    };

    // Currency
    const {
        foreignAmount, setForeignAmount,
        krwAmount, setKrwAmount,
        rate, setRate,
        convert
    } = useCurrency();

    // 목적지 변경 시 환율 자동 갱신
    useLiveRate(
        trip?.metadata?.destination || "",
        setRate,
        setForeignAmount,
        setKrwAmount,
        trip?.metadata?.destinationInfo as any
    );

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

    const startNewPlanning = async () => {
        await resetPlannerState();
        setCustomAiPrompt("");
        setValidatedHotel(null);
        setActivePlannerDetail(null);
        setIsPlanning(true);
        // Do not set view to "app" here; keep it "landing" so the background is the landing page
    };

    const { handleFileUpload, deleteFile } = useFileActions({
        setCustomFiles: setCustomFiles as any,
        showToast,
        user,
        saveTripToSupabase,
        trip,
        currentFiles: customFiles
    });

    const {
        generatePlanWithAI,
        saveDraft,
        exportTrip,
        importTrip,
        copyShareLink,
    } = usePlannerActions({
        plannerState,
        setTrip,
        setAllPoints,
        setPlannerStep,
        showToast,
        generatePlan,
        setActiveTab,
        trip,
        allPoints,
        completedItems,
        userReviews,
        userLogs,
        customFiles,
        analyzedFiles,
        setCompletedItems,
        setUserReviews,
        setUserLogs,
        setCustomFiles,
        user,
        setTrips,
        setPlannerData
    });

    const { isPreparingOffline, offlineProgress, offlinePhase, prepareOfflineMap } = useOfflineMap({
        allPoints,
        customFiles,
        defaultFiles: trip?.defaultFiles || [],
        showToast
    });

    const value = useMemo(() => ({
        view, setView, activeTab, setActiveTab, overviewMode, setOverviewMode,
        scheduleDay, setScheduleDay, scheduleViewMode, setScheduleViewMode,
        theme, setTheme, toggleTheme, trips, setTrips, trip, setTrip,
        allPoints, setAllPoints, completedItems, setCompletedItems,
        selectedPoint, setSelectedPoint, weatherIndex, setWeatherIndex,
        selectedWeatherLocation, setSelectedWeatherLocation,
        activePlannerDetail, setActivePlannerDetail, isPlanning, setIsPlanning,
        plannerStep, setPlannerStep, plannerData, setPlannerData,
        scheduleDensity, setScheduleDensity,
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
        foreignAmount, setForeignAmount, krwAmount, setKrwAmount, rate, setRate,
        isOcrLoading, setIsOcrLoading, analyzedFiles, setAnalyzedFiles, ticketFileInputRef,
        customAiPrompt, setCustomAiPrompt, draftId, setDraftId, isEditingPoint, setIsEditingPoint,
        attractionCategoryFilter, setAttractionCategoryFilter, isDragging, setIsDragging,
        toasts, showToast, isReviewModalOpen, setIsReviewModalOpen,
        isReEditModalOpen, setIsReEditModalOpen, tripToEdit, setTripToEdit,
        deleteConfirmModal, setDeleteConfirmModal,
        isLoggedIn, setIsLoggedIn,
        currentUser, setCurrentUser,
        user, signInWithEmail, signInWithGoogle, signUpWithPassword, signInWithPassword, signOut, // New Auth
        selectedFile, setSelectedFile,
        calendarDate, setCalendarDate, prevMonth, nextMonth,
        isDraggingRef, calculateProgress, getPoints,
        toggleComplete, updateReview, updateLog, speak, convert,
        handleReorder, deletePoint, addPoint, addAccommodation, deleteAccommodation,
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI, generateChecklistWithAI, closeToast,
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
        validateDestination, isValidatingDestination, isDestinationValidated, setIsDestinationValidated,
        fetchAttractionDetailWithAI, isFetchingDetail,
        saveAttractionsToCache: () => { },
        startNewPlanning,
        saveDraft,
        exportTrip,
        importTrip,
        copyShareLink,
        isPreparingOffline,
        offlineProgress,
        offlinePhase,
        prepareOfflineMap,
        deleteTrip,
        publishTrip,
        saveTripToSupabase,
        resetPlannerState,
        isAuthLoading // Added to value
    }) as PlannerContextType, [
        view, activeTab, overviewMode, scheduleDay, scheduleViewMode, theme, trips, trip,
        allPoints, completedItems, selectedPoint, weatherIndex, selectedWeatherLocation,
        activePlannerDetail, isPlanning, plannerStep, plannerData, scheduleDensity, selectedPlaceIds,
        dynamicAttractions, isSearchingAttractions, isSearchingHotels, recommendedHotels,
        hotelStrategy, hotelAddStatus, validatedHotel, isValidatingPlace, isPlaceAddedSuccess,
        isPlaceAddedError, userReviews, userLogs, customFiles, weatherData, isLoadingWeather,
        weatherError, foreignAmount, krwAmount, rate, isOcrLoading, analyzedFiles, customAiPrompt,
        isEditingPoint, attractionCategoryFilter, isDragging, isReviewModalOpen,
        tripToEdit, deleteConfirmModal, isLoggedIn, currentUser, draftId,
        user, signUpWithPassword, signInWithPassword, isAuthLoading,
        selectedFile, calendarDate, isDestinationValidated, isValidatingDestination,
        isFetchingDetail, isPreparingOffline, offlineProgress, offlinePhase,
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI,
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
        validateDestination, fetchAttractionDetailWithAI, startNewPlanning, saveDraft,
        exportTrip, importTrip, prepareOfflineMap, deleteTrip, publishTrip, resetPlannerState,
        toggleComplete, updateReview, updateLog, speak, convert, handleReorder, deletePoint, addPoint, addAccommodation, deleteAccommodation,
        showToast, closeToast
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
