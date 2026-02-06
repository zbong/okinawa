import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Clock, Camera, MapPin, ExternalLink, Search } from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";

export const AttractionDetailModal: React.FC = () => {
    const { activePlannerDetail, setActivePlannerDetail } = usePlanner();

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
    );
};
