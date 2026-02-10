import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2, Sparkles, Hotel,
    Calendar as CalendarIcon, Trash2, Plus, Save, Star, Check
} from 'lucide-react';
import { usePlanner } from '../../../contexts/PlannerContext';
import { StepIndicator } from '../../Common/StepIndicator';

export const PlannerStep5: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        isSearchingHotels,
        fetchHotelsWithAI,
        recommendedHotels,
        setRecommendedHotels,
        showToast,
        setDeleteConfirmModal,
        setPlannerStep,
        setIsPlanning,
        hotelStrategy,
        saveDraft
    } = usePlanner();

    React.useEffect(() => {
        if (recommendedHotels.length === 0 && plannerData.destination) {
            fetchHotelsWithAI(plannerData.destination);
        }
    }, []);

    const [selectedTag, setSelectedTag] = React.useState<string>("전체");

    const filteredHotels = React.useMemo(() => {
        if (selectedTag === "전체") return recommendedHotels;
        return recommendedHotels.filter((h: any) => h.tags && h.tags.includes(selectedTag));
    }, [recommendedHotels, selectedTag]);

    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        recommendedHotels.forEach((h: any) => {
            if (h.tags) h.tags.forEach((t: string) => tags.add(t));
        });
        return ["전체", ...Array.from(tags)];
    }, [recommendedHotels]);

    return (
        <motion.div
            key="planner-step-5"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: "800px",
                textAlign: "left",
            }}
        >
            <StepIndicator currentStep={5} totalSteps={5} />
            <h2
                style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    marginBottom: "10px",
                    textAlign: "center",
                }}
            >
                어디서 주무시나요?
            </h2>
            <p
                style={{
                    opacity: 0.6,
                    marginBottom: "32px",
                    textAlign: "center",
                }}
            >선택한 장소들을 참고하여 숙소를 선택해보세요.
            </p>

            <div style={{ marginBottom: "30px" }}>
                {isSearchingHotels ? (
                    <div
                        className="glass-card"
                        style={{
                            padding: "30px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            background: "rgba(0, 212, 255, 0.05)",
                            border: "1px solid var(--primary)",
                            borderRadius: "20px"
                        }}
                    >
                        <Loader2
                            size={32}
                            className="animate-spin"
                            color="var(--primary)"
                        />
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary)" }}>
                                AI 동선 분석 및 숙소 검색 중...
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.6, marginTop: 4 }}>
                                가장 최적화된 숙박 전략과 호텔을 찾고 있습니다.
                            </div>
                        </div>
                    </div>
                ) : (
                    recommendedHotels.length === 0 && (
                        <button
                            onClick={() => fetchHotelsWithAI(plannerData.destination)}
                            disabled={isSearchingHotels}
                            className="glass-card"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                padding: '30px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                cursor: isSearchingHotels ? 'wait' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: 'white'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            {isSearchingHotels ? (
                                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                            ) : (
                                <Sparkles size={24} color="var(--primary)" />
                            )}
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 800, fontSize: '18px' }}>
                                    {isSearchingHotels ? '최적의 숙소를 분석 중입니다...' : 'AI 숙소 추천받기'}
                                </div>
                                {!isSearchingHotels && (
                                    <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '2px' }}>
                                        선택한 장소들과의 거리를 고려해 최적의 동선을 제안합니다.
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                )}
            </div>



            {/* Recommended Hotels List */}
            {recommendedHotels.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                        }}
                    >
                        <h4
                            style={{
                                fontSize: "16px",
                                fontWeight: 800,
                                margin: 0,
                            }}
                        >
                            AI 추천 숙소
                        </h4>
                        <div style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500, marginTop: '2px' }}>
                            선택하신 장소들의 동선을 분석하여 최적의 숙소를 추천합니다.
                        </div>
                        <button
                            onClick={() => setRecommendedHotels([])}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-dim)",
                                fontSize: "12px",
                                cursor: "pointer",
                            }}
                        >
                            닫기
                        </button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            paddingBottom: "10px",
                        }}
                    >
                        {hotelStrategy && (
                            <div style={{
                                padding: '16px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                borderRadius: '12px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                marginBottom: '10px',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start'
                            }}>
                                <Sparkles size={18} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#e2e8f0', fontWeight: 500 }}>
                                    {hotelStrategy}
                                </div>
                            </div>
                        )}
                        {allTags.length > 1 && (
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '4px', scrollbarWidth: 'none' }}>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            border: selectedTag === tag ? 'none' : '1px solid rgba(255,255,255,0.15)',
                                            background: selectedTag === tag ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: selectedTag === tag ? 'black' : 'rgba(255,255,255,0.8)',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => selectedTag !== tag && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                        onMouseLeave={(e) => selectedTag !== tag && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                    >
                                        {tag === "전체" ? "전체" : `#${tag}`}
                                    </button>
                                ))}
                            </div>
                        )}
                        {filteredHotels.map((h: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => {
                                    window.open(`https://www.google.com/search?q=${h.name} ${plannerData.destination} 숙소`, "_blank");
                                }}
                                className="glass-card"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    padding: "20px",
                                    background: "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    position: "relative"
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {h.area && (
                                            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, marginBottom: 2 }}>
                                                [{h.area}]
                                            </span>
                                        )}
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "16px",
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {h.name}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '8px', height: 'fit-content' }}>
                                            <Star size={12} fill="#fbbf24" />
                                            <span style={{ fontWeight: 700 }}>{h.rating || 4.5}</span>
                                        </div>
                                        {(() => {
                                            const isSelected = plannerData.accommodations?.some((acc: any) => acc.name === h.name);
                                            return (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isSelected) {
                                                            setPlannerData(prev => ({
                                                                ...prev,
                                                                accommodations: prev.accommodations.filter((acc: any) => acc.name !== h.name)
                                                            }));
                                                            showToast(`${h.name}가 목록에서 제거되었습니다.`);
                                                        } else {
                                                            const newAcc = {
                                                                name: h.name,
                                                                startDate: "",
                                                                endDate: "",
                                                                nights: 0,
                                                                area: h.area || "",
                                                            };
                                                            setPlannerData(prev => ({
                                                                ...prev,
                                                                accommodations: [...(prev.accommodations || []), newAcc]
                                                            }));
                                                            showToast(
                                                                `${h.name}를 관심 숙소 목록에 추가했습니다!`,
                                                                'success'
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        background: isSelected ? "#34d399" : "var(--primary)",
                                                        border: "none",
                                                        borderRadius: "50%",
                                                        width: "28px",
                                                        height: "28px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: "pointer",
                                                        color: "black",
                                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                                    }}
                                                >
                                                    {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div
                                    style={{ fontSize: "13px", opacity: 0.8, lineHeight: 1.5 }}
                                >
                                    {h.reason && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                                            <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                                            <span>{h.reason}</span>
                                        </div>
                                    )}
                                    {h.desc}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {h.priceLevel && (
                                        <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', color: '#cbd5e1' }}>
                                            {h.priceLevel === 'Expensive' ? '고급형 💰💰💰' : h.priceLevel === 'Cheap' ? '실속형 💰' : '일반형 💰💰'}
                                        </span>
                                    )}
                                    {h.priceRange && (
                                        <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '6px', color: '#6ee7b7' }}>
                                            {h.priceRange}
                                        </span>
                                    )}
                                    {h.tags && h.tags.map((tag: string, tIdx: number) => (
                                        <span key={tIdx} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '6px', color: '#38bdf8' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* Added Accommodations List */}
            {
                plannerData.accommodations.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <h4
                            style={{
                                fontSize: "16px",
                                fontWeight: 800,
                                marginBottom: "15px",
                                paddingLeft: "5px",
                            }}
                        >
                            등록된 숙소 ({plannerData.accommodations.length})
                        </h4>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {plannerData.accommodations.map(
                                (acc: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="glass-card"
                                        style={{
                                            padding: "15px 20px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 15,
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "10px",
                                                    background: "rgba(255,255,255,0.05)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "var(--primary)",
                                                }}
                                            >
                                                <Hotel size={20} />
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 800,
                                                            fontSize: "16px",
                                                        }}
                                                    >
                                                        {acc.name}
                                                    </div>
                                                    {acc.area && (
                                                        <span
                                                            style={{
                                                                fontSize: "11px",
                                                                padding: "2px 6px",
                                                                borderRadius: "4px",
                                                                background:
                                                                    "rgba(0,212,255,0.1)",
                                                                color: "var(--primary)",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {acc.area}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        opacity: 0.6,
                                                        marginTop: 4,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <CalendarIcon size={12} />{" "}
                                                    {acc.startDate} ~ {acc.endDate} (
                                                    {acc.nights || 1}박)
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmModal({
                                                    isOpen: true,
                                                    title: "숙소 삭제",
                                                    message: `${acc.name} 숙소를 목록에서 삭제하시겠습니까?`,
                                                    onConfirm: () => {
                                                        setPlannerData({
                                                            ...plannerData,
                                                            accommodations:
                                                                plannerData.accommodations.filter(
                                                                    (_: any, i: number) =>
                                                                        i !== idx,
                                                                ),
                                                        });
                                                        setDeleteConfirmModal({
                                                            isOpen: false,
                                                            title: "",
                                                            message: "",
                                                            onConfirm: () => { },
                                                        });
                                                        showToast(
                                                            "숙소가 삭제되었습니다.",
                                                        );
                                                    },
                                                });
                                            }}
                                            style={{
                                                background: "rgba(255,78,80,0.1)",
                                                border: "none",
                                                color: "#ff4e50",
                                                padding: "8px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                "rgba(255,78,80,0.2)")
                                            }
                                            onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                "rgba(255,78,80,0.1)")
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )
            }

            <div style={{ display: "flex", gap: "15px" }}>
                <button
                    onClick={() => setPlannerStep(4)}
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
                    이전 (장소 선택)
                </button>
                <button
                    onClick={() => {
                        if (saveDraft(5)) {
                            showToast("숙소 설정이 임시 저장되었습니다.");
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
                    onClick={() => {
                        // Save logic for Accom
                        if (saveDraft(5)) {
                            // Go to new step 6: Summary & Upload
                            setPlannerStep(6);
                        }
                    }}
                    style={{
                        flex: 2,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "none",
                        background: "var(--primary)",
                        color: "black",
                        fontWeight: 900,
                        fontSize: "18px",
                    }}
                >
                    다음: 데이터 최종 점검
                </button>
            </div>
        </motion.div >
    );
};
