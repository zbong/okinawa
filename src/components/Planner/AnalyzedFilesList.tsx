import React from 'react';
import { Plane, Hotel, Loader2, Trash2 } from 'lucide-react';

interface AnalyzedFilesListProps {
    analyzedFiles: any[]; // Replace 'any' with proper type if available
    setAnalyzedFiles: (files: any[]) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    setDeleteConfirmModal: (modalConfig: any) => void;
}

export const AnalyzedFilesList: React.FC<AnalyzedFilesListProps> = ({
    analyzedFiles,
    setAnalyzedFiles,
    showToast,
    setDeleteConfirmModal
}) => {
    return (
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
                                            setAnalyzedFiles(
                                                analyzedFiles.filter(
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
    );
};
