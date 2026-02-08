import { useState, useEffect } from 'react';
import { TripPlan, LocationPoint, CustomFile } from '../types';
import { okinawaTrip } from '../data';

interface UseTripManagerProps {
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>;
}

export const useTripManager = ({ showToast, setDeleteConfirmModal }: UseTripManagerProps) => {
    // Trips & Current Trip
    const [trips, setTrips] = useState<TripPlan[]>(() => {
        if (typeof window === "undefined") return [okinawaTrip];
        const saved = localStorage.getItem("user_trips_v2");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse trips:", e);
            }
        }
        return [okinawaTrip];
    });

    const [trip, setTrip] = useState<TripPlan>(okinawaTrip);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("user_trips_v2", JSON.stringify(trips));
            } catch (e) {
                console.error("Critical: Failed to save trips to localStorage (QuotaExceeded)", e);
            }
        }
    }, [trips]);

    // Points Order (allPoints)
    const [allPoints, setAllPoints] = useState<LocationPoint[]>(() => {
        if (!okinawaTrip.metadata?.destination) return okinawaTrip.points || [];
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`points_order_${okinawaTrip.metadata.destination}`);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return okinawaTrip.points || [];
                }
            }
        }
        return okinawaTrip.points || [];
    });

    // Check completed items, reviews, logs, files
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
    const [userReviews, setUserReviews] = useState<Record<string, { rating: number; text: string }>>({});
    const [userLogs, setUserLogs] = useState<Record<string, string>>({});
    const [customFiles, setCustomFiles] = useState<CustomFile[]>([]);

    // Effects to sync "trip" -> "allPoints"
    useEffect(() => {
        if (trip && trip.metadata?.destination) {
            // Priority 1: If it's a shared trip, use its points directly
            if (trip.metadata.isShared) {
                console.log("📍 Shared trip detected. Using points from data.");
                setAllPoints(trip.points || []);
                return;
            }

            // Priority 2: Use local storage for local trips
            const saved = localStorage.getItem(`points_order_${trip.metadata.destination}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setAllPoints(parsed);
                        return;
                    }
                } catch (e) { }
            }
            setAllPoints(trip.points || []);
        } else if (trip && trip.points) {
            setAllPoints(trip.points);
        }
    }, [trip]);

    // Effect to sync "allPoints" -> LocalStorage
    useEffect(() => {
        if (trip && trip.metadata?.destination) {
            localStorage.setItem(`points_order_${trip.metadata.destination}`, JSON.stringify(allPoints));
        }
    }, [allPoints, trip]);

    // Load sub-data (checklist, etc.) when trip destination changes
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        const dest = trip.metadata.destination;

        const savedChecklist = localStorage.getItem(`checklist_${dest}`);
        setCompletedItems(savedChecklist ? JSON.parse(savedChecklist) : {});

        const savedReviews = localStorage.getItem(`reviews_${dest}`);
        setUserReviews(savedReviews ? JSON.parse(savedReviews) : {});

        const savedLogs = localStorage.getItem(`logs_${dest}`);
        setUserLogs(savedLogs ? JSON.parse(savedLogs) : {});

        const savedFiles = localStorage.getItem(`files_${dest}`);
        if (savedFiles) {
            setCustomFiles(JSON.parse(savedFiles));
        } else if (trip.customFiles && trip.customFiles.length > 0) {
            setCustomFiles(trip.customFiles);
        } else if (customFiles.length === 0) {
            // Only clear if we don't already have unsaved files (like from earlier planning steps)
            setCustomFiles([]);
        }
    }, [trip?.metadata?.destination, trip.customFiles]);

    // Save sub-data
    useEffect(() => {
        if (trip?.metadata?.destination) {
            try {
                localStorage.setItem(`checklist_${trip.metadata.destination}`, JSON.stringify(completedItems));
            } catch (e) {
                console.warn("Storage quota exceeded for checklist", e);
            }
        }
    }, [completedItems, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            try {
                localStorage.setItem(`reviews_${trip.metadata.destination}`, JSON.stringify(userReviews));
            } catch (e) {
                console.warn("Storage quota exceeded for reviews", e);
            }
        }
    }, [userReviews, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            try {
                localStorage.setItem(`logs_${trip.metadata.destination}`, JSON.stringify(userLogs));
            } catch (e) {
                console.warn("Storage quota exceeded for logs", e);
            }
        }
    }, [userLogs, trip?.metadata?.destination]);

    useEffect(() => {
        if (trip?.metadata?.destination) {
            try {
                localStorage.setItem(`files_${trip.metadata.destination}`, JSON.stringify(customFiles));
            } catch (e) {
                console.warn("Storage quota exceeded for files", e);
            }
        }
    }, [customFiles, trip?.metadata?.destination]);


    // Actions
    const handleReorder = (newOrder: LocationPoint[], scheduleDay: number) => {
        const otherPoints = allPoints.filter((p) => p.day !== scheduleDay);
        setAllPoints([...otherPoints, ...newOrder]);
    };

    const deletePoint = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteConfirmModal({
            isOpen: true,
            title: "장소 삭제",
            message: "이 장소를 일정에서 삭제하시겠습니까?",
            onConfirm: () => {
                setAllPoints((prev) => prev.filter((p) => p.id !== id));
                showToast("장소가 삭제되었습니다.");
                setDeleteConfirmModal({
                    isOpen: false,
                    title: "",
                    message: "",
                    onConfirm: () => { },
                });
            },
        });
    };

    const addPoint = (day: number, point: any) => {
        const newPoint: LocationPoint = {
            ...point,
            id: `manual-${Date.now()}`,
            day,
        };
        setAllPoints((prev) => [...prev, newPoint]);
        showToast("장소가 추가되었습니다.", "success");
    };

    const toggleComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const updateReview = (id: string, rating: number, text: string) => {
        setUserReviews((prev) => ({
            ...prev,
            [id]: { rating, text },
        }));
    };

    const updateLog = (id: string, text: string) => {
        setUserLogs((prev) => ({
            ...prev,
            [id]: text,
        }));
    };

    const getPoints = (day: number) => {
        return allPoints.filter((p) => p.day === day);
    };

    const calculateProgress = () => {
        const total = allPoints.length;
        if (total === 0) return 0;
        const completed = allPoints.filter(p => completedItems[p.id]).length;
        return Math.round((completed / total) * 100);
    };

    return {
        trips, setTrips,
        trip, setTrip,
        allPoints, setAllPoints,
        completedItems, setCompletedItems,
        userReviews, setUserReviews,
        userLogs, setUserLogs,
        customFiles, setCustomFiles,
        handleReorder,
        deletePoint,
        addPoint,
        toggleComplete,
        updateReview,
        updateLog,
        getPoints,
        calculateProgress
    };
};
