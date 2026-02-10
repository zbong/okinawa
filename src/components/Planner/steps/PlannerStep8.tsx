import React from "react";
import { DEFAULT_SPEECH_DATA } from "../../../utils/defaults";
import { motion } from "framer-motion";
import { Hotel, MapPin, Calendar, Plane, Clock, Save } from "lucide-react";
import { usePlanner } from "../../../contexts/PlannerContext";

export const PlannerStep8: React.FC = () => {
    const {
        trip,
        setPlannerStep,
        showToast,
        setIsPlanning,
        setView,
        saveDraft,
        publishTrip,
        resetPlannerState,
        customFiles,
        analyzedFiles,
        setActiveTab
    } = usePlanner();

    const displayPoints = trip?.points || [];

    return (
        <motion.div
            key="planner-step-8"
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
                AI가 제안하는 상세 일정과 배정된 숙소를 확인해 보세요.
            </p>

            {/* Trip Info Card */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--primary)', background: 'rgba(0, 212, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>PREVIEW</div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: 'white' }}>{trip?.metadata?.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, fontSize: '14px' }}>
                    <Calendar size={16} />
                    <span>{trip?.metadata?.period}</span>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "40px",
                }}
            >
                {displayPoints.length > 0 ? (
                    displayPoints.map((item: any, i: number) => {
                        const isStay = item.type === "stay";
                        const isLogistics = item.type === "logistics";

                        let bgColor = "var(--primary)";
                        let icon = <MapPin size={20} />;
                        let label = "";

                        if (isStay) {
                            bgColor = "#818cf8";
                            icon = <Hotel size={20} />;
                            label = "STAY";
                        } else if (isLogistics) {
                            bgColor = "#10b981";
                            icon = <Plane size={20} />;
                            label = "LOGISTICS";
                        }

                        return (
                            <div
                                key={i}
                                className="glass-card"
                                style={{
                                    padding: "18px 20px",
                                    display: "flex",
                                    gap: "16px",
                                    alignItems: "center",
                                    border: isStay ? "1px solid rgba(129, 140, 248, 0.3)" : isLogistics ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                                    background: isStay ? "rgba(129, 140, 248, 0.05)" : isLogistics ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.05)"
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "12px",
                                        background: bgColor,
                                        color: (isStay || isLogistics) ? "white" : "black",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 900,
                                        flexShrink: 0
                                    }}
                                >
                                    {icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <div style={{ fontWeight: 800, fontSize: "17px" }}>{item.name}</div>
                                        <span style={{ fontSize: '11px', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            Day {item.day || 1}
                                        </span>
                                        {item.time && (
                                            <span style={{ fontSize: '11px', opacity: 0.8, color: "var(--primary)", display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {item.time}
                                            </span>
                                        )}
                                        {label && (
                                            <span style={{ fontSize: '10px', color: bgColor, fontWeight: 900, letterSpacing: '0.5px' }}>{label}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: "13px", opacity: 0.6, marginTop: 4 }}>
                                        {item.desc}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>일정 데이터가 없습니다.</div>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => setPlannerStep(6)}
                        style={{
                            flex: 1,
                            padding: "18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.05)",
                            color: "white",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        이전 단계
                    </button>
                    <button
                        onClick={() => {
                            if (saveDraft(8)) {
                                showToast("현재 기획 상태가 초안으로 저장되었습니다.", "success");
                                setIsPlanning(false);
                                setPlannerStep(0);
                                setView("landing");
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: "18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.1)",
                            color: "white",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8
                        }}
                    >
                        <Save size={16} /> 현재까지의 기획 저장
                    </button>
                </div>
                <button
                    onClick={async () => {
                        if (!trip || !trip.points || trip.points.length === 0) {
                            showToast(
                                "일정 데이터가 생성되지 않았습니다. 이전 단계로 돌아가 AI 코스 생성을 다시 시도해 주세요.",
                                "error"
                            );
                            return;
                        }
                        const publishedTrip = {
                            ...trip,
                            title: trip.metadata?.title || "나의 멋진 여행",
                            period: trip.metadata?.period || "기간 미정",
                            destination: trip.metadata?.destination || "목적지 미정",
                            color: trip.metadata?.primaryColor || "#00d4ff",
                            id: `trip-${Date.now()}`,
                            progress: 0,
                            customFiles: customFiles || [],
                            analyzedFiles: analyzedFiles || [],
                            speechData: DEFAULT_SPEECH_DATA
                        };

                        try {
                            // 1. Publish to Supabase
                            await publishTrip(publishedTrip);

                            // 2. Clear Draft from Supabase/Local
                            await resetPlannerState();

                            // 3. UI Transition
                            setActiveTab("summary");
                            setIsPlanning(false);
                            setPlannerStep(0);
                            setView("landing");

                            showToast("여행 가이드 발행이 완료되었습니다! 목록에서 확인해 보세요.", "success");
                        } catch (e) {
                            console.error("Failed to publish trip:", e);
                            showToast("가이드 발행 중 오류가 발생했습니다. 다시 시도해 주세요.", "error");
                        }
                    }}
                    style={{
                        width: "100%",
                        padding: "20px",
                        borderRadius: "20px",
                        border: "none",
                        background: "var(--primary)",
                        color: "black",
                        fontWeight: 900,
                        fontSize: "18px",
                        cursor: "pointer",
                        zIndex: 10,
                        position: "relative",
                        marginTop: "10px",
                        boxShadow: "0 10px 25px rgba(0, 212, 255, 0.3)"
                    }}
                >
                    최종 가이드 생성 및 저장
                </button>
            </div>
        </motion.div>
    );
};
