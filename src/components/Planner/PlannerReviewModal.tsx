import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";

export const PlannerReviewModal: React.FC = () => {
    const {
        isReviewModalOpen,
        setIsReviewModalOpen,
        plannerData,
        selectedPlaceIds,
        customAiPrompt,
        setCustomAiPrompt,
        generatePlanWithAI
    } = usePlanner();

    if (!isReviewModalOpen) return null;

    return (
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
                zIndex: 6000000,
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
                    const days = !isNaN(start.getTime()) && !isNaN(end.getTime())
                        ? (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
                        : 0;

                    const missingItems = [];
                    if (!plannerData.destination) missingItems.push("여행지");
                    if (!plannerData.startDate || !plannerData.endDate) missingItems.push("여행 일정(날짜)");
                    if (selectedPlaceIds.length === 0) missingItems.push("방문할 장소(최소 1곳)");

                    if (missingItems.length > 0) {
                        return (
                            <div
                                style={{
                                    marginBottom: "32px",
                                    padding: "20px",
                                    borderRadius: "16px",
                                    background: "rgba(248, 113, 113, 0.1)",
                                    border: "1px solid rgba(248, 113, 113, 0.3)",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "18px",
                                        color: "#f87171",
                                        marginBottom: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    데이터가 부족합니다
                                </div>
                                <div style={{ fontSize: "14px", opacity: 0.8, color: "#f87171", lineHeight: 1.6 }}>
                                    가이드를 발행하려면 다음 정보가 추가로 필요합니다:<br />
                                    <span style={{ fontWeight: 700 }}>• {missingItems.join(", ")}</span>
                                    <div style={{ marginTop: "8px", fontSize: "12px" }}>
                                        각 단계로 돌아가 누락된 정보를 채워주세요.
                                    </div>
                                </div>
                            </div>
                        );
                    }

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
                        opacity: (plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0) ? 1 : 0.5
                    }}
                >
                    AI에게 특별히 요청할 사항이 있나요?
                </label>
                <textarea
                    placeholder="예: 맛집 위주로 짜줘 등..."
                    disabled={!(plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0)}
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
                        opacity: (plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0) ? 1 : 0.5
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
                        disabled={!(plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0)}
                        onClick={() => {
                            setIsReviewModalOpen(false);
                            generatePlanWithAI();
                        }}
                        style={{
                            flex: 2,
                            padding: "18px",
                            borderRadius: "16px",
                            background: (plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0)
                                ? "var(--primary)"
                                : "rgba(255,255,255,0.05)",
                            border: "none",
                            color: (plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0)
                                ? "black"
                                : "rgba(255,255,255,0.3)",
                            fontWeight: 800,
                            fontSize: "16px",
                            cursor: (plannerData.destination && plannerData.startDate && plannerData.endDate && selectedPlaceIds.length > 0)
                                ? "pointer"
                                : "not-allowed",
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
    );
};
