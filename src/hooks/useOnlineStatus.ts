import { useState, useEffect } from 'react';

/**
 * 현재 온라인/오프라인 상태를 감지하는 훅
 * navigator.onLine + online/offline 이벤트 조합 사용
 */
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, isOffline: !isOnline };
};
