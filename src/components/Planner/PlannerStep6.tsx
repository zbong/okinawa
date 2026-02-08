import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Plane, MapPin, Hotel, FileText, Car, Compass, Upload, Trash2, Save
} from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";
import { ConfirmModal } from "../Common/ConfirmModal";

export const PlannerStep6: React.FC = () => {
    const {
        plannerData,
        setPlannerData,
        selectedPlaceIds,
        dynamicAttractions,
        customFiles,
        handleFileAnalysis,
        deleteFile,
        setPlannerStep,
        showToast,
        setIsPlanning,
        setView,
        generatePlanWithAI,
        saveDraft
    } = usePlanner();

    const [showAccConfirmModal, setShowAccConfirmModal] = useState(false);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        setDragOverCategory(category);
    };

    const handleDragLeave = () => {
        setDragOverCategory(null);
    };

    const handleDrop = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        setDragOverCategory(null);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileAnalysis(files, category);
        }
    };

    const selectedPlaces = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));
    const accommodations = plannerData.accommodations || [];

    const getFilesByCategory = (category: string) => {
        return customFiles.filter(f => {
            if (category === "other") {
                return f.linkedTo === "other" || !f.linkedTo;
            }
            return f.linkedTo === category;
        });
    };

    const toggleAccConfirmation = (index: number) => {
        const newAccs = [...accommodations];
        newAccs[index] = { ...newAccs[index], isConfirmed: !newAccs[index].isConfirmed };
        setPlannerData(prev => ({ ...prev, accommodations: newAccs }));
    };

    const validateAndNext = async () => {
        const missing = [];
        if (!plannerData.destination) missing.push("여행지");
        if (!plannerData.startDate || !plannerData.endDate) missing.push("여행 일정");
        if (selectedPlaceIds.length === 0) missing.push("방문 장소 (최소 1곳)");

        // Warning if no confirmed accommodation
        const confirmedCount = accommodations.filter(a => a.isConfirmed).length;
        const uploadedVouchers = getFilesByCategory("accommodation").length;

        if (missing.length > 0) {
            showToast(`누락된 정보가 있습니다: ${missing.join(", ")}`, "error");
            return;
        }

        if (confirmedCount === 0 && uploadedVouchers === 0) {
            setShowAccConfirmModal(true);
            return;
        }

        // Trigger AI plan generation helper in context
        await generatePlanWithAI();
    };

    return (
        <motion.div
            key="planner-step-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: "100%",
                maxWidth: "700px",
                textAlign: "left",
                paddingBottom: "100px"
            }}
        >
            <ConfirmModal
                isOpen={showAccConfirmModal}
                title="확정된 숙소 없음"
                message="현재 확정된 숙소가 없습니다. AI가 추천 숙소를 제안하도록 일정을 생성할까요?"
                onConfirm={async () => {
                    setShowAccConfirmModal(false);
                    await generatePlanWithAI();
                }}
                onCancel={() => setShowAccConfirmModal(false)}
                confirmText="생성 시작"
                cancelText="숙소 확인하기"
            />
            <h2 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px", textAlign: "center" }}>
                데이터 최종 점검 및 서류 등록
            </h2>
            <p style={{ opacity: 0.6, marginBottom: "40px", textAlign: "center" }}>
                지금까지 입력한 정보를 확인하고 필요한 서류를 업로드해 주세요.
            </p>

            <div style={{ display: "grid", gap: "32px" }}>
                {/* 1. 기본 정보 & 항공 */}
                <section className="glass-card" style={{ padding: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Plane size={20} color="var(--primary)" /> 항공 및 기본 일정
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                            <span style={{ opacity: 0.6 }}>여행지</span>
                            <span style={{ fontWeight: 700 }}>{plannerData.destination || "미입력"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                            <span style={{ opacity: 0.6 }}>일정</span>
                            <span style={{ fontWeight: 700 }}>{plannerData.startDate} ~ {plannerData.endDate}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                            <span style={{ opacity: 0.6 }}>인원</span>
                            <span style={{ fontWeight: 700 }}>{plannerData.companion}</span>
                        </div>

                        {(plannerData.outboundFlights || []).length > 0 && (
                            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 800, marginBottom: "12px", opacity: 0.5, color: "var(--primary)", letterSpacing: '1px' }}>DEPARTURE / 출국편</div>
                                {plannerData.outboundFlights?.map((f, i) => (
                                    <React.Fragment key={f.id || i}>
                                        {i > 0 && (
                                            <div style={{ padding: '4px 12px', margin: '8px 0', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '6px', fontSize: '11px', color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
                                                ↓ 환승 (TRANSFER)
                                            </div>
                                        )}
                                        <div style={{ fontSize: "14px", marginBottom: "10px" }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 800 }}>{f.airline} {f.flightNumber}</span>
                                                <span style={{ fontSize: '12px', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {f.departureContext.date}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ color: "var(--primary)", fontWeight: 700 }}>{f.departureContext.time}</span>
                                                <span style={{ opacity: 0.4 }}>→</span>
                                                <span style={{ fontWeight: 700 }}>{f.arrivalContext.time}</span>
                                                <span style={{ fontSize: '12px', opacity: 0.5 }}>({f.departureContext.airport} → {f.arrivalContext.airport})</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {(plannerData.inboundFlights || []).length > 0 && (
                            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 800, marginBottom: "12px", opacity: 0.5, color: "#f87171", letterSpacing: '1px' }}>RETURN / 귀국편</div>
                                {plannerData.inboundFlights?.map((f, i) => (
                                    <React.Fragment key={f.id || i}>
                                        {i > 0 && (
                                            <div style={{ padding: '4px 12px', margin: '8px 0', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '6px', fontSize: '11px', color: '#f87171', fontWeight: 800, textAlign: 'center' }}>
                                                ↓ 환승 (TRANSFER)
                                            </div>
                                        )}
                                        <div style={{ fontSize: "14px", marginBottom: "10px" }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 800 }}>{f.airline} {f.flightNumber}</span>
                                                <span style={{ fontSize: '12px', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {f.departureContext.date}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ color: "#f87171", fontWeight: 700 }}>{f.departureContext.time}</span>
                                                <span style={{ opacity: 0.4 }}>→</span>
                                                <span style={{ fontWeight: 700 }}>{f.arrivalContext.time}</span>
                                                <span style={{ fontSize: '12px', opacity: 0.5 }}>({f.departureContext.airport} → {f.arrivalContext.airport})</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. 장소 & 숙소 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                    <section className="glass-card" style={{ padding: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
                            <MapPin size={18} color="var(--primary)" /> 방문 장소 ({selectedPlaces.length})
                        </h3>
                        <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                            {selectedPlaces.map(p => (
                                <div key={p.id} style={{ fontSize: "13px", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", border: '1px solid rgba(255,255,255,0.03)' }}>
                                    {p.name}
                                </div>
                            ))}
                            {selectedPlaces.length === 0 && <span style={{ opacity: 0.4, fontSize: "13px" }}>선택된 장소가 없습니다.</span>}
                        </div>
                    </section>

                    <section className="glass-card" style={{ padding: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
                            <Hotel size={18} color="#818cf8" /> 숙소 확정 및 후보 ({accommodations.length})
                        </h3>
                        <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                            {accommodations.map((a, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "12px",
                                        background: a.isConfirmed ? "rgba(34, 197, 94, 0.08)" : "rgba(255,255,255,0.03)",
                                        borderRadius: "12px",
                                        border: a.isConfirmed ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px", color: a.isConfirmed ? '#4ade80' : 'white' }}>{a.name}</div>
                                        <div style={{ fontSize: "11px", opacity: 0.5 }}>{a.startDate} ~ {a.endDate}</div>
                                    </div>
                                    <button
                                        onClick={() => toggleAccConfirmation(i)}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: "8px",
                                            fontSize: "11px",
                                            border: "none",
                                            background: a.isConfirmed ? "#22c55e" : "rgba(255,255,255,0.1)",
                                            color: a.isConfirmed ? "black" : "white",
                                            fontWeight: 800,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {a.isConfirmed ? "확정됨" : "후보로 보관"}
                                    </button>
                                </div>
                            ))}
                            {accommodations.length === 0 && <span style={{ opacity: 0.4, fontSize: "13px" }}>선택된 숙소가 없습니다.</span>}
                        </div>
                        <p style={{ marginTop: "12px", fontSize: "11px", opacity: 0.4, lineHeight: "1.4" }}>
                            * '확정됨'으로 표시한 숙소만 실제 이동 경로(Stay)에 반영됩니다. 후보 숙소는 별도로 제안됩니다.
                        </p>
                    </section>
                </div>

                {/* 3. 서류 업로드 */}
                <section className="glass-card" style={{ padding: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={20} color="#fbbf24" /> 추가 서류 및 바우처 등록
                    </h3>

                    <div style={{ display: "grid", gap: "20px" }}>
                        {/* Flight Category */}
                        <div
                            onDragOver={(e) => handleDragOver(e, "flight")}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "flight")}
                            style={{
                                padding: "16px",
                                background: dragOverCategory === "flight" ? "rgba(0, 212, 255, 0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: dragOverCategory === "flight" ? "2px dashed var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Plane size={18} />
                                    <span style={{ fontWeight: 700 }}>항공권 및 여권 사본 (비행기/신분증)</span>
                                </div>
                                <label style={{
                                    padding: "6px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "12px",
                                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}>
                                    <Upload size={14} /> 업로드
                                    <input type="file" hidden multiple onChange={(e) => handleFileAnalysis(Array.from(e.target.files || []), "flight")} />
                                </label>
                            </div>
                            <FileList files={getFilesByCategory("flight")} onDelete={deleteFile} />
                        </div>

                        {/* Rental Car Category */}
                        <div
                            onDragOver={(e) => handleDragOver(e, "rental_car")}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "rental_car")}
                            style={{
                                padding: "16px",
                                background: dragOverCategory === "rental_car" ? "rgba(0, 212, 255, 0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: dragOverCategory === "rental_car" ? "2px dashed var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Car size={18} />
                                    <span style={{ fontWeight: 700 }}>렌트카 예약 정보 (메일/바우처)</span>
                                </div>
                                <label style={{
                                    padding: "6px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "12px",
                                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}>
                                    <Upload size={14} /> 업로드
                                    <input type="file" hidden multiple onChange={(e) => handleFileAnalysis(Array.from(e.target.files || []), "rental_car")} />
                                </label>
                            </div>
                            <FileList files={getFilesByCategory("rental_car")} onDelete={deleteFile} />
                        </div>

                        {/* Tour Category */}
                        <div
                            onDragOver={(e) => handleDragOver(e, "tour")}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "tour")}
                            style={{
                                padding: "16px",
                                background: dragOverCategory === "tour" ? "rgba(0, 212, 255, 0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: dragOverCategory === "tour" ? "2px dashed var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Compass size={18} />
                                    <span style={{ fontWeight: 700 }}>투어/액티비티 예약 (메일/바우처)</span>
                                </div>
                                <label style={{
                                    padding: "6px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "12px",
                                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}>
                                    <Upload size={14} /> 업로드
                                    <input type="file" hidden multiple onChange={(e) => handleFileAnalysis(Array.from(e.target.files || []), "tour")} />
                                </label>
                            </div>
                            <FileList files={getFilesByCategory("tour")} onDelete={deleteFile} />
                        </div>

                        {/* Accommodation Category */}
                        <div
                            onDragOver={(e) => handleDragOver(e, "accommodation")}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "accommodation")}
                            style={{
                                padding: "16px",
                                background: dragOverCategory === "accommodation" ? "rgba(34, 197, 94, 0.08)" : "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: dragOverCategory === "accommodation" ? "2px dashed #22c55e" : "1px solid rgba(255,255,255,0.05)",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Hotel size={18} />
                                    <span style={{ fontWeight: 700 }}>숙소 확정 바우처</span>
                                </div>
                                <label style={{
                                    padding: "6px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "12px",
                                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}>
                                    <Upload size={14} /> 업로드
                                    <input type="file" hidden multiple onChange={(e) => handleFileAnalysis(Array.from(e.target.files || []), "accommodation")} />
                                </label>
                            </div>
                            <FileList files={getFilesByCategory("accommodation")} onDelete={deleteFile} />
                        </div>

                        {/* Other Category */}
                        <div
                            onDragOver={(e) => handleDragOver(e, "other")}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "other")}
                            style={{
                                padding: "16px",
                                background: dragOverCategory === "other" ? "rgba(0, 212, 255, 0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "16px",
                                border: dragOverCategory === "other" ? "2px dashed var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <FileText size={18} />
                                    <span style={{ fontWeight: 700 }}>기타 여행 서류 (보험, 증명서 등)</span>
                                </div>
                                <label style={{
                                    padding: "6px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "12px",
                                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}>
                                    <Upload size={14} /> 업로드
                                    <input type="file" hidden multiple onChange={(e) => handleFileAnalysis(Array.from(e.target.files || []), "other")} />
                                </label>
                            </div>
                            <FileList files={getFilesByCategory("other")} onDelete={deleteFile} />
                        </div>
                    </div>
                </section>
            </div>

            {/* Navigation Buttons */}
            <div style={{
                display: "flex",
                gap: "12px",
                marginTop: "60px",
                paddingBottom: "20px"
            }}>
                <button
                    onClick={() => setPlannerStep(5)}
                    style={{
                        flex: 1,
                        padding: "18px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "14px"
                    }}
                >
                    이전
                </button>
                <button
                    onClick={() => {
                        if (saveDraft(6)) {
                            showToast("현재 정보와 서류가 임시 저장되었습니다.", "success");
                            // Exit planner
                            setIsPlanning(false);
                            setPlannerStep(0);
                            setView("landing");
                        }
                    }}
                    style={{
                        flex: 1,
                        padding: "18px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.1)",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                    }}
                >
                    <Save size={16} /> 임시 저장
                </button>
                <button
                    onClick={validateAndNext}
                    style={{
                        flex: 2,
                        padding: "18px",
                        borderRadius: "18px",
                        border: "none",
                        background: "var(--primary)",
                        color: "black",
                        fontWeight: 900,
                        fontSize: "16px",
                        boxShadow: "0 10px 25px rgba(0, 212, 255, 0.2)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                    }}
                >
                    AI 경로 생성 시작 <Sparkles size={18} />
                </button>
            </div>
        </motion.div>
    );
};

const FileList: React.FC<{ files: any[], onDelete: (id: string, e: any) => void }> = ({ files, onDelete }) => {
    if (files.length === 0) return (
        <div style={{ fontSize: "12px", opacity: 0.4, padding: "4px 0" }}>등록된 서류가 없습니다.</div>
    );

    return (
        <div style={{ display: "grid", gap: "8px" }}>
            {files.map(f => (
                <div key={f.id} style={{
                    display: "flex", flexDirection: "column", gap: 4, padding: "12px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px", fontSize: "12px", transition: "all 0.2s"
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FileText size={14} color={f.parsedData ? "var(--primary)" : "rgba(255,255,255,0.3)"} />
                            <span style={{ fontWeight: 700, opacity: 0.9 }}>{f.name}</span>
                            {f.parsedData ? (
                                <span style={{ fontSize: "10px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>분석완료</span>
                            ) : (
                                <span style={{ fontSize: "10px", background: "rgba(255, 255, 255, 0.05)", opacity: 0.5, padding: "2px 6px", borderRadius: "4px" }}>분석중/대기</span>
                            )}
                        </div>
                        <button
                            onClick={(e) => onDelete(f.id, e)}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4, transition: "transform 0.1s" }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    {f.parsedData?.summary && (
                        <div style={{ marginTop: 4, padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                            {f.parsedData.summary}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const Sparkles = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
);
