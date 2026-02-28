import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * 오프라인 상태 감지 배너
 * - 오프라인 시: 상단에 경고 배너 표시
 * - 온라인 복귀 시: "연결됨" 배너 잠깐 표시 후 자동 제거
 */
export const OfflineBanner: React.FC = () => {
    const { isOffline } = useOnlineStatus();
    const [showReconnected, setShowReconnected] = useState(false);
    const [prevOffline, setPrevOffline] = useState(false);

    useEffect(() => {
        if (prevOffline && !isOffline) {
            // 오프라인 → 온라인 복귀
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 3000);
            return () => clearTimeout(timer);
        }
        setPrevOffline(isOffline);
    }, [isOffline]);

    if (!isOffline && !showReconnected) return null;

    const isReconnected = !isOffline && showReconnected;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                transition: 'all 0.3s ease',
                background: isReconnected
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
                color: 'white',
                boxShadow: isReconnected
                    ? '0 2px 12px rgba(16,185,129,0.4)'
                    : '0 2px 12px rgba(220,38,38,0.4)',
            }}
        >
            {isReconnected ? (
                <>
                    <Wifi size={15} />
                    인터넷 연결이 복구되었습니다
                </>
            ) : (
                <>
                    <WifiOff size={15} />
                    오프라인 모드 — 저장된 데이터를 사용 중입니다
                </>
            )}
        </div>
    );
};
