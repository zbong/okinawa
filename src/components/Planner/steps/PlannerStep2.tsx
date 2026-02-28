import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    User, Heart, Users, Minus, Plus, Save
} from 'lucide-react';
import { usePlanner } from '../../../contexts/PlannerContext';
import { StepIndicator } from '../../Common/StepIndicator';

export const PlannerStep2: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        setPlannerStep,
        setIsPlanning,
        setView,
        showToast,
        saveDraft,
        user,
        trip
    } = usePlanner();

    React.useEffect(() => {
        const syncFromDB = async () => {
            if (!user || !trip?.id) return;
            try {
                const { supabase } = await import('../../../utils/supabase');
                const { data } = await supabase.from('trips').select('metadata').eq('id', trip.id).single();
                if (data?.metadata) {
                    setPlannerData(prev => ({
                        ...prev,
                        companion: data.metadata.companion || prev.companion
                    }));
                    console.log("🔄 DB 싱크 완료(Step 2): 화면 진입 시 최신 상태로 초기화");
                }
            } catch (e) {
                console.error("DB Sync error:", e);
            }
        };
        syncFromDB();
    }, [user, trip?.id, setPlannerData]);

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <motion.div
            key="planner-step-2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "700px" }}
        >
            <StepIndicator currentStep={2} totalSteps={8} />

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

            {/* Portal Action Buttons */}
            {isMounted && document.getElementById('planner-nav-actions') && createPortal(
                <div style={{ display: "flex", gap: "15px", width: "100%" }}>
                    <button
                        onClick={() => setPlannerStep(1)}
                        style={{
                            flex: 1,
                            padding: "18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.05)",
                            color: "white",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                    >
                        이전
                    </button>
                    <button
                        onClick={async () => {
                            await saveDraft(2);
                            showToast('여행이 임시 저장되었습니다', 'success');
                            setTimeout(() => {
                                setIsPlanning(false);
                                setView("landing");
                            }, 500);
                        }}
                        style={{
                            flex: 1,
                            padding: "18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.1)",
                            color: "white",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            cursor: "pointer",
                        }}
                    >
                        <Save size={18} /> 저장
                    </button>
                    <button
                        onClick={() => setPlannerStep(3)}
                        disabled={!plannerData.companion}
                        style={{
                            flex: 2,
                            padding: "18px",
                            borderRadius: "18px",
                            border: "none",
                            background:
                                plannerData.companion
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.05)",
                            color:
                                plannerData.companion
                                    ? "black"
                                    : "rgba(255,255,255,0.2)",
                            fontWeight: 800,
                            cursor: plannerData.companion ? "pointer" : "not-allowed",
                            boxShadow: plannerData.companion ? "0 8px 25px rgba(0, 212, 255, 0.3)" : "none"
                        }}
                    >
                        다음 단계로 (교통편)
                    </button>
                </div>,
                document.getElementById('planner-nav-actions')!
            )}
        </motion.div>
    );
};
