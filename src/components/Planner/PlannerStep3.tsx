import React from 'react';
import { motion } from 'framer-motion';
import {
    Compass, Wind, Car, Bus, Trash2, Loader2, Plane, ArrowRight, Save, Hotel
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

    // 공항 코드 → 이름 매핑
    const airportNames: Record<string, string> = {
        // 한국
        'ICN': '인천국제공항',
        'GMP': '김포국제공항',
        'PUS': '김해국제공항',
        'CJU': '제주국제공항',
        'TAE': '대구국제공항',
        'CJJ': '청주국제공항',
        'MWX': '무안국제공항',
        'RSU': '여수공항',
        'KWJ': '광주공항',
        // 일본
        'NRT': '도쿄 나리타',
        'HND': '도쿄 하네다',
        'KIX': '오사카 간사이',
        'ITM': '오사카 이타미',
        'OKA': '오키나와 나하',
        'FUK': '후쿠오카',
        'CTS': '삿포로 신치토세',
        'NGO': '나고야 추부',
        'KOJ': '가고시마',
        'OIT': '오이타',
        'MYJ': '마쓰야마',
        'TAK': '다카마쓰',
        'HIJ': '히로시마',
        'SDJ': '센다이',
        // 동남아
        'BKK': '방콕 수완나품',
        'DMK': '방콕 돈므앙',
        'CNX': '치앙마이',
        'HKT': '푸켓',
        'SGN': '호치민',
        'HAN': '하노이',
        'DAD': '다낭',
        'CXR': '나트랑',
        'PQC': '푸꾸옥',
        'SIN': '싱가포르 창이',
        'KUL': '쿠알라룸푸르',
        'MNL': '마닐라',
        'CEB': '세부',
        'DPS': '발리 덴파사르',
        'CGK': '자카르타',
        // 중국/홍콩/대만
        'HKG': '홍콩',
        'TPE': '타이베이 타오위안',
        'TSA': '타이베이 송산',
        'PVG': '상하이 푸둥',
        'SHA': '상하이 훙차오',
        'PEK': '베이징 서우두',
        'PKX': '베이징 다싱',
        'CAN': '광저우',
        // 기타
        'LAX': '로스앤젤레스',
        'JFK': '뉴욕 JFK',
        'SFO': '샌프란시스코',
        'ORD': '시카고 오헤어',
        'SYD': '시드니',
        'MEL': '멜버른',
        'LHR': '런던 히드로',
        'CDG': '파리 샤를드골',
        'FRA': '프랑크푸르트',
    };

    // 공항 코드를 "이름 (코드)" 형식으로 변환
    const formatAirport = (code: string): string => {
        if (!code) return '';
        const upperCode = code.toUpperCase().trim();
        // 이미 "이름 (코드)" 형식이면 그대로 반환
        if (/\([A-Z]{3}\)/.test(code)) return code;
        const name = airportNames[upperCode];
        return name ? `${name} (${upperCode})` : upperCode;
    };

    // 항공사 코드 → 이름 매핑
    const airlineNames: Record<string, string> = {
        // 한국
        'KE': '대한항공',
        'OZ': '아시아나항공',
        '7C': '제주항공',
        'LJ': '진에어',
        'TW': '티웨이항공',
        'BX': '에어부산',
        'RS': '에어서울',
        'RF': '에어로케이',
        'YP': '에어프레미아',
        '4V': '플라이강원',
        // 일본
        'JL': '일본항공 (JAL)',
        'NH': '전일본공수 (ANA)',
        'MM': '피치항공',
        'BC': '스카이마크',
        'GK': '젯스타 재팬',
        'NU': '일본트랜스오션항공',
        '6J': '솔라시드에어',
        // LCC & 기타
        'VJ': '비엣젯항공',
        'VN': '베트남항공',
        'TG': '타이항공',
        'SQ': '싱가포르항공',
        'CX': '캐세이퍼시픽',
        'CI': '중화항공',
        'BR': '에바항공',
        'MU': '중국동방항공',
        'CA': '중국국제항공',
        'HO': '준야오항공',
        'TR': '스쿠트',
        'SL': '타이라이언에어',
        'FD': '에어아시아',
        'AK': '에어아시아 말레이시아',
        'PR': '필리핀항공',
        '5J': '세부퍼시픽',
        'Z2': '에어아시아 필리핀',
        'AA': '아메리칸항공',
        'UA': '유나이티드항공',
        'DL': '델타항공',
        'BA': '영국항공',
        'AF': '에어프랑스',
        'LH': '루프트한자',
        'EK': '에미레이트',
        'QR': '카타르항공',
    };

    // 편명을 "항공사명 풀편명" 형식으로 변환 (예: "제주항공 7C1801")
    const formatFlight = (airline: string, flightNumber: string): string => {

        // 만약 둘 다 비어있으면 빈 문자열 반환
        if (!airline && !flightNumber) return '';

        // flightNumber가 이미 풀 편명인 경우 (예: "7C1801", "KE123")
        // 항공사 코드는 반드시 문자를 포함해야 함 (7C, KE 등)
        // 순수 숫자(1801)는 매칭하지 않음
        const fnMatch = flightNumber?.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d+)$/i);
        if (fnMatch) {
            const code = fnMatch[1].toUpperCase();
            const name = airlineNames[code];
            return name ? `${name} ${flightNumber.toUpperCase()}` : flightNumber.toUpperCase();
        }

        // airline이 코드(7C), flightNumber가 숫자(1801)인 경우
        const airlineCode = airline?.toUpperCase().trim() || '';
        const flight = flightNumber?.trim() || '';

        // airline이 비어있고 flightNumber도 숫자만 있는 경우
        if (!airlineCode && /^\d+$/.test(flight)) {
            return flight; // 편명 숫자만 반환
        }

        // airline이 코드인 경우
        if (airlineCode && /^[A-Z0-9]{2}$/i.test(airlineCode)) {
            const airlineName = airlineNames[airlineCode];
            const fullFlightNumber = airlineCode + flight;
            const result = airlineName ? `${airlineName} ${fullFlightNumber}` : fullFlightNumber;
            return result;
        }

        // airline이 이미 이름인 경우 (예: "제주항공")
        if (airlineCode && airlineCode.length > 2) {
            return flight ? `${airlineCode} ${flight}` : airlineCode;
        }

        // 그 외: 있는 대로 조합
        return [airlineCode, flight].filter(Boolean).join(' ');
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

                                // Extract IATA codes from strings like "Incheon (ICN)" or just "ICN"
                                const extractIata = (str: string) => {
                                    if (!str) return null;
                                    const match = str.match(/\(([A-Z]{3})\)/i);
                                    if (match) return match[1].toLowerCase();
                                    if (/^[A-Z]{3}$/i.test(str.trim())) return str.trim().toLowerCase();
                                    return null;
                                };

                                let fromIata = extractIata(plannerData.departurePoint) || "icn";
                                let toIata = extractIata(plannerData.entryPoint) || extractIata(plannerData.destination);

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
