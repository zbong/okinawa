import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Phone, Edit3, Trash2, MapPin,
    Star, MessageCircle, FileText, Sparkles
} from "lucide-react";
import { usePlanner } from "../contexts/PlannerContext";
import { LocationPoint } from "../types";

export const LocationBottomSheet: React.FC = () => {
    const {
        theme,
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
        deletePoint,
        showToast,
        setActivePlannerDetail
    } = usePlanner();

    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Auto-close when switching tabs
    useEffect(() => {
        setSelectedPoint(null);
    }, [activeTab, setSelectedPoint]);

    const isLight = theme === 'light';

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
                    borderTop: "1px solid var(--glass-border)",
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
                        background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 10,
                        transition: "background 0.2s",
                    }}
                >
                    <X size={18} color="var(--text-primary)" />
                </button>

                {/* Handle with hint */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div
                        className="handle"
                        onClick={() => setSelectedPoint(null)}
                        style={{ cursor: "pointer", background: "var(--text-dim)", opacity: 0.3 }}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
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
                            color: "var(--text-primary)"
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

                    {/* Basic Info (Description) */}
                    {selectedPoint.description && (
                        <p style={{
                            marginTop: 14,
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "var(--text-secondary)",
                            padding: "12px",
                            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                            borderRadius: "12px",
                            border: "1px solid var(--glass-border)"
                        }}>
                            {selectedPoint.description}
                        </p>
                    )}
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "24px",
                    }}
                >
                    {/* 상세정보 button moved to front */}
                    <button
                        style={{
                            flex: 1,
                            padding: "16px 8px",
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: "var(--tab-inactive)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                        }}
                        onClick={() => setActivePlannerDetail(selectedPoint)}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(0, 212, 255, 0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--primary)"
                        }}>
                            <Sparkles size={16} />
                        </div>
                        상세정보
                    </button>

                    <button
                        style={{
                            flex: 1,
                            padding: "16px 8px",
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: completedItems[selectedPoint.id]
                                ? "rgba(16, 185, 129, 0.15)"
                                : "var(--tab-inactive)",
                            border: completedItems[selectedPoint.id]
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : "1px solid var(--glass-border)",
                            color: completedItems[selectedPoint.id]
                                ? "#10b981"
                                : "var(--text-primary)",
                        }}
                        onClick={(e) => toggleComplete(selectedPoint.id, e)}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: completedItems[selectedPoint.id] ? "#10b981" : "var(--glass-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: completedItems[selectedPoint.id] ? (isLight ? "white" : "black") : "var(--text-secondary)",
                            transition: "all 0.2s"
                        }}>
                            <Star size={16} fill={completedItems[selectedPoint.id] ? "currentColor" : "none"} />
                        </div>
                        방문체크
                    </button>

                    <button
                        style={{
                            flex: 1,
                            padding: "16px 8px",
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: "var(--tab-inactive)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                        }}
                        onClick={() => setIsEditingPoint(true)}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(59, 130, 246, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#3b82f6"
                        }}>
                            <Edit3 size={16} />
                        </div>
                        정보수정
                    </button>

                    <button
                        style={{
                            flex: 1,
                            padding: "16px 8px",
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: "var(--tab-inactive)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                        }}
                        onClick={(e) => deletePoint(selectedPoint.id, e)}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(239, 68, 68, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#ef4444"
                        }}>
                            <Trash2 size={16} />
                        </div>
                        장소삭제
                    </button>
                </div>

                {/* Editing Mode */}
                {isEditingPoint ? (
                    <div
                        className="glass-card"
                        style={{ padding: "20px", marginBottom: "20px" }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: 15, color: "var(--text-primary)" }}>장소 정보 수정</h3>
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.6,
                                    marginBottom: "6px",
                                    display: "block",
                                    color: "var(--text-secondary)"
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
                                    background: "var(--input-bg)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--text-primary)",
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
                                    color: "var(--text-secondary)"
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
                                    background: "var(--input-bg)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--text-primary)",
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
                                    color: "var(--text-secondary)"
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
                                    background: "var(--input-bg)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--text-primary)",
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
                                    border: "1px solid var(--glass-border)",
                                    background: "var(--tab-inactive)",
                                    color: "var(--text-primary)",
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
                                    color: "var(--text-on-primary)",
                                    fontWeight: 800,
                                }}
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Navigation Buttons */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: selectedPoint.mapcode ? "1fr 1fr" : "1fr",
                                gap: "12px",
                                marginBottom: "24px",
                            }}
                        >
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    background: "var(--primary)",
                                    color: "var(--text-on-primary)",
                                    textDecoration: "none",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "16px",
                                    borderRadius: "18px",
                                    fontSize: "15px",
                                    fontWeight: 800,
                                    boxShadow: isLight ? "0 4px 12px rgba(14, 165, 233, 0.2)" : "0 10px 20px rgba(0, 212, 255, 0.15)",
                                    transition: "transform 0.2s"
                                }}
                            >
                                <MapPin size={18} /> 길찾기
                            </a>
                            {selectedPoint.mapcode && (
                                <button
                                    style={{
                                        background: "var(--tab-inactive)",
                                        border: "1px solid var(--glass-border)",
                                        color: "var(--text-primary)",
                                        cursor: "pointer",
                                        padding: "16px",
                                        borderRadius: "18px",
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        transition: "all 0.2s"
                                    }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedPoint.mapcode!);
                                        showToast(`${selectedPoint.name}의 맵코드가 복사되었습니다!`, "success");
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>🗺️</span> 맵코드 복사
                                </button>
                            )}
                        </div>
                    </>
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
                                color: "var(--text-primary)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Star size={18} fill="var(--primary)" color="var(--primary)" />
                            나의 평가
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
                                            : "var(--text-dim)"
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
                            placeholder="이 장소에 대한 나만의 평가를 남겨보세요..."
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
                                background: isLight ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.2)",
                                border: "1px solid var(--glass-border)",
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
                        <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>개인적인 메모</h3>
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
                            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>관련 서류</h3>
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
                                        <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>{file.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => deleteFile(file.id, e)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--secondary)",
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
                                background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
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
