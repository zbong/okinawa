import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2, Sparkles, Hotel, Search, CheckCircle,
    Calendar as CalendarIcon, Trash2, Plus, Save
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const PlannerStep5: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        isSearchingHotels,
        fetchHotelsWithAI,
        recommendedHotels,
        setRecommendedHotels,
        validatedHotel,
        setValidatedHotel,
        validateHotel,
        hotelAddStatus,
        setHotelAddStatus,
        showToast,
        setDeleteConfirmModal,
        setPlannerStep,
        tripToEdit,
        setIsReviewModalOpen,
        selectedPlaceIds
    } = usePlanner();

    const isValidatingHotel = hotelAddStatus === "VALIDATING";

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
                                i === 5
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                            opacity: i < 5 ? 0.3 : 1,
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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "30px",
                }}
            >
                {/* AI Recommendation */}
                <div
                    className="glass-card"
                    style={{
                        padding: "30px",
                        border: "2px dashed rgba(0,212,255,0.3)",
                        background: "rgba(0,212,255,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 15,
                        cursor: isSearchingHotels ? "wait" : "pointer",
                        transition: "all 0.2s",
                    }}
                    onClick={() =>
                        !isSearchingHotels &&
                        fetchHotelsWithAI(plannerData.destination)
                    }
                    onMouseEnter={(e) =>
                        !isSearchingHotels &&
                        (e.currentTarget.style.background =
                            "rgba(0,212,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                        !isSearchingHotels &&
                        (e.currentTarget.style.background =
                            "rgba(0,212,255,0.02)")
                    }
                >
                    {isSearchingHotels ? (
                        <>
                            <Loader2
                                size={32}
                                className="animate-spin"
                                color="var(--primary)"
                            />
                            <div style={{ textAlign: "center" }}>
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "16px",
                                        color: "var(--primary)",
                                    }}
                                >
                                    AI 분석 중...
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.6,
                                        marginTop: 4,
                                    }}
                                >
                                    최적의 숙소를 찾고 있습니다
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Sparkles size={32} color="var(--primary)" />
                            <div style={{ textAlign: "center" }}>
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "16px",
                                        color: "var(--primary)",
                                    }}
                                >
                                    AI 숙소 추천받기
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.6,
                                        marginTop: 4,
                                    }}
                                >
                                    {plannerData.destination}의 인기 숙소를
                                    추천합니다
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* External Links */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateRows: "1fr 1fr",
                        gap: "10px",
                    }}
                >
                    <a
                        href={`https://www.agoda.com/search?city=${plannerData.destination}`}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-card"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: "white",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "16px",
                        }}
                    >
                        <Hotel size={20} />{" "}
                        <span style={{ fontWeight: 700 }}>
                            아고다에서 찾기
                        </span>
                    </a>

                    {plannerData.destination === "오키나와" || plannerData.destination === "제주도" ? (
                        <a
                            href={`https://www.yeogi.com/`}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-card"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                textDecoration: "none",
                                color: "white",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "16px",
                            }}
                        >
                            <Hotel size={20} />{" "}
                            <span style={{ fontWeight: 700 }}>
                                여기어때
                            </span>
                        </a>
                    ) : (
                        <a
                            href={`https://www.booking.com/searchresults.html?ss=${plannerData.destination}`}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-card"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                textDecoration: "none",
                                color: "white",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "16px",
                            }}
                        >
                            <Hotel size={20} />{" "}
                            <span style={{ fontWeight: 700 }}>
                                부킹닷컴
                            </span>
                        </a>
                    )}
                </div>
            </div>

            {/* Manual Entry Form */}
            <div
                className="glass-card"
                style={{
                    padding: "30px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: "5px",
                    }}
                >
                    <Hotel size={24} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: "18px" }}>
                        숙소 직접 등록
                    </span>
                </div>

                {/* Hotel Name + Verify Button */}
                <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <input
                            id="acc-name"
                            type="text"
                            placeholder="숙소 이름 (예: 힐튼 나하)"
                            defaultValue={validatedHotel?.name || ""}
                            onChange={() => {
                                if (validatedHotel) setValidatedHotel(null);
                                if (hotelAddStatus !== "IDLE")
                                    setHotelAddStatus("IDLE");
                            }}
                            style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)",
                                color: "white",
                                fontSize: "15px",
                            }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            const name = (
                                document.getElementById(
                                    "acc-name",
                                ) as HTMLInputElement
                            ).value;
                            validateHotel(name);
                        }}
                        disabled={isValidatingHotel}
                        style={{
                            padding: "0 20px",
                            borderRadius: "12px",
                            border: "none",
                            background: isValidatingHotel
                                ? "rgba(255,255,255,0.1)"
                                : "var(--primary)",
                            color: "black",
                            fontWeight: 800,
                            cursor: isValidatingHotel ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.2s",
                        }}
                    >
                        {isValidatingHotel ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                        {isValidatingHotel ? "확인 중" : "검증"}
                    </button>
                </div>

                {/* Validation Result info */}
                {validatedHotel && (
                    <div
                        style={{
                            padding: "12px 15px",
                            background: "rgba(52, 211, 153, 0.1)",
                            border: "1px solid rgba(52, 211, 153, 0.3)",
                            borderRadius: "10px",
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <CheckCircle size={16} color="#34d399" />
                        <div style={{ fontSize: "13px" }}>
                            <span
                                style={{ fontWeight: 800, color: "#34d399" }}
                            >
                                [{validatedHotel.area}]
                            </span>{" "}
                            {validatedHotel.desc}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 2 }}>
                        <label
                            style={{
                                fontSize: "12px",
                                marginBottom: "4px",
                                opacity: 0.7,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <CalendarIcon size={12} /> 체크인
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="acc-start"
                                type="date"
                                defaultValue={
                                    plannerData.startDate ||
                                    new Date().toISOString().split("T")[0]
                                }
                                onClick={(e) =>
                                    (e.target as any).showPicker?.()
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    paddingLeft: "40px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "white",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                }}
                            />
                            <CalendarIcon
                                size={16}
                                style={{
                                    position: "absolute",
                                    left: 14,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    opacity: 0.5,
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "12px",
                                marginBottom: "4px",
                                opacity: 0.7,
                            }}
                        >
                            박수
                        </label>
                        <select
                            id="acc-nights"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)",
                                color: "white",
                                fontSize: "14px",
                                cursor: "pointer",
                                height: "45px", // Match Date Input
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option
                                    key={n}
                                    value={n}
                                    style={{ background: "#1a1a1a" }}
                                >
                                    {n}박
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const nameInput = document.getElementById(
                            "acc-name",
                        ) as HTMLInputElement;
                        const name =
                            validatedHotel?.name || nameInput.value;
                        const start = (
                            document.getElementById(
                                "acc-start",
                            ) as HTMLInputElement
                        ).value;
                        const nights = parseInt(
                            (
                                document.getElementById(
                                    "acc-nights",
                                ) as HTMLSelectElement
                            ).value,
                        );

                        if (!name)
                            return showToast(
                                "숙소 이름을 입력해 주세요.",
                                "error",
                            );
                        if (!start)
                            return showToast(
                                "체크인 날짜를 선택해 주세요.",
                                "error",
                            );

                        // Calculate End Date
                        const startDate = new Date(start);
                        const endDateObj = new Date(startDate);
                        endDateObj.setDate(startDate.getDate() + nights);
                        const end = endDateObj
                            .toISOString()
                            .split("T")[0];

                        const newAcc = {
                            name,
                            startDate: start,
                            endDate: end,
                            nights,
                            area: validatedHotel?.area || "",
                        };
                        setPlannerData({
                            ...plannerData,
                            accommodations: [
                                ...plannerData.accommodations,
                                newAcc,
                            ],
                        });
                        nameInput.value = "";
                        setValidatedHotel(null);
                        setHotelAddStatus("IDLE");
                        showToast(
                            "숙소가 목록에 추가되었습니다.",
                            "success",
                        );
                    }}
                    style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: "12px",
                        background: "var(--primary)",
                        color: "black",
                        border: "none",
                        fontWeight: 800,
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                >
                    <Plus
                        size={18}
                        style={{
                            verticalAlign: "middle",
                            marginRight: "5px",
                        }}
                    />{" "}
                    목록에 추가
                </button>
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
                            gap: "10px",
                            overflowX: "auto",
                            paddingBottom: "10px",
                        }}
                    >
                        {recommendedHotels.map((h, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    const nameInput = document.getElementById(
                                        "acc-name",
                                    ) as HTMLInputElement;
                                    if (nameInput) nameInput.value = h.name;
                                    showToast(
                                        `${h.name}를 선택했습니다. 날짜를 확인하고 추가하세요.`,
                                    );
                                }}
                                className="glass-card"
                                style={{
                                    minWidth: "200px",
                                    padding: "15px",
                                    background: "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "14px",
                                        marginBottom: "4px",
                                    }}
                                >
                                    {h.name}
                                </div>
                                <div
                                    style={{ fontSize: "11px", opacity: 0.6 }}
                                >
                                    {h.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Added Accommodations List */}
            {plannerData.accommodations.length > 0 && (
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
            )}

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
                        const draft = {
                            step: 5,
                            data: plannerData,
                            selectedIds: selectedPlaceIds,
                            updated: Date.now(),
                            isEdit: tripToEdit ? true : false,
                            originalTripId: tripToEdit?.id,
                        };
                        localStorage.setItem(
                            "trip_draft_v1",
                            JSON.stringify(draft),
                        );
                        showToast("숙소 설정이 임시 저장되었습니다.");
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
                        const draft = {
                            data: plannerData,
                            step: 5,
                            selectedIds: selectedPlaceIds,
                            updated: Date.now(),
                        };
                        localStorage.setItem(
                            "trip_draft_v1",
                            JSON.stringify(draft),
                        );

                        // Open Review Modal
                        setIsReviewModalOpen(true);
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
                    최종 검토 및 생성
                </button>
            </div>
        </motion.div>
    );
};
