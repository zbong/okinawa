import React from 'react';
import { motion } from 'framer-motion';
import {
    User, Heart, Users, Minus, Plus, Clock, Save
} from 'lucide-react';
import { usePlanner } from '../../../contexts/PlannerContext';
import { StepIndicator } from '../../Common/StepIndicator';

export const PlannerStep2: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        setPlannerStep,
        setIsPlanning,
        showToast,
        saveDraft
    } = usePlanner();

    return (
        <motion.div
            key="planner-step-2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "700px" }}
        >
            <StepIndicator currentStep={2} totalSteps={6} />

            <h2
                style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    marginBottom: "30px",
                    textAlign: "center",
                }}
            >
                어떤 스타일의 여행인가요?
            </h2>

            <div style={{ marginBottom: "40px" }}>
                <label
                    style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 700,
                        marginBottom: "15px",
                        color: "var(--primary)",
                        opacity: 0.8,
                    }}
                >
                    누구와 함께 가시나요?
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: "15px",
                        marginBottom: "20px",
                    }}
                >
                    {[
                        {
                            id: "alone",
                            label: "혼자서",
                            icon: <User size={24} />,
                        },
                        {
                            id: "couple",
                            label: "연인과",
                            icon: <Heart size={24} />,
                        },
                        {
                            id: "friends",
                            label: "친구와",
                            icon: <Users size={24} />,
                        },
                        {
                            id: "family",
                            label: "가족과",
                            icon: <Users size={24} />,
                        },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() =>
                                setPlannerData({
                                    ...plannerData,
                                    companion: item.id,
                                })
                            }
                            style={{
                                padding: "20px",
                                borderRadius: "16px",
                                border:
                                    plannerData.companion === item.id
                                        ? "2px solid var(--primary)"
                                        : "1px solid rgba(255,255,255,0.1)",
                                background:
                                    plannerData.companion === item.id
                                        ? "rgba(0,212,255,0.1)"
                                        : "rgba(255,255,255,0.03)",
                                color: "white",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            {item.icon}
                            <span
                                style={{ fontWeight: 700, fontSize: "13px" }}
                            >
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        padding: "20px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700, color: "white" }}>
                            총 여행 인원
                        </div>
                        <div style={{ fontSize: "13px", opacity: 0.6 }}>
                            항공권 및 숙소가 검색에 반영됩니다
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                        }}
                    >
                        <button
                            onClick={() =>
                                setPlannerData({
                                    ...plannerData,
                                    peopleCount: Math.max(
                                        1,
                                        (plannerData.peopleCount || 1) - 1,
                                    ),
                                })
                            }
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.1)",
                                border: "none",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <Minus size={18} />
                        </button>
                        <span
                            style={{
                                fontSize: "20px",
                                fontWeight: 800,
                                width: 30,
                                textAlign: "center",
                            }}
                        >
                            {plannerData.peopleCount || 1}
                        </span>
                        <button
                            onClick={() =>
                                setPlannerData({
                                    ...plannerData,
                                    peopleCount:
                                        (plannerData.peopleCount || 1) + 1,
                                })
                            }
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "12px",
                                background: "var(--primary)",
                                border: "none",
                                color: "black",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px" }}>
                <label
                    style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 700,
                        marginBottom: "15px",
                        color: "var(--primary)",
                        opacity: 0.8,
                    }}
                >
                    여행 속도는 어떤가요?
                </label>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {[
                        {
                            id: "slow",
                            label: "여유롭게 (하루 2-3곳)",
                            icon: <Clock size={20} />,
                        },
                        {
                            id: "normal",
                            label: "적당히 (하루 4-5곳)",
                            icon: <Clock size={20} />,
                        },
                        {
                            id: "fast",
                            label: "빡빡하게 (하루 6곳+)",
                            icon: <Clock size={20} />,
                        },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() =>
                                setPlannerData({
                                    ...plannerData,
                                    pace: item.id as any,
                                })
                            }
                            style={{
                                padding: "16px 20px",
                                borderRadius: "16px",
                                border:
                                    plannerData.pace === item.id
                                        ? "2px solid var(--primary)"
                                        : "1px solid rgba(255,255,255,0.1)",
                                background:
                                    plannerData.pace === item.id
                                        ? "rgba(0,212,255,0.1)"
                                        : "rgba(255,255,255,0.03)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                gap: 15,
                                textAlign: "left",
                            }}
                        >
                            {item.icon}
                            <span style={{ fontWeight: 700 }}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
                <button
                    onClick={() => setPlannerStep(1)}
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
                    이전
                </button>
                <button
                    onClick={() => {
                        if (saveDraft(2)) {
                            showToast('여행이 임시 저장되었습니다', 'success');
                            setTimeout(() => setIsPlanning(false), 500);
                        }
                    }}
                    style={{
                        flex: 1,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.3)",
                        background: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                    }}
                >
                    <Save size={18} /> 저장
                </button>
                <button
                    onClick={() => setPlannerStep(3)}
                    disabled={
                        !plannerData.companion || !plannerData.pace
                    }
                    style={{
                        flex: 2,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "none",
                        background:
                            plannerData.companion && plannerData.pace
                                ? "var(--primary)"
                                : "rgba(255,255,255,0.1)",
                        color:
                            plannerData.companion && plannerData.pace
                                ? "black"
                                : "rgba(255,255,255,0.3)",
                        fontWeight: 800,
                    }}
                >
                    다음 단계로 (교통편)
                </button>
            </div>
        </motion.div>
    );
};
