import React from 'react';
import { motion } from 'framer-motion';

interface DebugViewProps {
    onBack: () => void;
}

/**
 * Storage Debugger View
 * Displays localStorage data for debugging purposes
 */
export const DebugView: React.FC<DebugViewProps> = ({ onBack }) => {
    return (
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
                    onClick={onBack}
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
    );
};
