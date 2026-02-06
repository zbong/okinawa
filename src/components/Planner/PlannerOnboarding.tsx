import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const PlannerOnboarding: React.FC = () => {
    const { setPlannerStep, setIsPlanning } = usePlanner();

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <div
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: "40px",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 30px",
                    color: "black",
                    boxShadow: "0 20px 50px rgba(0,212,255,0.4)",
                    transform: "rotate(-5deg)",
                }}
            >
                <Sparkles size={60} />
            </div>
            <h1
                style={{
                    fontSize: "36px",
                    fontWeight: 900,
                    marginBottom: "16px",
                }}
            >
                프리미엄 AI 여행 설계
            </h1>
            <p
                style={{
                    opacity: 0.7,
                    marginBottom: "48px",
                    lineHeight: 1.6,
                    fontSize: "19px",
                }}
            >
                당신의 취향을 분석하여 최적의 경로를 제안합니다.
            </p>
            <button
                onClick={() => setPlannerStep(1)}
                className="primary-button"
                style={{
                    padding: "20px 48px",
                    fontSize: "20px",
                    borderRadius: "40px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    margin: "0 auto",
                }}
            >
                설계 시작하기 <ArrowRight size={22} />
            </button>

            <button
                onClick={() => setIsPlanning(false)}
                style={{
                    marginTop: "24px",
                    padding: "16px 32px",
                    borderRadius: "30px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "16px",
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                취소하고 돌아가기
            </button>
        </motion.div>
    );
};
