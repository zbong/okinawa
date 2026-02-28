import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    Loader2, Sparkles, Hotel,
    Calendar as CalendarIcon, Trash2, Plus, Save, Star, Check, Upload,
    ListChecks, CheckSquare, Square
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
        saveDraft,
        setView,
        handleFileAnalysis,
        isOcrLoading,
        setCustomFiles,
        user,
        trip,
        generateChecklistWithAI
    } = usePlanner();

    React.useEffect(() => {
        const syncFromDB = async () => {
            if (!user || !trip?.id) return;
            try {
                const { supabase } = await import('../../../utils/supabase');
                const { data } = await supabase.from('trips').select('custom_files').eq('id', trip.id).single();
                if (data?.custom_files) {
                    setCustomFiles(data.custom_files);
                    console.log("🔄 DB 싱크 완료: 화면 진입 시 최신 상태로 초기화");
                }
            } catch (e) {
                console.error("DB Sync error:", e);
            }
        };
        syncFromDB();
    }, [user, trip?.id, setCustomFiles]);

    // ✅ missing isConfirmed 필드 자동 보정 (추천 숙소 등)
    React.useEffect(() => {
        const needsFix = plannerData.accommodations?.some((a: any) => a.isConfirmed === undefined);
        if (needsFix) {
            setPlannerData(prev => ({
                ...prev,
                accommodations: prev.accommodations.map((a: any) => ({
                    ...a,
                    isConfirmed: a.isConfirmed ?? false
                }))
            }));
        }
    }, [plannerData.accommodations, setPlannerData]);

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
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

    const confirmedAccommodations = React.useMemo(() => {
        return plannerData.accommodations.filter((a: any) => a.isConfirmed);
    }, [plannerData.accommodations]);

    const candidateAccommodations = React.useMemo(() => {
        return plannerData.accommodations.filter((a: any) => !a.isConfirmed);
    }, [plannerData.accommodations]);

    const [isGeneratingChecklist, setIsGeneratingChecklist] = React.useState(false);
    const [newItemText, setNewItemText] = React.useState("");
    const [newItemCategory, setNewItemCategory] = React.useState("기타");

    const handleGenerateChecklist = async () => {
        setIsGeneratingChecklist(true);
        try {
            const data = await generateChecklistWithAI();
            if (data && data.length > 0) {
                setPlannerData((prev: any) => ({
                    ...prev,
                    checklists: data
                }));
                showToast("AI가 맞춤형 준비물을 추천했습니다!", "success");
            } else {
                showToast("준비물 추천을 가져오지 못했습니다.", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("오류가 발생했습니다.", "error");
        } finally {
            setIsGeneratingChecklist(false);
        }
    };

    const handleAddChecklistItem = () => {
        if (!newItemText.trim()) return;
        setPlannerData((prev: any) => {
            const newList = [...(prev.checklists || [])];
            newList.push({
                id: 'chk-' + Math.random().toString(36).substr(2, 9),
                category: newItemCategory,
                text: newItemText,
                isChecked: false,
                isCustom: true
            });
            return { ...prev, checklists: newList };
        });
        setNewItemText("");
    };

    const handleRemoveChecklistItem = (id: string) => {
        setPlannerData((prev: any) => ({
            ...prev,
            checklists: (prev.checklists || []).filter((c: any) => c.id !== id)
        }));
    };

    const handleToggleChecklistItem = (id: string) => {
        setPlannerData((prev: any) => ({
            ...prev,
            checklists: (prev.checklists || []).map((c: any) =>
                c.id === id ? { ...c, isChecked: !c.isChecked } : c
            )
        }));
    };

    const checklistCategories = React.useMemo(() => {
        const categories = new Set<string>();
        (plannerData.checklists || []).forEach((c: any) => categories.add(c.category));
        return Array.from(categories);
    }, [plannerData.checklists]);

    const [activeChecklistCategory, setActiveChecklistCategory] = React.useState<string | "all">("all");

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
            <StepIndicator currentStep={5} totalSteps={8} />
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
                                                                isConfirmed: false,
                                                                priceRange: h.priceRange || ""
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

            {/* Hotel Voucher Upload Section */}
            <div
                className="glass-card"
                style={{
                    padding: "24px",
                    marginBottom: "30px",
                    background: "rgba(0, 212, 255, 0.03)",
                    border: "1px dashed rgba(0, 212, 255, 0.3)",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    textAlign: "center"
                }}
            >
                <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(0, 212, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)"
                }}>
                    <Upload size={24} />
                </div>
                <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 4px 0" }}>
                        예약 확정 바우처 업로드
                    </h4>
                    <p style={{ fontSize: "13px", opacity: 0.6, margin: 0 }}>
                        호텔 예약 확인서(PDF/이미지)를 올리면 AI가 정보를 추출하여 확정 숙소로 등록합니다.
                    </p>
                </div>
                <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFileAnalysis(Array.from(e.target.files), "accommodation");
                        }
                    }}
                    style={{ display: "none" }}
                    id="hotel-voucher-upload"
                    disabled={isOcrLoading}
                />
                <button
                    onClick={() => document.getElementById("hotel-voucher-upload")?.click()}
                    disabled={isOcrLoading}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: isOcrLoading ? "rgba(0, 212, 255, 0.5)" : "var(--primary)",
                        color: "black",
                        fontWeight: 800,
                        border: "none",
                        cursor: isOcrLoading ? "wait" : "pointer",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    {isOcrLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            분석 중...
                        </>
                    ) : (
                        "파일 선택하기"
                    )}
                </button>
            </div>

            {/* Added Accommodations List */}
            {confirmedAccommodations.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "15px", paddingLeft: "5px", display: "flex", alignItems: "center", gap: 8 }}>
                        예약 확정 숙소 ({confirmedAccommodations.length})
                        <span style={{ fontSize: "11px", background: "#34d399", color: "black", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>
                            파일 업로드됨
                        </span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {confirmedAccommodations.map((acc: any, idx: number) => (
                            <div key={`conf-${idx}`} className="glass-card" style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                                <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(52, 211, 153, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ fontWeight: 800, fontSize: "16px" }}>{acc.name}</div>
                                            {acc.area && (
                                                <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "rgba(52, 211, 153, 0.1)", color: "#34d399", fontWeight: 700 }}>{acc.area}</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "12px", opacity: 0.6, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                            <CalendarIcon size={12} /> {acc.startDate} ~ {acc.endDate} ({acc.nights || 1}박)
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setDeleteConfirmModal({
                                            isOpen: true, title: "숙소 삭제", message: `${acc.name} 숙소를 목록에서 삭제하시겠습니까?`,
                                            onConfirm: () => {
                                                setPlannerData({ ...plannerData, accommodations: plannerData.accommodations.filter((a: any) => a !== acc) });
                                                setDeleteConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => { } });
                                                showToast("숙소가 삭제되었습니다.");
                                            }
                                        });
                                    }}
                                    style={{ background: "rgba(255,78,80,0.1)", border: "none", color: "#ff4e50", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,78,80,0.2)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,78,80,0.1)")}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {
                candidateAccommodations.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "15px", paddingLeft: "5px", display: "flex", alignItems: "center", gap: 8 }}>
                            관심 후보 숙소 ({candidateAccommodations.length})
                            <span style={{ fontSize: "11px", background: "var(--primary)", color: "black", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>
                                AI 추천
                            </span>
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {candidateAccommodations.map((acc: any, idx: number) => (
                                <div key={`cand-${idx}`} className="glass-card" style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                            <Hotel size={20} />
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ fontWeight: 800, fontSize: "16px" }}>{acc.name}</div>
                                                {acc.area && (
                                                    <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,212,255,0.1)", color: "var(--primary)", fontWeight: 700 }}>{acc.area}</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: "12px", opacity: 0.6, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                                <CalendarIcon size={12} /> 추천 항목
                                                {acc.priceRange && (
                                                    <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(52, 211, 153, 0.1)", borderRadius: "4px", color: "#6ee7b7", marginLeft: 4 }}>
                                                        {acc.priceRange}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDeleteConfirmModal({
                                                isOpen: true, title: "후보 삭제", message: `${acc.name} 후보를 목록에서 삭제하시겠습니까?`,
                                                onConfirm: () => {
                                                    setPlannerData({ ...plannerData, accommodations: plannerData.accommodations.filter((a: any) => a !== acc) });
                                                    setDeleteConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => { } });
                                                    showToast("후보가 삭제되었습니다.");
                                                }
                                            });
                                        }}
                                        style={{ background: "rgba(255,78,80,0.1)", border: "none", color: "#ff4e50", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,78,80,0.2)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,78,80,0.1)")}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Preparation Checklist */}
            <div style={{ marginBottom: "150px" }}>
                <h4 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "15px", paddingLeft: "5px", display: "flex", alignItems: "center", gap: 10 }}>
                    <ListChecks size={24} color="var(--primary)" />
                    여행 준비물 체크리스트
                </h4>

                {!(plannerData.checklists && plannerData.checklists.length > 0) ? (
                    <div
                        className="glass-card"
                        style={{
                            padding: "30px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 15,
                            background: "rgba(0, 212, 255, 0.05)",
                            border: "1px dashed var(--primary)",
                            borderRadius: "16px",
                            textAlign: "center"
                        }}
                    >
                        <div style={{ fontWeight: 800, fontSize: "16px", color: "white" }}>
                            "어떤 준비물들이 필요할지 AI에게 물어보세요!"
                        </div>
                        <div style={{ fontSize: "13px", opacity: 0.6 }}>
                            계절, 일정, 방문지, 동행자 등 종합적인 상황을 고려해<br />여행에 꼭 필요한 맞춤형 준비물을 분석합니다.
                        </div>
                        <button
                            onClick={handleGenerateChecklist}
                            disabled={isGeneratingChecklist}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "12px",
                                background: "var(--primary)",
                                color: "black",
                                fontWeight: 800,
                                border: "none",
                                cursor: isGeneratingChecklist ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginTop: "5px"
                            }}
                        >
                            {isGeneratingChecklist ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    준비물 리스트 분석 중...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    AI 맞춤 준비물 추천받기
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* 탭 헤더 */}
                        <div style={{
                            display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}>
                            <button
                                onClick={() => setActiveChecklistCategory("all")}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    background: activeChecklistCategory === "all" ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: activeChecklistCategory === "all" ? '#000' : 'rgba(255,255,255,0.7)',
                                    border: '1px solid',
                                    borderColor: activeChecklistCategory === "all" ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                전체 보기
                            </button>
                            {checklistCategories.map(cat => (
                                <button
                                    key={`step5-tab-${cat}`}
                                    onClick={() => setActiveChecklistCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        whiteSpace: 'nowrap',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        background: activeChecklistCategory === cat ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                                        color: activeChecklistCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                                        border: '1px solid',
                                        borderColor: activeChecklistCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* 리스트 본문 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(plannerData.checklists || [])
                                .filter((c: any) => activeChecklistCategory === "all" || c.category === activeChecklistCategory)
                                .map((item: any) => (
                                    <div key={item.id} className="glass-card" style={{
                                        padding: '12px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => handleToggleChecklistItem(item.id)}>
                                            {item.isChecked ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="rgba(255,255,255,0.5)" />}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '14px', textDecoration: item.isChecked ? 'line-through' : 'none', opacity: item.isChecked ? 0.5 : 1 }}>
                                                    {item.text}
                                                </span>
                                                {activeChecklistCategory === "all" && (
                                                    <span style={{ fontSize: '10px', color: 'var(--primary)', opacity: 0.8, fontWeight: 700 }}>
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveChecklistItem(item.id)}
                                            style={{ background: "transparent", border: "none", color: "#ff4e50", cursor: "pointer", opacity: 0.7 }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                        </div>

                        {/* 직접 추가하기 영역 */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                            <select
                                value={newItemCategory}
                                onChange={(e) => setNewItemCategory(e.target.value)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    width: '120px'
                                }}
                            >
                                <option value="기타" style={{ color: 'black' }}>기타</option>
                                {checklistCategories.map(cat => (
                                    <option key={cat} value={cat} style={{ color: 'black' }}>{cat}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                placeholder="추가할 준비물을 입력하세요"
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleAddChecklistItem}
                                style={{
                                    padding: '0 20px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Portal Action Buttons */}
            {
                isMounted && document.getElementById('planner-nav-actions') && createPortal(
                    <div style={{ display: "flex", gap: "15px", width: "100%" }}>
                        <button
                            onClick={() => setPlannerStep(4)}
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
                                await saveDraft(5);
                                showToast("숙소 설정이 임시 저장되었습니다.");
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
                            onClick={async () => {
                                await saveDraft(6);
                                setPlannerStep(6);
                            }}
                            style={{
                                flex: 2,
                                padding: "18px",
                                borderRadius: "18px",
                                border: "none",
                                background: "var(--primary)",
                                color: "black",
                                fontWeight: 900,
                                cursor: "pointer",
                                boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)"
                            }}
                        >
                            다음: 데이터 최종 점검
                        </button>
                    </div>,
                    document.getElementById('planner-nav-actions')!
                )
            }
        </motion.div >
    );
};
