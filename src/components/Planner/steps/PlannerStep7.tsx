import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { usePlanner } from "../../../contexts/PlannerContext";

export const PlannerStep7: React.FC = () => {
    const { generatePlanWithAI, showToast, setPlannerStep } = usePlanner();

    useEffect(() => {
        let isMounted = true;
        const startGeneration = async () => {
            try {
                // Actual call to start AI generation
                await generatePlanWithAI();
            } catch (err) {
                if (isMounted) {
                    showToast("경로 생성 중 오류가 발생했습니다.", "error");
                    setPlannerStep(6); // Go back to summary
                }
            }
        };

        const timer = setTimeout(() => {
            startGeneration();
        }, 500); // Small delay for smooth transition

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    return (
        <motion.div
            key="planner-step-7"
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
                                i === 7 // Current step index representation
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
                사용자의 취향과 서류 정보를 분석하여 상세 일정을 구성하고 있습니다.
            </p>
        </motion.div>
    );
};
