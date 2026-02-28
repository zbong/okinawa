import { useEffect } from "react";

export const useAppCleanup = () => {
    // Remove legacy localStorage keys from older versions
    useEffect(() => {
        const legacyKeys = [
            "trip_draft_v1",
            "current_trip_v1",
            "attraction_recommendation_cache",
        ];
        // Clean up any keys from old localStorage-based architecture
        legacyKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Removed legacy localStorage key: ${key}`);
            }
        });
        // Also clean up any autobackup drafts
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("trip_draft_v1")) {
                localStorage.removeItem(key);
            }
        });
    }, []);
};
