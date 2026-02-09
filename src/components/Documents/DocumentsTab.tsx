import React from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

interface DocumentsTabProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => void;
  deleteFile: (id: string, e?: React.MouseEvent) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  handleFileUpload,
  deleteFile
}) => {
  const {
    activeTab,
    trip,
    customFiles,
    setSelectedFile
  } = usePlanner();

  if (activeTab !== "files") return null;

  const renderFileCard = (f: any, isDefault: boolean = false) => {
    const isImage = isDefault || f.type === 'image';
    const rawData = isDefault ? f.path : f.data;

    // For custom files, check if prefix is missing
    const displaySrc = (!isDefault && isImage && rawData && !rawData.startsWith('data:'))
      ? `data:image/jpeg;base64,${rawData}`
      : rawData;

    return (
      <div
        key={isDefault ? f.name : f.id}
        className="file-card"
        onClick={() => isImage && setSelectedFile({ ...f, data: displaySrc })}
        style={{ cursor: isImage ? 'pointer' : 'default' }}
      >
        {isImage ? (
          <img src={displaySrc} alt={f.name} className="file-img" />
        ) : (
          <div className="file-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <FileText size={48} color="var(--primary)" />
          </div>
        )}
        <div
          className="file-info"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isDefault ? "100%" : "80%",
            }}
          >
            {f.name}
          </span>
          {!isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(f.id, e);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {!isDefault && f.linkedTo && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "var(--primary)",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 10,
              color: "black",
              fontWeight: "bold",
            }}
          >
            연결됨
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-grid" style={{ paddingBottom: 80 }}>
      {/* Upload Button */}
      <div
        className="file-card"
        style={{
          border: "2px dashed var(--glass-border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: "rgba(255,255,255,0.05)",
          position: "relative"
        }}
      >
        <input
          type="file"
          accept="image/*,.html,.htm,.pdf"
          onChange={(e) => handleFileUpload(e)}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
            zIndex: 10
          }}
        />
        <Upload
          size={24}
          style={{ color: "var(--primary)", marginBottom: 8 }}
        />
        <div
          style={{ fontSize: 12, color: "var(--text-secondary)" }}
        >
          새 파일 업로드
        </div>
      </div>

      {/* Custom Files */}
      {customFiles.map((f) => renderFileCard(f, false))}

      {/* Default Files */}
      {trip?.defaultFiles?.map((f) => renderFileCard(f, true))}
    </div>
  );
};
