import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, LogOut, Edit3, RefreshCw, FileText, X, MapPin, Link, Trash2 } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';
import { AppHeader } from './AppHeader';
import { AuthButtons } from './AuthButtons';
import { LoginView } from './LoginView'; // Import LoginView
import { TripPlan } from '../../types';

export const LandingPage: React.FC = () => {
    const {
        view, setView,
        trips, setTrips,
        setTrip, setAllPoints,
        isPlanning, setIsPlanning,
        setPlannerStep,
        setPlannerData,
        setDynamicAttractions,
        setSelectedPlaceIds,
        setPlannerCustomFiles,
        setPlannerAnalyzedFiles,
        setRecommendedHotels,
        setHotelStrategy,
        setDeleteConfirmModal,
        isLoggedIn, setIsLoggedIn,
        currentUser, setCurrentUser,
        showToast,
        setActiveTab,
        setIsReEditModalOpen, setTripToEdit,
        handleMultipleOcr,
        startNewPlanning,
        shareToKakao: copyShareLink,
        signOut,
        deleteTrip
    } = usePlanner();

    const APP_VERSION = "v1.3.0 (Build: 01:05)";

    // Prevent unused variable errors for hidden features
    void FileText;
    void handleMultipleOcr;

    // Render Login View if view state is 'login'
    if (view === "login") {
        return <LoginView />;
    }

    if (view !== "landing" || isPlanning) return null;

    return (
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
                <AppHeader />

                {!isLoggedIn ? (
                    <AuthButtons
                        onLogin={() => setView("login")}
                        onSignup={() => setView("login")} // Redirect signup to login view as well for now
                    />
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
                                    {currentUser?.email || currentUser?.name}님의 여행들
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>

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
                                    onClick={async () => {
                                        await signOut();
                                        // Compatible with previous state but signOut handles real auth
                                        setIsLoggedIn(false);
                                        setCurrentUser(null);
                                        showToast("로그아웃 되었습니다.");
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
                                {/* <button
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
                                /> */}
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

                                // Deduplicate by title
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
                                                        // 0. Prevent self-reload backup loop
                                                        if (draft._key !== "trip_draft_v1") {
                                                            // 1. Auto-Backup current active draft (trip_draft_v1) to prevent data loss
                                                            try {
                                                                const current = localStorage.getItem("trip_draft_v1");
                                                                if (current) {
                                                                    const currentData = JSON.parse(current);
                                                                    // Only backup if it has some data
                                                                    if (currentData.data?.title || currentData.data?.destination) {
                                                                        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                                                                        const backupKey = `trip_draft_v1_autobackup_${timestamp}`;
                                                                        localStorage.setItem(backupKey, current);
                                                                        showToast("현재 작업 중이던 내용을 백업했습니다.", "info");
                                                                    }
                                                                }
                                                            } catch (e) {
                                                                console.error("Backup failed during switch:", e);
                                                            }
                                                        }

                                                        // Resume Draft
                                                        setIsPlanning(true);
                                                        setPlannerStep(draft.step || 0);
                                                        setPlannerData(draft.data);
                                                        if (draft.selectedIds)
                                                            setSelectedPlaceIds(draft.selectedIds);
                                                        if (draft.attractions)
                                                            setDynamicAttractions(draft.attractions);
                                                        if (draft.customFiles)
                                                            setPlannerCustomFiles(draft.customFiles);
                                                        if (draft.analyzedFiles)
                                                            setPlannerAnalyzedFiles(draft.analyzedFiles);
                                                        if (draft.trip) {
                                                            setTrip(draft.trip);
                                                            setAllPoints(draft.trip.points || []);
                                                        }
                                                        if (draft.hotels)
                                                            setRecommendedHotels(draft.hotels);
                                                        if (draft.hotelStrategy)
                                                            setHotelStrategy(draft.hotelStrategy);

                                                        setView("app");
                                                        setActiveTab("summary");
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
                                                            if (tripItem.points && tripItem.points.length > 0) {
                                                                try {
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
                                                                        speechData: tripItem.speechData || [],
                                                                        customFiles: tripItem.customFiles || [],
                                                                        analyzedFiles: tripItem.analyzedFiles || [],
                                                                        defaultFiles: []
                                                                    };

                                                                    setTrip(basePlan);
                                                                    setAllPoints(basePlan.points || []);
                                                                    setActiveTab("summary");
                                                                    setView("app");
                                                                } catch (err) {
                                                                    console.error("Failed to load trip:", err);
                                                                    showToast("데이터 형식에 오류가 있습니다.", "error");
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
                                                                    copyShareLink(tripItem);
                                                                }}
                                                                style={{
                                                                    padding: "8px 12px",
                                                                    background: "rgba(0, 212, 255, 0.1)",
                                                                    borderRadius: "20px",
                                                                    border: "1px solid rgba(0, 212, 255, 0.3)",
                                                                    color: "#00d4ff",
                                                                    fontSize: "12px",
                                                                    fontWeight: 800,
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px"
                                                                }}
                                                            >
                                                                <Link size={14} /> 링크 복사
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
                                                                            deleteTrip(tripItem.id);
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
            {/* Build Version Tag */}
            <div style={{
                marginTop: "20px",
                padding: "10px 0",
                fontSize: "10px",
                color: "var(--text-dim)",
                textAlign: "center",
                opacity: 0.6
            }}>
                {APP_VERSION}
            </div>
        </motion.div>
    );
}
