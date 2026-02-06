import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TripPlan, LocationPoint, PlannerData } from '../types';
import { okinawaTrip } from '../data';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const [weatherIndex, setWeatherIndex] = useState(0);
    const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<LocationPoint | null>(null);
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

    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>([]);
    const [isSearchingAttractions, setIsSearchingAttractions] = useState(false);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
    const [hotelAddStatus, setHotelAddStatus] = useState<"IDLE" | "VALIDATING" | "SUCCESS" | "ERROR">("IDLE");
    const [validatedHotel, setValidatedHotel] = useState<any | null>(null);
    const [isValidatingPlace, setIsValidatingPlace] = useState(false);
    const [isPlaceAddedSuccess, setIsPlaceAddedSuccess] = useState(false);
    const [isPlaceAddedError, setIsPlaceAddedError] = useState(false);

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

    // Weather Logic
    const [weatherData, setWeatherData] = useState<any>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    const fetchWeatherData = async (location: string, coordinates?: { lat: number; lng: number }) => {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey || apiKey === "YOUR_WEATHERAPI_KEY_HERE") return null;

        const cacheKey = `weather_${location}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < 3600000) {
                    setWeatherData(data);
                    return data;
                }
            } catch (e) { }
        }

        setIsLoadingWeather(true);
        setWeatherError(null);

        try {
            const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : location;
            const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=3&lang=ko`);
            if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
            setWeatherData(data);
            return data;
        } catch (error) {
            setWeatherError("날씨 정보를 불러올 수 없습니다.");
            return null;
        } finally {
            setIsLoadingWeather(false);
        }
    };

    const getKoreanLocationName = (apiName: string, originalName?: string) => {
        if (originalName) return originalName;
        const names: Record<string, string> = {
            'Naha': '나하', 'Okinawa': '오키나와', 'Kunigami': '쿠니가미',
            'Nago': '나고', 'Itoman': '이토만', 'Tomigusuku': '토미구스쿠'
        };
        return names[apiName] || apiName;
    };

    const getWeatherForDay = (dayIndex: number) => {
        const originalLocationName = selectedWeatherLocation?.name || trip?.metadata?.destination;
        const location = originalLocationName || "오키나와 (나하)";

        if (weatherData?.forecast?.forecastday?.[dayIndex]) {
            const dayData = weatherData.forecast.forecastday[dayIndex];
            const current = dayIndex === 0 ? weatherData.current : dayData.day;
            const koreanLocationName = getKoreanLocationName(weatherData.location?.name || "", originalLocationName);

            return {
                location: koreanLocationName,
                temp: `${Math.round(current.temp_c || current.avgtemp_c)}°`,
                condition: current.condition?.text || "정보 없음",
                wind: `${Math.round((current.wind_kph || current.maxwind_kph) / 3.6)} m/s`,
                humidity: `${current.humidity || current.avghumidity}%`,
            };
        }
        return {
            location,
            temp: "22°", condition: "맑음", wind: "3 m/s", humidity: "60%"
        };
    };

    const getFormattedDate = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
        return `${month}월 ${date}일 ${days[now.getDay()]}`;
    };

    // Currency
    const [jpyAmount, setJpyAmount] = useState("1000");
    const [krwAmount, setKrwAmount] = useState("9000");
    const [rate, setRate] = useState(9.0);

    // Global UI States
    const [toasts, setToasts] = useState<any[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

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

    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true for demo
    const [currentUser, setCurrentUser] = useState({ name: "사용자", homeAddress: "서울" });

    // Calendar States
    const [calendarDate, setCalendarDate] = useState(new Date());

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

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const convert = (val: string, type: "jpy" | "krw") => {
        const num = parseFloat(val.replace(/,/g, ""));
        if (isNaN(num)) {
            if (type === "jpy") {
                setJpyAmount(val);
                setKrwAmount("0");
            } else {
                setKrwAmount(val);
                setJpyAmount("0");
            }
            return;
        }
        if (type === "jpy") {
            setJpyAmount(val);
            setKrwAmount(Math.round(num * rate).toLocaleString());
        } else {
            setKrwAmount(val);
            setJpyAmount(Math.round(num / rate).toString());
        }
    };

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

    const fetchAttractionsWithAI = async (destination: string) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
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
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
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
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
                const flattenedPoints: LocationPoint[] = [];
                planData.days?.forEach((dayObj: any) => {
                    dayObj.points?.forEach((p: any) => {
                        flattenedPoints.push({
                            ...p,
                            id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                            day: dayObj.day || 1,
                            coordinates: { lat: Number(p.coordinates?.lat), lng: Number(p.coordinates?.lng) }
                        });
                    });
                });
                const finalPlan: TripPlan = {
                    ...okinawaTrip,
                    id: `trip-${Date.now()}`,
                    metadata: {
                        ...okinawaTrip.metadata,
                        destination: plannerData.destination,
                        title: plannerData.title || `${plannerData.destination} 여행`,
                        startDate: plannerData.startDate,
                        endDate: plannerData.endDate,
                        accommodations: plannerData.accommodations,
                    },
                    points: flattenedPoints,
                };
                setTrip(finalPlan);
                setPlannerStep(7);
            }
        } catch (error) {
            setPlannerStep(5);
        }
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
        fetchAttractionsWithAI, fetchHotelsWithAI, validateAndAddPlace, validateHotel, generatePlanWithAI, closeToast
    };

    return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
};

export const usePlanner = () => {
    const context = useContext(PlannerContext);
    if (context === undefined) {
        throw new Error('usePlanner must be used within a PlannerProvider');
    }
    return context;
};
