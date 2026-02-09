import { useEffect } from 'react';

/**
 * Custom hook for global app event handlers.
 * - Error handling (window.onerror, unhandledrejection)
 * - Drag & drop prevention (prevents browser from opening dropped files)
 */
export const useAppEvents = () => {
    useEffect(() => {
        // Global error handlers
        const errorHandler = (event: ErrorEvent) =>
            console.error("🔥🔥🔥 GLOBAL ERROR:", event.error);
        const promiseHandler = (event: PromiseRejectionEvent) =>
            console.error("🔥🔥🔥 UNHANDLED PROMISE:", event.reason);
        window.addEventListener("error", errorHandler);
        window.addEventListener("unhandledrejection", promiseHandler);

        // Prevent browser from opening dropped files globally
        const preventDefault = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("dragover", preventDefault);
        window.addEventListener("drop", preventDefault);

        return () => {
            window.removeEventListener("error", errorHandler);
            window.removeEventListener("unhandledrejection", promiseHandler);
            window.removeEventListener("dragover", preventDefault);
            window.removeEventListener("drop", preventDefault);
        };
    }, []);
};
