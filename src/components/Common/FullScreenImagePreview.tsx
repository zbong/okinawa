import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FullScreenImagePreviewProps {
    file: {
        name: string;
        type?: string;
        data?: string;
        path?: string;
        url?: string;
    } | null;
    isOpen?: boolean;
    nonFixed?: boolean;
    onClose: () => void;
}

/**
 * Full screen image preview overlay
 */
export const FullScreenImagePreview: React.FC<FullScreenImagePreviewProps> = ({ file, isOpen = true, nonFixed = false, onClose }) => {
    const [htmlContent, setHtmlContent] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen && file && (file.type === 'html' || file.name?.toLowerCase().endsWith('.html') || file.name?.toLowerCase().endsWith('.htm'))) {
            const data = file.data || file.url || file.path;
            if (data && data.startsWith('http')) {
                fetch(data)
                    .then(res => res.text())
                    .then(text => setHtmlContent(text))
                    .catch(err => console.error("Failed to fetch HTML content:", err));
            } else if (data && data.startsWith('data:text/html;base64,')) {
                try {
                    const base64 = data.split(',')[1];
                    setHtmlContent(decodeURIComponent(escape(atob(base64))));
                } catch {
                    setHtmlContent(atob(data.split(',')[1]));
                }
            } else if (data && data.trim().startsWith('<')) {
                setHtmlContent(data);
            }
        } else {
            setHtmlContent(null);
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const isImage = file.type === 'image' || (!file.type && file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const isHtml = file.type === 'html' || (file.name && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')));
    const isPdf = file.type === 'pdf' || (file.name?.toLowerCase().endsWith('.pdf'));

    const displaySrc = file.url || file.data || file.path;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fullscreen-preview-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: nonFixed ? 'absolute' : 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px'
                    }}
                >
                    <motion.div
                        className="fullscreen-preview-content"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '95%',
                            maxHeight: '95%',
                            width: (isHtml || isPdf) ? '98%' : 'auto',
                            height: (isHtml || isPdf) ? '98%' : 'auto',
                            background: isHtml ? 'white' : 'transparent',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <X size={24} />
                        </button>

                        {isImage ? (
                            <img
                                src={displaySrc}
                                alt={file.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        ) : isHtml ? (
                            <iframe
                                srcDoc={htmlContent || undefined}
                                title={file.name}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                sandbox="allow-same-origin allow-scripts"
                            />
                        ) : isPdf ? (
                            <embed
                                src={displaySrc}
                                type="application/pdf"
                                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                            />
                        ) : (
                            <div style={{ color: 'white', textAlign: 'center' }}>
                                <p>미리보기를 지원하지 않는 형식입니다.</p>
                                <a href={displaySrc} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                                    원본 파일 보기
                                </a>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
