import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { usePlanner } from "../../../contexts/PlannerContext";

import { StepIndicator } from "../../Common/StepIndicator";

export const PlannerStep7: React.FC = () => {
    const {
        generatePlanWithAI,
        showToast,
        setPlannerStep,
        isPlanning,
        isDestinationValidated,
        customAiPrompt,
    } = usePlanner();

    const generationStarted = React.useRef(false); // 🚀 Prevention of double/unwanted calls

    useEffect(() => {
        if (!isPlanning || !isDestinationValidated || generationStarted.current) return;

        let isMounted = true;
        const startGeneration = async () => {
            generationStarted.current = true;
            try {
                console.log("[경로생성] 🚀 AI 일정 생성을 시작합니다...");
                await generatePlanWithAI(customAiPrompt);
            } catch (err) {
                if (isMounted) {
                    console.error("[경로생성] 🔥 오류 발생:", err);
                    showToast("경로 생성 중 오류가 발생했습니다.", "error");
                    setPlannerStep(6);
                }
            }
        };

        const timer = setTimeout(() => {
            startGeneration();
        }, 500);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [isPlanning, isDestinationValidated, customAiPrompt, generatePlanWithAI, setPlannerStep, showToast]);

    return (
        <motion.div
            key="planner-step-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "700px" }}
        >
            <StepIndicator currentStep={7} totalSteps={8} />

            <div style={{ padding: "60px 0", textAlign: "center" }}>
                <Loader2
                    size={100}
                    className="animate-spin"
                    style={{
                        color: "var(--primary)",
                        marginBottom: "40px",
                        display: "inline-block"
                    }}
                />
                <h2
                    style={{
                        fontSize: "32px",
                        fontWeight: 900,
                        marginBottom: "16px"
                    }}
                >
                    AI가 최적의 동선을 설계 중입니다...
                </h2>
                <p
                    style={{
                        opacity: 0.6,
                        fontSize: "16px",
                        marginBottom: "40px"
                    }}
                >
                    사용자의 취향과 서류 정보를 분석하여 상세 일정을 구성하고 있습니다.
                </p>

            </div>
        </motion.div>
    );
};
