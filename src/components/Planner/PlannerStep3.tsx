import React from 'react';
import { motion } from 'framer-motion';
import {
    Compass, Wind, Car, Bus, Trash2, Loader2, Plane, ArrowRight, Save, Hotel
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';
import { formatAirport, formatFlight, extractIata } from '../../utils/airline-data';

export const PlannerStep3: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        setPlannerStep,
        analyzedFiles,
        setAnalyzedFiles,
        setDeleteConfirmModal,
        currentUser,
        setIsPlanning,
        showToast,
        handleMultipleOcr,
        isOcrLoading,
        handleFileAnalysis,
        saveDraft
    } = usePlanner();

    const [isDragOver, setIsDragOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileAnalysis(files);
        }
    };

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
                {[1, 2, 3, 4, 5].map((_, i) => (
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
                어떻게 가시나요?
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
                    {/* Ticket Upload Area */}
                    <div
                        style={{ marginBottom: "20px" }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            id="ticket-upload-step3"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                handleMultipleOcr(e);
                                e.target.value = '';
                            }}
                        />
                        <button
                            onClick={() => document.getElementById("ticket-upload-step3")?.click()}
                            disabled={isOcrLoading}
                            style={{
                                width: "100%",
                                padding: "30px",
                                borderRadius: "12px",
                                border: isDragOver ? "2px dashed var(--primary)" : "1px dashed rgba(255,255,255,0.3)",
                                background: isDragOver ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)",
                                color: isDragOver ? "var(--primary)" : "white",
                                fontWeight: 700,
                                cursor: isOcrLoading ? "wait" : "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                transition: "all 0.2s"
                            }}
                        >
                            {isOcrLoading ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>티켓 분석 중... 잠시만 기다려 주세요.</span>
                                </>
                            ) : (
                                <>
                                    <Plane size={24} color={isDragOver ? "var(--primary)" : "white"} />
                                    <span style={{ fontSize: "15px" }}>
                                        {isDragOver ? "여기에 파일을 놓으세요!" : "비행기 티켓 / E-티켓 업로드"}
                                    </span>
                                    <span style={{ fontSize: "12px", opacity: 0.6, fontWeight: 400 }}>
                                        클릭하거나 파일을 여기로 드래그하세요
                                    </span>
                                </>
                            )}
                        </button>
                    </div>

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
                                const count = (plannerData.peopleCount || 1) + (plannerData.companionCount || 0);
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

                                let fromIata = (extractIata(plannerData.departurePoint) || "icn").toLowerCase();
                                let toIata = (extractIata(plannerData.entryPoint) || extractIata(plannerData.destination) || "").toLowerCase();

                                // Mapping for common destinations if no IATA code found in input
                                if (!toIata) {
                                    const dest = (plannerData.destination || "").toLowerCase();
                                    if (dest.includes("오키나와") || dest.includes("okinawa")) toIata = "oka";
                                    else if (dest.includes("치앙마이") || dest.includes("chiang mai")) toIata = "cnx";
                                    else if (dest.includes("방콕") || dest.includes("bangkok")) toIata = "bkk";
                                    else if (dest.includes("다낭") || dest.includes("danang")) toIata = "dad";
                                    else if (dest.includes("도쿄") || dest.includes("tokyo")) toIata = "nrt";
                                    else if (dest.includes("오사카") || dest.includes("osaka")) toIata = "kix";
                                    else if (dest.includes("후쿠오카") || dest.includes("fukuoka")) toIata = "fuk";
                                    else if (dest.includes("제주") || dest.includes("jeju")) toIata = "cju";
                                    else if (dest.includes("삿포로") || dest.includes("sapporo")) toIata = "cts";
                                }

                                let skyscannerUrl = "https://www.skyscanner.co.kr";
                                if (toIata) {
                                    skyscannerUrl = `https://www.skyscanner.co.kr/transport/flights/${fromIata}/${toIata}`;
                                    if (sStart) skyscannerUrl += `/${sStart}`;
                                    if (sEnd) skyscannerUrl += `/${sEnd}`;
                                    skyscannerUrl += `/?adultsv2=${count}&cabinclass=economy&childrenv2=&ref=home&rtn=${sEnd ? 1 : 0}&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
                                } else if (plannerData.destination) {
                                    // Fallback to keyword search if no IATA code found
                                    skyscannerUrl = `https://www.skyscanner.co.kr/transport/flights-from/${fromIata}/?query=${encodeURIComponent(plannerData.destination)}`;
                                }

                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "100%",
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
                                                gap: 10,
                                                background: "var(--primary)",
                                                borderRadius: "14px",
                                                color: "black",
                                                textDecoration: "none",
                                                fontSize: "14px",
                                                fontWeight: 800,
                                                padding: "16px",
                                                boxShadow: "0 8px 20px rgba(0, 212, 255, 0.2)",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 12px 25px rgba(0, 212, 255, 0.3)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 212, 255, 0.2)";
                                            }}
                                        >
                                            <Plane size={18} /> {plannerData.destination || "목적지"} 항공권 스카이스캐너 검색
                                        </a>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Always visible results & Reset button */}
            <div style={{ marginTop: "30px", marginBottom: "30px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 800 }}>분석 내역</h3>
                    <button
                        onClick={() => {
                            setAnalyzedFiles([]);
                            showToast("분석 내역이 초기화되었습니다.");
                        }}
                        style={{
                            background: "rgba(255,107,107,0.1)",
                            border: "1px solid rgba(255,107,107,0.2)",
                            color: "#ff6b6b",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        전체 초기화
                    </button>
                </div>

                {analyzedFiles.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {analyzedFiles.map((file) => (
                            <div
                                key={file.id || file.name}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "16px 20px",
                                    background: "rgba(255,255,255,0.07)",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {file.linkedTo === 'accommodation' ? <Hotel size={18} color="var(--primary)" /> : <Plane size={18} color="var(--primary)" />}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{file.name}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.6 }}>
                                            {file.linkedTo === 'accommodation' ? '숙소' : '항공'}
                                            {file.parsedData && (
                                                <span style={{ color: 'var(--primary)', marginLeft: 6 }}>
                                                    • {file.parsedData.hotelName || file.parsedData.airline || file.parsedData.name || '분석 완료'}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {file.status === "loading" && <Loader2 size={14} className="animate-spin" />}
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
                                                        (f) => f.id !== file.id && f.name !== file.name,
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
                                    style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff6b6b', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', opacity: 0.5, fontSize: '14px' }}>
                        업로드된 서류가 없습니다.
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
                {plannerData.travelMode === "plane" ? (
                    <>
                        {/* Outbound Section */}
                        <div
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                padding: "20px",
                                borderRadius: "16px",
                                border: "1px solid rgba(255,255,255,0.05)",
                                marginBottom: "20px",
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

                            {/* Outbound Flights List */}
                            {plannerData.outboundFlights && plannerData.outboundFlights.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                    {plannerData.outboundFlights.map((leg, i) => (
                                        <div key={leg.id || i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                                    [{leg.departureContext.date}] {formatAirport(leg.departureContext.airport)} ({leg.departureContext.time.slice(-5)}) <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {formatAirport(leg.arrivalContext.airport)} ({leg.arrivalContext.time.slice(-5)})
                                                </div>
                                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                    {formatFlight(leg.airline, leg.flightNumber)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setPlannerData(prev => ({
                                                        ...prev,
                                                        outboundFlights: (prev.outboundFlights || []).filter(l => l.id !== leg.id)
                                                    }));
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Inbound Section */}
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

                            {/* Inbound Flights List */}
                            {plannerData.inboundFlights && plannerData.inboundFlights.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                    {plannerData.inboundFlights.map((leg, i) => (
                                        <div key={leg.id || i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                                    [{leg.departureContext.date}] {formatAirport(leg.departureContext.airport)} ({leg.departureContext.time.slice(-5)}) <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {formatAirport(leg.arrivalContext.airport)} ({leg.arrivalContext.time.slice(-5)})
                                                </div>
                                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                    {formatFlight(leg.airline, leg.flightNumber)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setPlannerData(prev => ({
                                                        ...prev,
                                                        inboundFlights: (prev.inboundFlights || []).filter(l => l.id !== leg.id)
                                                    }));
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Extracted Accommodations Section in Step 3 */}
                        {plannerData.accommodations && plannerData.accommodations.length > 0 && (
                            <div
                                style={{
                                    background: "rgba(52, 211, 153, 0.05)",
                                    padding: "20px",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(52, 211, 153, 0.2)",
                                    marginBottom: "20px",
                                }}
                            >
                                <h4
                                    style={{
                                        color: "#34d399",
                                        marginBottom: "15px",
                                        fontWeight: 800,
                                        fontSize: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <Hotel size={16} /> 추출된 숙소 정보
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {plannerData.accommodations.map((acc: any, i: number) => (
                                        <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '8px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Hotel size={14} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                                                    {acc.name}
                                                </div>
                                                <div style={{ fontSize: 11, opacity: 0.7 }}>
                                                    {acc.startDate} ~ {acc.endDate} ({acc.nights}박)
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setPlannerData(prev => ({
                                                        ...prev,
                                                        accommodations: prev.accommodations.filter((_: any, idx: number) => idx !== i)
                                                    }));
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
                                    * 숙소 상세 설정은 5단계에서 가능합니다.
                                </div>
                            </div>
                        )}
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
                )
                }

                <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
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
                        onClick={() => {
                            if (saveDraft(3)) {
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
                        onClick={() => {
                            const outboundMismatch = plannerData.outboundFlights?.some(leg => (leg as any).departureContext?.date !== plannerData.startDate);
                            const inboundMismatch = plannerData.inboundFlights?.some(leg => (leg as any).departureContext?.date !== plannerData.endDate);

                            if (plannerData.travelMode === 'plane' && (outboundMismatch || inboundMismatch)) {
                                setDeleteConfirmModal({
                                    isOpen: true,
                                    title: "날짜 불일치 확인",
                                    message: "등록된 비행기 날짜와 여행 기간이 일치하지 않습니다. 그래도 진행하시겠습니까?",
                                    confirmText: "진행",
                                    cancelText: "취소",
                                    onConfirm: () => {
                                        setDeleteConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => { } });
                                        setPlannerStep(4);
                                    }
                                });
                            } else {
                                setPlannerStep(4);
                            }
                        }}
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
                        다음 단계로 (명소 추천)
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
