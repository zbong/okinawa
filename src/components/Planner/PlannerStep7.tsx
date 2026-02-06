import React from "react";
import { motion } from "framer-motion";
import { usePlanner } from "../../contexts/PlannerContext";

export const PlannerStep7: React.FC = () => {
    const {
        trip,
        dynamicAttractions,
        selectedPlaceIds,
        setPlannerStep,
        showToast,
        setTrips,
        setIsPlanning,
        setView
    } = usePlanner();

    return (
        <motion.div
            key="planner-step-7"
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
                    장소 수정
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
                            title: trip.metadata?.title || "나의 멋진 여행",
                            period: trip.metadata?.period || "기간 미정",
                            destination: trip.metadata?.destination || "목적지 미정",
                            color: trip.metadata?.primaryColor || "#00d4ff",
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
    );
};
