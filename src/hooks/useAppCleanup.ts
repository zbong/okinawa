import { useEffect } from "react";

export const useAppCleanup = () => {
    // Draft Cleanup
    useEffect(() => {
        try {
            const saved = localStorage.getItem("trip_draft_v1");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.data) {
                    const hasData =
                        (parsed.data.destination || "").trim() !== "" ||
                        (parsed.data.title || "").trim() !== "";
                    if (!hasData && parsed.step === 0) {
                        localStorage.removeItem("trip_draft_v1");
                        console.log("🧹 Cleaned up empty draft.");
                    }
                }
            }
        } catch (e) {
            console.error("Draft cleanup error:", e);
        }
    }, []);

    // Cache Cleanup
    useEffect(() => {
        const CACHE_KEY = "attraction_recommendation_cache";
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
            try {
                const cache = JSON.parse(cachedStr);
                const now = Date.now();
                const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
                let hasChanges = false;

                Object.keys(cache).forEach((key) => {
                    if (now - cache[key].timestamp > sevenDaysInMs) {
                        delete cache[key];
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                    console.log("Cleaned up expired attraction cache items.");
                }
            } catch (e) {
                console.error("Cache cleanup error:", e);
            }
        }
    }, []);
};
