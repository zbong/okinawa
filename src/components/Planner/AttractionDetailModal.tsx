import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Clock, Camera, MapPin, Search, Info } from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";

export const AttractionDetailModal: React.FC = () => {
    const { theme, activeTab, activePlannerDetail, setActivePlannerDetail } = usePlanner();

    useEffect(() => {
        setActivePlannerDetail(null);
    }, [activeTab, setActivePlannerDetail]);

    const isLight = theme === 'light';

    // Check if there is any detailed content
    const hasDetailedContent = activePlannerDetail && (
        activePlannerDetail.longDesc ||
        activePlannerDetail.history ||
        (activePlannerDetail.attractions && activePlannerDetail.attractions.length > 0) ||
        activePlannerDetail.access
    );

    return (
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
                        background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.9)",
                        backdropFilter: "blur(15px)",
                        zIndex: 6000000,
                        display: "flex",
                        alignItems: "flex-end", // Mobile friendly: starts from bottom
                        justifyContent: "center",
                    }}
                    onClick={() => setActivePlannerDetail(null)}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="glass-card"
                        style={{
                            width: "100%",
                            maxWidth: "500px", // App standard width
                            height: "92vh", // Almost full screen on mobile
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            background: "var(--sheet-bg)",
                            border: "1px solid var(--glass-border)",
                            boxShadow: "var(--card-shadow)",
                            borderRadius: "24px 24px 0 0", // Bottom sheet style
                            margin: "0 auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Section */}
                        <div
                            style={{
                                padding: "24px 20px 16px",
                                borderBottom: "1px solid var(--glass-border)",
                                position: "relative"
                            }}
                        >
                            <div style={{
                                width: 40,
                                height: 4,
                                background: "var(--text-dim)",
                                opacity: 0.2,
                                borderRadius: 2,
                                margin: "0 auto 16px"
                            }} />

                            <button
                                onClick={() => setActivePlannerDetail(null)}
                                style={{
                                    position: "absolute",
                                    top: 20,
                                    right: 20,
                                    background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    zIndex: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <X size={20} />
                            </button>
                            <div
                                style={{
                                    color: "var(--primary)",
                                    fontWeight: 900,
                                    fontSize: "12px",
                                    letterSpacing: "1.5px",
                                    marginBottom: "8px",
                                }}
                            >
                                ATTRACTION REPORT
                            </div>
                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 900,
                                    marginBottom: "6px",
                                    color: "var(--text-primary)",
                                    lineHeight: 1.2
                                }}
                            >
                                {activePlannerDetail.name}
                            </h3>
                            <p
                                style={{ fontSize: "14px", opacity: 0.7, fontWeight: 500, color: "var(--text-secondary)" }}
                            >
                                {activePlannerDetail.desc || activePlannerDetail.description}
                            </p>
                        </div>

                        {/* Content Area */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "30px",
                                textAlign: "left",
                            }}
                        >
                            {!hasDetailedContent ? (
                                <div style={{
                                    padding: "40px 20px",
                                    textAlign: "center",
                                    background: "rgba(0,0,0,0.02)",
                                    borderRadius: "20px",
                                    border: "1px dashed var(--glass-border)"
                                }}>
                                    <Info size={40} color="var(--text-dim)" style={{ marginBottom: 16, opacity: 0.5 }} />
                                    <h4 style={{ color: "var(--text-primary)", marginBottom: 8, fontWeight: 700 }}>상세 정보가 없습니다</h4>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
                                        이 정보는 AI 플래너를 통해 여행을 생성할 때 자동으로 채워집니다.<br />
                                        직접 추가한 장소이거나 기존 일정인 경우, 아래 버튼들을 활용해 정보를 확인해 주세요.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {activePlannerDetail.longDesc && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <FileText size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>장소 개요</h4>
                                            </div>
                                            <p style={{ lineHeight: 1.7, fontSize: "15px", color: "var(--text-primary)", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                                                {activePlannerDetail.longDesc}
                                            </p>
                                        </section>
                                    )}

                                    {activePlannerDetail.history && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <Clock size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>역사와 유래</h4>
                                            </div>
                                            <p style={{ lineHeight: 1.7, fontSize: "15px", color: "var(--text-primary)", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                                                {activePlannerDetail.history}
                                            </p>
                                        </section>
                                    )}

                                    {activePlannerDetail.attractions && activePlannerDetail.attractions.length > 0 && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <Camera size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>주요 볼거리</h4>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {activePlannerDetail.attractions.map((item: string, i: number) => (
                                                    <div key={i} style={{
                                                        padding: "14px",
                                                        background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                                                        borderRadius: "12px",
                                                        borderLeft: "3px solid var(--primary)",
                                                        fontSize: "14px",
                                                        lineHeight: 1.5,
                                                        color: "var(--text-primary)"
                                                    }}>
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {activePlannerDetail.access && (
                                        <section style={{ padding: "20px", background: "rgba(0,212,255,0.05)", borderRadius: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px" }}>
                                                <MapPin size={18} color="var(--primary)" />
                                                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>찾아가는 법</h4>
                                            </div>
                                            <p style={{ fontSize: "14px", opacity: 0.8, color: "var(--text-primary)", lineHeight: 1.5 }}>
                                                {activePlannerDetail.access}
                                            </p>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div
                            style={{
                                padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
                                background: "var(--sheet-bg)",
                                borderTop: "1px solid var(--glass-border)",
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={() => {
                                    const lat = activePlannerDetail.coordinates?.lat;
                                    const lng = activePlannerDetail.coordinates?.lng;
                                    const url = (lat && lng)
                                        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlannerDetail.name)}`;
                                    window.open(url, "_blank");
                                }}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    borderRadius: "12px",
                                    background: "var(--primary)",
                                    color: "var(--text-on-primary)",
                                    fontWeight: 800,
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <MapPin size={16} /> 길찾기
                            </button>
                            <button
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activePlannerDetail.name)}`, "_blank")}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    borderRadius: "12px",
                                    background: "#3b82f6",
                                    color: "white",
                                    fontWeight: 800,
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Search size={16} /> 구글
                            </button>
                            <button
                                onClick={() => window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(activePlannerDetail.name)}`, "_blank")}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    borderRadius: "12px",
                                    background: "#03C75A",
                                    color: "white",
                                    fontWeight: 800,
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Search size={16} /> 네이버
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
