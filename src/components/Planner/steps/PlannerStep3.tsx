import React from 'react';
import { motion } from 'framer-motion';
import {
    Plane, Save
} from 'lucide-react';
import { usePlanner } from '../../../contexts/PlannerContext';
import { extractIata } from '../../../utils/airline-data';
import { StepIndicator } from '../../Common/StepIndicator';
import { FileUploadZone } from '../../Common/FileUploadZone';
import { TransportModeSelector } from '../common/TransportModeSelector';
import { AnalyzedFilesList } from '../common/AnalyzedFilesList';
import { ExtractedFlightList } from '../common/ExtractedFlightList';
import { ExtractedAccommodationList } from '../common/ExtractedAccommodationList';

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
            <StepIndicator currentStep={3} totalSteps={5} />
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
            <TransportModeSelector
                selectedMode={plannerData.travelMode || ""}
                onSelect={(mode, isCar) => {
                    setPlannerData({
                        ...plannerData,
                        travelMode: mode as any,
                        entryPoint: isCar ? "Direct Driving" : "",
                        departurePoint:
                            isCar &&
                                !plannerData.departurePoint &&
                                currentUser?.homeAddress
                                ? currentUser.homeAddress
                                : plannerData.departurePoint,
                    });
                }}
            />

            {plannerData.travelMode && (
                <div style={{ marginBottom: "30px" }}>
                    {/* Ticket Upload Area */}
                    <div style={{ marginBottom: "20px" }}>
                        <FileUploadZone
                            isDragOver={isDragOver}
                            isLoading={isOcrLoading}
                            inputId="ticket-upload-step3"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onFileSelect={handleMultipleOcr}
                        />
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
            <AnalyzedFilesList
                analyzedFiles={analyzedFiles}
                setAnalyzedFiles={setAnalyzedFiles}
                showToast={showToast}
                setDeleteConfirmModal={setDeleteConfirmModal}
            />

            <div style={{ display: "grid", gap: "20px" }}>
                {plannerData.travelMode === "plane" ? (
                    <>
                        <ExtractedFlightList
                            outboundFlights={plannerData.outboundFlights || []}
                            inboundFlights={plannerData.inboundFlights || []}
                            setPlannerData={setPlannerData}
                        />

                        {/* Extracted Accommodations Section in Step 3 */}
                        <ExtractedAccommodationList
                            accommodations={plannerData.accommodations || []}
                            setPlannerData={setPlannerData}
                        />
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
