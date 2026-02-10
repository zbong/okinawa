import React, { useState, useEffect, useCallback } from 'react';
import { TripPlan, LocationPoint, CustomFile } from '../types';
import { supabase } from '../utils/supabase';

interface UseTripManagerProps {
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>;
    user: any;
}

export const useTripManager = ({ showToast, setDeleteConfirmModal, user }: UseTripManagerProps) => {
    // Trips & Current Trip
    const [trips, setTrips] = useState<TripPlan[]>([]);
    const [trip, setTrip] = useState<TripPlan | null>(null);
    const [allPoints, setAllPoints] = useState<LocationPoint[]>([]);
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
    const [userReviews, setUserReviews] = useState<Record<string, { rating: number; text: string }>>({});
    const [userLogs, setUserLogs] = useState<Record<string, string>>({});
    const [customFiles, setCustomFiles] = useState<CustomFile[]>([]);
    const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);

    // 1. Initial Load (Supabase Only)
    useEffect(() => {
        const loadTrips = async () => {
            if (!user) {
                setTrips([]);
                return;
            }

            try {
                // Load from Supabase
                const { data, error } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const serverTrips = data.map(t => ({
                        id: t.id,
                        metadata: t.metadata,
                        points: t.points || [],
                        customFiles: t.custom_files || [],
                        analyzedFiles: t.analyzed_files || [],
                        completed_items: t.completed_items || {},
                        user_reviews: t.user_reviews || {},
                        user_logs: t.user_logs || {},
                        speechData: t.speech_data || [],
                        defaultFiles: []
                    }));

                    // Merge: Keep local trips that are currently syncing (not yet on server)
                    setTrips(prev => {
                        const syncingLocal = prev.filter(t =>
                            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) &&
                            isSyncing.current.has(t.id)
                        );
                        return [...syncingLocal, ...serverTrips];
                    });
                }
            } catch (err) {
                console.error("❌ Failed to load trips from Supabase:", err);
                showToast("여행 목록을 불러오는 중 오류가 발생했습니다.", "error");
            }
        };

        loadTrips();
    }, [user, showToast]);


    // 3. Save/Update Trip in Supabase
    const isSyncing = React.useRef<Set<string>>(new Set());

    // Track deleted IDs to prevent zombies
    const deletedTripIds = React.useRef<Set<string>>(new Set());

    const saveTripToSupabase = useCallback(async (targetTrip: TripPlan) => {
        if (!user || isSyncing.current.has(targetTrip.id) || deletedTripIds.current.has(targetTrip.id)) return;

        // Ensure we have a valid UUID or generate one if it's a legacy string ID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTrip.id);
        const tripId = isUuid ? targetTrip.id : undefined;

        // Date Format Helper
        const formatDate = (dateStr: string | undefined) => {
            if (!dateStr || dateStr.trim() === "" || dateStr === "미정") return null;
            const cleaned = dateStr.replace(/\./g, '-').trim();
            const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return match ? match[0] : null;
        };

        isSyncing.current.add(targetTrip.id);
        console.log(`💾 Syncing trip [${targetTrip.id}] "${targetTrip.metadata?.title}"...`);

        try {
            // Check if it was deleted while waiting
            if (deletedTripIds.current.has(targetTrip.id)) {
                console.log("Trip was deleted, aborting save.");
                return;
            }

            // ... rest of logic
            // Robust Profile Ensure
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
            if (!profile) {
                await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    username: user.email?.split('@')[0] || 'User',
                    updated_at: new Date().toISOString()
                });
            }

            // Determine the definitive data to save
            const isActive = trip?.id === targetTrip.id;

            const pointsToSave = (isActive && allPoints.length > 0) ? allPoints : (targetTrip.points || []);
            const customFilesToSave = (isActive && customFiles.length > 0) ? customFiles : (targetTrip.customFiles || []);
            const analyzedFilesToSave = (isActive && analyzedFiles.length > 0) ? analyzedFiles : (targetTrip.analyzedFiles || []);
            const completedToSave = isActive ? completedItems : ((targetTrip as any).completed_items || {});
            const reviewsToSave = isActive ? userReviews : ((targetTrip as any).user_reviews || {});
            const logsToSave = isActive ? userLogs : ((targetTrip as any).user_logs || {});

            // CRITICAL: Protection against accidental empty save
            if (pointsToSave.length === 0 && targetTrip.points && targetTrip.points.length > 0) {
                console.warn("⚠️ Attempted to save empty points for a trip that has points in object. Aborting sync.");
                return;
            }

            const payload: any = {
                user_id: user.id,
                title: targetTrip.metadata?.title || (targetTrip as any).title || "제목 없음",
                destination: targetTrip.metadata?.destination || (targetTrip as any).destination || "목적지 없음",
                start_date: formatDate(targetTrip.metadata?.startDate || (targetTrip as any).startDate),
                end_date: formatDate(targetTrip.metadata?.endDate || (targetTrip as any).endDate),
                metadata: targetTrip.metadata || {},
                points: pointsToSave,
                custom_files: customFilesToSave,
                analyzed_files: analyzedFilesToSave,
                completed_items: completedToSave,
                user_reviews: reviewsToSave,
                user_logs: logsToSave,
                speech_data: targetTrip.speechData || []
            };

            if (tripId) payload.id = tripId;

            const { data, error } = await supabase
                .from('trips')
                .upsert(payload, { onConflict: 'id' })
                .select();

            if (error) {
                console.error("❌ Supabase Save Error:", error);
            } else if (data && !tripId) {
                const newId = data[0].id;
                console.log(`✅ Trip published with new UUID: ${newId}`);
                setTrips(prev => prev.map(t => t.id === targetTrip.id ? { ...t, id: newId } : t));
                if (trip?.id === targetTrip.id) setTrip(prev => prev ? { ...prev, id: newId } : null);
            } else {
                console.log(`✅ Trip [${targetTrip.id}] synced successfully.`);
            }
        } catch (error: any) {
            console.error("Critical error in sync:", error);
        } finally {
            // Allow re-sync after 3 seconds
            setTimeout(() => isSyncing.current.delete(targetTrip.id), 3000);
        }
    }, [user, completedItems, userReviews, userLogs, customFiles, analyzedFiles, allPoints, trip]);


    // 4. Sync "trip" -> Sub-states (allPoints, etc.)
    useEffect(() => {
        if (trip) {
            setAllPoints(trip.points || []);
            setCustomFiles(trip.customFiles || []);
            setAnalyzedFiles(trip.analyzedFiles || []);

            // Sync user interaction data if available in the trip object
            const t = trip as any;
            if (t.completed_items) setCompletedItems(t.completed_items);
            if (t.user_reviews) setUserReviews(t.user_reviews);
            if (t.user_logs) setUserLogs(t.user_logs);
        }
    }, [trip]);

    // 5. Load sub-data (checklist, etc.)
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        // If logged in, we assume these are already part of the 'trip' object or fetched via sync
    }, [trip?.metadata?.destination, user]);


    const publishTrip = async (newTrip: TripPlan) => {
        // 1. Add to local state first for immediate UI feedback (Check for duplicates)
        setTrips(prev => {
            const exists = prev.some(t => t.id === newTrip.id);
            if (exists) {
                return prev.map(t => t.id === newTrip.id ? newTrip : t);
            }
            return [newTrip, ...prev];
        });

        // 2. Trigger immediate save to Supabase
        await saveTripToSupabase(newTrip);
    };

    // Actions
    const deleteTrip = async (id: string) => {
        console.log("🗑️ Attempting to delete trip:", id);

        // 1. Block any in-flight syncs for this ID
        isSyncing.current.add(id);
        deletedTripIds.current.add(id);

        try {
            // 2. Remove from local state IMMEDIATELY
            setTrips(prev => prev.filter(t => t.id !== id));
            if (trip?.id === id) setTrip(null);

            // 3. Remove from Supabase if logged in
            if (user) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                if (isUuid) {
                    const { error } = await supabase.from('trips').delete().eq('id', id);
                    if (error) {
                        console.error("Error deleting trip from Supabase:", error);
                        // showToast is optional here as we already updated UI
                    } else {
                        console.log("✅ Successfully deleted from Supabase");
                    }
                }
            }
            showToast("여행 가이드가 삭제되었습니다.");
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            // Keep blocking sync for a while just in case
            setTimeout(() => isSyncing.current.delete(id), 10000);
        }
    };

    const handleReorder = (newOrder: LocationPoint[], scheduleDay: number) => {
        setAllPoints((prev) => {
            const otherPoints = prev.filter((p) => p.day !== scheduleDay);
            const updated = [...otherPoints, ...newOrder];
            if (trip) setTrip({ ...trip, points: updated });
            return updated;
        });
    };

    const deletePoint = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteConfirmModal({
            isOpen: true,
            title: "장소 삭제",
            message: "이 장소를 일정에서 삭제하시겠습니까?",
            onConfirm: () => {
                setAllPoints((prev) => {
                    const filtered = prev.filter((p) => p.id !== id);
                    if (trip) setTrip({ ...trip, points: filtered });
                    return filtered;
                });
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
        setAllPoints((prev) => {
            const updated = [...prev, newPoint];
            if (trip) setTrip({ ...trip, points: updated });
            return updated;
        });
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

    const getPoints = useCallback((day?: number) => {
        const targetDay = day || 1;
        return allPoints.filter((p) => Number(p.day) === Number(targetDay));
    }, [allPoints]);

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
        analyzedFiles, setAnalyzedFiles,
        handleReorder,
        deletePoint,
        deleteTrip,
        addPoint,
        publishTrip,
        toggleComplete,
        updateReview,
        updateLog,
        getPoints,
        calculateProgress
    };
};

