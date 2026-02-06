import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const PlannerStep6: React.FC = () => {
    return (
        <motion.div
            key="planner-step-6"
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
                사용자의 취향과 명소 간의 실시간 거리를 분석하고 있습니다.
            </p>
        </motion.div>
    );
};
