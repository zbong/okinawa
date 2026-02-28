import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    Loader2, Camera, Utensils, Compass, MapPin, CheckCircle, Star, Plus, AlertCircle, Save, Trash2, RefreshCw
} from 'lucide-react';
import { usePlanner } from '../../../contexts/PlannerContext';
import { StepIndicator } from '../../Common/StepIndicator';

export const PlannerStep4: React.FC = () => {
    const {
        plannerData,
        isSearchingAttractions,
        dynamicAttractions,
        setDynamicAttractions,
        fetchAttractionsWithAI,
        attractionCategoryFilter,
        selectedPlaceIds,
        setActivePlannerDetail,
        setSelectedPlaceIds,
        isValidatingPlace,
        validateAndAddPlace,
        showToast,
        setPlannerStep,
        setDeleteConfirmModal,
        setIsPlanning,
        isPlaceAddedError,
        isPlaceAddedSuccess,
        setAttractionCategoryFilter,
        saveDraft,
        setView,
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
                    if (data.metadata.attractions) setDynamicAttractions(data.metadata.attractions);
                    if (data.metadata.selectedIds) setSelectedPlaceIds(data.metadata.selectedIds);
                    console.log("🔄 DB 싱크 완료(Step 4): 화면 진입 시 최신 상태로 초기화");
                }
            } catch (e) {
                console.error("DB Sync error:", e);
            }
        };
        syncFromDB();
    }, [user, trip?.id, setDynamicAttractions, setSelectedPlaceIds]);

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (!isSearchingAttractions && dynamicAttractions.length === 0 && plannerData.destination) {
            fetchAttractionsWithAI(plannerData.destination);
        }
    }, [plannerData.destination, dynamicAttractions.length, fetchAttractionsWithAI, isSearchingAttractions]);

    return (
        <motion.div
            key="planner-step-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "900px" }}
        >
            <StepIndicator currentStep={4} totalSteps={8} />
            <h2
                style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    marginBottom: "10px",
                    textAlign: "center",
                }}
            >
                {plannerData.destination}의 어디를 가고 싶으신가요?
            </h2>

            {isSearchingAttractions ? (
                <div
                    style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 100,
                        background: "var(--sheet-bg)",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "24px",
                        textAlign: "center"
                    }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        style={{
                            width: 80, height: 80,
                            border: "4px solid var(--glass-border)",
                            borderTopColor: "var(--primary)",
                            borderRadius: "50%",
                            marginBottom: "24px"
                        }}
                    />
                    <h3 style={{ fontSize: "24px", fontWeight: 'bold', marginBottom: "12px" }}>
                        AI가 완벽한 명소를 찾고 있습니다
                    </h3>
                    <p style={{ opacity: 0.6, maxWidth: "300px", lineHeight: 1.6 }}>
                        {plannerData.destination}의 날씨, 동행자 정보, 테마를 분석하여 최적의 장소를 큐레이션 중입니다.
                    </p>

                    <div style={{ marginTop: "30px", fontSize: "12px", opacity: 0.4, letterSpacing: "2px" }}>
                        GEMINI 2.0 FLASH
                    </div>
                </div>
            ) : dynamicAttractions.length === 0 ? (
                <div
                    style={{ padding: "60px 0", textAlign: "center" }}
                >
                    <p style={{ opacity: 0.6, marginBottom: "24px", fontSize: "16px" }}>
                        {plannerData.destination}의 AI 추천 명소를 확인해보시겠어요?
                    </p>
                    <button
                        onClick={() =>
                            fetchAttractionsWithAI(plannerData.destination)
                        }
                        style={{
                            padding: "16px 32px",
                            borderRadius: "16px",
                            border: "none",
                            background: "var(--primary)",
                            color: "black",
                            fontWeight: 'bold',
                            fontSize: "16px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0, 212, 255, 0.2)"
                        }}
                    >
                        AI 명소 추천받기
                    </button>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginBottom: "20px",
                            justifyContent: "center",
                        }}
                    >
                        {[
                            { id: "all", label: "전체", icon: null },
                            { id: "sightseeing", label: "관광명소", icon: <Camera size={16} /> },
                            { id: "activity", label: "체험/활동", icon: <Compass size={16} /> },
                            { id: "food", label: "식당/맛집", icon: <Utensils size={16} /> },
                            { id: "cafe", label: "카페", icon: <Star size={16} fill="currentColor" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setAttractionCategoryFilter(tab.id as any)}
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background: attractionCategoryFilter === tab.id ? "var(--primary)" : "rgba(255,255,255,0.1)",
                                    color: attractionCategoryFilter === tab.id ? "black" : "white",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px", paddingRight: "4px" }}>
                        <button
                            onClick={() => fetchAttractionsWithAI(plannerData.destination, true)}
                            style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                color: "#cbd5e1",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s"
                            }}
                        >
                            <RefreshCw size={14} /> 추천 목록 갱신
                        </button>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "20px",
                            marginBottom: "20px",
                            padding: "10px",
                            textAlign: "left",
                        }}
                    >
                        <div style={{ display: 'contents' }}>
                            {dynamicAttractions
                                .filter((item) => attractionCategoryFilter === "all" || item.category === attractionCategoryFilter)
                                .map((item) => {
                                    const isSelected = selectedPlaceIds.includes(item.id);
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            onClick={() => {
                                                setSelectedPlaceIds(isSelected ? selectedPlaceIds.filter((id) => id !== item.id) : [...selectedPlaceIds, item.id]);
                                            }}
                                            className="glass-card"
                                            style={{
                                                padding: "20px",
                                                borderRadius: "20px",
                                                border: isSelected ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                                                background: isSelected ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                                                cursor: "pointer",
                                                position: "relative",
                                                transition: "border 0.2s, background 0.2s",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "12px",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center" }}>
                                                        <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", color: "#cbd5e1" }}>
                                                            {item.category === "food" ? "식당" : item.category === "cafe" ? "카페" : item.category === "activity" ? "체험/활동" : item.category === "custom" ? "직접 입력" : "관광"}
                                                        </span>
                                                        {item.priceLevel && (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                                {item.priceLevel === "Expensive" ? "" : item.priceLevel === "Moderate" ? "" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', fontSize: "18px", marginBottom: "4px", color: isSelected ? "var(--primary)" : "white" }}>
                                                        {item.name}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirmModal({
                                                                isOpen: true,
                                                                title: "장소 삭제",
                                                                message: `${item.name}을(를) 목록에서 삭제하시겠습니까?`,
                                                                onConfirm: () => {
                                                                    setDynamicAttractions((prev) => prev.filter((p) => p.id !== item.id));
                                                                    setSelectedPlaceIds((prev) => prev.filter((id) => id !== item.id));
                                                                    setDeleteConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => { } });
                                                                },
                                                            });
                                                        }}
                                                        style={{
                                                            width: "24px", height: "24px", borderRadius: "50%",
                                                            background: "rgba(255,0,0,0.1)", display: "flex",
                                                            alignItems: "center", justifyContent: "center",
                                                            color: "#ff6b6b", cursor: "pointer",
                                                            border: "1px solid rgba(255,0,0,0.2)", flexShrink: 0
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </div>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPlaceIds(isSelected ? selectedPlaceIds.filter((id) => id !== item.id) : [...selectedPlaceIds, item.id]);
                                                        }}
                                                        style={{
                                                            width: "24px", height: "24px", borderRadius: "50%",
                                                            background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.1)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: isSelected ? "black" : "transparent",
                                                            border: isSelected ? "none" : "2px solid rgba(255,255,255,0.3)",
                                                            flexShrink: 0, cursor: "pointer",
                                                        }}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                            {item.rating && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "#fbbf24", fontWeight: 700 }}>
                                                    <Star size={14} fill="#fbbf24" /> {item.rating} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({item.reviewCount || "100+"})</span>
                                                </div>
                                            )}
                                            <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500, lineHeight: 1.4, opacity: 0.9 }}>
                                                {item.desc}
                                            </div>
                                            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePlannerDetail(item);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--primary)',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    상세보기
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    </div>

                    {isSearchingAttractions && dynamicAttractions.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "15px", marginBottom: "20px",
                            color: "var(--primary)", fontSize: "14px", fontWeight: 700, background: "rgba(0, 212, 255, 0.05)",
                            borderRadius: "15px", border: "1px dashed rgba(0, 212, 255, 0.3)"
                        }}>
                            <Loader2 size={16} className="animate-spin" />
                            AI가 숨은 명소들을 더 찾아보고 있습니다...
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: "20px", display: "flex", gap: "10px", alignItems: "center", marginBottom: "40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                            <MapPin size={20} color="var(--primary)" />
                            <input
                                id="custom-place-input"
                                type="text"
                                disabled={isValidatingPlace}
                                placeholder={isValidatingPlace ? "AI가 장소 정보를 확인 중입니다..." : "원하는 장소가 없다면 직접 입력하여 추가하세요"}
                                style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: "15px", padding: "10px" }}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter" && !isValidatingPlace) {
                                        const name = (e.target as HTMLInputElement).value.trim();
                                        if (name && await validateAndAddPlace(name)) {
                                            (e.target as HTMLInputElement).value = "";
                                            setAttractionCategoryFilter("all");
                                        }
                                    }
                                }}
                            />
                        </div>
                        <button
                            disabled={isValidatingPlace}
                            onClick={async () => {
                                const input = document.getElementById("custom-place-input") as HTMLInputElement;
                                const name = input.value.trim();
                                if (name && await validateAndAddPlace(name)) {
                                    input.value = "";
                                    setAttractionCategoryFilter("all");
                                } else if (!name) {
                                    showToast("장소 이름을 입력해주세요.");
                                }
                            }}
                            style={{
                                padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: 'bold', cursor: isValidatingPlace ? "wait" : "pointer",
                                display: "flex", alignItems: "center", gap: 6, transition: "all 0.3s ease",
                                background: isPlaceAddedError ? "#ef4444" : isPlaceAddedSuccess ? "#34d399" : isValidatingPlace ? "gray" : "var(--primary)",
                                color: (isPlaceAddedError || isPlaceAddedSuccess) ? "white" : "black"
                            }}
                        >
                            {isValidatingPlace ? <Loader2 size={16} className="animate-spin" /> : isPlaceAddedError ? <AlertCircle size={16} /> : isPlaceAddedSuccess ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {isValidatingPlace ? "확인 중" : isPlaceAddedError ? "이미 존재" : isPlaceAddedSuccess ? "저장 완료" : "추가"}
                        </button>
                    </div>

                    {isMounted && document.getElementById('planner-nav-actions') && createPortal(
                        <div style={{ display: "flex", gap: "15px", width: "100%" }}>
                            <button
                                onClick={() => setPlannerStep(3)}
                                style={{
                                    flex: 1, padding: "18px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)", color: "white", fontWeight: 'bold', cursor: "pointer",
                                }}
                            >
                                이전
                            </button>
                            <button
                                onClick={async () => {
                                    await saveDraft(4);
                                    showToast('여행이 임시 저장되었습니다', 'success');
                                    setTimeout(() => {
                                        setIsPlanning(false);
                                        setView("landing");
                                    }, 500);
                                }}
                                style={{
                                    flex: 1, padding: "18px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.2)",
                                    background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 'bold', display: "flex",
                                    alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                                }}
                            >
                                <Save size={18} /> 저장
                            </button>
                            <button
                                disabled={selectedPlaceIds.length === 0}
                                onClick={async () => { await saveDraft(4); setPlannerStep(5); }}
                                style={{
                                    flex: 2, padding: "18px", borderRadius: "18px", border: "none", fontWeight: 'bold', transition: "all 0.3s ease",
                                    background: selectedPlaceIds.length > 0 ? "var(--primary)" : "rgba(255,255,255,0.05)",
                                    color: selectedPlaceIds.length > 0 ? "black" : "rgba(255,255,255,0.2)",
                                    cursor: selectedPlaceIds.length > 0 ? "pointer" : "not-allowed",
                                    boxShadow: selectedPlaceIds.length > 0 ? "0 8px 25px rgba(0, 212, 255, 0.3)" : "none"
                                }}
                            >
                                {selectedPlaceIds.length === 0 ? "장소를 선택해주세요" : "다음 단계로 (숙소)"}
                            </button>
                        </div>,
                        document.getElementById('planner-nav-actions')!
                    )}
                </>
            )}
        </motion.div>
    );
};
