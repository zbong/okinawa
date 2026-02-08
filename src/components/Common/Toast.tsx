import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {

    const getToastConfig = (type: 'success' | 'error' | 'info') => {
        switch (type) {
            case 'success':
                return {
                    title: '완료',
                    icon: <CheckCircle2 size={24} />,
                    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.95))', // Vibrant Emerald Gradient
                    shadow: '0 10px 40px -10px rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgba(52, 211, 153, 0.4)'
                };
            case 'error':
                return {
                    title: '오류',
                    icon: <AlertTriangle size={24} />,
                    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.95))', // Vibrant Red Gradient
                    shadow: '0 10px 40px -10px rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgba(248, 113, 113, 0.4)'
                };
            case 'info':
            default:
                return {
                    title: '알림',
                    icon: <Info size={24} />,
                    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.95))', // Vibrant Blue Gradient
                    shadow: '0 10px 40px -10px rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(96, 165, 250, 0.4)'
                };
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 6000000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                pointerEvents: 'none',
                width: '100%',
                padding: '0 24px',
            }}
        >
            <AnimatePresence>
                {toasts.map((toast) => {
                    const config = getToastConfig(toast.type);
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                background: config.gradient,
                                border: `1px solid ${config.borderColor}`,
                                borderRadius: '24px',
                                boxShadow: config.shadow,
                                padding: '24px',
                                width: '100%',
                                maxWidth: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                position: 'relative',
                                pointerEvents: 'auto',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '50%',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                    }}>
                                        {config.icon}
                                    </div>
                                    <span style={{
                                        fontSize: '20px',
                                        fontWeight: 800,
                                        color: 'white',
                                        letterSpacing: '-0.5px',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {config.title}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                fontSize: '16px',
                                color: 'rgba(255,255,255,0.95)',
                                lineHeight: '1.6',
                                fontWeight: 600,
                                paddingLeft: '4px'
                            }}>
                                {toast.message}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
