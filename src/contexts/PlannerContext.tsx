import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TripPlan, LocationPoint, PlannerData } from '../types';
import { okinawaTrip } from '../data';
import {
    extractTextFromFile,
    parseUniversalDocument,
    fileToBase64
} from '../utils/ocr';
import { parseWithAI } from '../utils/ai-parser';
import { usePlannerAI } from '../hooks/usePlannerAI';
import { useGoogleTTS } from '../hooks/useGoogleTTS';
import { useCurrency } from '../hooks/useCurrency';
import { useWeather } from '../hooks/useWeather';

export interface CustomFile {
    id: string;
    name: string;
    type: "image" | "pdf";
    data: string; // Base64
    linkedTo?: string; // Point ID
    date: string;
}

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

    // Trips & Current Trip
    const [trips, setTrips] = useState<TripPlan[]>(() => {
        const saved = localStorage.getItem("user_trips_v2");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse trips:", e);
            }
        }
        return [okinawaTrip];
    });

    const [trip, setTrip] = useState<TripPlan>(okinawaTrip);

    useEffect(() => {
        localStorage.setItem("user_trips_v2", JSON.stringify(trips));
    }, [trips]);

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

    // Global UI States
    const [toasts, setToasts] = useState<any[]>([]);
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    const closeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<any>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

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
        generatePlanWithAI: generatePlan
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

    // Points Order
    const [allPoints, setAllPoints] = useState<LocationPoint[]>(() => {
        if (!okinawaTrip.metadata?.destination) return okinawaTrip.points || [];
        const saved = localStorage.getItem(`points_order_${okinawaTrip.metadata.destination}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return okinawaTrip.points || [];
            }
        }
        return okinawaTrip.points || [];
    });

    const isDraggingRef = useRef(false);

    // OCR Lab
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
    const [customAiPrompt, setCustomAiPrompt] = useState("");

    // App Local But Moved to Context
    const [isEditingPoint, setIsEditingPoint] = useState(false);
    const [attractionCategoryFilter, setAttractionCategoryFilter] = useState<"all" | "sightseeing" | "food" | "cafe">("all");
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (trip && trip.metadata?.destination) {
            const saved = localStorage.getItem(`points_order_${trip.metadata.destination}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setAllPoints(parsed);
                        return;
                    }
                } catch (e) { }
            }
            setAllPoints(trip.points || []);
        } else if (trip && trip.points) {
            setAllPoints(trip.points);
        }
    }, [trip]);

    useEffect(() => {
        if (trip && trip.metadata?.destination) {
            localStorage.setItem(`points_order_${trip.metadata.destination}`, JSON.stringify(allPoints));
        }
    }, [allPoints, trip]);

    // Checklist, Reviews, Logs, Files
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
    const [userReviews, setUserReviews] = useState<Record<string, { rating: number; text: string }>>({});
    const [userLogs, setUserLogs] = useState<Record<string, string>>({});
    const [customFiles, setCustomFiles] = useState<CustomFile[]>([]);

    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        const dest = trip.metadata.destination;

        const savedChecklist = localStorage.getItem(`checklist_${dest}`);
        setCompletedItems(savedChecklist ? JSON.parse(savedChecklist) : {});

        const savedReviews = localStorage.getItem(`reviews_${dest}`);
        setUserReviews(savedReviews ? JSON.parse(savedReviews) : {});

        const savedLogs = localStorage.getItem(`logs_${dest}`);
        setUserLogs(savedLogs ? JSON.parse(savedLogs) : {});

        const savedFiles = localStorage.getItem(`files_${dest}`);
        setCustomFiles(savedFiles ? JSON.parse(savedFiles) : []);

        setScheduleDay(1);
        setSelectedPoint(null);
    }, [trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            localStorage.setItem(`checklist_${trip.metadata.destination}`, JSON.stringify(completedItems));
        }
    }, [completedItems, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            localStorage.setItem(`reviews_${trip.metadata.destination}`, JSON.stringify(userReviews));
        }
    }, [userReviews, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            localStorage.setItem(`logs_${trip.metadata.destination}`, JSON.stringify(userLogs));
        }
    }, [userLogs, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            localStorage.setItem(`files_${trip.metadata.destination}`, JSON.stringify(customFiles));
        }
    }, [customFiles, trip?.metadata?.destination]);


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

    const calculateProgress = () => {
        const total = allPoints.length;
        if (total === 0) return 0;
        const completed = allPoints.filter(p => completedItems[p.id]).length;
        return Math.round((completed / total) * 100);
    };

    const getPoints = () => {
        return allPoints.filter((p) => p.day === scheduleDay);
    };

    const toggleComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const updateReview = (id: string, rating: number, text: string) => {
        setUserReviews((prev) => ({
            ...prev,
            [id]: { rating, text },
        }));
    };

    const updateLog = (id: string, text: string) => {
        setUserLogs((prev) => ({
            ...prev,
            [id]: text,
        }));
    };

    const { speak } = useGoogleTTS();

    const handleReorder = (newOrder: LocationPoint[]) => {
        const otherPoints = allPoints.filter((p) => p.day !== scheduleDay);
        setAllPoints([...otherPoints, ...newOrder]);
    };

    const deletePoint = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteConfirmModal({
            isOpen: true,
            title: "장소 삭제",
            message: "이 장소를 일정에서 삭제하시겠습니까?",
            onConfirm: () => {
                setAllPoints((prev) => prev.filter((p) => p.id !== id));
                showToast("장소가 삭제되었습니다.");
                setDeleteConfirmModal({
                    isOpen: false,
                    title: "",
                    message: "",
                    onConfirm: () => { },
                });
            },
        });
    };

    const addPoint = (day: number, point: any) => {
        const newPoint: LocationPoint = {
            ...point,
            id: `manual-${Date.now()}`,
            day,
        };
        setAllPoints((prev) => [...prev, newPoint]);
        showToast("장소가 추가되었습니다.", "success");
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


    const handleFileAnalysis = async (files: File[]) => {
        if (files.length === 0) return;
        setIsOcrLoading(true);
        try {
            const updates: Partial<PlannerData> = {};
            const newAnalyzedFiles = [...analyzedFiles];

            const resolveAirportName = (code: string | undefined) => {
                if (!code) return "";
                const map: Record<string, string> = {
                    ICN: "인천국제공항 (ICN)",
                    GMP: "김포국제공항 (GMP)",
                    KIX: "간사이국제공항 (KIX)",
                    NRT: "나리타국제공항 (NRT)",
                    HND: "하네다공항 (HND)",
                    FUK: "후쿠오카공항 (FUK)",
                    CTS: "신치토세공항 (CTS)",
                    OKA: "나하공항 (OKA)",
                    CJU: "제주국제공항 (CJU)",
                    PUS: "김해국제공항 (PUS)",
                    TAE: "대구국제공항 (TAE)",
                    CJJ: "청주국제공항 (CJJ)",
                    MWX: "무안국제공항 (MWX)",
                    YNY: "양양국제공항 (YNY)",
                };
                if (code.length === 3 && code === code.toUpperCase())
                    return map[code] || code;
                return code;
            };

            const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (newAnalyzedFiles.some((f) => f.name === file.name)) {
                    showToast(`이미 추가된 파일입니다: ${file.name}`);
                    continue;
                }

                const fileIdx = newAnalyzedFiles.length;
                newAnalyzedFiles.push({ name: file.name, text: "", status: "loading" });
                setAnalyzedFiles([...newAnalyzedFiles]);

                const mimeType = file.type || "image/jpeg";
                const isSupportedMultimodal =
                    mimeType.startsWith("image/") || mimeType === "application/pdf";

                let text = "";
                let base64 = "";

                if (!isSupportedMultimodal) {
                    text = await extractTextFromFile(file);
                } else {
                    base64 = await fileToBase64(file);
                }

                let parsed;
                try {
                    const fileData = isSupportedMultimodal
                        ? { base64, mimeType }
                        : undefined;
                    parsed = await parseWithAI(text, fileData);
                } catch (err) {
                    console.error(`AI Parsing failure for ${file.name}:`, err);
                    if (!isSupportedMultimodal && text) {
                        parsed = parseUniversalDocument(text);
                    } else {
                        newAnalyzedFiles[fileIdx] = {
                            name: file.name,
                            text: text || "(Analysis Failed)",
                            status: "error",
                        };
                        setAnalyzedFiles([...newAnalyzedFiles]);
                        continue;
                    }
                }

                if (i > 0) {
                    await sleep(1000);
                }

                newAnalyzedFiles[fileIdx] = {
                    name: file.name,
                    text: text || "(Vision Mode)",
                    parsedData: parsed,
                    status: "done",
                };
                setAnalyzedFiles([...newAnalyzedFiles]);

                if (parsed.type === "flight") {
                    const arrival = parsed.flight?.arrivalAirport || parsed.arrival;
                    if (arrival && arrival !== "도착지 미확인")
                        updates.destination = arrival;

                    if (parsed.flight?.departureAirport)
                        updates.departurePoint = resolveAirportName(
                            parsed.flight.departureAirport,
                        );
                    if (parsed.flight?.arrivalAirport)
                        updates.entryPoint = resolveAirportName(
                            parsed.flight.arrivalAirport,
                        );
                    if (parsed.flight?.departureCoordinates)
                        updates.departureCoordinates = parsed.flight.departureCoordinates;
                    if (parsed.flight?.arrivalCoordinates)
                        updates.entryCoordinates = parsed.flight.arrivalCoordinates;

                    updates.travelMode = "plane";

                    if (parsed.flight?.departureDate) {
                        updates.startDate = parsed.flight.departureDate;
                    } else if (parsed.startDate && parsed.startDate !== "미확인") {
                        updates.startDate = parsed.startDate;
                    }

                    if (parsed.flight?.arrivalDate) {
                        updates.arrivalDate = parsed.flight.arrivalDate;
                    }

                    const overallEnd = parsed.endDate || parsed.flight?.arrivalDate;
                    if (overallEnd && overallEnd !== "미확인")
                        updates.endDate = overallEnd;

                    if (parsed.flight?.departureTime)
                        updates.departureTime = parsed.flight.departureTime;
                    if (parsed.flight?.arrivalTime)
                        updates.arrivalTime = parsed.flight.arrivalTime;
                    if (parsed.flight?.returnDepartureTime)
                        updates.returnDepartureTime = parsed.flight.returnDepartureTime;
                    if (parsed.flight?.returnArrivalTime)
                        updates.returnArrivalTime = parsed.flight.returnArrivalTime;

                    if (parsed.flight?.airline) updates.airline = parsed.flight.airline;
                    if (parsed.flight?.flightNumber)
                        updates.flightNumber = parsed.flight.flightNumber;
                    if (parsed.flight?.returnAirline)
                        updates.returnAirline = parsed.flight.returnAirline;
                    if (parsed.flight?.returnFlightNumber)
                        updates.returnFlightNumber = parsed.flight.returnFlightNumber;
                } else if (parsed.type === "hotel" || parsed.type === "accommodation") {
                    const hotelName = parsed.hotelName || parsed.name;
                    if (hotelName && hotelName !== "미확인") {
                        const newAcc = {
                            name: hotelName,
                            address: parsed.address || "",
                            startDate: parsed.checkInDate || parsed.startDate || "",
                            endDate: parsed.checkOutDate || parsed.endDate || "",
                            coordinates: parsed.coordinates,
                        };
                        const existing = plannerData.accommodations || [];
                        if (!existing.some((a: any) => a.name === hotelName)) {
                            updates.accommodations = [...existing, newAcc];
                        }
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setPlannerData((prev) => ({ ...prev, ...updates }));
                showToast("티켓에서 정보를 추출하여 반영했습니다.", "success");
            }
        } catch (error) {
            console.error("OCR Analysis failed:", error);
            showToast("문서 분석 중 오류가 발생했습니다.", "error");
        } finally {
            setIsOcrLoading(false);
        }
    };

    const handleTicketOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleFileAnalysis([file]);
    };

    const handleMultipleOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFileAnalysis(files);
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
        handleFileAnalysis, handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile
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
