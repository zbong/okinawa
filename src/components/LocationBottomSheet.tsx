import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Phone, Edit3, Trash2, MapPin,
    Star, MessageCircle, FileText
} from "lucide-react";
import { usePlanner } from "../contexts/PlannerContext";
import { LocationPoint } from "../types";

export const LocationBottomSheet: React.FC = () => {
    const {
        selectedPoint,
        setSelectedPoint,
        activeTab,
        isEditingPoint,
        setIsEditingPoint,
        setAllPoints,
        allPoints,
        completedItems,
        toggleComplete,
        userReviews,
        updateReview,
        userLogs,
        updateLog,
        customFiles,
        handleFileUpload,
        deleteFile,
        deletePoint
    } = usePlanner();

    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Bottom Sheet Height Logic
    const bottomSheetTop = activeTab === "summary" ? "380px" : "280px";

    const savePointEdit = (id: string, updates: Partial<LocationPoint>) => {
        const updatedPoints = allPoints.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
        );
        setAllPoints(updatedPoints);

        // Update selected point as well to reflect changes immediately
        if (selectedPoint && selectedPoint.id === id) {
            setSelectedPoint({ ...selectedPoint, ...updates });
        }
        setIsEditingPoint(false);
    };

    if (!selectedPoint) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="bottom-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                style={{
                    zIndex: 9999,
                    position: "absolute",
                    top: bottomSheetTop,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `calc(100% - ${bottomSheetTop})`,
                    maxHeight: "none",
                    borderTopLeftRadius: "24px",
                    borderTopRightRadius: "24px",
                    background: "var(--sheet-bg)",
                    overflowY: "auto",
                    padding: "24px",
                }}
            >
                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoint(null);
                    }}
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 10,
                        transition: "background 0.2s",
                    }}
                >
                    <X size={18} color="white" />
                </button>

                {/* Handle with hint */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div
                        className="handle"
                        onClick={() => setSelectedPoint(null)}
                        style={{ cursor: "pointer" }}
                    />
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                        아래로 밀어서 닫기
                    </div>
                </div>

                {/* Title Section */}
                <div style={{ marginBottom: "24px" }}>
                    <h2
                        style={{
                            margin: "0 0 8px 0",
                            fontSize: "24px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        {selectedPoint.name}
                        {completedItems[selectedPoint.id] && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    background: "#10b981",
                                    borderRadius: "20px",
                                    color: "white",
                                }}
                            >
                                방문 완료
                            </span>
                        )}
                    </h2>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 15,
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={14} /> 오키나와현
                        </span>
                        {selectedPoint.phone && (
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    cursor: "pointer",
                                }}
                                onClick={() =>
                                    (window.location.href = `tel:${selectedPoint.phone}`)
                                }
                            >
                                <Phone size={14} /> {selectedPoint.phone}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "24px",
                    }}
                >
                    <button
                        className={`action-btn ${completedItems[selectedPoint.id] ? "active" : ""}`}
                        style={{
                            background: completedItems[selectedPoint.id]
                                ? "rgba(16, 185, 129, 0.2)"
                                : "var(--input-bg)",
                            border: completedItems[selectedPoint.id]
                                ? "1px solid #10b981"
                                : "1px solid var(--border-color)",
                            color: completedItems[selectedPoint.id]
                                ? "#10b981"
                                : "var(--text-primary)",
                        }}
                        onClick={(e) => toggleComplete(selectedPoint.id, e)}
                    >
                        ✅ 방문 체크
                    </button>
                    <button
                        className="action-btn"
                        onClick={() => setIsEditingPoint(true)}
                    >
                        <Edit3 size={16} /> 정보 수정
                    </button>
                    <button
                        className="action-btn delete"
                        onClick={(e) => deletePoint(selectedPoint.id, e)}
                    >
                        <Trash2 size={16} /> 장소 삭제
                    </button>
                </div>

                {/* Editing Mode */}
                {isEditingPoint ? (
                    <div
                        className="glass-card"
                        style={{ padding: "20px", marginBottom: "20px" }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: 15 }}>장소 정보 수정</h3>
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.6,
                                    marginBottom: "6px",
                                    display: "block",
                                }}
                            >
                                장소명
                            </label>
                            <input
                                id="edit-name"
                                defaultValue={selectedPoint.name}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.6,
                                    marginBottom: "6px",
                                    display: "block",
                                }}
                            >
                                전화번호
                            </label>
                            <input
                                id="edit-phone"
                                defaultValue={selectedPoint.phone || ""}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.6,
                                    marginBottom: "6px",
                                    display: "block",
                                }}
                            >
                                맵코드
                            </label>
                            <input
                                id="edit-mapcode"
                                defaultValue={selectedPoint.mapcode || ""}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                marginTop: "10px",
                            }}
                        >
                            <button
                                onClick={() => setIsEditingPoint(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "transparent",
                                    color: "white",
                                    fontWeight: 600,
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    const name = (document.getElementById("edit-name") as HTMLInputElement).value;
                                    const phone = (document.getElementById("edit-phone") as HTMLInputElement).value;
                                    const mapcode = (document.getElementById("edit-mapcode") as HTMLInputElement).value;
                                    savePointEdit(selectedPoint.id, {
                                        name,
                                        phone,
                                        mapcode,
                                    });
                                }}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "var(--primary)",
                                    color: "black",
                                    fontWeight: 800,
                                }}
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginBottom: "24px",
                        }}
                    >
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="primary-button"
                            style={{
                                background: "var(--primary)",
                                color: "black",
                                textDecoration: "none",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <MapPin size={16} /> 구글맵 열기
                        </a>
                        {selectedPoint.mapcode && (
                            <button
                                className="primary-button"
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border-color)",
                                }}
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedPoint.mapcode!);
                                    alert(`맵코드가 복사되었습니다: ${selectedPoint.mapcode}`);
                                }}
                            >
                                🗺️ 맵코드 복사
                            </button>
                        )}
                    </div>
                )}

                {/* Reviews Section */}
                <div style={{ marginBottom: "20px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            padding: "0 4px",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Star size={18} fill="var(--primary)" color="var(--primary)" />
                            나으 평가
                        </h3>
                        <span
                            style={{
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                            }}
                        >
                            {userReviews[selectedPoint.id]?.rating || 0} / 5.0
                        </span>
                    </div>

                    <div
                        className="glass-card"
                        style={{
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={24}
                                    fill={
                                        (userReviews[selectedPoint.id]?.rating || 0) >= star
                                            ? "#F59E0B"
                                            : "none"
                                    }
                                    color={
                                        (userReviews[selectedPoint.id]?.rating || 0) >= star
                                            ? "#F59E0B"
                                            : "#4B5563"
                                    }
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        updateReview(
                                            selectedPoint.id,
                                            star,
                                            userReviews[selectedPoint.id]?.text || "",
                                        )
                                    }
                                />
                            ))}
                        </div>
                        <textarea
                            placeholder="이 장소에 대한 나만의 평를 남겨보세요..."
                            value={userReviews[selectedPoint.id]?.text || ""}
                            onChange={(e) =>
                                updateReview(
                                    selectedPoint.id,
                                    userReviews[selectedPoint.id]?.rating || 0,
                                    e.target.value,
                                )
                            }
                            style={{
                                width: "100%",
                                background: "rgba(0,0,0,0.2)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "12px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                resize: "none",
                                height: "80px",
                            }}
                        />
                    </div>
                </div>

                {/* Personal Notes Section */}
                <div style={{ marginBottom: "20px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: "12px",
                            padding: "0 4px",
                        }}
                    >
                        <MessageCircle size={18} color="var(--primary)" />
                        <h3 style={{ margin: 0, fontSize: "16px" }}>개인적인 메모</h3>
                    </div>

                    <motion.div
                        className="glass-card"
                        animate={{
                            height: expandedSection === "logs" || userLogs[selectedPoint.id] ? "auto" : "50px",
                        }}
                        style={{ overflow: "hidden" }}
                    >
                        {!expandedSection && !userLogs[selectedPoint.id] ? (
                            <div
                                onClick={() => setExpandedSection("logs")}
                                style={{
                                    padding: "12px",
                                    color: "var(--text-secondary)",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <Edit3 size={14} /> 메모 입력하기...
                            </div>
                        ) : (
                            <div style={{ padding: "12px" }}>
                                <textarea
                                    autoFocus
                                    placeholder="이 장소에서의 추억이나 팁을 기록하세요..."
                                    value={userLogs[selectedPoint.id] || ""}
                                    onChange={(e) => updateLog(selectedPoint.id, e.target.value)}
                                    style={{
                                        width: "100%",
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-primary)",
                                        fontSize: "14px",
                                        resize: "none",
                                        minHeight: "80px",
                                        outline: "none",
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Files Section */}
                <div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        padding: "0 4px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FileText size={18} color="var(--primary)" />
                            <h3 style={{ margin: 0, fontSize: "16px" }}>관련 서류</h3>
                        </div>
                        <label style={{
                            fontSize: "12px",
                            color: "var(--primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                        }}>
                            + 파일 추가
                            <input
                                type="file"
                                multiple
                                hidden
                                onChange={(e) => handleFileUpload(e, selectedPoint.id)}
                            />
                        </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {customFiles
                            .filter(f => f.linkedTo === selectedPoint.id)
                            .map(file => (
                                <div key={file.id} className="glass-card" style={{
                                    padding: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <FileText size={16} color="var(--text-secondary)" />
                                        <span style={{ fontSize: "14px" }}>{file.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => deleteFile(file.id, e)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#ef4444",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        {customFiles.filter(f => f.linkedTo === selectedPoint.id).length === 0 && (
                            <div style={{
                                textAlign: "center",
                                padding: "20px",
                                color: "var(--text-secondary)",
                                fontSize: "13px",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "12px"
                            }}>
                                등록된 파일이 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ height: "40px" }} /> {/* Bottom Spacer */}
            </motion.div>
        </AnimatePresence>
    );
};
