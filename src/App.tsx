import React, { useEffect } from "react";
import "./styles/design-system.css";
import { okinawaTrip } from "./data";
import { TripPlan } from "./types";
import { supabase } from "./utils/supabase";
import { usePlanner } from "./contexts/PlannerContext";
import { Toast } from "./components/Common/Toast";
import { ConfirmModal } from "./components/Common/ConfirmModal";
import { ScheduleTab } from "./components/Schedule/ScheduleTab";
import { SummaryTab } from "./components/Summary/SummaryTab";
import { DocumentsTab } from "./components/Documents/DocumentsTab";
import { ExchangeTab } from "./components/Exchange/ExchangeTab";
import { PhrasebookTab } from "./components/Phrasebook/PhrasebookTab";
import { Ocr_labTab } from "./components/Ocr_lab/Ocr_labTab";
import { PlannerOnboarding } from "./components/Planner/PlannerOnboarding";
import { PlannerStep1 } from "./components/Planner/PlannerStep1";
import { PlannerStep2 } from "./components/Planner/PlannerStep2";
import { PlannerStep3 } from "./components/Planner/PlannerStep3";
import { PlannerStep4 } from "./components/Planner/PlannerStep4";
import { PlannerStep5 } from "./components/Planner/PlannerStep5";
import { PlannerStep6 } from "./components/Planner/PlannerStep6";
import { PlannerStep7 } from "./components/Planner/PlannerStep7";
import { PlannerStep8 } from "./components/Planner/PlannerStep8";
import { PlannerReviewModal } from "./components/Planner/PlannerReviewModal";
import { PlannerReEditModal } from "./components/Planner/PlannerReEditModal";
import { AttractionDetailModal } from "./components/Planner/AttractionDetailModal";
import { LocationBottomSheet } from "./components/LocationBottomSheet";
// GoogleGenerativeAI moved to context
import {
  Loader2, Sparkles, LogOut, LogIn, User, UserPlus,
  LayoutDashboard, Calendar, RefreshCw, Sun, Moon,
  FileText, Edit3, X, MapPin, Trash2, MessageCircle
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





const App: React.FC = () => {
  const {
    view, setView, activeTab, setActiveTab,
    theme, toggleTheme, trips, setTrips, setTrip,
    setSelectedPoint,
    isPlanning, setIsPlanning,
    setPlannerStep,
    plannerStep,
    setPlannerData,
    setDynamicAttractions,
    setSelectedPlaceIds,
    setDeleteConfirmModal,
    setActivePlannerDetail,
    // States
    analyzedFiles, ticketFileInputRef,
    isOcrLoading,
    isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser,
    toasts, showToast, closeToast, deleteConfirmModal,
    setIsReEditModalOpen, setTripToEdit,
    convert, speak,
    handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile,
    startNewPlanning,
    selectedFile,
    setSelectedFile,
    shareToKakao
  } = usePlanner();

  // Handle Shared Link (Supabase)
  useEffect(() => {
    const handleSharedLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('id');

      if (shareId) {
        showToast("공유된 일정을 불러오는 중입니다...", "info");
        try {
          const { data, error } = await supabase
            .from('shared_trips')
            .select('trip_data')
            .eq('id', shareId)
            .single();

          if (error) throw error;
          if (data && data.trip_data) {
            setTrip(data.trip_data);
            setView("app");
            setActiveTab("summary");
            showToast("여행 가이드를 성공적으로 불러왔습니다!", "success");
            // URL 파라미터 깔끔하게 제거 (새로고침 시 중복 로딩 방지)
            window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
          }
        } catch (err) {
          console.error("Failed to load shared trip:", err);
          showToast("여행 정보를 불러오는데 실패했습니다.", "error");
        }
      }
    };
    handleSharedLink();
  }, [setTrip, setView, setActiveTab]);


  // DEBUG: Global Error Handler & Render Log
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) =>
      console.error("🔥🔥🔥 GLOBAL ERROR:", event.error);
    const promiseHandler = (event: PromiseRejectionEvent) =>
      console.error("🔥🔥🔥 UNHANDLED PROMISE:", event.reason);
    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", promiseHandler);

    // One-time cleanup of "typing trash" in localStorage
    const cleanupStorage = () => {
      try {
        const publishedDestinations = trips.map((t: any) => t.metadata?.destination || t.destination).filter(Boolean);
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;

          const prefixes = ["files_", "logs_", "reviews_", "checklist_", "points_order_"];
          const matchingPrefix = prefixes.find(p => key.startsWith(p));

          if (matchingPrefix) {
            const dest = key.replace(matchingPrefix, "");
            // Only keep data for published trips
            if (!publishedDestinations.includes(dest)) {
              keysToRemove.push(key);
            }
          }
        }

        if (localStorage.getItem("trips_v1")) {
          keysToRemove.push("trips_v1");
        }

        if (keysToRemove.length > 0) {
          console.log(`🧹 Cleaning up ${keysToRemove.length} storage keys...`, keysToRemove);
          keysToRemove.forEach(k => localStorage.removeItem(k));
        }
      } catch (e) {
        console.error("Cleanup failed:", e);
      }
    };
    cleanupStorage();

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
                padding: "30px 20px",
                background:
                  "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
                zIndex: 999999,
                position: "relative",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  textAlign: "center",
                  width: "100%",
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
                      marginTop: "20px",
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
                            // 1. Find in published trips (check root title and metadata title)
                            let oki1: any = trips.find((t: any) =>
                              t.title === "오키1" ||
                              t.metadata?.title === "오키1"
                            );

                            // 2. If not found, check localStorage drafts
                            if (!oki1) {
                              const draftKeys = Object.keys(localStorage).filter(k => k.startsWith("trip_draft_v1"));
                              for (const key of draftKeys) {
                                try {
                                  const saved = localStorage.getItem(key);
                                  if (!saved) continue;
                                  const draft = JSON.parse(saved);
                                  if (draft.data?.title === "오키1") {
                                    oki1 = draft;
                                    break;
                                  }
                                } catch (e) { }
                              }
                            }

                            if (!oki1) {
                              showToast("'오키1'이라는 제목의 여행이나 초안을 찾을 수 없습니다. (현재 목록의 제목을 확인해 주세요)", "error");
                              return;
                            }

                            // Create 4 Drafts (not published trips)
                            let successCount = 0;
                            [2, 3, 4, 5].forEach(num => {
                              try {
                                const newDraft = {
                                  step: oki1.step !== undefined ? oki1.step : 0,
                                  data: oki1.data ? { ...oki1.data, title: `오키${num}` } : { ...(oki1.metadata || {}), title: `오키${num}` },
                                  selectedIds: oki1.selectedIds || (oki1.points ? oki1.points.map((p: any) => p.id) : []),
                                  attractions: oki1.attractions || [],
                                  hotels: oki1.hotels || [],
                                  updated: Date.now()
                                };
                                localStorage.setItem(`trip_draft_v1_copy_${num}`, JSON.stringify(newDraft));
                                successCount++;
                              } catch (e) {
                                console.error(`Failed to copy draft ${num}:`, e);
                              }
                            });

                            if (successCount > 0) {
                              showToast(`오키2~5 임시 저장본이 ${successCount}개 생성되었습니다.`, "success");
                              // Trigger state update to refresh draft list in UI if needed
                              window.location.reload();
                            } else {
                              showToast("용량 부족으로 복사본을 생성하지 못했습니다.", "error");
                            }
                          }}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            padding: "10px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "var(--text-dim)",
                            fontWeight: "bold",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <RefreshCw size={16} /> 데이터 복사
                        </button>
                        <button
                          onClick={() => startNewPlanning()}
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
                      {(() => {
                        const allDraftKeys = Object.keys(localStorage).filter(
                          (k) => k.startsWith("trip_draft_v1"),
                        );
                        if (allDraftKeys.length === 0) return null;

                        const drafts = allDraftKeys
                          .map((key) => {
                            try {
                              const rawDraft = JSON.parse(
                                localStorage.getItem(key)!,
                              );
                              const draft = rawDraft.data
                                ? rawDraft
                                : { data: rawDraft, step: 0 };
                              return { ...draft, _key: key };
                            } catch (e) {
                              return null;
                            }
                          })
                          .filter(Boolean) as any[];

                        // Deduplicate by title, letting the main trip_draft_v1 take priority
                        const seenTitles = new Set();
                        const uniqueDrafts = drafts.sort((a, b) => {
                          if (a._key === "trip_draft_v1") return -1;
                          if (b._key === "trip_draft_v1") return 1;
                          return 0;
                        }).filter(d => {
                          const title = d.data?.title || `${d.data?.destination || "여행지"} 여행`;
                          if (seenTitles.has(title)) return false;
                          seenTitles.add(title);
                          return true;
                        });

                        if (uniqueDrafts.length === 0) return null;

                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 16,
                            }}
                          >
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
                              작성 중인 여행 ({uniqueDrafts.length})
                              <div
                                style={{
                                  height: 1,
                                  flex: 1,
                                  background:
                                    "linear-gradient(to left, rgba(245,158,11,0.5), transparent)",
                                }}
                              />
                            </div>
                            {uniqueDrafts.map((draft) => {
                              const dest =
                                draft.data.destination || "여행지 미정";
                              const step = draft.step || 0;
                              return (
                                <motion.div
                                  key={draft._key}
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
                                      {draft.data.title || `${dest} 여행`}{" "}
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
                                          localStorage.removeItem(draft._key);
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
                              );
                            })}
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
                          const key = t.groupId || `year - ${year} `;
                          const title = t.groupTitle || `${year} 년`;

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
                                          // DO NOT merge with okinawaTrip for user-defined trips
                                          // Create a clean base plan instead
                                          const basePlan: TripPlan = {
                                            ...tripItem,
                                            id: tripItem.id,
                                            metadata: {
                                              destination: tripItem.destination || tripItem.metadata?.destination || "Destination",
                                              title: tripItem.title || tripItem.metadata?.title || "Untitled Trip",
                                              period: tripItem.period || tripItem.metadata?.period || "Dates TBD",
                                              startDate: tripItem.startDate || tripItem.metadata?.startDate || "",
                                              endDate: tripItem.endDate || tripItem.metadata?.endDate || "",
                                              useRentalCar: tripItem.useRentalCar || tripItem.metadata?.useRentalCar || false,
                                              primaryColor: tripItem.color || tripItem.metadata?.primaryColor || "#00d4ff"
                                            },
                                            points: tripItem.points || [],
                                            days: tripItem.days || [],
                                            speechData: okinawaTrip.speechData,
                                            defaultFiles: []
                                          };

                                          setTrip(basePlan);
                                          setView("app");
                                        } catch (err) {
                                          console.error("Failed to load trip:", err);
                                          alert("여행 데이터를 불러오는 중 오류가 발생했습니다.");
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
                                        background: `${displayColor} 20`,
                                        border: `1px solid ${displayColor} 50`,
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
                                          shareToKakao(tripItem);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          background: "#FEE500",
                                          borderRadius: "20px",
                                          border: "none",
                                          color: "#191919",
                                          fontSize: "12px",
                                          fontWeight: 800,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px"
                                        }}
                                      >
                                        <MessageCircle size={14} fill="#191919" /> 카톡보내기
                                      </button>
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
                overflowY: "auto"
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
                justifyContent: "flex-start",
                background:
                  "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
                overflowY: "auto"
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
                    console.log("🔄 Navigating to landing via X button...");
                    setSelectedPoint(null);
                    setActivePlannerDetail(null);
                    setView("landing");
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
                  className={`tab ${activeTab === "summary" ? "active" : ""} `}
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
                  className={`tab ${activeTab === "schedule" ? "active" : ""} `}
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
                  className={`tab ${activeTab === "files" ? "active" : ""} `}
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
                  className={`tab ${activeTab === "exchange" ? "active" : ""} `}
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
                  className={`tab ${activeTab === "speech" ? "active" : ""} `}
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
              <LocationBottomSheet />
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
                    {plannerStep === 0 && <PlannerOnboarding />}
                    {plannerStep === 1 && <PlannerStep1 />}
                    {plannerStep === 2 && <PlannerStep2 />}
                    {plannerStep === 3 && <PlannerStep3 />}
                    {plannerStep === 4 && <PlannerStep4 />}
                    {plannerStep === 5 && <PlannerStep5 />}
                    {plannerStep === 6 && <PlannerStep6 />}
                    {plannerStep === 7 && <PlannerStep7 />}
                    {plannerStep === 8 && <PlannerStep8 />}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attraction Detail Modal */}
        <AttractionDetailModal />

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
        )
        }

      </div >

      {/* Re-Edit Confirmation Modal */}
      < PlannerReEditModal />

      {/* Review Modal */}
      < PlannerReviewModal />


      {/* Delete Confirmation Modal */}
      < ConfirmModal
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
        confirmText={deleteConfirmModal.confirmText || "삭제"}
        cancelText={deleteConfirmModal.cancelText || "취소"}
      />

      {/* Full Screen Image Preview Overlay */}
      {selectedFile && (
        <div
          className="fullscreen-overlay"
          onClick={() => setSelectedFile(null)}
          style={{ cursor: 'pointer' }}
        >
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 3001,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X color="white" size={24} />
          </div>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={selectedFile.data || selectedFile.path}
            alt={selectedFile.name}
            className="fullscreen-img"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </div>
      )}

      {/* Toast Notifications */}
      < Toast toasts={toasts} onClose={closeToast} />
    </>
  );
};

export default App;
