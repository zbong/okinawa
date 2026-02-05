import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
            }}
        >
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            background:
                                toast.type === 'success'
                                    ? '#10b981'
                                    : toast.type === 'error'
                                        ? '#ef4444'
                                        : '#3b82f6',
                            color: 'white',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            minWidth: 300,
                            maxWidth: 400,
                        }}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                            {toast.message}
                        </span>
                        <button
                            onClick={() => onClose(toast.id)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={16} color="white" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
