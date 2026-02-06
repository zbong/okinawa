import React from 'react';
import { motion } from 'framer-motion';
import {
    Compass, Wind, Car, Bus, Trash2, Loader2, Plane, ArrowRight
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const PlannerStep3: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        setPlannerStep,
        analyzedFiles,
        setAnalyzedFiles,
        setDeleteConfirmModal,
        currentUser
    } = usePlanner();

    return (
        <motion.div
            key="planner-step-3"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: "700px",
                marginTop: "40px",
                paddingBottom: "100px",
                position: "relative",
                zIndex: 10,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "30px",
                }}
            >
                {[1, 2, 3, 4, 5].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background:
                                i === 3
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.1)",
                            opacity: i < 3 ? 0.3 : 1,
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
                    color: "white",
                }}
            >
                어떻게 오시나요?
            </h2>
            <p
                style={{
                    textAlign: "center",
                    opacity: 0.6,
                    marginBottom: "20px",
                }}
            >
                교통편을 입력하면 일정에 자동으로 추가해 드립니다.
            </p>

            <div
                style={{
                    background: "rgba(255,255,255,0.05)",
                    padding: "15px",
                    borderRadius: "12px",
                    marginBottom: "30px",
                    fontSize: "15px",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <span
                    style={{ color: "var(--primary)", fontWeight: 700 }}
                >
                    {plannerData.startDate} ~ {plannerData.endDate}
                </span>
                <span style={{ margin: "0 10px", opacity: 0.3 }}>
                    |
                </span>
                <span>총 {plannerData.peopleCount || 1}명</span>
            </div>

            {/* Transport Buttons Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "12px",
                    marginBottom: "30px",
                }}
            >
                {[
                    {
                        id: "plane",
                        label: "비행기",
                        icon: <Compass size={24} />,
                    },
                    {
                        id: "ship",
                        label: "배",
                        icon: <Wind size={24} />,
                    },
                    {
                        id: "car",
                        label: "자동차",
                        icon: <Car size={24} />,
                    },
                    {
                        id: "public",
                        label: "대중교통",
                        icon: <Bus size={24} />,
                    },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            const isCar = item.id === "car";
                            setPlannerData({
                                ...plannerData,
                                travelMode: item.id as any,
                                entryPoint: isCar ? "Direct Driving" : "",
                                departurePoint:
                                    isCar &&
                                        !plannerData.departurePoint &&
                                        currentUser?.homeAddress
                                        ? currentUser.homeAddress
                                        : plannerData.departurePoint,
                            });
                        }}
                        style={{
                            padding: "16px",
                            borderRadius: "16px",
                            border:
                                plannerData.travelMode === item.id
                                    ? "2px solid var(--primary)"
                                    : "1px solid rgba(255,255,255,0.1)",
                            background:
                                plannerData.travelMode === item.id
                                    ? "rgba(0,212,255,0.1)"
                                    : "rgba(255,255,255,0.03)",
                            color: "white",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                        }}
                    >
                        {item.icon}
                        <span
                            style={{ fontWeight: 700, fontSize: "12px" }}
                        >
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {plannerData.travelMode && (
                <div style={{ marginBottom: "30px" }}>
                    {/* Header with Search Buttons */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                        }}
                    >
                        <h3 style={{ fontSize: "17px", fontWeight: 800 }}>
                            상세 정보 입력
                        </h3>

                        {/* Search Quick Buttons */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            {/* Naver Maps */}
                            <a
                                href={`https://map.naver.com/v5/search/${encodeURIComponent(plannerData.destination || "오키나와")}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    background: "#03C75A",
                                    color: "white",
                                    textDecoration: "none",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                }}
                            >
                                <Compass size={14} /> 네이버 지도
                            </a>
                        </div>
                    </div>

                    {/* File List for Transportation */}
                    {analyzedFiles.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            {analyzedFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 15px",
                                        background: "rgba(255,255,255,0.03)",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            fontSize: "13px",
                                        }}
                                    >
                                        <Plane
                                            size={14}
                                            style={{
                                                opacity: 0.7,
                                                color: "var(--primary)",
                                            }}
                                        />
                                        <span
                                            style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "250px",
                                            }}
                                        >
                                            {file.name}
                                        </span>
                                        {file.status === "loading" && (
                                            <Loader2
                                                size={12}
                                                className="animate-spin"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmModal({
                                                isOpen: true,
                                                title: "파일 삭제",
                                                message: `${file.name} 파일을 삭제하시겠습니까?`,
                                                onConfirm: () => {
                                                    setAnalyzedFiles((prev) =>
                                                        prev.filter(
                                                            (_, i) => i !== idx,
                                                        ),
                                                    );
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
                                            background: "rgba(255,0,0,0.1)",
                                            border: "none",
                                            color: "#ff6b6b",
                                            cursor: "pointer",
                                            padding: "6px",
                                            borderRadius: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        title="파일 삭제"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Booking Buttons (if Plane) */}
                    {plannerData.travelMode === "plane" && (
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            {(() => {
                                const count = plannerData.peopleCount || 1;
                                const sStart = plannerData.startDate
                                    ? plannerData.startDate
                                        .slice(2)
                                        .replace(/-/g, "")
                                    : "";
                                const sEnd = plannerData.endDate
                                    ? plannerData.endDate
                                        .slice(2)
                                        .replace(/-/g, "")
                                    : "";

                                let skyscannerUrl = "https://www.skyscanner.co.kr";
                                if (
                                    plannerData.destination &&
                                    (plannerData.destination.includes("오키나와") ||
                                        plannerData.destination.toLowerCase().includes("okinawa"))
                                ) {
                                    skyscannerUrl = "https://www.skyscanner.co.kr/transport/flights/icn/oka";
                                    if (sStart) skyscannerUrl += `/${sStart}`;
                                    if (sEnd) skyscannerUrl += `/${sEnd}`;
                                    skyscannerUrl += `/?adultsv2=${count}&cabinclass=economy&childrenv2=&ref=home&rtn=${sEnd ? 1 : 0}&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
                                }

                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "40%",
                                        }}
                                    >
                                        <a
                                            href={skyscannerUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                background: "rgba(255,255,255,0.05)",
                                                borderRadius: "12px",
                                                color: "white",
                                                textDecoration: "none",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                padding: "12px",
                                            }}
                                        >
                                            <Plane size={16} /> 스카이스캐너 예매
                                        </a>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div style={{ display: "grid", gap: "20px" }}>
                        {plannerData.travelMode === "plane" ? (
                            <>
                                {/* Plane Mode: Round Trip UI */}
                                <div
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        padding: "20px",
                                        borderRadius: "16px",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <h4
                                        style={{
                                            color: "#60a5fa",
                                            marginBottom: "15px",
                                            fontWeight: 800,
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        🛫 가는 편 (출국)
                                    </h4>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "10px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="항공사"
                                            value={plannerData.airline || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    airline: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="편명 (예: KE001)"
                                            value={plannerData.flightNumber || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    flightNumber: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="출발 공항 (ICN)"
                                            value={plannerData.departurePoint}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    departurePoint: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <ArrowRight
                                            size={14}
                                            color="rgba(255,255,255,0.3)"
                                        />
                                        <input
                                            type="text"
                                            placeholder="도착 공항 (OKA)"
                                            value={
                                                plannerData.entryPoint === "Direct Driving"
                                                    ? ""
                                                    : plannerData.entryPoint
                                            }
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    entryPoint: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "5px" }}>
                                        <input
                                            type="date"
                                            value={plannerData.startDate || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    startDate: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 3,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <input
                                            type="time"
                                            value={plannerData.departureTime || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    departureTime: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 2,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        padding: "20px",
                                        borderRadius: "16px",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <h4
                                        style={{
                                            color: "#fbbf24",
                                            marginBottom: "15px",
                                            fontWeight: 800,
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        🛬 오는 편 (귀국)
                                    </h4>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "10px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="항공사"
                                            value={plannerData.returnAirline || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    returnAirline: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="편명 (예: KE002)"
                                            value={plannerData.returnFlightNumber || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    returnFlightNumber: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="출발 공항 (OKA)"
                                            value={plannerData.returnDeparturePoint || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    returnDeparturePoint: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <ArrowRight
                                            size={14}
                                            color="rgba(255,255,255,0.3)"
                                        />
                                        <input
                                            type="text"
                                            placeholder="도착 공항 (ICN)"
                                            value={plannerData.returnArrivalPoint || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    returnArrivalPoint: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "5px" }}>
                                        <input
                                            type="date"
                                            value={plannerData.endDate || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    endDate: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 3,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                        <input
                                            type="time"
                                            value={plannerData.returnDepartureTime || ""}
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    returnDepartureTime: e.target.value,
                                                })
                                            }
                                            style={{
                                                flex: 2,
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Generic Mode (Car/Ship/etc) */}
                                <div>
                                    <label
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: "8px",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            opacity: 0.8,
                                        }}
                                    >
                                        <span>출발지</span>
                                        {plannerData.departureCoordinates && (
                                            <span style={{ fontSize: "10px", color: "#10b981" }}>
                                                ✓ 위치 확인됨
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="예: 출발지 입력"
                                        value={plannerData.departurePoint}
                                        onChange={(e) =>
                                            setPlannerData({
                                                ...plannerData,
                                                departurePoint: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "14px",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            background: "rgba(0,0,0,0.3)",
                                            color: "white",
                                        }}
                                    />
                                </div>

                                {plannerData.travelMode !== "car" && (
                                    <div>
                                        <label
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "8px",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                opacity: 0.8,
                                            }}
                                        >
                                            <span>도착지</span>
                                            {plannerData.entryCoordinates && (
                                                <span style={{ fontSize: "10px", color: "#10b981" }}>
                                                    ✓ 위치 확인됨
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={`예: ${plannerData.destination} 항구/터미널`}
                                            value={
                                                plannerData.entryPoint === "Direct Driving"
                                                    ? ""
                                                    : plannerData.entryPoint
                                            }
                                            onChange={(e) =>
                                                setPlannerData({
                                                    ...plannerData,
                                                    entryPoint: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "14px",
                                                borderRadius: "12px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.3)",
                                                color: "white",
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Date/Time */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "15px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "8px",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                opacity: 0.8,
                                            }}
                                        >
                                            출발 일시
                                        </label>
                                        <div style={{ display: "flex", gap: "5px" }}>
                                            <input
                                                type="date"
                                                value={plannerData.startDate || ""}
                                                onChange={(e) =>
                                                    setPlannerData({
                                                        ...plannerData,
                                                        startDate: e.target.value,
                                                    })
                                                }
                                                style={{
                                                    flex: 3,
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    background: "rgba(0,0,0,0.3)",
                                                    color: "white",
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={plannerData.departureTime || ""}
                                                onChange={(e) =>
                                                    setPlannerData({
                                                        ...plannerData,
                                                        departureTime: e.target.value,
                                                    })
                                                }
                                                style={{
                                                    flex: 2,
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    background: "rgba(0,0,0,0.3)",
                                                    color: "white",
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "8px",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                opacity: 0.8,
                                            }}
                                        >
                                            도착 일시
                                        </label>
                                        <div style={{ display: "flex", gap: "5px" }}>
                                            <input
                                                type="date"
                                                value={
                                                    plannerData.arrivalDate ||
                                                    plannerData.startDate ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setPlannerData({
                                                        ...plannerData,
                                                        arrivalDate: e.target.value,
                                                    })
                                                }
                                                style={{
                                                    flex: 3,
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    background: "rgba(0,0,0,0.3)",
                                                    color: "white",
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={plannerData.arrivalTime || ""}
                                                onChange={(e) =>
                                                    setPlannerData({
                                                        ...plannerData,
                                                        arrivalTime: e.target.value,
                                                    })
                                                }
                                                style={{
                                                    flex: 2,
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    background: "rgba(0,0,0,0.3)",
                                                    color: "white",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "15px" }}>
                <button
                    onClick={() => setPlannerStep(2)}
                    style={{
                        flex: 1,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "white",
                        fontWeight: 800,
                        cursor: "pointer",
                    }}
                >
                    이전
                </button>
                <button
                    onClick={() => setPlannerStep(4)}
                    disabled={!plannerData.travelMode}
                    style={{
                        flex: 2,
                        padding: "20px",
                        borderRadius: "20px",
                        border: "none",
                        background: plannerData.travelMode
                            ? "var(--primary)"
                            : "rgba(255,255,255,0.1)",
                        color: plannerData.travelMode
                            ? "black"
                            : "rgba(255,255,255,0.3)",
                        fontWeight: 800,
                        cursor: plannerData.travelMode ? "pointer" : "not-allowed",
                    }}
                >
                    다음 단계로 (숙소 정보)
                </button>
            </div>
        </motion.div>
    );
};
