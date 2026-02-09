import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface FullScreenImagePreviewProps {
    file: {
        name: string;
        data?: string;
        path?: string;
    };
    onClose: () => void;
}

/**
 * Full screen image preview overlay
 */
export const FullScreenImagePreview: React.FC<FullScreenImagePreviewProps> = ({
    file,
    onClose
}) => {
    return (
        <div
            className="fullscreen-overlay"
            onClick={onClose}
            style={{ cursor: 'pointer' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 3001,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <X color="white" size={24} />
            </div>
            <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={file.data || file.path}
                alt={file.name}
                className="fullscreen-img"
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            />
        </div>
    );
};
