import React from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, ChevronLeft, ChevronRight, CheckCircle, Loader2
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const PlannerStep1: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        plannerStep,
        setPlannerStep,
        setIsPlanning,
        analyzedFiles,
        setView,
        calendarDate,
        prevMonth,
        nextMonth,
        validateDestination,
        isValidatingDestination,
        isDestinationValidated,
        setIsDestinationValidated,
        setCalendarDate
    } = usePlanner();

    // Auto-switch calendar to start date if exists
    React.useEffect(() => {
        if (plannerData.startDate) {
            const date = new Date(plannerData.startDate);
            if (!isNaN(date.getTime())) {
                setCalendarDate(date);
            }
        }
    }, []);

    return (
        <motion.div
            key="planner-step-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: "800px" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: "20px",
                    justifyContent: "center",
                }}
            >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background:
                                i === 1
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                            opacity: i < 1 ? 0.3 : 1,
                        }}
                    />
                ))}
            </div>
            <h2
                style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    marginBottom: "8px",
                }}
            >
                여행의 기본 정보를 알려 주세요
            </h2>
            <p style={{ opacity: 0.6, marginBottom: "32px" }}>
                언제, 어디로 떠나시나요?
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr",
                    gap: "24px",
                    textAlign: "left",
                }}
            >
                {/* Destination & Info */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {/* Title Input */}
                    <div
                        className="glass-card"
                        style={{ padding: "20px" }}
                    >
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 700,
                                marginBottom: "12px",
                                color: "var(--primary)",
                                opacity: 0.8,
                            }}
                        >
                            여행 제목
                        </label>
                        <input
                            type="text"
                            placeholder="예: 우리가족 오사카 3박4일"
                            value={(plannerData as any).title || ""}
                            onChange={(e) =>
                                setPlannerData({
                                    ...plannerData,
                                    title: e.target.value,
                                } as any)
                            }
                            style={{
                                width: "100%",
                                padding: "14px",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                                fontSize: "16px",
                            }}
                        />
                    </div>

                    <div
                        className="glass-card"
                        style={{ padding: "20px" }}
                    >
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 700,
                                marginBottom: "12px",
                                color: "var(--primary)",
                                opacity: 0.8,
                            }}
                        >
                            여행 목적지
                        </label>
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => {
                                    if (plannerData.destination) {
                                        validateDestination(plannerData.destination);
                                    } else {
                                        alert("목적지를 먼저 입력해 주세요.");
                                    }
                                }}
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: isDestinationValidated
                                        ? "#4ade80" // Green when validated
                                        : "rgba(0,212,255,0.1)",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "6px",
                                    color: isDestinationValidated
                                        ? "black"
                                        : "var(--primary)",
                                    cursor: "pointer",
                                    zIndex: 2,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title={isDestinationValidated ? "검증 완료" : "목적지 검증 필요"}
                                disabled={isValidatingDestination}
                            >
                                {isValidatingDestination ? (
                                    <Loader2 className="spin" size={18} />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                            </button>
                            <input
                                type="text"
                                placeholder="예: 일본 오사카, 제주도 등"
                                value={plannerData.destination}
                                onChange={(e) => {
                                    setPlannerData({
                                        ...plannerData,
                                        destination: e.target.value,
                                    });
                                    setIsDestinationValidated(false); // Reset validation on edit
                                }}
                                style={{
                                    width: "100%",
                                    padding: "14px 14px 14px 50px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: isDestinationValidated
                                        ? "1px solid #4ade80"
                                        : "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    fontSize: "16px",
                                }}
                            />
                        </div>
                        {!isDestinationValidated && plannerData.destination && (
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "var(--primary)",
                                    marginTop: "8px",
                                    paddingLeft: "4px",
                                    opacity: 0.8,
                                }}
                            >
                                * 체크 아이콘을 눌러 목적지를 확인해 주세요.
                            </div>
                        )}
                    </div>

                    <div
                        className="glass-card"
                        style={{
                            padding: "20px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 700,
                                marginBottom: "15px",
                                color: "var(--primary)",
                                opacity: 0.8,
                            }}
                        >
                            선택된 일정
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                flex: 1,
                            }}
                        >
                            <div
                                style={{
                                    padding: "15px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "11px",
                                        opacity: 0.4,
                                        marginBottom: "4px",
                                    }}
                                >
                                    시작일
                                </div>
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "18px",
                                    }}
                                >
                                    {plannerData.startDate || "날짜 선택"}
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: "15px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "11px",
                                        opacity: 0.4,
                                        marginBottom: "4px",
                                    }}
                                >
                                    종료일
                                </div>
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "18px",
                                    }}
                                >
                                    {plannerData.endDate || "날짜 선택"}
                                </div>
                            </div>
                        </div>

                        {analyzedFiles.length > 0 && (
                            <div
                                style={{
                                    marginTop: "20px",
                                    paddingTop: "15px",
                                    borderTop:
                                        "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <h4
                                        style={{
                                            fontSize: "11px",
                                            opacity: 0.5,
                                            textTransform: "uppercase",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        학습된 서류 데이터
                                    </h4>
                                    <button
                                        onClick={() => setView("ocr_lab")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--primary)",
                                            fontSize: "10px",
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        상세 보기
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                    }}
                                >
                                    {analyzedFiles
                                        .filter((f) => f.status === "done")
                                        .slice(-3)
                                        .map((f, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    fontSize: "11px",
                                                    background:
                                                        "rgba(255,255,255,0.02)",
                                                    padding: "8px 10px",
                                                    borderRadius: "8px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        opacity: 0.7,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        maxWidth: "140px",
                                                    }}
                                                >
                                                    📄 {f.name}
                                                </span>
                                                <span
                                                    style={{
                                                        color:
                                                            f.parsedData?.type === "flight"
                                                                ? "#4facfe"
                                                                : f.parsedData?.type ===
                                                                    "accommodation"
                                                                    ? "#fbbf24"
                                                                    : "#888",
                                                        fontWeight: 800,
                                                        fontSize: "9px",
                                                        background:
                                                            "rgba(255,255,255,0.05)",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    {f.parsedData?.type?.toUpperCase() ||
                                                        "UNKNOWN"}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Calendar Grid */}
                <div
                    className="glass-card"
                    style={{
                        padding: "20px",
                        background: "rgba(255,255,255,0.02)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <h3 style={{ fontSize: "17px", fontWeight: 800 }}>
                            {calendarDate.getFullYear()}년{" "}
                            {calendarDate.getMonth() + 1}월
                        </h3>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={prevMonth}
                                style={{
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    color: "white",
                                    width: 30,
                                    height: 30,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={nextMonth}
                                style={{
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    color: "white",
                                    width: 30,
                                    height: 30,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "8px",
                            textAlign: "center",
                        }}
                    >
                        {["일", "월", "화", "수", "목", "금", "토"].map(
                            (d) => (
                                <div
                                    key={d}
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        opacity: 0.3,
                                        marginBottom: "8px",
                                    }}
                                >
                                    {d}
                                </div>
                            ),
                        )}
                        {(() => {
                            const year = calendarDate.getFullYear();
                            const month = calendarDate.getMonth();
                            const firstDay = new Date(
                                year,
                                month,
                                1,
                            ).getDay();
                            const lastDate = new Date(
                                year,
                                month + 1,
                                0,
                            ).getDate();

                            const days = [];

                            // Empty slots
                            for (let i = 0; i < firstDay; i++) {
                                days.push(<div key={`empty-${i}`} />);
                            }

                            // Days
                            for (let d = 1; d <= lastDate; d++) {
                                const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
                                const isSelected =
                                    plannerData.startDate === dateStr ||
                                    plannerData.endDate === dateStr;
                                const isInRange =
                                    plannerData.startDate &&
                                    plannerData.endDate &&
                                    dateStr > plannerData.startDate &&
                                    dateStr < plannerData.endDate;

                                days.push(
                                    <div
                                        key={d}
                                        onClick={() => {
                                            if (
                                                !plannerData.startDate ||
                                                (plannerData.startDate &&
                                                    plannerData.endDate)
                                            ) {
                                                setPlannerData({
                                                    ...plannerData,
                                                    startDate: dateStr,
                                                    endDate: "",
                                                });
                                            } else {
                                                if (dateStr < plannerData.startDate) {
                                                    setPlannerData({
                                                        ...plannerData,
                                                        startDate: dateStr,
                                                        endDate: plannerData.startDate,
                                                    });
                                                } else {
                                                    setPlannerData({
                                                        ...plannerData,
                                                        endDate: dateStr,
                                                    });
                                                }
                                            }
                                        }}
                                        style={{
                                            padding: "10px 0",
                                            borderRadius: "10px",
                                            fontSize: "14px",
                                            fontWeight:
                                                isSelected || isInRange ? 800 : 500,
                                            cursor: "pointer",
                                            background: isSelected
                                                ? "var(--primary)"
                                                : isInRange
                                                    ? "rgba(0,212,255,0.15)"
                                                    : "transparent",
                                            color: isSelected ? "black" : "white",
                                            opacity: 1,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {d}
                                    </div>,
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setPlannerStep(2)}
                disabled={
                    !plannerData.destination ||
                    !plannerData.startDate ||
                    !plannerData.endDate ||
                    !isDestinationValidated
                }
                style={{
                    width: "100%",
                    marginTop: "30px",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "none",
                    background:
                        plannerData.destination &&
                            plannerData.startDate &&
                            plannerData.endDate &&
                            isDestinationValidated
                            ? "var(--primary)"
                            : "rgba(255,255,255,0.1)",
                    color:
                        plannerData.destination &&
                            plannerData.startDate &&
                            plannerData.endDate &&
                            isDestinationValidated
                            ? "black"
                            : "rgba(255,255,255,0.3)",
                    fontWeight: 900,
                    fontSize: "18px",
                    cursor:
                        plannerData.destination &&
                            plannerData.startDate &&
                            plannerData.endDate &&
                            isDestinationValidated
                            ? "pointer"
                            : "not-allowed",
                    boxShadow:
                        plannerData.destination &&
                            plannerData.startDate &&
                            plannerData.endDate &&
                            isDestinationValidated
                            ? "0 10px 30px rgba(0,212,255,0.3)"
                            : "none",
                }}
            >
                {isDestinationValidated ? "다음 단계로 (여행 스타일)" : "목적지 검증이 필요합니다"}
            </button>

            <button
                onClick={() => setIsPlanning(false)}
                style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                }}
            >
                취소하고 돌아가기
            </button>
        </motion.div>
    );
};
