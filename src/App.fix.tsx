import React, { useState, useEffect, useRef } from "react";
import "./styles/design-system.css";
import { okinawaTrip } from "./data";
import { LocationPoint, TripPlan, PlannerData } from "./types";
import {
    extractTextFromFile,
    parseFlightTicket,
    parsePublicTransportTicket,
    parseUniversalDocument,
    fileToBase64,
} from "./utils/ocr";
import { parseWithAI } from "./utils/ai-parser";
import {
    LayoutDashboard,
    Calendar,
    Map as MapIcon,
    FileText,
    Phone,
    RefreshCw,
    CheckCircle,
    Circle,
    CloudSun,
    Wind,
    Droplets,
    X,
    Moon,
    Sun,
    Star,
    Lock,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Upload,
    UploadCloud,
    Trash2,
    MessageCircle,
    Volume2,
    MapPin,
    Sparkles,
    ArrowRight,
    Loader2,
    User,
    LogIn,
    UserPlus,
    LogOut,
    Users,
    Heart,
    Compass,
    Utensils,
    Camera,
    Clock,
    Car,
    Bus,
    ExternalLink,
    Hotel,
    Edit3,
    Save,
    Search,
    Plane,
    Globe,
    Plus,
    Minus,
    AlertCircle,
    Info,
    Check,
    Calendar as CalendarIcon,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

import MapComponent from "./components/MapComponent";
import { PhrasebookTab } from './components/Phrasebook/PhrasebookTab';
import { ExchangeTab } from './components/Exchange/ExchangeTab';
import { DocumentsTab } from './components/Documents/DocumentsTab';
import { ScheduleTab } from './components/Schedule/ScheduleTab';
import { SummaryTab } from './components/Summary/SummaryTab';
import { Ocr_labTab } from './components/Ocr_lab/Ocr_labTab';
import { Toast, ToastMessage } from "./components/Common/Toast";
import { ConfirmModal } from "./components/Common/ConfirmModal";
import { usePlanner } from "./contexts/PlannerContext";

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: any; errorInfo: any }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: "white", background: "#1e293b", minHeight: "100vh" }}>
                    <h3>Something went wrong.</h3>
                    <pre style={{ fontSize: 10 }}>{this.state.error?.toString()}</pre>
                    <button onClick={() => window.location.reload()}>Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const App: React.FC = () => {
    const {
        view, setView, activeTab, setActiveTab, overviewMode, setOverviewMode,
        scheduleDay, setScheduleDay, scheduleViewMode, setScheduleViewMode,
        theme, toggleTheme, trips, setTrips, trip, setTrip,
        allPoints, setAllPoints, completedItems, setCompletedItems,
        selectedPoint, setSelectedPoint, weatherIndex, setWeatherIndex,
        selectedWeatherLocation, setSelectedWeatherLocation,
        activePlannerDetail, setActivePlannerDetail, isPlanning, setIsPlanning,
        plannerStep, setPlannerStep, plannerData, setPlannerData,
        selectedPlaceIds, setSelectedPlaceIds, dynamicAttractions, setDynamicAttractions,
        userReviews, setUserReviews, userLogs, setUserLogs, customFiles, setCustomFiles,
        fetchWeatherData, getWeatherForDay, getFormattedDate, calculateProgress,
        isDraggingRef, getPoints
    } = usePlanner();

    // DEBUG: Global Error Handler & Render Log
    useEffect(() => {
        const errorHandler = (event: ErrorEvent) =>
            console.error("🔥🔥🔥 GLOBAL ERROR:", event.error);
        const promiseHandler = (event: PromiseRejectionEvent) =>
            console.error("🔥🔥🔥 UNHANDLED PROMISE:", event.reason);
        window.addEventListener("error", errorHandler);
        window.addEventListener("unhandledrejection", promiseHandler);

        // Prevent browser from opening dropped files globally
        const preventDefault = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("dragover", preventDefault);
        window.addEventListener("drop", preventDefault);

        return () => {
            window.removeEventListener("error", errorHandler);
            window.removeEventListener("unhandledrejection", promiseHandler);
            window.removeEventListener("dragover", preventDefault);
            window.removeEventListener("drop", preventDefault);
        };
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.data) {
                    const hasData =
                        (parsed.data.destination || "").trim() !== "" ||
                        (parsed.data.title || "").trim() !== "";
                    if (!hasData && parsed.step === 0) {
                        localStorage.removeItem("trip_draft_v1");
                        console.log("🧹 Cleaned up empty draft.");
                    }
                }
            }
        } catch (e) {
            console.error("Draft cleanup error:", e);
        }
    }, []);

    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentUser, setCurrentUser] = useState<{
        name: string;
        homeAddress?: string;
    } | null>({
        name: "Tester",
        homeAddress: "경기도 평택시 서재로 36 자이아파트",
    });

    const [isEditingPoint, setIsEditingPoint] = useState(false);

    // Toast Notification State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [customAiPrompt, setCustomAiPrompt] = useState("");

    const showToast = (
        message: string,
        type: "success" | "error" | "info" = "info",
    ) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    const closeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);

    // Delete Confirmation Modal State
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [analyzedFiles, setAnalyzedFiles] = useState<
        {
            name: string;
            text: string;
            status: "loading" | "done" | "error";
            parsedData?: any;
        }[]
    >([]);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
