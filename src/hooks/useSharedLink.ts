import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { usePlanner } from '../contexts/PlannerContext';

/**
 * Custom hook to handle shared trip links via URL parameters.
 * Parses the 'id' query parameter and loads the shared trip from Supabase.
 */
export const useSharedLink = () => {
    const {
        setTrip,
        setView,
        setActiveTab,
        setIsPlanning,
        showToast
    } = usePlanner();

    const isHandlingLink = useRef(false);

    useEffect(() => {
        const handleSharedLink = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const shareId = urlParams.get('id');

            if (shareId && !isHandlingLink.current) {
                isHandlingLink.current = true;

                // Clean URL immediately to prevent re-execution on refresh or back
                window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);

                console.log("🔍 Checking Share ID:", shareId);

                try {
                    const { data, error } = await supabase
                        .from('shared_trips')
                        .select('trip_data')
                        .eq('id', shareId)
                        .single();

                    if (error) {
                        console.error("❌ DB ERROR:", error.message, error.details, error.hint);
                        showToast(`데이터 로드 실패: ${error.message}`, "error");
                        // Clear trip state to prevent showing old data
                        setTrip(null);
                        throw error;
                    }

                    if (data && data.trip_data) {
                        const tripWithFlag = {
                            ...data.trip_data,
                            metadata: {
                                ...data.trip_data.metadata,
                                isShared: true
                            }
                        };
                        setTrip(tripWithFlag);
                        setIsPlanning(false);

                        setTimeout(() => {
                            setView("app");
                            setActiveTab("summary");
                            showToast("공유 가이드가 로드되었습니다.", "success");
                        }, 300);
                    } else {
                        showToast("공유된 일정이 존재하지 않습니다.", "error");
                        // Clear trip state if no data found for shared ID
                        setTrip(null);
                    }
                } catch (err: any) {
                    console.error("❌ Critical Load Error:", err);
                    isHandlingLink.current = false;
                    setTrip(null);

                    if (err.message === "Invalid API key" || err.status === 401) {
                        showToast("인증 오류: 관리자에게 문의하세요 (API Key).", "error");
                    } else if (err.code === "PGRST116") {
                        showToast("존재하지 않는 공유 링크입니다.", "error");
                    } else {
                        showToast("데이터 로드 중 오류가 발생했습니다.", "error");
                    }
                }
            }
        };
        handleSharedLink();
    }, [setTrip, setView, setActiveTab, setIsPlanning, showToast]);
};
