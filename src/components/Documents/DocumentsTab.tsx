import React, { useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Code } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

interface DocumentsTabProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => void;
  deleteFile: (id: string, e?: React.MouseEvent) => void;
}

// HTML 파일을 인라인 미리보기로 렌더링하는 컴포넌트
const HtmlPreview: React.FC<{ content: string | undefined; name: string }> = ({ content, name }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !content) return;
    const iframe = iframeRef.current;

    const loadContent = async () => {
      try {
        let html = "";
        if (content.startsWith('http')) {
          // Fetch from URL (e.g. Supabase Storage)
          const resp = await fetch(content);
          html = await resp.text();
        } else if (content.startsWith('data:')) {
          // Handle data URIs directly
          const parts = content.split(',');
          if (parts.length > 1) {
            const mimeType = parts[0].split(';')[0].split(':')[1];
            const base64Content = parts[1];
            if (mimeType.includes('html')) {
              try {
                html = decodeURIComponent(escape(atob(base64Content)));
              } catch {
                html = atob(base64Content);
              }
            } else {
              // Fallback for other data URIs if needed, though not expected for HTML preview
              console.warn("HtmlPreview received a non-HTML data URI:", mimeType);
              html = `<pre>Unsupported data URI type: ${mimeType}</pre>`;
            }
          }
        } else if (!content.trim().startsWith('<')) {
          // Base64 decoding
          try {
            html = decodeURIComponent(escape(atob(content)));
          } catch {
            html = atob(content);
          }
        } else {
          html = content;
        }

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      } catch (e) {
        console.warn('HTML preview failed:', e);
      }
    };

    loadContent();
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      title={name}
      sandbox="allow-same-origin allow-scripts"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px 8px 0 0',
        background: '#fff',
      }}
    />
  );
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  handleFileUpload,
  deleteFile
}) => {
  const {
    activeTab,
    trip,
    customFiles,
    setSelectedFile,
  } = usePlanner();

  if (activeTab !== "files") return null;

  const renderFileCard = (f: any, isDefault: boolean = false) => {
    const fileType = f.type || '';
    const isImage = isDefault || fileType === 'image';
    const isHtml = !isDefault && (
      fileType === 'html' ||
      f.name?.toLowerCase().endsWith('.html') ||
      f.name?.toLowerCase().endsWith('.htm')
    );
    const isPdf = fileType === 'pdf' || f.name?.toLowerCase().endsWith('.pdf');
    const rawData = isDefault ? f.path : (f.url || f.data);

    // src 정리
    let displaySrc = rawData;
    if (!isDefault && rawData && !rawData.startsWith('data:') && !rawData.startsWith('http')) {
      if (isImage) displaySrc = `data:image/jpeg;base64,${rawData}`;
      else if (isHtml) displaySrc = `data:text/html;base64,${rawData}`;
      else if (isPdf) displaySrc = `data:application/pdf;base64,${rawData}`;
    }

    return (
      <div
        key={isDefault ? f.name : f.id}
        className="file-card"
        onClick={() => {
          if (isImage || isHtml || isPdf) setSelectedFile({ ...f, data: displaySrc });
        }}
        style={{ cursor: (isImage || isHtml || isPdf) ? 'pointer' : 'default' }}
      >
        {/* 미리보기 및 클릭 영역 */}
        <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
          {isImage ? (
            <img src={displaySrc} alt={f.name} className="file-img" style={{ height: '100%' }} />
          ) : isHtml ? (
            <div className="file-img" style={{ position: 'relative', height: '100%', padding: 0, background: '#fff' }}>
              <HtmlPreview content={rawData} name={f.name} />
              {/* Click Overlay for iframe */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
            </div>
          ) : (
            <div
              className="file-img"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', flexDirection: 'column', gap: 6, height: '100%' }}
            >
              <FileText size={36} color="var(--primary)" />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.7 }}>{isPdf ? 'PDF' : 'FILE'}</span>
            </div>
          )}
        </div>

        <div className="file-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, overflow: 'hidden' }}>
            {isHtml && <Code size={12} color="var(--primary)" style={{ flexShrink: 0 }} />}
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
          </div>
          {!isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card's onClick from firing
                deleteFile(f.id, e);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
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
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e);
            }
          }}
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
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          새 파일 업로드
        </div>
      </div>

      {/* All Files (Merged & Deduped) */}
      {(() => {
        // 중복 파일 렌더링 방지: ID와 Path를 조합하여 유일성 식별
        const cFiles = (customFiles || []).map(f => ({ ...f, _isDefault: false }));
        const dFiles = (trip?.defaultFiles || []).map(f => ({ ...f, _isDefault: true }));
        const all = [...cFiles, ...dFiles];

        // 이름 기준이 아닌 내부 ID/경로 기준으로 유일성 체크
        const unique = all.filter((f, index, self) =>
          index === self.findIndex(t => ((t as any).id && (t as any).id === (f as any).id) || ((t as any).path && (t as any).path === (f as any).path))
        );

        return unique.map((f, i) => (
          <React.Fragment key={(f as any).id || (f as any).path || `file-${i}`}>
            {renderFileCard(f, f._isDefault)}
          </React.Fragment>
        ));
      })()}
    </div>
  );
};
