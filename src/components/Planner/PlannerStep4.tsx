import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2, Camera, Utensils, Compass, MapPin, CheckCircle, Star, Plus, AlertCircle, Save, Trash2
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const PlannerStep4: React.FC = () => {
    const {
        plannerData,
        isSearchingAttractions,
        dynamicAttractions,
        setDynamicAttractions,
        fetchAttractionsWithAI,
        setAttractionCategoryFilter,
        attractionCategoryFilter,
        selectedPlaceIds,
        setActivePlannerDetail,
        setSelectedPlaceIds,
        isValidatingPlace,
        validateAndAddPlace,
        isPlaceAddedError,
        isPlaceAddedSuccess,
        showToast,
        setPlannerStep,
        setDeleteConfirmModal,
        setIsPlanning,
        saveDraft
    } = usePlanner();

    React.useEffect(() => {
        if (dynamicAttractions.length === 0 && plannerData.destination) {
            fetchAttractionsWithAI(plannerData.destination);
        }
    }, []);

    return (
        <motion.div
            key="planner-step-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "900px" }}
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
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background:
                                i === 4
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                            opacity: i < 4 ? 0.3 : 1,
                        }}
                    />
                ))}
            </div>
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
                    style={{ padding: "100px 0", textAlign: "center" }}
                >
                    <Loader2
                        size={60}
                        className="animate-spin"
                        style={{
                            color: "var(--primary)",
                            margin: "0 auto 20px",
                        }}
                    />
                    <p style={{ opacity: 0.6 }}>
                        AI가 {plannerData.destination}의 숨은 명소들을 찾
                        있습니다...
                    </p>
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
                            fontWeight: 800,
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
                    {/* Category Filter Tabs */}
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
                            {
                                id: "sightseeing",
                                label: "관광명소",
                                icon: <Camera size={16} />,
                            },
                            {
                                id: "food",
                                label: "식당/맛집",
                                icon: <Utensils size={16} />,
                            },
                            {
                                id: "cafe",
                                label: "카페",
                                icon: <Compass size={16} />,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() =>
                                    setAttractionCategoryFilter(tab.id as any)
                                }
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background:
                                        attractionCategoryFilter === tab.id
                                            ? "var(--primary)"
                                            : "rgba(255,255,255,0.1)",
                                    color:
                                        attractionCategoryFilter === tab.id
                                            ? "black"
                                            : "white",
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
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "20px",
                            marginBottom: "20px",
                            maxHeight: "500px",
                            overflowY: "auto",
                            padding: "10px",
                            textAlign: "left",
                        }}
                    >
                        {dynamicAttractions
                            .filter(
                                (item) =>
                                    attractionCategoryFilter === "all" ||
                                    item.category === attractionCategoryFilter,
                            )
                            .map((item) => {
                                const isSelected = selectedPlaceIds.includes(
                                    item.id,
                                );
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() =>
                                            setActivePlannerDetail(item)
                                        }
                                        className="glass-card"
                                        style={{
                                            padding: "20px",
                                            borderRadius: "20px",
                                            border: isSelected
                                                ? "2px solid var(--primary)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                            background: isSelected
                                                ? "rgba(0,212,255,0.1)"
                                                : "rgba(255,255,255,0.03)",
                                            cursor: "pointer",
                                            position: "relative",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "12px",
                                        }}
                                    >
                                        {/* Header: Name & Selection Checkbox */}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        marginBottom: "6px",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "4px 8px",
                                                            borderRadius: "6px",
                                                            background:
                                                                "rgba(255,255,255,0.1)",
                                                            color: "#cbd5e1",
                                                        }}
                                                    >
                                                        {item.category === "food"
                                                            ? "식당"
                                                            : item.category === "cafe"
                                                                ? "카페"
                                                                : item.category === "custom"
                                                                    ? "직접 입력"
                                                                    : "관광"}
                                                    </span>
                                                    {item.priceLevel && (
                                                        <span
                                                            style={{
                                                                fontSize: "11px",
                                                                color: "#94a3b8",
                                                            }}
                                                        >
                                                            {item.priceLevel === "Expensive"
                                                                ? "💰💰💰"
                                                                : item.priceLevel ===
                                                                    "Moderate"
                                                                    ? "💰💰"
                                                                    : "💰"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 800,
                                                        fontSize: "18px",
                                                        marginBottom: "4px",
                                                        color: isSelected
                                                            ? "var(--primary)"
                                                            : "white",
                                                    }}
                                                >
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
                                                                setDeleteConfirmModal({
                                                                    isOpen: false,
                                                                    title: "",
                                                                    message: "",
                                                                    onConfirm: () => { },
                                                                });
                                                            },
                                                        });
                                                    }}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        background: "rgba(255,0,0,0.1)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "#ff6b6b",
                                                        cursor: "pointer",
                                                        border: "1px solid rgba(255,0,0,0.2)",
                                                        flexShrink: 0
                                                    }}
                                                    title="목록에서 삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </div>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPlaceIds(
                                                            isSelected
                                                                ? selectedPlaceIds.filter(
                                                                    (id) => id !== item.id,
                                                                )
                                                                : [
                                                                    ...selectedPlaceIds,
                                                                    item.id,
                                                                ],
                                                        );
                                                    }}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        background: isSelected
                                                            ? "var(--primary)"
                                                            : "rgba(255,255,255,0.1)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: isSelected
                                                            ? "black"
                                                            : "transparent",
                                                        border: isSelected
                                                            ? "none"
                                                            : "2px solid rgba(255,255,255,0.3)",
                                                        flexShrink: 0,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <CheckCircle size={16} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        {item.rating && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    fontSize: "14px",
                                                    color: "#fbbf24",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <Star size={14} fill="#fbbf24" />{" "}
                                                {item.rating}{" "}
                                                <span
                                                    style={{
                                                        color: "#94a3b8",
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    ({item.reviewCount || "100+"})
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#e2e8f0",
                                                fontWeight: 500,
                                                lineHeight: 1.4,
                                                opacity: 0.9,
                                            }}
                                        >
                                            {item.desc}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "12px",
                                                opacity: 0.6,
                                                lineHeight: 1.5,
                                                textAlign: "left",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {item.longDesc}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Manual Entry Below List */}
                    <div
                        className="glass-card"
                        style={{
                            padding: "20px",
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            marginBottom: "40px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flex: 1,
                            }}
                        >
                            <MapPin size={20} color="var(--primary)" />
                            <input
                                id="custom-place-input"
                                type="text"
                                disabled={isValidatingPlace}
                                placeholder={
                                    isValidatingPlace
                                        ? "AI가장소 정보를 확인 중입니다..."
                                        : "원하는 장소가 없다면 직접 입력하여 추가하세요 (예: 할머니 댁, 스타벅스 나하점)"
                                }
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    color: "white",
                                    fontSize: "15px",
                                    padding: "10px",
                                }}
                                onKeyDown={async (e) => {
                                    if (
                                        e.key === "Enter" &&
                                        !isValidatingPlace
                                    ) {
                                        const input = document.getElementById(
                                            "custom-place-input",
                                        ) as HTMLInputElement;
                                        const name = input.value.trim();
                                        if (name) {
                                            const success =
                                                await validateAndAddPlace(name);
                                            if (success) {
                                                input.value = "";
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                        <button
                            disabled={isValidatingPlace}
                            onClick={async () => {
                                const input = document.getElementById(
                                    "custom-place-input",
                                ) as HTMLInputElement;
                                const name = input.value.trim();
                                if (!name)
                                    return showToast(
                                        "장소 이름을 입력해주세요.",
                                    );

                                const success =
                                    await validateAndAddPlace(name);
                                if (success) {
                                    input.value = "";
                                }
                            }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "12px",
                                background: isPlaceAddedError
                                    ? "#ef4444"
                                    : isPlaceAddedSuccess
                                        ? "#34d399"
                                        : isValidatingPlace
                                            ? "gray"
                                            : "var(--primary)",
                                color:
                                    isPlaceAddedError || isPlaceAddedSuccess
                                        ? "white"
                                        : "black",
                                border: "none",
                                fontWeight: 800,
                                cursor: isValidatingPlace
                                    ? "wait"
                                    : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.3s ease",
                            }}
                        >
                            {isValidatingPlace ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : isPlaceAddedError ? (
                                <AlertCircle size={16} />
                            ) : isPlaceAddedSuccess ? (
                                <CheckCircle size={16} />
                            ) : (
                                <Plus size={16} />
                            )}
                            {isValidatingPlace
                                ? "확인 중"
                                : isPlaceAddedError
                                    ? "이미 존재"
                                    : isPlaceAddedSuccess
                                        ? "저장 완료"
                                        : "추가"}
                        </button>
                    </div>
                </>
            )}

            <div style={{ display: "flex", gap: "15px" }}>
                <button
                    onClick={() => setPlannerStep(3)}
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
                    이전 (교통편)
                </button>
                <button
                    onClick={() => {
                        if (saveDraft(4)) {
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
                    disabled={selectedPlaceIds.length === 0}
                    onClick={() => {
                        if (saveDraft(4)) {
                            setPlannerStep(5);
                        }
                    }}
                    style={{
                        flex: 2,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "none",
                        background: selectedPlaceIds.length > 0 ? "var(--primary)" : "rgba(255,255,255,0.05)",
                        color: selectedPlaceIds.length > 0 ? "black" : "rgba(255,255,255,0.2)",
                        fontWeight: 800,
                        cursor: selectedPlaceIds.length > 0 ? "pointer" : "not-allowed",
                        transition: "all 0.3s ease"
                    }}
                >
                    {selectedPlaceIds.length === 0 ? "장소를 선택해주세요" : "다음 단계로 (숙소)"}
                </button>
            </div>
        </motion.div>
    );
};
