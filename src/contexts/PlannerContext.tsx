import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

import { TripPlan, LocationPoint, PlannerData, CustomFile } from '../types';
import { usePlannerAI } from '../hooks/usePlannerAI';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useTripManager } from '../hooks/useTripManager';
import { useGoogleTTS } from '../hooks/useGoogleTTS';
import { useCurrency } from '../hooks/useCurrency';
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

    setPlannerCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    setPlannerAnalyzedFiles: React.Dispatch<React.SetStateAction<any[]>>;

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
    speak: (text: string) => void;
    convert: (val: string, type: "jpy" | "krw") => void;
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
    publishTrip: (newTrip: TripPlan) => Promise<void>;
    shareToKakao: (trip: TripPlan) => void;
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
    const [view, setView] = useState("app");
    const [activeTab, setActiveTab] = useState("schedule");
    const [overviewMode, setOverviewMode] = useState<"map" | "text">("map");
    const [scheduleDay, setScheduleDay] = useState(1);
    const [scheduleViewMode, setScheduleViewMode] = useState<"map" | "list">("list");

    // Core dependencies
    const [toasts, setToasts] = useState<any[]>([]);
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1000);
    };
    const closeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
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
        customFiles: tripCustomFiles, setCustomFiles: setTripCustomFiles,
        analyzedFiles: tripAnalyzedFiles, setAnalyzedFiles: setTripAnalyzedFiles,
        handleReorder: handleReorderBase,
        deletePoint,
        deleteTrip,
        addPoint,
        toggleComplete,
        updateReview,
        updateLog,
        getPoints: getPointsBase,
        calculateProgress,
        publishTrip
    } = useTripManager({ showToast, setDeleteConfirmModal, user });

    // Wrappers
    const handleReorder = (newOrder: LocationPoint[]) => handleReorderBase(newOrder, scheduleDay);
    const getPoints = () => getPointsBase(scheduleDay);

    const isDraggingRef = useRef(false);

    // Selection
    const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
    const [activePlannerDetail, setActivePlannerDetail] = useState<any | null>(null);

    // Planning State
    const plannerState = usePlannerState({ user, trip, setTrip });
    const {
        isPlanning, setIsPlanning,
        plannerStep, setPlannerStep,
        plannerData, setPlannerData,
        selectedPlaceIds, setSelectedPlaceIds,
        dynamicAttractions, setDynamicAttractions,
        recommendedHotels, setRecommendedHotels,
        hotelStrategy, setHotelStrategy,
        customFiles: plannerCustomFiles, setCustomFiles: setPlannerCustomFiles,
        analyzedFiles: plannerAnalyzedFiles, setAnalyzedFiles: setPlannerAnalyzedFiles,
        resetPlannerState
    } = plannerState;

    const analyzedFiles = isPlanning || plannerStep > 0 ? plannerAnalyzedFiles : tripAnalyzedFiles;
    const setAnalyzedFiles = isPlanning || plannerStep > 0 ? setPlannerAnalyzedFiles : setTripAnalyzedFiles;

    const customFiles = isPlanning || plannerStep > 0 ? plannerCustomFiles : tripCustomFiles;
    const setCustomFiles = isPlanning || plannerStep > 0 ? setPlannerCustomFiles : (setTripCustomFiles as any);

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
        setIsDestinationValidated
    } = usePlannerAI({
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
    });

    const {
        isOcrLoading,
        setIsOcrLoading,
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
        analyzedFiles,
        setAnalyzedFiles,
        showToast
    });

    // Sync planner destination
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

    // Reset day on destination change
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        setScheduleDay(1);
        setSelectedPoint(null);
    }, [trip?.metadata?.destination]);

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
        jpyAmount, setJpyAmount,
        krwAmount, setKrwAmount,
        rate, setRate,
        convert
    } = useCurrency();

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
        setView("app");
    };

    const { handleFileUpload, deleteFile } = useFileActions({
        setCustomFiles: setCustomFiles as any,
        showToast,
        user
    });

    const {
        generatePlanWithAI,
        saveDraft,
        exportTrip,
        importTrip,
        copyShareLink: shareToKakao
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
        setCompletedItems,
        setUserReviews,
        setUserLogs,
        setTripCustomFiles: (setTripCustomFiles as any)
    });

    const { isPreparingOffline, offlineProgress, prepareOfflineMap } = useOfflineMap({ allPoints, showToast });

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
        user, signInWithEmail, signInWithGoogle, signUpWithPassword, signInWithPassword, signOut, // New Auth
        selectedFile, setSelectedFile,
        calendarDate, setCalendarDate, prevMonth, nextMonth,
        isDraggingRef, calculateProgress, getPoints,
        toggleComplete, updateReview, updateLog, speak, convert,
        handleReorder, deletePoint, addPoint, addAccommodation, deleteAccommodation,
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI, closeToast,
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
        setPlannerCustomFiles, setPlannerAnalyzedFiles,
        validateDestination, isValidatingDestination, isDestinationValidated, setIsDestinationValidated,
        saveAttractionsToCache: () => { },
        startNewPlanning,
        saveDraft,
        exportTrip,
        importTrip,
        isPreparingOffline,
        offlineProgress,
        prepareOfflineMap,
        shareToKakao,
        deleteTrip,
        publishTrip,
        resetPlannerState,
        isAuthLoading // Added to value
    }), [
        view, activeTab, overviewMode, scheduleDay, scheduleViewMode, theme, trips, trip,
        allPoints, completedItems, selectedPoint, weatherIndex, selectedWeatherLocation,
        activePlannerDetail, isPlanning, plannerStep, plannerData, selectedPlaceIds,
        dynamicAttractions, isSearchingAttractions, isSearchingHotels, recommendedHotels,
        hotelStrategy, hotelAddStatus, validatedHotel, isValidatingPlace, isPlaceAddedSuccess,
        isPlaceAddedError, userReviews, userLogs, customFiles, weatherData, isLoadingWeather,
        weatherError, jpyAmount, krwAmount, rate, isOcrLoading, analyzedFiles, customAiPrompt,
        isEditingPoint, attractionCategoryFilter, isDragging, isReviewModalOpen,
        tripToEdit, deleteConfirmModal, isLoggedIn, currentUser,
        user, signUpWithPassword, signInWithPassword, isAuthLoading, // Added isAuthLoading
        selectedFile, calendarDate, isDestinationValidated, isValidatingDestination,
        isPreparingOffline, offlineProgress, shareToKakao,
        setPlannerCustomFiles, setPlannerAnalyzedFiles
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
