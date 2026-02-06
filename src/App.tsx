import React, { useState, useEffect, useRef } from "react";
import "./styles/design-system.css";
import { okinawaTrip } from "./data";
import { LocationPoint, TripPlan, PlannerData } from "./types";
import {
  extractTextFromFile,
  parseUniversalDocument,
  fileToBase64,
} from "./utils/ocr";
import { parseWithAI } from "./utils/ai-parser";
import { usePlanner } from "./contexts/PlannerContext";
import { Toast } from "./components/Common/Toast";
import { ConfirmModal } from "./components/Common/ConfirmModal";
import { ScheduleTab } from "./components/Schedule/ScheduleTab";
import { SummaryTab } from "./components/Summary/SummaryTab";
import { DocumentsTab } from "./components/Documents/DocumentsTab";
import { ExchangeTab } from "./components/Exchange/ExchangeTab";
import { PhrasebookTab } from "./components/Phrasebook/PhrasebookTab";
import { Ocr_labTab } from "./components/Ocr_lab/Ocr_labTab";
// GoogleGenerativeAI moved to context
import {
  Loader2, FileText, Sparkles, LogOut, Edit3, X, MapPin, Trash2, LogIn, User, UserPlus,
  LayoutDashboard, Calendar, RefreshCw, MessageCircle, Sun, Moon, MapIcon, Phone,
  Upload, ChevronUp, ChevronDown, Volume2, Star, Lock, ArrowRight, ChevronLeft,
  ChevronRight, Minus, Plus, Clock, Compass, Wind, Car, Bus, Plane, Save, Camera,
  Utensils, CheckCircle, AlertCircle, Hotel, Search, ExternalLink, Heart, Users,
  Calendar as CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface SpeechItem {
  id: string;
  kor: string;
  jp: string;
  pron: string;
  category: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const App: React.FC = () => {
  const {
    view, setView, activeTab, setActiveTab,
    theme, toggleTheme, trips, setTrips, trip, setTrip,
    allPoints, setAllPoints,
    selectedPoint, setSelectedPoint,
    isPlanning, setIsPlanning,
    plannerStep, setPlannerStep, plannerData, setPlannerData,
    selectedPlaceIds, setSelectedPlaceIds, dynamicAttractions, setDynamicAttractions,
    isSearchingAttractions, fetchAttractionsWithAI,
    attractionCategoryFilter, setAttractionCategoryFilter,
    isValidatingPlace, validateAndAddPlace,
    isPlaceAddedError, isPlaceAddedSuccess,
    isSearchingHotels, fetchHotelsWithAI,
    validatedHotel, setValidatedHotel, validateHotel,
    recommendedHotels, setRecommendedHotels,
    customFiles, setCustomFiles,
    isOcrLoading, setIsOcrLoading, analyzedFiles, setAnalyzedFiles, ticketFileInputRef,
    customAiPrompt, setCustomAiPrompt,
    isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser,
    toasts, showToast, closeToast, deleteConfirmModal, setDeleteConfirmModal,
    isReviewModalOpen, setIsReviewModalOpen,
    isReEditModalOpen, setIsReEditModalOpen, tripToEdit, setTripToEdit,
    isEditingPoint, setIsEditingPoint,
    hotelAddStatus, setHotelAddStatus,
    convert, speak,
    activePlannerDetail, setActivePlannerDetail,
    isDragging, setIsDragging,
    generatePlanWithAI,
    userReviews, userLogs, updateReview, updateLog,
    calendarDate, prevMonth, nextMonth
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


  const savePointEdit = (id: string, updates: Partial<LocationPoint>) => {
    const updatedPoints = allPoints.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    setAllPoints(updatedPoints);
    if (selectedPoint && selectedPoint.id === id) {
      setSelectedPoint({ ...selectedPoint, ...updates });
    }
    setIsEditingPoint(false);
    showToast("정보가 수정되었습니다.");
  };

  const handleFileAnalysis = async (files: File[]) => {
    if (files.length === 0) return;
    setIsOcrLoading(true);
    try {
      const updates: Partial<PlannerData> = {};
      const newAnalyzedFiles = [...analyzedFiles];

      // Helper for Airport Codes
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Duplicate Check
        if (newAnalyzedFiles.some((f) => f.name === file.name)) {
          showToast(`이미 추가된 파일입니다: ${file.name}`);
          continue;
        }

        // Add to analyzed list with loading status
        const fileIdx = newAnalyzedFiles.length;
        newAnalyzedFiles.push({ name: file.name, text: "", status: "loading" });
        setAnalyzedFiles([...newAnalyzedFiles]);

        const mimeType = file.type || "image/jpeg";
        const isSupportedMultimodal =
          mimeType.startsWith("image/") || mimeType === "application/pdf";

        let text = "";
        let base64 = "";

        // Only extract text locally if it's NOT a multimodal-supported file (like HTML)
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
          // Only fallback to legacy if specifically text-based and AI failed completely
          if (!isSupportedMultimodal && text) {
            parsed = parseUniversalDocument(text);
          } else {
            // Mark as error
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
          await sleep(1000); // Reduced throttle (4.5s -> 1s) for better UX
        }

        // Update analyzed list with results
        newAnalyzedFiles[fileIdx] = {
          name: file.name,
          text: text || "(Vision Mode)",
          parsedData: parsed,
          status: "done",
        };
        setAnalyzedFiles([...newAnalyzedFiles]);

        // Intelligent update mapping
        if (parsed.type === "flight") {
          const arrival = parsed.flight?.arrivalAirport || parsed.arrival;
          if (arrival && arrival !== "도착지 미확인")
            updates.destination = arrival;

          // Explicit Mapping for Step 3
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

          // Strict mapping: Only use explicit flight dates if available
          if (parsed.flight?.departureDate) {
            updates.startDate = parsed.flight.departureDate;
          } else if (parsed.startDate && parsed.startDate !== "미확인") {
            // Fallback only if flight date is missing
            updates.startDate = parsed.startDate;
          }

          if (parsed.flight?.arrivalDate) {
            updates.arrivalDate = parsed.flight.arrivalDate; // Store specific leg arrival
          }

          // For overall trip end date, usually it's the return flight, but for one-way, it might be arrival
          const overallEnd = parsed.endDate || parsed.flight?.arrivalDate;
          if (overallEnd && overallEnd !== "미확인")
            updates.endDate = overallEnd;

          if (parsed.flight?.departureTime)
            updates.departureTime = parsed.flight.departureTime;
          if (parsed.flight?.arrivalTime)
            updates.arrivalTime = parsed.flight.arrivalTime;
          if (parsed.flight?.airline) updates.airline = parsed.flight.airline;
          if (parsed.flight?.flightNumber)
            updates.flightNumber = parsed.flight.flightNumber;
          if (parsed.flight?.arrivalDate)
            updates.arrivalDate = parsed.flight.arrivalDate;
        } else if (parsed.type === "accommodation") {
          const hotel = parsed.accommodation?.hotelName || parsed.hotelName;
          if (!updates.destination && hotel) updates.destination = hotel;

          const checkIn = parsed.accommodation?.checkInDate || parsed.checkIn;
          const checkOut =
            parsed.accommodation?.checkOutDate || parsed.checkOut;

          if (checkIn && checkIn !== "미확인" && checkIn !== null)
            updates.startDate = checkIn;
          if (checkOut && checkOut !== "미확인" && checkOut !== null)
            updates.endDate = checkOut;

          if (parsed.accommodation?.checkInTime)
            updates.arrivalTime = parsed.accommodation.checkInTime;

          // Add to accommodations list (don't overwrite, append if not exists)
          if (hotel) {
            setPlannerData((prev) => {
              const exists = prev.accommodations.some((a) => a.name === hotel);
              if (!exists) {
                return {
                  ...prev,
                  accommodations: [
                    ...prev.accommodations,
                    {
                      name: hotel,
                      startDate: checkIn || prev.startDate || "",
                      endDate: checkOut || prev.endDate || "",
                      coordinates: parsed.accommodation?.coordinates,
                    },
                  ],
                };
              }
              return prev;
            });
          }
        } else if (parsed.type === "ship") {
          const dep = parsed.ship?.departurePort;
          const arr = parsed.ship?.arrivalPort;
          if (dep) updates.departurePoint = dep;
          if (arr) updates.entryPoint = arr;
          if (parsed.ship?.departureCoordinates)
            updates.departureCoordinates = parsed.ship.departureCoordinates;
          if (parsed.ship?.arrivalCoordinates)
            updates.entryCoordinates = parsed.ship.arrivalCoordinates;

          updates.travelMode = "ship";

          if (parsed.ship?.departureDate)
            updates.startDate = parsed.ship.departureDate;
          if (parsed.ship?.arrivalDate)
            updates.arrivalDate = parsed.ship.arrivalDate;
          if (parsed.ship?.departureTime)
            updates.departureTime = parsed.ship.departureTime;
          if (parsed.ship?.arrivalTime)
            updates.arrivalTime = parsed.ship.arrivalTime;
          if (parsed.ship?.shipName) updates.shipName = parsed.ship.shipName;
        } else if (parsed.type === "tour") {
          if (parsed.tour?.tourName) updates.tourName = parsed.tour.tourName;
          if (parsed.tour?.date) updates.startDate = parsed.tour.date;
        } else {
          // Unified date info
          const sDate =
            parsed.startDate ||
            parsed.accommodation?.checkInDate ||
            parsed.flight?.departureDate;
          const eDate =
            parsed.endDate ||
            parsed.accommodation?.checkOutDate ||
            parsed.flight?.arrivalDate;

          if (sDate && sDate !== "미확인" && sDate !== null)
            updates.startDate = sDate;
          if (eDate && eDate !== "미확인" && eDate !== null)
            updates.endDate = eDate;
        }
      }

      // Post-processing for Flight Round Trip Logic

      // Post-processing for Flight Round Trip Logic
      const flightResults = newAnalyzedFiles
        .filter((f) => f.parsedData?.type === "flight")
        .map((f) => f.parsedData);
      if (flightResults.length > 0) {
        // Sort by date strings to find explicit order
        flightResults.sort((a, b) => {
          const da = a.flight?.departureDate || a.startDate || "";
          const db = b.flight?.departureDate || b.startDate || "";
          return da.localeCompare(db);
        });

        const dep = flightResults[0];
        const depUpdates: Partial<PlannerData> = {};
        // ... extract departure info (re-using existing logic but scoped) ...
        if (dep.flight?.departureAirport)
          depUpdates.departurePoint = resolveAirportName(
            dep.flight.departureAirport,
          );
        if (dep.flight?.arrivalAirport)
          depUpdates.entryPoint = resolveAirportName(dep.flight.arrivalAirport);
        if (dep.flight?.departureDate)
          depUpdates.startDate = dep.flight.departureDate;
        if (dep.flight?.departureTime)
          depUpdates.departureTime = dep.flight.departureTime;
        if (dep.flight?.arrivalTime)
          depUpdates.arrivalTime = dep.flight.arrivalTime;
        if (dep.flight?.airline) depUpdates.airline = dep.flight.airline;
        if (dep.flight?.flightNumber)
          depUpdates.flightNumber = dep.flight.flightNumber;
        depUpdates.travelMode = "plane";
        Object.assign(updates, depUpdates);

        // If more than one flight, use the last one as Return
        if (flightResults.length >= 2) {
          const ret = flightResults[flightResults.length - 1]; // Last flight
          const retUpdates: Partial<PlannerData> = {};
          if (ret.flight?.airline)
            retUpdates.returnAirline = ret.flight.airline;
          if (ret.flight?.flightNumber)
            retUpdates.returnFlightNumber = ret.flight.flightNumber;
          if (ret.flight?.departureDate)
            retUpdates.endDate = ret.flight.departureDate; // Return flight date is EndDate
          if (ret.flight?.departureTime)
            retUpdates.returnDepartureTime = ret.flight.departureTime;

          // Return Flight Airports
          if (ret.flight?.departureAirport)
            retUpdates.returnDeparturePoint = resolveAirportName(
              ret.flight.departureAirport,
            );
          if (ret.flight?.arrivalAirport)
            retUpdates.returnArrivalPoint = resolveAirportName(
              ret.flight.arrivalAirport,
            );

          Object.assign(updates, retUpdates);
        } else {
          // Single flight case (already handled mostly by loop above, but ensuring single update consistency)
          // If single flight has arrivalDate Different from startDate, it's NOT a return flight info, just arrival of leg 1.
          // But if parsed.endDate exists, use it.
        }
      }

      setPlannerData((prev) => {
        const newUpdates = { ...updates };

        // Helper to normalize date strings (YYYY-MM-DD)
        const normalizeDate = (d: string | undefined) => {
          if (!d) return "";
          // Replace dots and slashes with hyphens, remove whitespace
          return d.replace(/[\.\/]/g, "-").trim();
        };

        const newStart = normalizeDate(newUpdates.startDate);
        const prevStart = normalizeDate(prev.startDate);
        const newEnd = normalizeDate(newUpdates.endDate);
        const prevEnd = normalizeDate(prev.endDate);

        // Check for Date Mismatch if dates are being updated
        // Only prompt if there is a REAL difference after normalization
        const isStartMismatch = newStart && prevStart && newStart !== prevStart;
        const isEndMismatch = newEnd && prevEnd && newEnd !== prevEnd;

        if (isStartMismatch || isEndMismatch) {
          const userConfirmed = window.confirm(
            `티켓의 날짜(${newUpdates.startDate || prev.startDate} ~ ${newUpdates.endDate || prev.endDate})가 현재 설정된 여행 날짜(${prev.startDate} ~ ${prev.endDate})와 다릅니다.\n티켓 날짜로 변경하시겠습니까?`,
          );

          if (!userConfirmed) {
            delete newUpdates.startDate;
            delete newUpdates.endDate;
          }
        }
        return { ...prev, ...newUpdates };
      });
    } finally {
      setIsOcrLoading(false);
    }
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
    showToast("서류가 삭제되었습니다.");
  };

  const handleTicketOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileAnalysis([file]);
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // AI Logic - MOVED TO CONTEXT
  // isGenerating removed

  // No redundant states here

  // Cleanup old attraction cache (older than 7 days)
  useEffect(() => {
    const CACHE_KEY = "attraction_recommendation_cache";
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      try {
        const cache = JSON.parse(cachedStr);
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        let hasChanges = false;

        Object.keys(cache).forEach((key) => {
          if (now - cache[key].timestamp > sevenDaysInMs) {
            delete cache[key];
            hasChanges = true;
          }
        });

        if (hasChanges) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
          console.log("Cleaned up expired attraction cache items.");
        }
      } catch (e) {
        console.error("Cache cleanup error:", e);
      }
    }
  }, []);

  // Close bottom sheet when switching tabs
  const bottomSheetTop = activeTab === "summary" ? "380px" : "280px";
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isValidatingHotel = hotelAddStatus === "VALIDATING";

  const tabProps = {
    SummaryTab: {},
    ScheduleTab: { ErrorBoundary },
    DocumentsTab: { handleFileUpload, deleteFile },
    ExchangeTab: { convert },
    PhrasebookTab: { speak },
    Ocr_labTab: {
      analyzedFiles, handleMultipleOcr, ticketFileInputRef,
      isOcrLoading, handleTicketOcr, handleFileUpload, deleteFile
    }
  };

  return (
    <>
      <div className="app">
        {/* Global Loading Overlay for OCR */}
        <AnimatePresence>
          {isOcrLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(8px)",
                zIndex: 10000000,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <Loader2 size={80} className="spin" color="var(--primary)" />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={30} color="var(--primary)" />
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "white",
                    marginBottom: "8px",
                  }}
                >
                  AI 문서 분석 중
                </h3>
                <p style={{ opacity: 0.7, color: "white", fontSize: "15px" }}>
                  서류에서 정보를 추출하고 있습니다. 잠시만 기다려 주세요.
                </p>
                <div
                  style={{
                    marginTop: 15,
                    fontSize: "12px",
                    color: "var(--primary)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span className="pulse">●</span> 대기 중인 요청 처리 중 (API
                  Throttling 적용됨)
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AnimatePresence removed to fix black screen crash */}
        <>
          {view === "landing" && !isPlanning && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "30px",
                background:
                  "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
                zIndex: 999999,
                position: "relative",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "30px",
                    overflow: "hidden",
                    marginBottom: "24px",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="빠니보살"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <h1
                  style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    marginBottom: "4px",
                    letterSpacing: "-2px",
                    color: "#ffffff",
                    textShadow: "0 0 20px rgba(0,212,255,0.4)",
                  }}
                >
                  빠니보살
                </h1>
                <p
                  style={{
                    color: "var(--primary)",
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "40px",
                    letterSpacing: "1px",
                  }}
                >
                  AI로 자유여행
                </p>

                {!isLoggedIn ? (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <button
                      onClick={() => setView("login")}
                      className="primary-button"
                      style={{ width: "100%" }}
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => setView("signup")}
                      style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: "16px",
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      회원가입
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {/* List Style Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        width: "100%",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <h2
                          style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            color: "white",
                          }}
                        >
                          나의 여행 기록
                        </h2>
                        <p
                          style={{ fontSize: "12px", color: "var(--text-dim)" }}
                        >
                          {currentUser?.name}님의 여행들
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => {
                            // Always start fresh new trip
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
                            setSelectedPlaceIds([]);
                            setDynamicAttractions([]);
                          }}
                          style={{
                            background: "var(--primary)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "10px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "black",
                            fontWeight: "bold",
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0,212,255,0.3)",
                          }}
                        >
                          <Sparkles size={16} /> 새 여행
                        </button>
                        <button
                          onClick={() => {
                            setIsLoggedIn(false);
                            setCurrentUser(null);
                          }}
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            borderRadius: "12px",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          <LogOut size={18} />
                        </button>
                        <button
                          onClick={() =>
                            document.getElementById("multi-ocr-input")?.click()
                          }
                          style={{
                            background: "rgba(52, 211, 153, 0.1)",
                            border: "1px solid rgba(52, 211, 153, 0.3)",
                            color: "#34d399",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FileText size={14} /> 실규모 OCR 실습
                        </button>
                        <input
                          id="multi-ocr-input"
                          type="file"
                          multiple
                          style={{ display: "none" }}
                          accept="image/*,.html,.htm,.pdf"
                          onChange={handleMultipleOcr}
                        />
                      </div>
                    </div>
                    {/* Trip List with Grouping */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                        overflowY: "auto",
                        paddingRight: "4px",
                        flex: 1,
                        textAlign: "left",
                      }}
                    >
                      {/* Draft Section */}
                      {localStorage.getItem("trip_draft_v1") &&
                        (() => {
                          const rawDraft = JSON.parse(
                            localStorage.getItem("trip_draft_v1")!,
                          );
                          // Handle legacy format (where draft was just plannerData)
                          const draft = rawDraft.data
                            ? rawDraft
                            : { data: rawDraft, step: 0 };
                          const dest = draft.data.destination || "여행지 미정";
                          const step = draft.step || 0;
                          return (
                            <div>
                              <div
                                style={{
                                  padding: "0 8px 12px",
                                  fontSize: "12px",
                                  fontWeight: 900,
                                  color: "#f59e0b",
                                  letterSpacing: "2px",
                                  opacity: 0.8,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    height: 1,
                                    flex: 1,
                                    background:
                                      "linear-gradient(to right, rgba(245,158,11,0.5), transparent)",
                                  }}
                                />
                                작성 중인 여행
                                <div
                                  style={{
                                    height: 1,
                                    flex: 1,
                                    background:
                                      "linear-gradient(to left, rgba(245,158,11,0.5), transparent)",
                                  }}
                                />
                              </div>
                              <motion.div
                                whileTap={{ scale: 0.98 }}
                                className="glass-card"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 16,
                                  padding: "16px",
                                  background: "rgba(245,158,11,0.1)",
                                  border: "1px solid rgba(245,158,11,0.3)",
                                  cursor: "pointer",
                                  position: "relative",
                                }}
                                onClick={() => {
                                  // Resume Draft
                                  setIsPlanning(true);
                                  setPlannerStep(step);
                                  setPlannerData(draft.data);
                                  if (draft.selectedIds)
                                    setSelectedPlaceIds(draft.selectedIds);
                                  if (draft.attractions)
                                    setDynamicAttractions(draft.attractions);
                                }}
                              >
                                <div
                                  style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: "12px",
                                    background: "rgba(245,158,11,0.2)",
                                    border: "1px solid rgba(245,158,11,0.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#f59e0b",
                                  }}
                                >
                                  <Edit3 size={24} />
                                </div>
                                <div style={{ flex: 1, textAlign: "left" }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "16px",
                                      color: "white",
                                    }}
                                  >
                                    {dest}{" "}
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        opacity: 0.7,
                                      }}
                                    >
                                      작성 중...
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "var(--text-dim)",
                                      marginTop: 2,
                                    }}
                                  >
                                    Step {step + 1} 진행 중
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmModal({
                                      isOpen: true,
                                      title: "작성 중인 여행 삭제",
                                      message:
                                        "작성 중인 내용을 삭제하시겠습니까?",
                                      onConfirm: () => {
                                        localStorage.removeItem(
                                          "trip_draft_v1",
                                        );
                                        showToast(
                                          "작성 중인 내용이 삭제되었습니다.",
                                        );

                                        setDeleteConfirmModal({
                                          isOpen: false,
                                          title: "",
                                          message: "",
                                          onConfirm: () => { },
                                        });
                                      },
                                    });
                                  }}
                                  style={{
                                    padding: 8,
                                    background: "rgba(0,0,0,0.3)",
                                    borderRadius: "50%",
                                    border: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                  }}
                                >
                                  <X size={16} />
                                </button>
                              </motion.div>
                            </div>
                          );
                        })()}
                      {(() => {
                        const groups: Record<
                          string,
                          { title: string; items: any[] }
                        > = {};
                        const groupKeys: string[] = [];

                        trips.forEach((t: any) => {
                          const period =
                            t.period ||
                            (t.metadata && t.metadata.period) ||
                            "2000.01.01";
                          const year = period.substring(0, 4);
                          const key = t.groupId || `year-${year}`;
                          const title = t.groupTitle || `${year}년`;

                          if (!groups[key]) {
                            groups[key] = { title, items: [] };
                            groupKeys.push(key);
                          }
                          groups[key].items.push(t);
                        });

                        // Remove duplicate keys and sort
                        const uniqueKeys = Array.from(new Set(groupKeys)).sort(
                          (a, b) => b.localeCompare(a),
                        );

                        return uniqueKeys.map((key) => (
                          <div key={key}>
                            <div
                              style={{
                                padding: "0 8px 12px",
                                fontSize: "12px",
                                fontWeight: 900,
                                color: "var(--primary)",
                                letterSpacing: "2px",
                                opacity: 0.8,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  height: 1,
                                  flex: 1,
                                  background:
                                    "linear-gradient(to right, rgba(0,212,255,0.5), transparent)",
                                }}
                              />
                              {groups[key].title}
                              <div
                                style={{
                                  height: 1,
                                  flex: 1,
                                  background:
                                    "linear-gradient(to left, rgba(0,212,255,0.5), transparent)",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              {groups[key].items.map((tripItem: any) => {
                                const displayTitle =
                                  tripItem.title ||
                                  (tripItem.metadata &&
                                    tripItem.metadata.title) ||
                                  "제목 없는 여행";
                                const displayPeriod =
                                  tripItem.period ||
                                  (tripItem.metadata &&
                                    tripItem.metadata.period) ||
                                  "날짜 미정";
                                const displayColor =
                                  tripItem.color ||
                                  (tripItem.metadata &&
                                    tripItem.metadata.primaryColor) ||
                                  "#00d4ff";

                                return (
                                  <div
                                    key={tripItem.id}
                                    onClick={() => {
                                      // Clean landing state and load trip
                                      if (
                                        tripItem.id === "okinawa" ||
                                        tripItem.id === okinawaTrip.id
                                      ) {
                                        setTrip(okinawaTrip);
                                        setView("app");
                                      } else if (
                                        tripItem.points &&
                                        tripItem.points.length > 0
                                      ) {
                                        try {
                                          // Reconstruct with base defaults to ensure no missing fields
                                          const loadedTrip: TripPlan = {
                                            ...okinawaTrip,
                                            ...tripItem,
                                            metadata: {
                                              ...okinawaTrip.metadata,
                                              ...(tripItem.metadata || {}),
                                              destination:
                                                tripItem.destination ||
                                                tripItem.metadata
                                                  ?.destination ||
                                                "Destination",
                                              title:
                                                tripItem.title ||
                                                tripItem.metadata?.title ||
                                                "Untitled Trip",
                                              period:
                                                tripItem.period ||
                                                tripItem.metadata?.period ||
                                                "Dates TBD",
                                            },
                                          };
                                          console.log(
                                            "Loading Trip:",
                                            loadedTrip,
                                          );
                                          setTrip(loadedTrip);
                                          setView("app");
                                        } catch (err) {
                                          console.error(
                                            "Failed to load trip:",
                                            err,
                                          );
                                          alert(
                                            "여행 데이터를 불러오는 중 오류가 발생했습니다.",
                                          );
                                        }
                                      }
                                    }}
                                    className="glass-card"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 16,
                                      padding: "16px",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      cursor: "pointer",
                                      transition: "transform 0.1s",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "12px",
                                        background: `${displayColor}20`,
                                        border: `1px solid ${displayColor}50`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: displayColor,
                                      }}
                                    >
                                      <MapPin size={24} />
                                    </div>
                                    <div style={{ flex: 1, textAlign: "left" }}>
                                      <div
                                        style={{
                                          fontWeight: 800,
                                          fontSize: "16px",
                                          color: "white",
                                        }}
                                      >
                                        {displayTitle}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "13px",
                                          color: "var(--text-dim)",
                                          marginTop: 2,
                                        }}
                                      >
                                        {displayPeriod}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                      }}
                                    >
                                      <div style={{ textAlign: "right" }}>
                                        <div
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: displayColor,
                                          }}
                                        >
                                          {tripItem.progress}%
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "10px",
                                            color: "var(--text-dim)",
                                          }}
                                        >
                                          달성도
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log(
                                            "Re-edit button clicked!",
                                          );
                                          setTripToEdit(tripItem);
                                          setIsReEditModalOpen(true);
                                        }}
                                        style={{
                                          position: "relative",
                                          zIndex: 1000,
                                          padding: "8px",
                                          background: "rgba(255,255,255,0.05)",
                                          borderRadius: "50%",
                                          border: "none",
                                          color: "var(--primary)",
                                          cursor: "pointer",
                                          pointerEvents: "auto",
                                        }}
                                        title="경로 재설정"
                                      >
                                        <Edit3 size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmModal({
                                            isOpen: true,
                                            title: "여행 가이드 삭제",
                                            message:
                                              "이 여행 가이드를 삭제하시겠습니까?",
                                            onConfirm: () => {
                                              const updated = trips.filter(
                                                (t) => t.id !== tripItem.id,
                                              );
                                              setTrips(updated);
                                              localStorage.setItem(
                                                "trips_v1",
                                                JSON.stringify(updated),
                                              );
                                              showToast(
                                                "여행 가이드가 삭제되었습니다.",
                                              );
                                              setDeleteConfirmModal({
                                                isOpen: false,
                                                title: "",
                                                message: "",
                                                onConfirm: () => { },
                                              });
                                            },
                                          });
                                        }}
                                        style={{
                                          padding: "8px",
                                          background: "rgba(255,255,255,0.05)",
                                          borderRadius: "50%",
                                          border: "none",
                                          color: "rgba(255,255,255,0.2)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "login" && (
            <motion.div
              key="login"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "30px",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "30px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <LogIn size={28} /> 로그인
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      opacity: 0.6,
                      fontSize: "13px",
                    }}
                  >
                    이메일
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={18}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.5,
                      }}
                    />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      style={{
                        width: "100%",
                        padding: "16px 16px 16px 48px",
                        borderRadius: "12px",
                        border: "1px solid var(--glass-border)",
                        background: "var(--input-bg)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      opacity: 0.6,
                      fontSize: "13px",
                    }}
                  >
                    비밀번호
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--input-bg)",
                      color: "white",
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    setIsLoggedIn(true);
                    setCurrentUser({
                      name: "사용자",
                      homeAddress: "경기도 평택시 서재로 36 자이아파트",
                    });
                    setView("landing");
                  }}
                  className="primary-button"
                  style={{ marginTop: "10px" }}
                >
                  로그인하기
                </button>
                <button
                  onClick={() => setView("landing")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                  }}
                >
                  뒤로 가기
                </button>
              </div>
            </motion.div>
          )}

          {view === "signup" && (
            <motion.div
              key="signup"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "30px",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "30px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <UserPlus size={28} /> 회원가입
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      opacity: 0.6,
                      fontSize: "13px",
                    }}
                  >
                    이름
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={18}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.5,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="홍길동"
                      style={{
                        width: "100%",
                        padding: "16px 16px 16px 48px",
                        borderRadius: "12px",
                        border: "1px solid var(--glass-border)",
                        background: "var(--input-bg)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      opacity: 0.6,
                      fontSize: "13px",
                    }}
                  >
                    집 주소 (여행 출발지)
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin
                      size={18}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.5,
                      }}
                    />
                    <input
                      id="signup-address"
                      type="text"
                      placeholder="예: 서울특별시 강남구..."
                      style={{
                        width: "100%",
                        padding: "16px 16px 16px 48px",
                        borderRadius: "12px",
                        border: "1px solid var(--glass-border)",
                        background: "var(--input-bg)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nameInput =
                      (
                        document.querySelector(
                          'input[placeholder="홍길동"]',
                        ) as HTMLInputElement
                      )?.value || "신규여행자";
                    const addrInput =
                      (
                        document.getElementById(
                          "signup-address",
                        ) as HTMLInputElement
                      )?.value || "";
                    setIsLoggedIn(true);
                    setCurrentUser({ name: nameInput, homeAddress: addrInput });
                    setView("landing");
                  }}
                  className="primary-button"
                >
                  회원가입 완료
                </button>
                <button
                  onClick={() => setView("landing")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                  }}
                >
                  뒤로 가기
                </button>
              </div>
            </motion.div>
          )}

          {view === "app" && (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <nav className="nav-tabs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "🔄 Main Nav X Clicked. Returning to landing...",
                    );
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    // Force clear any pending map states
                    // Small delay to allow map cleanup
                    setTimeout(() => {
                      console.log(
                        '⏰ Timeout Executed. Calling setView("landing")...',
                      );
                      try {
                        setView("landing");
                        console.log(
                          '✅ setView("landing") called successfully.',
                        );
                      } catch (err) {
                        console.error("❌ Error during setView:", err);
                      }
                    }, 50);
                  }}
                  style={{
                    padding: "8px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    marginRight: "8px",
                  }}
                >
                  <X size={20} />
                </button>
                <button
                  className={`tab ${activeTab === "summary" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setActiveTab("summary");
                  }}
                >
                  <LayoutDashboard size={18} />{" "}
                  <span style={{ marginLeft: "4px" }}>개요</span>
                </button>
                <button
                  className={`tab ${activeTab === "schedule" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setActiveTab("schedule");
                  }}
                >
                  <Calendar size={18} />{" "}
                  <span style={{ marginLeft: "4px" }}>일정</span>
                </button>
                <button
                  className={`tab ${activeTab === "files" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setActiveTab("files");
                  }}
                >
                  <FileText size={18} />{" "}
                  <span style={{ marginLeft: "4px" }}>서류</span>
                </button>
                <button
                  className={`tab ${activeTab === "exchange" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setActiveTab("exchange");
                  }}
                >
                  <RefreshCw size={18} />{" "}
                  <span style={{ marginLeft: "4px" }}>환율</span>
                </button>
                <button
                  className={`tab ${activeTab === "speech" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setActiveTab("speech");
                  }}
                >
                  <MessageCircle size={18} />{" "}
                  <span style={{ marginLeft: "4px" }}>회화</span>
                </button>
                <button
                  className="tab"
                  onClick={toggleTheme}
                  style={{
                    marginLeft: "auto",
                    padding: "6px 10px",
                    minWidth: "auto",
                  }}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </nav>

              <main
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {(() => {
                  return (
                    <>
                      <SummaryTab {...tabProps.SummaryTab} />
                      <ScheduleTab {...tabProps.ScheduleTab} />
                      <DocumentsTab {...tabProps.DocumentsTab} />
                      <ExchangeTab {...tabProps.ExchangeTab} />
                      <PhrasebookTab {...tabProps.PhrasebookTab} />
                      <Ocr_labTab {...tabProps.Ocr_labTab} />
                    </>
                  );
                })()}
              </main>

              {/* Currency Logic Moved to Tab */}
              {/* Removed FAB and Overlay Modal */}

              {/* Bottom Sheet */}
              <AnimatePresence>
                {selectedPoint && (
                  <>
                    <motion.div
                      className="bottom-sheet"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      style={{
                        zIndex: 9999,
                        position: "absolute",
                        top: bottomSheetTop,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: `calc(100% - ${bottomSheetTop})`,
                        maxHeight: "none",
                        borderTopLeftRadius: "24px",
                        borderTopRightRadius: "24px",
                        background: "var(--sheet-bg)",
                        overflowY: "auto",
                        padding: "24px",
                      }}
                    >
                      {/* Close Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "❌ X Button Clicked! Closing details...",
                          );
                          console.log("Current selectedPoint:", selectedPoint);
                          setSelectedPoint(null);
                        }}
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.2)")
                        }
                        onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)")
                        }
                      >
                        <X size={18} color="white" />
                      </button>

                      {/* Handle with hint */}
                      <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div
                          className="handle"
                          onClick={() => setSelectedPoint(null)}
                          style={{ cursor: "pointer" }}
                        />
                        <div
                          style={{ fontSize: 11, color: "#666", marginTop: 4 }}
                        >
                          아래로 밀어서 닫기
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "20px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                          >
                            {selectedPoint.name}
                          </h3>
                          <p
                            style={{ color: "var(--primary)", fontWeight: 600 }}
                          >
                            {selectedPoint.category.toUpperCase()}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditingPoint(!isEditingPoint)}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "none",
                            color: isEditingPoint ? "var(--primary)" : "white",
                            padding: "8px",
                            borderRadius: "10px",
                            cursor: "pointer",
                          }}
                        >
                          <Edit3 size={18} />
                        </button>
                      </div>

                      {isEditingPoint ? (
                        <div
                          className="glass-card"
                          style={{
                            padding: "20px",
                            marginBottom: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "15px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                opacity: 0.6,
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              장소 이름
                            </label>
                            <input
                              id="edit-name"
                              defaultValue={selectedPoint.name}
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                opacity: 0.6,
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              화번호
                            </label>
                            <input
                              id="edit-phone"
                              defaultValue={selectedPoint.phone || ""}
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                opacity: 0.6,
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              맵코드
                            </label>
                            <input
                              id="edit-mapcode"
                              defaultValue={selectedPoint.mapcode || ""}
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "10px",
                            }}
                          >
                            <button
                              onClick={() => setIsEditingPoint(false)}
                              style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "transparent",
                                color: "white",
                                fontWeight: 600,
                              }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    "edit-name",
                                  ) as HTMLInputElement
                                ).value;
                                const phone = (
                                  document.getElementById(
                                    "edit-phone",
                                  ) as HTMLInputElement
                                ).value;
                                const mapcode = (
                                  document.getElementById(
                                    "edit-mapcode",
                                  ) as HTMLInputElement
                                ).value;
                                savePointEdit(selectedPoint.id, {
                                  name,
                                  phone,
                                  mapcode,
                                });
                              }}
                              style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "10px",
                                border: "none",
                                background: "var(--primary)",
                                color: "black",
                                fontWeight: 800,
                              }}
                            >
                              장하기
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginBottom: "24px",
                          }}
                        >
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="primary-button"
                            style={{
                              background: "var(--primary)",
                              color: "black",
                              textDecoration: "none",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "8px",
                              gridColumn: "1 / -1",
                            }}
                          >
                            <MapIcon size={18} /> 길찾기 (구글맵)
                          </a>
                          {selectedPoint.phone && (
                            <a
                              href={`tel:${selectedPoint.phone}`}
                              className="primary-button"
                              style={{
                                background: "var(--input-bg)",
                                color: "var(--text-primary)",
                                textDecoration: "none",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Phone size={18} />    화
                            </a>
                          )}
                          {selectedPoint.mapcode && (
                            <div
                              className="glass-card"
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                margin: 0,
                              }}
                            >
                              <div style={{ fontSize: "10px", opacity: 0.5 }}>
                                맵코드
                              </div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                }}
                              >
                                {selectedPoint.mapcode}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="overview-section">
                        <h4
                          style={{
                            marginBottom: "8px",
                            color: "var(--text-primary)",
                          }}
                        >
                          여행 팁
                        </h4>
                        <ul
                          style={{
                            paddingLeft: "20px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {selectedPoint.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Linked Files Section */}
                      <div
                        className="overview-section"
                        style={{ marginTop: 24 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <h4
                            style={{ color: "var(--text-primary)", margin: 0 }}
                          >
                            📎 관    서류
                          </h4>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.1)",
                              cursor: "pointer",
                              fontSize: 12,
                              color: "var(--primary)",
                            }}
                          >
                            <Upload size={14} /> 추가
                            <input
                              type="file"
                              accept="image/*,.html,.htm"
                              style={{ display: "none" }}
                              onChange={(e) =>
                                handleFileUpload(e, selectedPoint.id)
                              }
                            />
                          </label>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            overflowX: "auto",
                            paddingBottom: 8,
                          }}
                        >
                          {customFiles.filter(
                            (f) => f.linkedTo === selectedPoint.id,
                          ).length === 0 ? (
                            <div
                              style={{
                                padding: "12px",
                                width: "100%",
                                textAlign: "center",
                                fontSize: 13,
                                color: "var(--text-dim)",
                                background: "rgba(0,0,0,0.1)",
                                borderRadius: 12,
                              }}
                            >
                              등록된 서류가 없습니다.
                            </div>
                          ) : (
                            customFiles
                              .filter((f) => f.linkedTo === selectedPoint.id)
                              .map((f) => (
                                <div
                                  key={f.id}
                                  style={{
                                    minWidth: 100,
                                    width: 100,
                                    position: "relative",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "100%",
                                      height: 100,
                                      borderRadius: 12,
                                      overflow: "hidden",
                                      marginBottom: 4,
                                      cursor: "pointer",
                                      border: "1px solid var(--glass-border)",
                                    }}
                                  >
                                    <img
                                      src={f.data}
                                      alt={f.name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-secondary)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {f.name}
                                  </div>
                                  <button
                                    onClick={(e) => deleteFile(f.id, e)}
                                    style={{
                                      position: "absolute",
                                      top: 4,
                                      right: 4,
                                      background: "rgba(0,0,0,0.6)",
                                      borderRadius: "50%",
                                      width: 20,
                                      height: 20,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      border: "none",
                                      color: "white",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* Local Conversation Section */}
                      {(trip.speechData.some(
                        (s: SpeechItem) =>
                          s.category === selectedPoint.category,
                      ) ||
                        selectedPoint.category === "sightseeing") && (
                          <div style={{ marginTop: 16 }}>
                            <button
                              onClick={() =>
                                setExpandedSection(
                                  expandedSection === "localSpeech"
                                    ? null
                                    : "localSpeech",
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "16px",
                                background: "var(--glass-bg)",
                                borderRadius: "16px",
                                border: "1px solid var(--glass-border)",
                                color: "var(--text-primary)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <MessageCircle size={18} color="var(--primary)" />
                                <span>현지 회화 (추천)</span>
                              </div>
                              {expandedSection === "localSpeech" ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>

                            {expandedSection === "localSpeech" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{
                                  overflow: "hidden",
                                  marginTop: 8,
                                  padding: "12px",
                                  background: "rgba(0,0,0,0.2)",
                                  borderRadius: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  {trip.speechData
                                    .filter(
                                      (s) =>
                                        s.category === selectedPoint.category ||
                                        (selectedPoint.category ===
                                          "sightseeing" &&
                                          s.category === "shopping"),
                                    )
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          background: "rgba(255,255,255,0.05)",
                                          padding: "8px 12px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <div
                                            style={{
                                              fontSize: "11px",
                                              color: "var(--text-secondary)",
                                            }}
                                          >
                                            {item.kor}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "15px",
                                              fontWeight: 700,
                                              color: "var(--text-primary)",
                                            }}
                                          >
                                            {item.jp}{" "}
                                            <span
                                              style={{
                                                fontSize: "12px",
                                                color: "var(--primary)",
                                                fontWeight: 500,
                                                marginLeft: 4,
                                              }}
                                            >
                                              {item.pron}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => speak(item.jp)}
                                          style={{
                                            background: "var(--primary)",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: 28,
                                            height: 28,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            color: "black",
                                          }}
                                        >
                                          <Volume2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                      {/* Rating & Review Section Toggle */}
                      <div style={{ marginTop: 16 }}>
                        <button
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "review" ? null : "review",
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "16px",
                            background: "var(--glass-bg)",
                            borderRadius: "16px",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Star
                              size={18}
                              color={
                                userReviews[selectedPoint.id]?.rating
                                  ? "#FFD700"
                                  : "var(--text-secondary)"
                              }
                              fill={
                                userReviews[selectedPoint.id]?.rating
                                  ? "#FFD700"
                                  : "transparent"
                              }
                            />
                            <span>평가 및 리뷰</span>
                          </div>
                          {expandedSection === "review" ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                        {expandedSection === "review" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                              overflow: "hidden",
                              marginTop: 8,
                              padding: "16px",
                              background: "rgba(0,0,0,0.2)",
                              borderRadius: "16px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                marginBottom: 12,
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={24}
                                  fill={
                                    (userReviews[selectedPoint.id]?.rating ||
                                      0) >= star
                                      ? "#FFD700"
                                      : "transparent"
                                  }
                                  color={
                                    (userReviews[selectedPoint.id]?.rating ||
                                      0) >= star
                                      ? "#FFD700"
                                      : "var(--text-secondary)"
                                  }
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    updateReview(
                                      selectedPoint.id,
                                      star,
                                      userReviews[selectedPoint.id]?.text || "",
                                    )
                                  }
                                />
                              ))}
                            </div>
                            <textarea
                              placeholder="이 장소에 대한 한줄평을 남겨주세요"
                              value={userReviews[selectedPoint.id]?.text || ""}
                              onChange={(e) =>
                                updateReview(
                                  selectedPoint.id,
                                  userReviews[selectedPoint.id]?.rating || 0,
                                  e.target.value,
                                )
                              }
                              style={{
                                width: "100%",
                                background: "var(--input-bg)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                resize: "none",
                                height: "80px",
                              }}
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Private Log Section Toggle */}
                      <div style={{ marginTop: 12 }}>
                        <button
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "log" ? null : "log",
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "16px",
                            background: "var(--glass-bg)",
                            borderRadius: "16px",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Lock
                              size={18}
                              color={
                                userLogs[selectedPoint.id]
                                  ? "var(--primary)"
                                  : "var(--text-secondary)"
                              }
                            />
                            <span>나만의 기록</span>
                          </div>
                          {expandedSection === "log" ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                        {expandedSection === "log" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                              overflow: "hidden",
                              marginTop: 8,
                              padding: "16px",
                              background: "rgba(0,0,0,0.2)",
                              borderRadius: "16px",
                            }}
                          >
                            <textarea
                              placeholder="개인적인 메모나 기록을 남기세요..."
                              value={userLogs[selectedPoint.id] || ""}
                              onChange={(e) =>
                                updateLog(selectedPoint.id, e.target.value)
                              }
                              style={{
                                width: "100%",
                                background: "var(--input-bg)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                resize: "none",
                                height: "100px",
                              }}
                            />
                          </motion.div>
                        )}
                      </div>

                      <button
                        className="primary-button"
                        style={{
                          width: "100%",
                          marginTop: "20px",
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                        }}
                        onClick={() => {
                          setSelectedPoint(null);
                          setIsEditingPoint(false);
                        }}
                      >
                        닫기
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </>

        {/* Planning Wizard Overlay */}

        <AnimatePresence>
          {isPlanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.98)",
                backdropFilter: "blur(30px)",
                zIndex: 5000000,
                display: "flex",
                flexDirection: "column",
                color: "white",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: plannerStep >= 3 ? "flex-start" : "center",
                  alignItems: "center",
                  padding: "0 30px 60px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    textAlign: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {plannerStep === 0 && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                      >
                        <div
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: "40px",
                            background: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 30px",
                            color: "black",
                            boxShadow: "0 20px 50px rgba(0,212,255,0.4)",
                            transform: "rotate(-5deg)",
                          }}
                        >
                          <Sparkles size={60} />
                        </div>
                        <h1
                          style={{
                            fontSize: "36px",
                            fontWeight: 900,
                            marginBottom: "16px",
                          }}
                        >
                          프리미엄 AI 여행 설계
                        </h1>
                        <p
                          style={{
                            opacity: 0.7,
                            marginBottom: "48px",
                            lineHeight: 1.6,
                            fontSize: "19px",
                          }}
                        >
                          당신의 취향을 분석하여 최적의 경로를 제안합니다.
                        </p>
                        <button
                          onClick={() => setPlannerStep(1)}
                          className="primary-button"
                          style={{
                            padding: "20px 48px",
                            fontSize: "20px",
                            borderRadius: "40px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            margin: "0 auto",
                          }}
                        >
                          설계 시작하기 <ArrowRight size={22} />
                        </button>

                        <button
                          onClick={() => setIsPlanning(false)}
                          style={{
                            marginTop: "24px",
                            padding: "16px 32px",
                            borderRadius: "30px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "16px",
                            margin: "0 auto",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          취소하고 돌아가기
                        </button>
                      </motion.div>
                    )}

                    {plannerStep === 1 && (
                      <motion.div
                        key="planner-step-1"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: "100%", maxWidth: "800px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: "20px",
                            justifyContent: "center",
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 1
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                                opacity: i < 1 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "8px",
                          }}
                        >
                          여행의 기본 정보를 알려 주세요
                        </h2>
                        <p style={{ opacity: 0.6, marginBottom: "32px" }}>
                          언제, 어디로 떠나시나요?
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1.2fr",
                            gap: "24px",
                            textAlign: "left",
                          }}
                        >
                          {/* Destination & Info */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "20px",
                            }}
                          >
                            {/* Title Input */}
                            <div
                              className="glass-card"
                              style={{ padding: "20px" }}
                            >
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  marginBottom: "12px",
                                  color: "var(--primary)",
                                  opacity: 0.8,
                                }}
                              >
                                여행 제목
                              </label>
                              <input
                                type="text"
                                placeholder="예: 우리가족 오사카 3박4일"
                                value={(plannerData as any).title || ""}
                                onChange={(e) =>
                                  setPlannerData({
                                    ...plannerData,
                                    title: e.target.value,
                                  } as any)
                                }
                                style={{
                                  width: "100%",
                                  padding: "14px",
                                  borderRadius: "12px",
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  color: "white",
                                  fontSize: "16px",
                                }}
                              />
                            </div>

                            <div
                              className="glass-card"
                              style={{ padding: "20px" }}
                            >
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  marginBottom: "12px",
                                  color: "var(--primary)",
                                  opacity: 0.8,
                                }}
                              >
                                여행 제목적지
                              </label>
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={() => {
                                    if (plannerData.destination) {
                                      window.open(
                                        `https://www.google.com/maps/search/${encodeURIComponent(plannerData.destination)}`,
                                        "_blank",
                                      );
                                    } else {
                                      alert("목적지를 먼저 입력해 주세요.");
                                    }
                                  }}
                                  style={{
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(0,212,255,0.1)",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "6px",
                                    color: "var(--primary)",
                                    cursor: "pointer",
                                    zIndex: 2,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                  title="주소 검색"
                                >
                                  <MapPin size={18} />
                                </button>
                                <input
                                  type="text"
                                  placeholder="예: 일본 오사카,    주도 등"
                                  value={plannerData.destination}
                                  onChange={(e) =>
                                    setPlannerData({
                                      ...plannerData,
                                      destination: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "14px 14px 14px 50px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    fontSize: "16px",
                                  }}
                                />
                              </div>

                              {/* Document Upload Removed from here and moved to relevant steps (Transport/Accom) */}
                            </div>

                            {/* Accommodations removed from Step 1, will be in Step 4 */}

                            <div
                              className="glass-card"
                              style={{
                                padding: "20px",
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  marginBottom: "15px",
                                  color: "var(--primary)",
                                  opacity: 0.8,
                                }}
                              >
                                선택된 일정
                              </label>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "12px",
                                  flex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    padding: "15px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      opacity: 0.4,
                                      marginBottom: "4px",
                                    }}
                                  >
                                    시작일
                                  </div>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "18px",
                                    }}
                                  >
                                    {plannerData.startDate || "날짜 선택"}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: "15px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      opacity: 0.4,
                                      marginBottom: "4px",
                                    }}
                                  >
                                    종료일
                                  </div>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "18px",
                                    }}
                                  >
                                    {plannerData.endDate || "날짜 선택"}
                                  </div>
                                </div>
                              </div>

                              {analyzedFiles.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "20px",
                                    paddingTop: "15px",
                                    borderTop:
                                      "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        fontSize: "11px",
                                        opacity: 0.5,
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                      }}
                                    >
                                      학습된 서류 데이터
                                    </h4>
                                    <button
                                      onClick={() => setView("ocr_lab")}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--primary)",
                                        fontSize: "10px",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      상세 정보기
                                    </button>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "6px",
                                    }}
                                  >
                                    {analyzedFiles
                                      .filter((f) => f.status === "done")
                                      .slice(-3)
                                      .map((f, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            fontSize: "11px",
                                            background:
                                              "rgba(255,255,255,0.02)",
                                            padding: "8px 10px",
                                            borderRadius: "8px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <span
                                            style={{
                                              opacity: 0.7,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              maxWidth: "140px",
                                            }}
                                          >
                                            📄 {f.name}
                                          </span>
                                          <span
                                            style={{
                                              color:
                                                f.parsedData?.type === "flight"
                                                  ? "#4facfe"
                                                  : f.parsedData?.type ===
                                                    "accommodation"
                                                    ? "#fbbf24"
                                                    : "#888",
                                              fontWeight: 800,
                                              fontSize: "9px",
                                              background:
                                                "rgba(255,255,255,0.05)",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                            }}
                                          >
                                            {f.parsedData?.type?.toUpperCase() ||
                                              "UNKNOWN"}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Custom Calendar Grid */}
                          <div
                            className="glass-card"
                            style={{
                              padding: "20px",
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                              }}
                            >
                              <h3 style={{ fontSize: "17px", fontWeight: 800 }}>
                                {calendarDate.getFullYear()}년{" "}
                                {calendarDate.getMonth() + 1}월
                              </h3>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={prevMonth}
                                  style={{
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    color: "white",
                                    width: 30,
                                    height: 30,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  onClick={nextMonth}
                                  style={{
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    color: "white",
                                    width: 30,
                                    height: 30,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: "8px",
                                textAlign: "center",
                              }}
                            >
                              {["일", "월", "화", "수", "목", "금", "  "].map(
                                (d) => (
                                  <div
                                    key={d}
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      opacity: 0.3,
                                      marginBottom: "8px",
                                    }}
                                  >
                                    {d}
                                  </div>
                                ),
                              )}
                              {(() => {
                                const year = calendarDate.getFullYear();
                                const month = calendarDate.getMonth();
                                const firstDay = new Date(
                                  year,
                                  month,
                                  1,
                                ).getDay();
                                const lastDate = new Date(
                                  year,
                                  month + 1,
                                  0,
                                ).getDate();

                                const days = [];

                                // Empty slots
                                for (let i = 0; i < firstDay; i++) {
                                  days.push(<div key={`empty-${i}`} />);
                                }

                                // Days
                                for (let d = 1; d <= lastDate; d++) {
                                  const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
                                  const isSelected =
                                    plannerData.startDate === dateStr ||
                                    plannerData.endDate === dateStr;
                                  const isInRange =
                                    plannerData.startDate &&
                                    plannerData.endDate &&
                                    dateStr > plannerData.startDate &&
                                    dateStr < plannerData.endDate;

                                  days.push(
                                    <div
                                      key={d}
                                      onClick={() => {
                                        if (
                                          !plannerData.startDate ||
                                          (plannerData.startDate &&
                                            plannerData.endDate)
                                        ) {
                                          setPlannerData({
                                            ...plannerData,
                                            startDate: dateStr,
                                            endDate: "",
                                          });
                                        } else {
                                          if (dateStr < plannerData.startDate) {
                                            setPlannerData({
                                              ...plannerData,
                                              startDate: dateStr,
                                              endDate: plannerData.startDate,
                                            });
                                          } else {
                                            setPlannerData({
                                              ...plannerData,
                                              endDate: dateStr,
                                            });
                                          }
                                        }
                                      }}
                                      style={{
                                        padding: "10px 0",
                                        borderRadius: "10px",
                                        fontSize: "14px",
                                        fontWeight:
                                          isSelected || isInRange ? 800 : 500,
                                        cursor: "pointer",
                                        background: isSelected
                                          ? "var(--primary)"
                                          : isInRange
                                            ? "rgba(0,212,255,0.15)"
                                            : "transparent",
                                        color: isSelected ? "black" : "white",
                                        opacity: 1,
                                        transition: "all 0.2s",
                                      }}
                                    >
                                      {d}
                                    </div>,
                                  );
                                }
                                return days;
                              })()}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setPlannerStep(2)}
                          disabled={
                            !plannerData.destination ||
                            !plannerData.startDate ||
                            !plannerData.endDate
                          }
                          style={{
                            width: "100%",
                            marginTop: "30px",
                            padding: "20px",
                            borderRadius: "16px",
                            border: "none",
                            background:
                              plannerData.destination &&
                                plannerData.startDate &&
                                plannerData.endDate
                                ? "var(--primary)"
                                : "rgba(255,255,255,0.1)",
                            color:
                              plannerData.destination &&
                                plannerData.startDate &&
                                plannerData.endDate
                                ? "black"
                                : "rgba(255,255,255,0.3)",
                            fontWeight: 900,
                            fontSize: "18px",
                            cursor:
                              plannerData.destination &&
                                plannerData.startDate &&
                                plannerData.endDate
                                ? "pointer"
                                : "not-allowed",
                            boxShadow:
                              plannerData.destination &&
                                plannerData.startDate &&
                                plannerData.endDate
                                ? "0 10px 30px rgba(0,212,255,0.3)"
                                : "none",
                          }}
                        >
                          다음 단계로 (여행 스타일)
                        </button>

                        <button
                          onClick={() => setIsPlanning(false)}
                          style={{
                            width: "100%",
                            marginTop: "12px",
                            padding: "16px",
                            borderRadius: "16px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            fontWeight: 600,
                            fontSize: "15px",
                            cursor: "pointer",
                          }}
                        >
                          취소하고 돌아가기
                        </button>
                      </motion.div>
                    )}

                    {plannerStep === 2 && (
                      <motion.div
                        key="planner-step-2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: "100%", maxWidth: "700px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: "40px",
                            justifyContent: "center",
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 2
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                                opacity: i < 2 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "30px",
                            textAlign: "center",
                          }}
                        >
                          어떤 스타일의 여행인가요?
                        </h2>

                        <div style={{ marginBottom: "40px" }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: 700,
                              marginBottom: "15px",
                              color: "var(--primary)",
                              opacity: 0.8,
                            }}
                          >
                            누구와 함께 가시나요?
                          </label>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr",
                              gap: "15px",
                              marginBottom: "20px",
                            }}
                          >
                            {[
                              {
                                id: "alone",
                                label: "혼자서",
                                icon: <User size={24} />,
                              },
                              {
                                id: "couple",
                                label: "연인과",
                                icon: <Heart size={24} />,
                              },
                              {
                                id: "friends",
                                label: "친구와",
                                icon: <Users size={24} />,
                              },
                              {
                                id: "family",
                                label: "가족과",
                                icon: <Users size={24} />,
                              },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  setPlannerData({
                                    ...plannerData,
                                    companion: item.id,
                                  })
                                }
                                style={{
                                  padding: "20px",
                                  borderRadius: "16px",
                                  border:
                                    plannerData.companion === item.id
                                      ? "2px solid var(--primary)"
                                      : "1px solid rgba(255,255,255,0.1)",
                                  background:
                                    plannerData.companion === item.id
                                      ? "rgba(0,212,255,0.1)"
                                      : "rgba(255,255,255,0.03)",
                                  color: "white",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                {item.icon}
                                <span
                                  style={{ fontWeight: 700, fontSize: "13px" }}
                                >
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div
                            style={{
                              padding: "20px",
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: "16px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: "white" }}>
                                총 여행 인원
                              </div>
                              <div style={{ fontSize: "13px", opacity: 0.6 }}>
                                항공권 및 숙소 검색에 반영됩니다
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setPlannerData({
                                    ...plannerData,
                                    peopleCount: Math.max(
                                      1,
                                      (plannerData.peopleCount || 1) - 1,
                                    ),
                                  })
                                }
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "12px",
                                  background: "rgba(255,255,255,0.1)",
                                  border: "none",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Minus size={18} />
                              </button>
                              <span
                                style={{
                                  fontSize: "20px",
                                  fontWeight: 800,
                                  width: 30,
                                  textAlign: "center",
                                }}
                              >
                                {plannerData.peopleCount || 1}
                              </span>
                              <button
                                onClick={() =>
                                  setPlannerData({
                                    ...plannerData,
                                    peopleCount:
                                      (plannerData.peopleCount || 1) + 1,
                                  })
                                }
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "12px",
                                  background: "var(--primary)",
                                  border: "none",
                                  color: "black",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: "40px" }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: 700,
                              marginBottom: "15px",
                              color: "var(--primary)",
                              opacity: 0.8,
                            }}
                          >
                            여행 속도는 어떤가요?
                          </label>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            }}
                          >
                            {[
                              {
                                id: "slow",
                                label: "여유롭게 (하루 2-3곳)",
                                icon: <Clock size={20} />,
                              },
                              {
                                id: "normal",
                                label: "적당히 (하루 4-5곳)",
                                icon: <Clock size={20} />,
                              },
                              {
                                id: "fast",
                                label: "빡빡하게 (하루 6곳+)",
                                icon: <Clock size={20} />,
                              },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  setPlannerData({
                                    ...plannerData,
                                    pace: item.id as any,
                                  })
                                }
                                style={{
                                  padding: "16px 20px",
                                  borderRadius: "16px",
                                  border:
                                    plannerData.pace === item.id
                                      ? "2px solid var(--primary)"
                                      : "1px solid rgba(255,255,255,0.1)",
                                  background:
                                    plannerData.pace === item.id
                                      ? "rgba(0,212,255,0.1)"
                                      : "rgba(255,255,255,0.03)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 15,
                                  textAlign: "left",
                                }}
                              >
                                {item.icon}
                                <span style={{ fontWeight: 700 }}>
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "15px" }}>
                          <button
                            onClick={() => setPlannerStep(1)}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "transparent",
                              color: "white",
                              fontWeight: 800,
                            }}
                          >
                            이전
                          </button>
                          <button
                            onClick={() => setPlannerStep(3)}
                            disabled={
                              !plannerData.companion || !plannerData.pace
                            }
                            style={{
                              flex: 2,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "none",
                              background:
                                plannerData.companion && plannerData.pace
                                  ? "var(--primary)"
                                  : "rgba(255,255,255,0.1)",
                              color:
                                plannerData.companion && plannerData.pace
                                  ? "black"
                                  : "rgba(255,255,255,0.3)",
                              fontWeight: 800,
                            }}
                          >
                            다음 단계로 (교통편)
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {plannerStep === 3 && (
                      <motion.div
                        key="planner-step-3"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          width: "100%",
                          maxWidth: "700px",
                          marginTop: "40px",
                          paddingBottom: "100px",
                          position: "relative",
                          zIndex: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                            marginBottom: "30px",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((s, i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 3
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                                opacity: i < 3 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "10px",
                            textAlign: "center",
                            color: "white",
                          }}
                        >
                          어떻게 오시나요?
                        </h2>
                        <p
                          style={{
                            textAlign: "center",
                            opacity: 0.6,
                            marginBottom: "20px",
                          }}
                        >
                          교통편을 입력하면 일정에 자동으로 추가해 드립니다.
                        </p>

                        <div
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: "15px",
                            borderRadius: "12px",
                            marginBottom: "30px",
                            fontSize: "15px",
                            textAlign: "center",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <span
                            style={{ color: "var(--primary)", fontWeight: 700 }}
                          >
                            {plannerData.startDate} ~ {plannerData.endDate}
                          </span>
                          <span style={{ margin: "0 10px", opacity: 0.3 }}>
                            |
                          </span>
                          <span>총 {plannerData.peopleCount || 1}명</span>
                        </div>

                        {/* Transport Buttons Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            gap: "12px",
                            marginBottom: "30px",
                          }}
                        >
                          {[
                            {
                              id: "plane",
                              label: "비행기",
                              icon: <Compass size={24} />,
                            },
                            {
                              id: "ship",
                              label: "배",
                              icon: <Wind size={24} />,
                            },
                            {
                              id: "car",
                              label: "자동차",
                              icon: <Car size={24} />,
                            },
                            {
                              id: "public",
                              label: "대중교통",
                              icon: <Bus size={24} />,
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                const isCar = item.id === "car";
                                setPlannerData({
                                  ...plannerData,
                                  travelMode: item.id as any,
                                  entryPoint: isCar ? "Direct Driving" : "",
                                  departurePoint:
                                    isCar &&
                                      !plannerData.departurePoint &&
                                      currentUser?.homeAddress
                                      ? currentUser.homeAddress
                                      : plannerData.departurePoint,
                                });
                              }}
                              style={{
                                padding: "16px",
                                borderRadius: "16px",
                                border:
                                  plannerData.travelMode === item.id
                                    ? "2px solid var(--primary)"
                                    : "1px solid rgba(255,255,255,0.1)",
                                background:
                                  plannerData.travelMode === item.id
                                    ? "rgba(0,212,255,0.1)"
                                    : "rgba(255,255,255,0.03)",
                                color: "white",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              {item.icon}
                              <span
                                style={{ fontWeight: 700, fontSize: "13px" }}
                              >
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Dynamic Form Area */}
                        <div
                          style={{
                            textAlign: "left",
                            marginBottom: "30px",
                            padding: "24px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "20px",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {/* Deep Links & OCR */}
                          {plannerData.travelMode !== "car" && (
                            <div
                              style={{
                                marginBottom: "25px",
                                display: "flex",
                                gap: "10px",
                              }}
                            >
                              {/* OCR Upload */}
                              <div
                                onClick={() =>
                                  ticketFileInputRef.current?.click()
                                }
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDragging(true);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDragging(false);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDragging(false);
                                  if (
                                    e.dataTransfer.files &&
                                    e.dataTransfer.files.length > 0
                                  ) {
                                    handleFileAnalysis(
                                      Array.from(e.dataTransfer.files),
                                    );
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  border: isDragging
                                    ? "2px dashed var(--primary)"
                                    : "2px dashed rgba(255,255,255,0.2)",
                                  borderRadius: "16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "15px",
                                  cursor: "pointer",
                                  background: isDragging
                                    ? "rgba(0,212,255,0.05)"
                                    : "rgba(255,255,255,0.02)",
                                  transition: "all 0.2s",
                                  minHeight: "180px",
                                }}
                              >
                                <input
                                  type="file"
                                  ref={ticketFileInputRef}
                                  style={{ display: "none" }}
                                  accept="image/*,.html,.htm,.pdf"
                                  onChange={handleTicketOcr}
                                />
                                {isOcrLoading ? (
                                  <>
                                    <Loader2
                                      size={24}
                                      className="animate-spin"
                                      color="var(--primary)"
                                    />
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        color: "var(--primary)",
                                        fontWeight: 700,
                                      }}
                                    >
                                      티켓 분석 중...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={24} color="var(--primary)" />
                                    <div style={{ textAlign: "center" }}>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: 700,
                                          color: "var(--primary)",
                                        }}
                                      >
                                        티켓/예매내역 업로드
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          opacity: 0.5,
                                          marginTop: 4,
                                        }}
                                      >
                                        이미지나 PDF를 올리면 자동 입력됩니다
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              {/* Uploaded File List with Delete Option */}
                              {analyzedFiles.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      opacity: 0.5,
                                      marginBottom: "2px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    업로드됨
                                  </div>
                                  {analyzedFiles.map((file, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        border:
                                          "1px solid rgba(255,255,255,0.05)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <FileText
                                          size={14}
                                          style={{
                                            opacity: 0.7,
                                            color: "var(--primary)",
                                          }}
                                        />
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "250px",
                                          }}
                                        >
                                          {file.name}
                                        </span>
                                        {file.status === "loading" && (
                                          <Loader2
                                            size={12}
                                            className="animate-spin"
                                          />
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmModal({
                                            isOpen: true,
                                            title: "파일 삭제",
                                            message: `${file.name} 파일을 삭제하시겠습니까?`,
                                            onConfirm: () => {
                                              setAnalyzedFiles((prev) =>
                                                prev.filter(
                                                  (_, i) => i !== idx,
                                                ),
                                              );
                                              setDeleteConfirmModal({
                                                isOpen: false,
                                                title: "",
                                                message: "",
                                                onConfirm: () => { },
                                              });
                                            },
                                          });
                                        }}
                                        style={{
                                          background: "rgba(255,0,0,0.1)",
                                          border: "none",
                                          color: "#ff6b6b",
                                          cursor: "pointer",
                                          padding: "6px",
                                          borderRadius: "6px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        title="파일 삭제"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Deep Links */}
                              {(() => {
                                const count = plannerData.peopleCount || 1;
                                // Skyscanner
                                const sStart = plannerData.startDate
                                  ? plannerData.startDate
                                    .slice(2)
                                    .replace(/-/g, "")
                                  : "";
                                const sEnd = plannerData.endDate
                                  ? plannerData.endDate
                                    .slice(2)
                                    .replace(/-/g, "")
                                  : "";

                                let skyscannerUrl =
                                  "https://www.skyscanner.co.kr";
                                if (
                                  plannerData.destination &&
                                  (plannerData.destination.includes(
                                    "오키나와",
                                  ) ||
                                    plannerData.destination
                                      .toLowerCase()
                                      .includes("okinawa"))
                                ) {
                                  skyscannerUrl =
                                    "https://www.skyscanner.co.kr/transport/flights/icn/oka";
                                  if (sStart) skyscannerUrl += `/${sStart}`;
                                  if (sEnd) skyscannerUrl += `/${sEnd}`;
                                  skyscannerUrl += `/?adultsv2=${count}&cabinclass=economy&childrenv2=&ref=home&rtn=${sEnd ? 1 : 0}&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
                                }

                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                      width: "40%",
                                    }}
                                  >
                                    <a
                                      href={skyscannerUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "12px",
                                        color: "white",
                                        textDecoration: "none",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Plane size={16} /> 스카이스캐너 예매
                                    </a>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          <div style={{ display: "grid", gap: "20px" }}>
                            {plannerData.travelMode === "plane" ? (
                              <>
                                {/* Plane Mode: Round Trip UI */}
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.03)",
                                    padding: "20px",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <h4
                                    style={{
                                      color: "#60a5fa",
                                      marginBottom: "15px",
                                      fontWeight: 800,
                                      fontSize: "14px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    🛫 가는 편 (출국)
                                  </h4>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "10px",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="항공사"
                                      value={plannerData.airline || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          airline: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="편명 (예: KE001)"
                                      value={plannerData.flightNumber || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          flightNumber: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "10px",
                                      alignItems: "center",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="출발 공항 (ICN)"
                                      value={plannerData.departurePoint}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          departurePoint: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <ArrowRight
                                      size={14}
                                      color="rgba(255,255,255,0.3)"
                                    />
                                    <input
                                      type="text"
                                      placeholder="도착 공항 (OKA)"
                                      value={
                                        plannerData.entryPoint ===
                                          "Direct Driving"
                                          ? ""
                                          : plannerData.entryPoint
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          entryPoint: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", gap: "5px" }}>
                                    <input
                                      type="date"
                                      value={plannerData.startDate || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          startDate: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 3,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <input
                                      type="time"
                                      value={plannerData.departureTime || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          departureTime: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 2,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                </div>

                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.03)",
                                    padding: "20px",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <h4
                                    style={{
                                      color: "#fbbf24",
                                      marginBottom: "15px",
                                      fontWeight: 800,
                                      fontSize: "14px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    🛬 오는 편 (귀국)
                                  </h4>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "10px",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="항공사"
                                      value={plannerData.returnAirline || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          returnAirline: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="편명 (예: KE002)"
                                      value={
                                        plannerData.returnFlightNumber || ""
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          returnFlightNumber: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "10px",
                                      alignItems: "center",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="출발 공항 (OKA)"
                                      value={
                                        plannerData.returnDeparturePoint || ""
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          returnDeparturePoint: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <ArrowRight
                                      size={14}
                                      color="rgba(255,255,255,0.3)"
                                    />
                                    <input
                                      type="text"
                                      placeholder="도착 공항 (ICN)"
                                      value={
                                        plannerData.returnArrivalPoint || ""
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          returnArrivalPoint: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", gap: "5px" }}>
                                    <input
                                      type="date"
                                      value={plannerData.endDate || ""}
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          endDate: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 3,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                    <input
                                      type="time"
                                      value={
                                        plannerData.returnDepartureTime || ""
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          returnDepartureTime: e.target.value,
                                        })
                                      }
                                      style={{
                                        flex: 2,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Generic Mode (Car/Ship/etc) */}
                                {/* Places */}
                                <div>
                                  <label
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "8px",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      opacity: 0.8,
                                    }}
                                  >
                                    <span>출발지</span>
                                    {plannerData.departureCoordinates && (
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          color: "#10b981",
                                        }}
                                      >
                                        ✓ 위치 확인됨
                                      </span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="예: 출발지 입력"
                                    value={plannerData.departurePoint}
                                    onChange={(e) =>
                                      setPlannerData({
                                        ...plannerData,
                                        departurePoint: e.target.value,
                                      })
                                    }
                                    style={{
                                      width: "100%",
                                      padding: "14px",
                                      borderRadius: "12px",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      background: "rgba(0,0,0,0.3)",
                                      color: "white",
                                    }}
                                  />
                                </div>

                                {plannerData.travelMode !== "car" && (
                                  <div>
                                    <label
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        opacity: 0.8,
                                      }}
                                    >
                                      <span>도착지</span>
                                      {plannerData.entryCoordinates && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "#10b981",
                                          }}
                                        >
                                          ✓ 위치 확인됨
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={`예: ${plannerData.destination} 항구/터미널`}
                                      value={
                                        plannerData.entryPoint ===
                                          "Direct Driving"
                                          ? ""
                                          : plannerData.entryPoint
                                      }
                                      onChange={(e) =>
                                        setPlannerData({
                                          ...plannerData,
                                          entryPoint: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "12px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(0,0,0,0.3)",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Date/Time */}
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                  }}
                                >
                                  <div>
                                    <label
                                      style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        opacity: 0.8,
                                      }}
                                    >
                                      출발 일시
                                    </label>
                                    <div
                                      style={{ display: "flex", gap: "5px" }}
                                    >
                                      <input
                                        type="date"
                                        value={plannerData.startDate || ""}
                                        onChange={(e) =>
                                          setPlannerData({
                                            ...plannerData,
                                            startDate: e.target.value,
                                          })
                                        }
                                        style={{
                                          flex: 3,
                                          padding: "12px",
                                          borderRadius: "10px",
                                          border:
                                            "1px solid rgba(255,255,255,0.1)",
                                          background: "rgba(0,0,0,0.3)",
                                          color: "white",
                                        }}
                                      />
                                      <input
                                        type="time"
                                        value={plannerData.departureTime || ""}
                                        onChange={(e) =>
                                          setPlannerData({
                                            ...plannerData,
                                            departureTime: e.target.value,
                                          })
                                        }
                                        style={{
                                          flex: 2,
                                          padding: "12px",
                                          borderRadius: "10px",
                                          border:
                                            "1px solid rgba(255,255,255,0.1)",
                                          background: "rgba(0,0,0,0.3)",
                                          color: "white",
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        opacity: 0.8,
                                      }}
                                    >
                                      도착 일시
                                    </label>
                                    <div
                                      style={{ display: "flex", gap: "5px" }}
                                    >
                                      <input
                                        type="date"
                                        value={
                                          plannerData.arrivalDate ||
                                          plannerData.startDate ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          setPlannerData({
                                            ...plannerData,
                                            arrivalDate: e.target.value,
                                          })
                                        }
                                        style={{
                                          flex: 3,
                                          padding: "12px",
                                          borderRadius: "10px",
                                          border:
                                            "1px solid rgba(255,255,255,0.1)",
                                          background: "rgba(0,0,0,0.3)",
                                          color: "white",
                                        }}
                                      />
                                      <input
                                        type="time"
                                        value={plannerData.arrivalTime || ""}
                                        onChange={(e) =>
                                          setPlannerData({
                                            ...plannerData,
                                            arrivalTime: e.target.value,
                                          })
                                        }
                                        style={{
                                          flex: 2,
                                          padding: "12px",
                                          borderRadius: "10px",
                                          border:
                                            "1px solid rgba(255,255,255,0.1)",
                                          background: "rgba(0,0,0,0.3)",
                                          color: "white",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "15px" }}>
                          <button
                            onClick={() => setPlannerStep(2)}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "transparent",
                              color: "white",
                              fontWeight: 800,
                            }}
                          >
                            이전
                          </button>
                          <button
                            onClick={() => {
                              const draft = {
                                data: plannerData,
                                step: 3,
                                updated: Date.now(),
                              };
                              localStorage.setItem(
                                "trip_draft_v1",
                                JSON.stringify(draft),
                              );
                              showToast("여행 계획이 저장되었습니다.");
                              setTimeout(() => setIsPlanning(false), 1500);
                            }}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "rgba(255,255,255,0.05)",
                              color: "white",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              justifyContent: "center",
                            }}
                          >
                            <Save size={20} />
                            <span style={{ fontSize: "14px" }}>저장</span>
                          </button>
                          <button
                            onClick={() => {
                              setPlannerStep(4);
                              // Auto-fetch attractions if empty
                              if (dynamicAttractions.length === 0) {
                                fetchAttractionsWithAI(plannerData.destination);
                              }
                            }}
                            style={{
                              flex: 2,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "none",
                              background: "var(--primary)",
                              color: "black",
                              fontWeight: 800,
                            }}
                          >
                            다음 단계로 (장소 선택)
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {plannerStep === 4 && (
                      <motion.div
                        key="planner-step-4"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: "100%", maxWidth: "900px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: "40px",
                            justifyContent: "center",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 4
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                                opacity: i < 4 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "10px",
                            textAlign: "center",
                          }}
                        >
                          {plannerData.destination}의 어디를 가고 싶으신가요?
                        </h2>

                        {isSearchingAttractions ? (
                          <div
                            style={{ padding: "100px 0", textAlign: "center" }}
                          >
                            <Loader2
                              size={60}
                              className="animate-spin"
                              style={{
                                color: "var(--primary)",
                                margin: "0 auto 20px",
                              }}
                            />
                            <p style={{ opacity: 0.6 }}>
                              AI가 {plannerData.destination}의 숨은 명소들을 찾
                              있습니다...
                            </p>
                          </div>
                        ) : dynamicAttractions.length === 0 ? (
                          <div
                            style={{ padding: "60px 0", textAlign: "center" }}
                          >
                            <p style={{ opacity: 0.6, marginBottom: "20px" }}>
                              명소를 불러오지 못했습니다.
                            </p>
                            <button
                              onClick={() =>
                                fetchAttractionsWithAI(plannerData.destination)
                              }
                              style={{
                                padding: "12px 24px",
                                borderRadius: "12px",
                                border: "1px solid var(--primary)",
                                background: "transparent",
                                color: "var(--primary)",
                                fontWeight: 700,
                              }}
                            >
                              다시 검색하기
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Category Filter Tabs */}
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "20px",
                                justifyContent: "center",
                              }}
                            >
                              {[
                                { id: "all", label: "전체", icon: null },
                                {
                                  id: "sightseeing",
                                  label: "관광명소",
                                  icon: <Camera size={16} />,
                                },
                                {
                                  id: "food",
                                  label: "식당/맛집",
                                  icon: <Utensils size={16} />,
                                },
                                {
                                  id: "cafe",
                                  label: "카페",
                                  icon: <Compass size={16} />,
                                },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() =>
                                    setAttractionCategoryFilter(tab.id as any)
                                  }
                                  style={{
                                    padding: "10px 18px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background:
                                      attractionCategoryFilter === tab.id
                                        ? "var(--primary)"
                                        : "rgba(255,255,255,0.1)",
                                    color:
                                      attractionCategoryFilter === tab.id
                                        ? "black"
                                        : "white",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {tab.icon} {tab.label}
                                </button>
                              ))}
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "20px",
                                marginBottom: "20px",
                                maxHeight: "500px",
                                overflowY: "auto",
                                padding: "10px",
                                textAlign: "left",
                              }}
                            >
                              {dynamicAttractions
                                .filter(
                                  (item) =>
                                    attractionCategoryFilter === "all" ||
                                    item.category === attractionCategoryFilter,
                                )
                                .map((item) => {
                                  const isSelected = selectedPlaceIds.includes(
                                    item.id,
                                  );
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() =>
                                        setActivePlannerDetail(item)
                                      }
                                      className="glass-card"
                                      style={{
                                        padding: "20px",
                                        borderRadius: "20px",
                                        border: isSelected
                                          ? "2px solid var(--primary)"
                                          : "1px solid rgba(255,255,255,0.1)",
                                        background: isSelected
                                          ? "rgba(0,212,255,0.1)"
                                          : "rgba(255,255,255,0.03)",
                                        cursor: "pointer",
                                        position: "relative",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                      }}
                                    >
                                      {/* Header: Name & Selection Checkbox */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "flex-start",
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: "8px",
                                              marginBottom: "6px",
                                              alignItems: "center",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                background:
                                                  "rgba(255,255,255,0.1)",
                                                color: "#cbd5e1",
                                              }}
                                            >
                                              {item.category === "food"
                                                ? "식당"
                                                : item.category === "cafe"
                                                  ? "카페"
                                                  : item.category === "custom"
                                                    ? "직접 입력"
                                                    : "관광"}
                                            </span>
                                            {item.priceLevel && (
                                              <span
                                                style={{
                                                  fontSize: "11px",
                                                  color: "#94a3b8",
                                                }}
                                              >
                                                {item.priceLevel === "Expensive"
                                                  ? "💰💰💰"
                                                  : item.priceLevel ===
                                                    "Moderate"
                                                    ? "💰💰"
                                                    : "💰"}
                                              </span>
                                            )}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: 800,
                                              fontSize: "18px",
                                              marginBottom: "4px",
                                              color: isSelected
                                                ? "var(--primary)"
                                                : "white",
                                            }}
                                          >
                                            {item.name}
                                          </div>
                                        </div>
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPlaceIds(
                                              isSelected
                                                ? selectedPlaceIds.filter(
                                                  (id) => id !== item.id,
                                                )
                                                : [
                                                  ...selectedPlaceIds,
                                                  item.id,
                                                ],
                                            );
                                          }}
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isSelected
                                              ? "var(--primary)"
                                              : "rgba(255,255,255,0.1)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: isSelected
                                              ? "black"
                                              : "transparent",
                                            border: isSelected
                                              ? "none"
                                              : "2px solid rgba(255,255,255,0.3)",
                                            flexShrink: 0,
                                            cursor: "pointer",
                                          }}
                                        >
                                          <CheckCircle size={16} />
                                        </div>
                                      </div>

                                      {/* Rating */}
                                      {item.rating && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "14px",
                                            color: "#fbbf24",
                                            fontWeight: 700,
                                          }}
                                        >
                                          <Star size={14} fill="#fbbf24" />{" "}
                                          {item.rating}{" "}
                                          <span
                                            style={{
                                              color: "#94a3b8",
                                              fontWeight: 400,
                                            }}
                                          >
                                            ({item.reviewCount || "100+"})
                                          </span>
                                        </div>
                                      )}

                                      <div
                                        style={{
                                          fontSize: "13px",
                                          color: "#e2e8f0",
                                          fontWeight: 500,
                                          lineHeight: 1.4,
                                          opacity: 0.9,
                                        }}
                                      >
                                        {item.desc}
                                      </div>

                                      <div
                                        style={{
                                          fontSize: "12px",
                                          opacity: 0.6,
                                          lineHeight: 1.5,
                                          textAlign: "left",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {item.longDesc}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Manual Entry Below List */}
                            <div
                              className="glass-card"
                              style={{
                                padding: "20px",
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                                marginBottom: "40px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  flex: 1,
                                }}
                              >
                                <MapPin size={20} color="var(--primary)" />
                                <input
                                  id="custom-place-input"
                                  type="text"
                                  disabled={isValidatingPlace}
                                  placeholder={
                                    isValidatingPlace
                                      ? "AI가장소 정보를 확인 중입니다..."
                                      : "원하는 장소가 없다면 직접 입력하여 추가하세요 (예: 할머니 댁, 스타벅스 나하점)"
                                  }
                                  style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    color: "white",
                                    fontSize: "15px",
                                    padding: "10px",
                                  }}
                                  onKeyDown={async (e) => {
                                    if (
                                      e.key === "Enter" &&
                                      !isValidatingPlace
                                    ) {
                                      const input = document.getElementById(
                                        "custom-place-input",
                                      ) as HTMLInputElement;
                                      const name = input.value.trim();
                                      if (name) {
                                        const success =
                                          await validateAndAddPlace(name);
                                        if (success) {
                                          input.value = "";
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <button
                                disabled={isValidatingPlace}
                                onClick={async () => {
                                  const input = document.getElementById(
                                    "custom-place-input",
                                  ) as HTMLInputElement;
                                  const name = input.value.trim();
                                  if (!name)
                                    return showToast(
                                      "장소 이름을 입력해주세요.",
                                    );

                                  const success =
                                    await validateAndAddPlace(name);
                                  if (success) {
                                    input.value = "";
                                  }
                                }}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "12px",
                                  background: isPlaceAddedError
                                    ? "#ef4444"
                                    : isPlaceAddedSuccess
                                      ? "#34d399"
                                      : isValidatingPlace
                                        ? "gray"
                                        : "var(--primary)",
                                  color:
                                    isPlaceAddedError || isPlaceAddedSuccess
                                      ? "white"
                                      : "black",
                                  border: "none",
                                  fontWeight: 800,
                                  cursor: isValidatingPlace
                                    ? "wait"
                                    : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {isValidatingPlace ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : isPlaceAddedError ? (
                                  <AlertCircle size={16} />
                                ) : isPlaceAddedSuccess ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <Plus size={16} />
                                )}
                                {isValidatingPlace
                                  ? "확인 중"
                                  : isPlaceAddedError
                                    ? "이미 존재"
                                    : isPlaceAddedSuccess
                                      ? "저장 완료"
                                      : "추가"}
                              </button>
                            </div>
                          </>
                        )}

                        <div style={{ display: "flex", gap: "15px" }}>
                          <button
                            onClick={() => setPlannerStep(3)}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "transparent",
                              color: "white",
                              fontWeight: 800,
                            }}
                          >
                            이전 (교통편)
                          </button>
                          <button
                            onClick={() => {
                              const draft = {
                                step: 4,
                                data: plannerData,
                                selectedIds: selectedPlaceIds,
                                updated: Date.now(),
                                isEdit: tripToEdit ? true : false,
                                originalTripId: tripToEdit?.id,
                              };
                              localStorage.setItem(
                                "trip_draft_v1",
                                JSON.stringify(draft),
                              );
                              showToast(
                                "현재선택한 장소들이 임시 저장되었습니다.",
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.3)",
                              background: "rgba(255,255,255,0.15)",
                              color: "white",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <Save size={18} /> 저장
                          </button>
                          <button
                            onClick={() => {
                              const draft = {
                                step: 4,
                                data: plannerData,
                                selectedIds: selectedPlaceIds,
                                updated: Date.now(),
                                isEdit: tripToEdit ? true : false,
                                originalTripId: tripToEdit?.id,
                              };
                              localStorage.setItem(
                                "trip_draft_v1",
                                JSON.stringify(draft),
                              );

                              setPlannerStep(5);
                            }}
                            style={{
                              flex: 2,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "none",
                              background: "var(--primary)",
                              color: "black",
                              fontWeight: 800,
                            }}
                          >
                            다음 단계로 (숙소)
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {plannerStep === 5 && (
                      <motion.div
                        key="planner-step-5"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          width: "100%",
                          maxWidth: "800px",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: "40px",
                            justifyContent: "center",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 5
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                                opacity: i < 5 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "10px",
                            textAlign: "center",
                          }}
                        >
                          어디서 주무시나요?
                        </h2>
                        <p
                          style={{
                            opacity: 0.6,
                            marginBottom: "32px",
                            textAlign: "center",
                          }}
                        >선택한 장소들을 참고하여 숙소를 선택해보세요.
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                            marginBottom: "30px",
                          }}
                        >
                          {/* AI Recommendation */}
                          <div
                            className="glass-card"
                            style={{
                              padding: "30px",
                              border: "2px dashed rgba(0,212,255,0.3)",
                              background: "rgba(0,212,255,0.02)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 15,
                              cursor: isSearchingHotels ? "wait" : "pointer",
                              transition: "all 0.2s",
                            }}
                            onClick={() =>
                              !isSearchingHotels &&
                              fetchHotelsWithAI(plannerData.destination)
                            }
                            onMouseEnter={(e) =>
                              !isSearchingHotels &&
                              (e.currentTarget.style.background =
                                "rgba(0,212,255,0.05)")
                            }
                            onMouseLeave={(e) =>
                              !isSearchingHotels &&
                              (e.currentTarget.style.background =
                                "rgba(0,212,255,0.02)")
                            }
                          >
                            {isSearchingHotels ? (
                              <>
                                <Loader2
                                  size={32}
                                  className="animate-spin"
                                  color="var(--primary)"
                                />
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "16px",
                                      color: "var(--primary)",
                                    }}
                                  >
                                    AI 분석 중...
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      opacity: 0.6,
                                      marginTop: 4,
                                    }}
                                  >
                                    최적의 숙소를 찾고 있습니다
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <Sparkles size={32} color="var(--primary)" />
                                <div style={{ textAlign: "center" }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "16px",
                                      color: "var(--primary)",
                                    }}
                                  >
                                    AI 숙소 추천받기
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      opacity: 0.6,
                                      marginTop: 4,
                                    }}
                                  >
                                    {plannerData.destination}의 인기 숙소를
                                    추천합니다
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* External Links */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateRows: "1fr 1fr",
                              gap: "10px",
                            }}
                          >
                            <a
                              href={`https://www.agoda.com/search?city=${plannerData.destination}`}
                              target="_blank"
                              rel="noreferrer"
                              className="glass-card"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                textDecoration: "none",
                                color: "white",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "16px",
                              }}
                            >
                              <Hotel size={20} />{" "}
                              <span style={{ fontWeight: 700 }}>
                                아고다에서 찾기
                              </span>
                            </a>

                            {plannerData.destination === "오키나와" || plannerData.destination === "제주도" ? (
                              <a
                                href={`https://www.yeogi.com/`}
                                target="_blank"
                                rel="noreferrer"
                                className="glass-card"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 10,
                                  textDecoration: "none",
                                  color: "white",
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: "16px",
                                }}
                              >
                                <Hotel size={20} />{" "}
                                <span style={{ fontWeight: 700 }}>
                                  여기어때
                                </span>
                              </a>
                            ) : (
                              <a
                                href={`https://www.booking.com/searchresults.html?ss=${plannerData.destination}`}
                                target="_blank"
                                rel="noreferrer"
                                className="glass-card"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 10,
                                  textDecoration: "none",
                                  color: "white",
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: "16px",
                                }}
                              >
                                <Hotel size={20} />{" "}
                                <span style={{ fontWeight: 700 }}>
                                  부킹닷컴
                                </span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Manual Entry Form */}
                        <div
                          className="glass-card"
                          style={{
                            padding: "30px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 15,
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: "5px",
                            }}
                          >
                            <Hotel size={24} color="var(--primary)" />
                            <span style={{ fontWeight: 800, fontSize: "18px" }}>
                              숙소 직접 등록
                            </span>
                          </div>

                          {/* Hotel Name + Verify Button */}
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1, position: "relative" }}>
                              <input
                                id="acc-name"
                                type="text"
                                placeholder="숙소 이름 (예: 힐튼 나하)"
                                defaultValue={validatedHotel?.name || ""}
                                onChange={() => {
                                  if (validatedHotel) setValidatedHotel(null);
                                  if (hotelAddStatus !== "IDLE")
                                    setHotelAddStatus("IDLE");
                                }}
                                style={{
                                  width: "100%",
                                  padding: "16px",
                                  borderRadius: "12px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  background: "rgba(255,255,255,0.05)",
                                  color: "white",
                                  fontSize: "15px",
                                }}
                              />
                            </div>
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    "acc-name",
                                  ) as HTMLInputElement
                                ).value;
                                validateHotel(name);
                              }}
                              disabled={isValidatingHotel}
                              style={{
                                padding: "0 20px",
                                borderRadius: "12px",
                                border: "none",
                                background: isValidatingHotel
                                  ? "rgba(255,255,255,0.1)"
                                  : "var(--primary)",
                                color: "black",
                                fontWeight: 800,
                                cursor: isValidatingHotel ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.2s",
                              }}
                            >
                              {isValidatingHotel ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Search size={16} />
                              )}
                              {isValidatingHotel ? "확인 중" : "검증"}
                            </button>
                          </div>

                          {/* Validation Result info */}
                          {validatedHotel && (
                            <div
                              style={{
                                padding: "12px 15px",
                                background: "rgba(52, 211, 153, 0.1)",
                                border: "1px solid rgba(52, 211, 153, 0.3)",
                                borderRadius: "10px",
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <CheckCircle size={16} color="#34d399" />
                              <div style={{ fontSize: "13px" }}>
                                <span
                                  style={{ fontWeight: 800, color: "#34d399" }}
                                >
                                  [{validatedHotel.area}]
                                </span>{" "}
                                {validatedHotel.desc}
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 2 }}>
                              <label
                                style={{
                                  fontSize: "12px",
                                  marginBottom: "4px",
                                  opacity: 0.7,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <CalendarIcon size={12} /> 체크인
                              </label>
                              <div style={{ position: "relative" }}>
                                <input
                                  id="acc-start"
                                  type="date"
                                  defaultValue={
                                    plannerData.startDate ||
                                    new Date().toISOString().split("T")[0]
                                  }
                                  onClick={(e) =>
                                    (e.target as any).showPicker?.()
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "12px",
                                    paddingLeft: "40px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "white",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                  }}
                                />
                                <CalendarIcon
                                  size={16}
                                  style={{
                                    position: "absolute",
                                    left: 14,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    opacity: 0.5,
                                    pointerEvents: "none",
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "12px",
                                  marginBottom: "4px",
                                  opacity: 0.7,
                                }}
                              >
                                박수
                              </label>
                              <select
                                id="acc-nights"
                                style={{
                                  width: "100%",
                                  padding: "12px",
                                  borderRadius: "10px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  background: "rgba(255,255,255,0.05)",
                                  color: "white",
                                  fontSize: "14px",
                                  cursor: "pointer",
                                  height: "45px", // Match Date Input
                                }}
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <option
                                    key={n}
                                    value={n}
                                    style={{ background: "#1a1a1a" }}
                                  >
                                    {n}박
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById(
                                "acc-name",
                              ) as HTMLInputElement;
                              const name =
                                validatedHotel?.name || nameInput.value;
                              const start = (
                                document.getElementById(
                                  "acc-start",
                                ) as HTMLInputElement
                              ).value;
                              const nights = parseInt(
                                (
                                  document.getElementById(
                                    "acc-nights",
                                  ) as HTMLSelectElement
                                ).value,
                              );

                              if (!name)
                                return showToast(
                                  "숙소 이름을 입력해 주세요.",
                                  "error",
                                );
                              if (!start)
                                return showToast(
                                  "체크인 날짜를 선택해 주세요.",
                                  "error",
                                );

                              // Calculate End Date
                              const startDate = new Date(start);
                              const endDateObj = new Date(startDate);
                              endDateObj.setDate(startDate.getDate() + nights);
                              const end = endDateObj
                                .toISOString()
                                .split("T")[0];

                              const newAcc = {
                                name,
                                startDate: start,
                                endDate: end,
                                nights,
                                area: validatedHotel?.area || "",
                              };
                              setPlannerData({
                                ...plannerData,
                                accommodations: [
                                  ...plannerData.accommodations,
                                  newAcc,
                                ],
                              });
                              nameInput.value = "";
                              setValidatedHotel(null);
                              setHotelAddStatus("IDLE");
                              showToast(
                                "숙소가 목록에 추가되었습니다.",
                                "success",
                              );
                            }}
                            style={{
                              width: "100%",
                              padding: "16px",
                              borderRadius: "12px",
                              background: "var(--primary)",
                              color: "black",
                              border: "none",
                              fontWeight: 800,
                              cursor: "pointer",
                              marginTop: "10px",
                            }}
                          >
                            <Plus
                              size={18}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "5px",
                              }}
                            />{" "}
                            목록에 추가
                          </button>
                        </div>

                        {/* Recommended Hotels List */}
                        {recommendedHotels.length > 0 && (
                          <div style={{ marginBottom: "30px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "15px",
                              }}
                            >
                              <h4
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  margin: 0,
                                }}
                              >
                                AI 추천 숙소
                              </h4>
                              <button
                                onClick={() => setRecommendedHotels([])}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text-dim)",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                닫기
                              </button>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                overflowX: "auto",
                                paddingBottom: "10px",
                              }}
                            >
                              {recommendedHotels.map((h, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    const nameInput = document.getElementById(
                                      "acc-name",
                                    ) as HTMLInputElement;
                                    if (nameInput) nameInput.value = h.name;
                                    showToast(
                                      `${h.name}를 선택했습니다. 날짜를 확인하고 추가하세요.`,
                                    );
                                  }}
                                  className="glass-card"
                                  style={{
                                    minWidth: "200px",
                                    padding: "15px",
                                    background: "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "14px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    {h.name}
                                  </div>
                                  <div
                                    style={{ fontSize: "11px", opacity: 0.6 }}
                                  >
                                    {h.desc}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Added Accommodations List */}
                        {plannerData.accommodations.length > 0 && (
                          <div style={{ marginBottom: "30px" }}>
                            <h4
                              style={{
                                fontSize: "16px",
                                fontWeight: 800,
                                marginBottom: "15px",
                                paddingLeft: "5px",
                              }}
                            >
                              등록된 숙소 ({plannerData.accommodations.length})
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              {plannerData.accommodations.map(
                                (acc: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="glass-card"
                                    style={{
                                      padding: "15px 20px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 15,
                                        alignItems: "center",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "10px",
                                          background: "rgba(255,255,255,0.05)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "var(--primary)",
                                        }}
                                      >
                                        <Hotel size={20} />
                                      </div>
                                      <div>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: 800,
                                              fontSize: "16px",
                                            }}
                                          >
                                            {acc.name}
                                          </div>
                                          {acc.area && (
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                background:
                                                  "rgba(0,212,255,0.1)",
                                                color: "var(--primary)",
                                                fontWeight: 700,
                                              }}
                                            >
                                              {acc.area}
                                            </span>
                                          )}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            opacity: 0.6,
                                            marginTop: 4,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                          }}
                                        >
                                          <CalendarIcon size={12} />{" "}
                                          {acc.startDate} ~ {acc.endDate} (
                                          {acc.nights || 1}박)
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmModal({
                                          isOpen: true,
                                          title: "숙소 삭제",
                                          message: `${acc.name} 숙소를 목록에서 삭제하시겠습니까?`,
                                          onConfirm: () => {
                                            setPlannerData({
                                              ...plannerData,
                                              accommodations:
                                                plannerData.accommodations.filter(
                                                  (_: any, i: number) =>
                                                    i !== idx,
                                                ),
                                            });
                                            setDeleteConfirmModal({
                                              isOpen: false,
                                              title: "",
                                              message: "",
                                              onConfirm: () => { },
                                            });
                                            showToast(
                                              "숙소가 삭제되었습니다.",
                                            );
                                          },
                                        });
                                      }}
                                      style={{
                                        background: "rgba(255,78,80,0.1)",
                                        border: "none",
                                        color: "#ff4e50",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                      }}
                                      onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "rgba(255,78,80,0.2)")
                                      }
                                      onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "rgba(255,78,80,0.1)")
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "15px" }}>
                          <button
                            onClick={() => setPlannerStep(4)}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "transparent",
                              color: "white",
                              fontWeight: 800,
                            }}
                          >
                            이전 (장소 선택)
                          </button>
                          <button
                            onClick={() => {
                              const draft = {
                                step: 5,
                                data: plannerData,
                                selectedIds: selectedPlaceIds,
                                updated: Date.now(),
                                isEdit: tripToEdit ? true : false,
                                originalTripId: tripToEdit?.id,
                              };
                              localStorage.setItem(
                                "trip_draft_v1",
                                JSON.stringify(draft),
                              );
                              showToast("숙소 설정이 임시 저장되었습니다.");
                            }}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.3)",
                              background: "rgba(255,255,255,0.15)",
                              color: "white",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <Save size={18} /> 저장
                          </button>
                          <button
                            onClick={() => {
                              // Save logic for Accom
                              const draft = {
                                data: plannerData,
                                step: 5,
                                selectedIds: selectedPlaceIds,
                                updated: Date.now(),
                              };
                              localStorage.setItem(
                                "trip_draft_v1",
                                JSON.stringify(draft),
                              );

                              // Open Review Modal
                              setIsReviewModalOpen(true);
                            }}
                            style={{
                              flex: 2,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "none",
                              background: "var(--primary)",
                              color: "black",
                              fontWeight: 900,
                              fontSize: "18px",
                            }}
                          >
                            최종 검토 및 생성
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {plannerStep === 6 && (
                      <motion.div
                        key="planner-step-8"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: "40px",
                            justifyContent: "center",
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  i === 9
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                              }}
                            />
                          ))}
                        </div>
                        <Loader2
                          size={100}
                          className="animate-spin"
                          style={{
                            color: "var(--primary)",
                            marginBottom: "32px",
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          AI가 최적의 동선을 설계 중입니다...
                        </h2>
                        <p
                          style={{
                            opacity: 0.6,
                            marginTop: "16px",
                            textAlign: "center",
                          }}
                        >
                          사용자의 취향과 명소 간의 실시간 거리를 분석하
                          있습니다.
                        </p>
                      </motion.div>
                    )}

                    {plannerStep === 7 && (
                      <motion.div
                        key="planner-step-9"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          width: "100%",
                          maxWidth: "600px",
                          textAlign: "left",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            marginBottom: "10px",
                            textAlign: "center",
                          }}
                        >
                          설계된 맞춤 코스 프리뷰
                        </h2>
                        <p
                          style={{
                            opacity: 0.6,
                            marginBottom: "32px",
                            textAlign: "center",
                          }}
                        >
                          발행 전 마지막으로 코스를 확인해 주세요.
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            marginBottom: "40px",
                          }}
                        >
                          {dynamicAttractions
                            .filter((a) => selectedPlaceIds.includes(a.id))
                            .map((rec, i) => (
                              <div
                                key={rec.id}
                                className="glass-card"
                                style={{
                                  padding: "18px 20px",
                                  display: "flex",
                                  gap: "16px",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "12px",
                                    background: "var(--primary)",
                                    color: "black",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 900,
                                  }}
                                >
                                  {i + 1}
                                </div>
                                <div style={{ textAlign: "left" }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "18px",
                                    }}
                                  >
                                    {rec.name}
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", opacity: 0.6 }}
                                  >
                                    {rec.desc}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: "15px" }}>
                          <button
                            onClick={() => setPlannerStep(5)}
                            style={{
                              flex: 1,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "transparent",
                              color: "white",
                              fontWeight: 800,
                            }}
                          >
                            장소 수
                          </button>
                          <button
                            onClick={() => {
                              if (
                                !trip ||
                                !trip.points ||
                                trip.points.length === 0
                              ) {
                                showToast(
                                  "여행 데이터가 충분히 생성되지 않았습니다. 다시 시도해 주세요.",
                                );
                                return;
                              }
                              const publishedTrip = {
                                ...trip,
                                title: trip.metadata.title,
                                period: trip.metadata.period,
                                destination: trip.metadata.destination,
                                color: trip.metadata.primaryColor || "#00d4ff",
                                id: `trip-${Date.now()}`,
                                progress: 0,
                              };
                              setTrips((prevTrips) => [
                                publishedTrip,
                                ...prevTrips,
                              ]);
                              localStorage.removeItem("trip_draft_v1");
                              setIsPlanning(false);
                              setPlannerStep(0);
                              setView("landing");
                              showToast(
                                "여행 가이드 발행이 완료되었습니다! 목록에서 확인해 보세요.",
                              );
                            }}
                            style={{
                              flex: 2,
                              padding: "20px",
                              borderRadius: "20px",
                              border: "none",
                              background: "var(--primary)",
                              color: "black",
                              fontWeight: 900,
                              fontSize: "18px",
                            }}
                          >
                            가이드 발행하기
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attraction Detail Modal */}
        <AnimatePresence>
          {activePlannerDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.9)",
                backdropFilter: "blur(15px)",
                zIndex: 6000000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              onClick={() => setActivePlannerDetail(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="glass-card"
                style={{
                  width: "100%",
                  maxWidth: "800px",
                  height: "85vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: "40px 40px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <button
                    onClick={() => setActivePlannerDetail(null)}
                    style={{
                      position: "absolute",
                      top: 30,
                      right: 30,
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      padding: "10px",
                      borderRadius: "50%",
                      zIndex: 10,
                    }}
                  >
                    <X size={24} />
                  </button>
                  <div
                    style={{
                      color: "var(--primary)",
                      fontWeight: 900,
                      fontSize: "14px",
                      letterSpacing: "2px",
                      marginBottom: "12px",
                    }}
                  >
                    ATTRACTION REPORT
                  </div>
                  <h3
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      marginBottom: "8px",
                    }}
                  >
                    {activePlannerDetail.name}
                  </h3>
                  <p
                    style={{ fontSize: "18px", opacity: 0.7, fontWeight: 500 }}
                  >
                    {activePlannerDetail.desc}
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "40px",
                    textAlign: "left",
                  }}
                >
                  <section>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: "16px",
                        color: "var(--primary)",
                      }}
                    >
                      <FileText size={20} />
                      <h4 style={{ fontSize: "20px", fontWeight: 800 }}>
                        장소 개요
                      </h4>
                    </div>
                    <p
                      style={{
                        lineHeight: 1.8,
                        fontSize: "16px",
                        opacity: 0.9,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {activePlannerDetail.longDesc}
                    </p>
                  </section>
                  {activePlannerDetail.history && (
                    <section>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: "16px",
                          color: "var(--primary)",
                        }}
                      >
                        <Clock size={20} />
                        <h4 style={{ fontSize: "20px", fontWeight: 800 }}>
                          역사와 유래
                        </h4>
                      </div>
                      <p
                        style={{
                          lineHeight: 1.8,
                          fontSize: "16px",
                          opacity: 0.9,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {activePlannerDetail.history}
                      </p>
                    </section>
                  )}
                  {activePlannerDetail.attractions && (
                    <section>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: "16px",
                          color: "var(--primary)",
                        }}
                      >
                        <Camera size={20} />
                        <h4 style={{ fontSize: "20px", fontWeight: 800 }}>
                          주요 볼거리
                        </h4>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {activePlannerDetail.attractions.map(
                          (item: string, i: number) => (
                            <div
                              key={i}
                              style={{
                                padding: "16px",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: "12px",
                                borderLeft: "3px solid var(--primary)",
                                fontSize: "15px",
                                lineHeight: 1.6,
                              }}
                            >
                              {item}
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  )}
                  <section
                    style={{
                      padding: "24px",
                      background: "rgba(0,212,255,0.05)",
                      borderRadius: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: "12px",
                      }}
                    >
                      <MapPin size={20} color="var(--primary)" />
                      <h4 style={{ fontSize: "18px", fontWeight: 800 }}>
                        찾아가는 법
                      </h4>
                    </div>
                    <p style={{ fontSize: "15px", opacity: 0.8 }}>
                      {activePlannerDetail.access}
                    </p>
                  </section>
                </div>
                <div
                  style={{
                    padding: "30px 40px",
                    background: "rgba(255,255,255,0.02)",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <a
                    href={activePlannerDetail.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "18px 24px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/search?q=${encodeURIComponent(activePlannerDetail.name)}`,
                        "_blank",
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "18px",
                      borderRadius: "16px",
                      background: "#3b82f6",
                      color: "white",
                      fontWeight: 900,
                      border: "none",
                      fontSize: "15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Search size={18} /> 구글 검색
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://search.naver.com/search.naver?query=${encodeURIComponent(activePlannerDetail.name)}`,
                        "_blank",
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "18px",
                      borderRadius: "16px",
                      background: "#03C75A",
                      color: "white",
                      fontWeight: 900,
                      border: "none",
                      fontSize: "15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Search size={18} /> 네이버 검색
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {view === "debug" && (
          <motion.div
            key="debug"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overview-content"
            style={{
              padding: "20px",
              height: "100%",
              overflowY: "auto",
              background: "#0f172a",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h1 style={{ color: "var(--primary)", margin: 0 }}>
                Storage Debugger
              </h1>
              <button
                onClick={() => setView("landing")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "none",
                }}
              >
                돌아가기
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => {
                  if (window.confirm("초기화하시겠습니까?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#ff4e50",
                  color: "white",
                  border: "none",
                }}
              >
                전체 초기화
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  color: "black",
                  border: "none",
                }}
              >
                새로고침
              </button>
            </div>
            <section style={{ marginBottom: 30 }}>
              <h3 style={{ color: "white" }}>user_trips_v2</h3>
              <pre
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: 15,
                  borderRadius: 10,
                  overflowX: "auto",
                  fontSize: 12,
                  color: "#10b981",
                }}
              >
                {JSON.stringify(
                  JSON.parse(localStorage.getItem("user_trips_v2") || "[]"),
                  null,
                  2,
                )}
              </pre>
            </section>
          </motion.div>
        )}

      </div>

      {/* Re-Edit Confirmation Modal */}
      {
        isReEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 9000000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: "100%",
                maxWidth: "450px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "24px",
                padding: "32px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(0,212,255,0.1)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Edit3 size={30} />
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  marginBottom: "12px",
                  color: "white",
                }}
              >
                경로를 재설정하시겠습니까?
              </h2>
              <p
                style={{
                  opacity: 0.7,
                  marginBottom: "32px",
                  lineHeight: 1.6,
                  fontSize: "15px",
                }}
              >
                선택한 여행의 장소 선택 단계로 이동합니다.
                <br />
                기존 동선 순서는 초기화되며, AI가 새로운 최적의 경로를 제안합니다.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setIsReEditModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (tripToEdit) {
                      setPlannerData({
                        title: tripToEdit.metadata.title,
                        destination: tripToEdit.metadata.destination,
                        startDate: tripToEdit.metadata.startDate,
                        endDate: tripToEdit.metadata.endDate,
                        arrivalTime: "10:00",
                        departureTime: "18:00",
                        departurePoint: "",
                        entryPoint: "",
                        travelMode: "plane",
                        useRentalCar: tripToEdit.metadata.useRentalCar || false,
                        companion: "",
                        transport: tripToEdit.metadata.useRentalCar
                          ? "rental"
                          : "bus", // Simplification
                        pace: "standard",
                        theme: "",
                        accommodations: tripToEdit.metadata.accommodations || [],
                      });

                      // Load existing places from the trip into dynamicAttractions
                      const existingPlaces = tripToEdit.points.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category || "attraction",
                        desc: p.description || p.desc || "",
                        longDesc: p.longDesc || p.description || "",
                        rating: p.rating,
                        reviewCount: p.reviewCount,
                        priceLevel: p.priceLevel || "",
                        coordinates: p.coordinates || { lat: 0, lng: 0 },
                        link: p.link || "",
                        access: p.access || "",
                        history: p.history || "",
                        attractions: p.attractions || [],
                      }));

                      setDynamicAttractions(existingPlaces);

                      const existingIds = tripToEdit.points.map((p: any) => p.id);
                      setSelectedPlaceIds(existingIds);
                      setAttractionCategoryFilter("all"); // Request: Default to 'all'

                      // Fetch additional attractions if needed
                      fetchAttractionsWithAI(tripToEdit.metadata.destination);

                      setIsPlanning(true);
                      setPlannerStep(7);
                      setIsReEditModalOpen(false);
                      // Keep tripToEdit for save logic
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "16px",
                    background: "var(--primary)",
                    color: "black",
                    border: "none",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  확인 및 수정
                </button>
              </div>
            </motion.div>
          </motion.div>
        )
      }

      {/* 상세 정보 모달 (Review Modal) */}
      {
        isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(20, 20, 25, 0.95)",
              backdropFilter: "blur(20px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "600px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "32px",
                textAlign: "left",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <CheckCircle color="var(--primary)" size={32} /> 경로 검토 및 요청
              </h2>

              {(() => {
                const start = new Date(plannerData.startDate);
                const end = new Date(plannerData.endDate);
                const days =
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
                const placeCount = selectedPlaceIds.length;
                let minPerDay = 3;
                let maxPerDay = 6;
                if (plannerData.pace === "slow") {
                  minPerDay = 1;
                  maxPerDay = 3;
                }
                if (plannerData.pace === "fast") {
                  minPerDay = 5;
                  maxPerDay = 8;
                }
                const minTotal = Math.floor(days * minPerDay);
                const maxTotal = Math.ceil(days * maxPerDay);
                let color = "#4ade80";
                let msg = "여행 기간과 선택한 장소의 비율이 적합합니다!";
                let subMsg = "AI가 최적의 동선을 짤 수 있습니다.";
                if (placeCount < minTotal) {
                  color = "#fbbf24";
                  msg = `여행 기간(${days}일)에 비해 장소가 조금 부족해 보여요.`;
                  subMsg = `(${minTotal}곳 이상 권장, 현재 ${placeCount}곳) 남는 시간은 어떻게 보낼까요?`;
                } else if (placeCount > maxTotal) {
                  color = "#f87171";
                  msg = `여행 기간(${days}일)에 비해 장소가 너무 많습니다.`;
                  subMsg = `(${maxTotal}곳 이하 권장, 현재 ${placeCount}곳) 일부 장소는 제외될 수 있습니다.`;
                }

                return (
                  <div
                    style={{
                      marginBottom: "32px",
                      padding: "20px",
                      borderRadius: "16px",
                      background: `${color}15`,
                      border: `1px solid ${color}40`,
                      display: "flex",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{ width: 4, background: color, borderRadius: "4px" }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: color,
                          marginBottom: "4px",
                        }}
                      >
                        {msg}
                      </div>
                      <div style={{ fontSize: "14px", opacity: 0.8 }}>
                        {subMsg}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: "12px",
                  fontSize: "16px",
                }}
              >
                AI에게 특별히 요청할 사항이 있나요?
              </label>
              <textarea
                placeholder="예: 맛집 위주로 짜줘 등..."
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "15px",
                  resize: "none",
                  marginBottom: "32px",
                }}
              />

              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "18px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    generatePlanWithAI();
                  }}
                  style={{
                    flex: 2,
                    padding: "18px",
                    borderRadius: "16px",
                    background: "var(--primary)",
                    border: "none",
                    color: "black",
                    fontWeight: 800,
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Sparkles size={20} /> AI 코스 생성 시작
                </button>
              </div>
            </div>
          </motion.div>
        )
      }


      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        title={deleteConfirmModal.title}
        message={deleteConfirmModal.message}
        onConfirm={() => {
          deleteConfirmModal.onConfirm();
          setDeleteConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => { },
          });
        }}
        onCancel={() =>
          setDeleteConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => { },
          })
        }
        confirmText="삭제"
        cancelText="취소"
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onClose={closeToast} />
    </>
  );
};

export default App;
