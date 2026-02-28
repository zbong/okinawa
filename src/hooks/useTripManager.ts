import React, { useState, useEffect, useCallback } from 'react';
import { TripPlan, LocationPoint, CustomFile } from '../types';
import { supabase } from '../utils/supabase';
import { saveTripsToDB, getTripsFromDB, saveSingleTripToDB, deleteTripFromDB } from '../utils/tripCache';

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
                        checklists: t.metadata?.checklists || [],
                        defaultFiles: []
                    }));

                    // ✅ IndexedDB에 스냅샷 저장 (오프라인 대비)
                    saveTripsToDB(serverTrips).catch(e => console.warn('[TripCache] snapshot failed:', e));

                    // Merge: Keep local trips that are currently syncing OR preserve their state
                    setTrips(prev => {
                        const syncingTrips = prev.filter(t => isSyncing.current.has(t.id));
                        const filteredServer = serverTrips.filter(t => !isSyncing.current.has(t.id));
                        return [...syncingTrips, ...filteredServer];
                    });
                }
            } catch (err) {
                console.error("❌ Failed to load trips from Supabase:", err);

                // 🔌 오프라인 fallback: IndexedDB에서 읽기
                try {
                    const cachedTrips = await getTripsFromDB();
                    if (cachedTrips.length > 0) {
                        console.log(`[TripCache] Loaded ${cachedTrips.length} trips from IndexedDB (offline).`);
                        setTrips(cachedTrips);
                        showToast("오프라인 모드 - 저장된 데이터를 불러왔습니다.", "info");
                    } else {
                        showToast("여행 목록을 불러올 수 없습니다. 인터넷 연결을 확인해주세요.", "error");
                    }
                } catch (cacheErr) {
                    console.error('[TripCache] IndexedDB fallback failed:', cacheErr);
                    showToast("여행 목록을 불러오는 중 오류가 발생했습니다.", "error");
                }
            }
        };

        loadTrips();
    }, [user, showToast]);


    // 3. Save/Update Trip in Supabase
    const isSyncing = React.useRef<Set<string>>(new Set());

    // Track deleted IDs to prevent zombies
    const deletedTripIds = React.useRef<Set<string>>(new Set());

    const saveTripToSupabase = useCallback(async (targetTrip: TripPlan, isImmediate: boolean = false, overrides: any = {}) => {
        if (!user || deletedTripIds.current.has(targetTrip.id)) return;


        // Skip check if immediate
        if (!isImmediate && isSyncing.current.has(targetTrip.id)) return;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTrip.id);
        const tripId = isUuid ? targetTrip.id : undefined;

        const formatDate = (dateStr: string | undefined) => {
            if (!dateStr || dateStr.trim() === "" || dateStr === "미정") return null;
            const cleaned = dateStr.replace(/\./g, '-').trim();
            const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return match ? match[0] : null;
        };

        isSyncing.current.add(targetTrip.id);
        console.log(`💾 Syncing trip [${targetTrip.id}]${isImmediate ? ' (IMMEDIATE)' : ''}...`);

        try {
            if (deletedTripIds.current.has(targetTrip.id)) return;

            // Ensure profile exists
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            const payload: any = {
                user_id: user.id,
                title: overrides.title || targetTrip.metadata?.title || "제목 없음",
                destination: overrides.destination || targetTrip.metadata?.destination || "목적지 없음",
                start_date: formatDate(overrides.startDate || targetTrip.metadata?.startDate),
                end_date: formatDate(overrides.endDate || targetTrip.metadata?.endDate),
                metadata: {
                    ...(overrides.metadata || targetTrip.metadata || {}),
                    checklists: overrides.checklists || targetTrip.checklists || []
                },
                // 🛑 CRITICAL: Overrides must take ABSOLUTE priority over local state
                points: overrides.points || allPoints,
                custom_files: overrides.customFiles || overrides.custom_files || customFiles,
                analyzed_files: overrides.analyzedFiles || overrides.analyzed_files || analyzedFiles,
                completed_items: overrides.completed_items || completedItems,
                user_reviews: overrides.user_reviews || userReviews,
                user_logs: overrides.user_logs || userLogs,
                speech_data: overrides.speechData || targetTrip.speechData || []
            };

            if (tripId) payload.id = tripId;

            const { data, error } = await supabase
                .from('trips')
                .upsert(payload, { onConflict: 'id' })
                .select();

            if (error) throw error;

            const updatedCount = data?.[0]?.custom_files?.length || 0;
            console.log(`✅ Sync Success: DB now has ${updatedCount} files.`);

            if (data) {
                const updatedServerTrip = data[0];
                const newId = updatedServerTrip.id;

                // Update lists and active trip
                setTrips(prev => prev.map(t => t.id === targetTrip.id ? {
                    ...t,
                    id: newId,
                    customFiles: updatedServerTrip.custom_files || []
                } : t));

                if (trip?.id === targetTrip.id) {
                    setTrip(prev => prev ? {
                        ...prev,
                        id: newId,
                        customFiles: updatedServerTrip.custom_files || []
                    } : null);

                    // 🚀 CRITICAL: Sync Sub-states IMMEDIATELY with server truth
                    setCustomFiles(updatedServerTrip.custom_files || []);
                    setAnalyzedFiles(updatedServerTrip.analyzed_files || []);
                    setAllPoints(updatedServerTrip.points || []);
                    setCompletedItems(updatedServerTrip.completed_items || {});
                    setUserReviews(updatedServerTrip.user_reviews || {});
                    setUserLogs(updatedServerTrip.user_logs || {});
                }

                // ✅ IndexedDB에도 최신 상태 저장
                const cacheTrip = {
                    id: newId,
                    metadata: updatedServerTrip.metadata,
                    points: updatedServerTrip.points || [],
                    customFiles: updatedServerTrip.custom_files || [],
                    analyzedFiles: updatedServerTrip.analyzed_files || [],
                    completed_items: updatedServerTrip.completed_items || {},
                    user_reviews: updatedServerTrip.user_reviews || {},
                    user_logs: updatedServerTrip.user_logs || {},
                    speechData: updatedServerTrip.speech_data || [],
                    checklists: updatedServerTrip.metadata?.checklists || [],
                    defaultFiles: []
                };
                saveSingleTripToDB(cacheTrip).catch(e => console.warn('[TripCache] update failed:', e));
            }
        } catch (error: any) {
            console.error("❌ Sync Error Details:", error);
        } finally {
            setTimeout(() => isSyncing.current.delete(targetTrip.id), 1000);
        }
    }, [user, allPoints, customFiles, analyzedFiles, completedItems, userReviews, userLogs, trip?.id]);


    // 4. Sync "trip" -> Sub-states (allPoints, etc.)
    useEffect(() => {
        if (trip) {
            // trip 객체(ID)가 바뀔 때만 하위 상태를 갱신
            const isDifferentTrip = prevTripId.current !== trip.id;

            if (isDifferentTrip) {
                console.log("🔄 Loading sub-states for trip:", trip.id);
                setAllPoints(trip.points || []);
                setCustomFiles(trip.customFiles || []);
                setAnalyzedFiles(trip.analyzedFiles || []);

                const t = trip as any;
                setCompletedItems(t.completed_items || {});
                setUserReviews(t.user_reviews || {});
                setUserLogs(t.user_logs || {});

                prevTripId.current = trip.id;
            }
        }
    }, [trip]);

    const prevTripId = React.useRef<string | null>(null);

    // 💾 Persist only the active trip's ID for session restore
    useEffect(() => {
        if (trip?.id) {
            localStorage.setItem('active_trip_id', trip.id);
        } else {
            localStorage.removeItem('active_trip_id');
        }
    }, [trip?.id]);

    // 🔄 On initial load (after trips are fetched), restore the last active trip
    const hasRestored = React.useRef(false);
    useEffect(() => {
        if (hasRestored.current || trips.length === 0) return;
        const lastId = localStorage.getItem('active_trip_id');
        if (lastId) {
            const found = trips.find(t => t.id === lastId);
            if (found) {
                setTrip(found);
                setAllPoints(found.points || []);
                hasRestored.current = true;
            }
        }
    }, [trips]);

    // 💾 4.1 Auto-Save REMOVED: No more background updates.


    // 5. Load sub-data (checklist, etc.)
    useEffect(() => {
        if (!trip?.metadata?.destination) return;
        // If logged in, we assume these are already part of the 'trip' object or fetched via sync
    }, [trip?.metadata?.destination, user]);


    const publishTrip = async (newTrip: TripPlan) => {
        // Strip draft flags from metadata before publishing
        const publishedTrip: TripPlan = {
            ...newTrip,
            metadata: {
                ...newTrip.metadata,
                is_draft: undefined,
                draft_step: undefined,
            } as any
        };

        // 1. Add to local state first for immediate UI feedback
        setTrips(prev => {
            const exists = prev.some(t => t.id === publishedTrip.id);
            if (exists) {
                return prev.map(t => t.id === publishedTrip.id ? publishedTrip : t);
            }
            return [publishedTrip, ...prev];
        });

        // 2. Trigger immediate save to Supabase
        await saveTripToSupabase(publishedTrip);
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
                    } else {
                        console.log("✅ Successfully deleted from Supabase");
                    }
                }
            }

            // ✅ IndexedDB에서도 삭제
            deleteTripFromDB(id).catch(e => console.warn('[TripCache] delete failed:', e));
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
        calculateProgress,
        saveTripToSupabase
    };
};

