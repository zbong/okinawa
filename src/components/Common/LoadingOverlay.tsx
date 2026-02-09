import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText } from 'lucide-react';

interface LoadingOverlayProps {
    isLoading: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
    return (
        <AnimatePresence>
            {isLoading && (
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
    );
};
