import React from 'react';
import { Loader2, Plane } from 'lucide-react';

interface FileUploadZoneProps {
    isDragOver: boolean;
    isLoading: boolean;
    inputId: string;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Drag and drop file upload zone for ticket/document analysis
 */
export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    isDragOver,
    isLoading,
    inputId,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect
}) => {
    return (
        <div
            style={{ marginBottom: "20px" }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <input
                type="file"
                multiple
                accept="image/*,.pdf"
                id={inputId}
                style={{ display: "none" }}
                onChange={(e) => {
                    onFileSelect(e);
                    e.target.value = '';
                }}
            />
            <button
                onClick={() => document.getElementById(inputId)?.click()}
                disabled={isLoading}
                style={{
                    width: "100%",
                    padding: "30px",
                    borderRadius: "12px",
                    border: isDragOver ? "2px dashed var(--primary)" : "1px dashed rgba(255,255,255,0.3)",
                    background: isDragOver ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)",
                    color: isDragOver ? "var(--primary)" : "white",
                    fontWeight: 700,
                    cursor: isLoading ? "wait" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "all 0.2s"
                }}
            >
                {isLoading ? (
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
    );
};
