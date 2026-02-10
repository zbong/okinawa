import { supabase } from '../../utils/supabase';
import { TripPlan, LocationPoint } from '../../types';

interface UsePlannerActionsProps {
    plannerState: any;
    setTrip: React.Dispatch<React.SetStateAction<TripPlan | null>>;
    setAllPoints: React.Dispatch<React.SetStateAction<LocationPoint[]>>;
    setPlannerStep: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    generatePlan: (customPrompt?: string) => Promise<any>;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    trip: TripPlan | null;
    allPoints: LocationPoint[];
    completedItems: Record<string, boolean>;
    userReviews: Record<string, { rating: number; text: string }>;
    userLogs: Record<string, string>;
    setCompletedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setUserReviews: React.Dispatch<React.SetStateAction<Record<string, { rating: number; text: string }>>>;
    setUserLogs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setTripCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
}

export const usePlannerActions = ({
    plannerState,
    setTrip,
    setAllPoints,
    setPlannerStep,
    showToast,
    generatePlan,
    setActiveTab,
    trip,
    allPoints,
    completedItems,
    userReviews,
    userLogs,
    setCompletedItems,
    setUserReviews,
    setUserLogs,
    setTripCustomFiles
}: UsePlannerActionsProps) => {

    const generatePlanWithAI = async (customPrompt?: string) => {
        const planData = await generatePlan(customPrompt);
        if (planData) {
            const mappedPoints = (planData.points || []).map((p: any) => {
                const sourceAttr = plannerState.dynamicAttractions.find((a: any) => a.name === p.name);
                const sourceAcc = plannerState.plannerData.accommodations.find((a: any) => a.name === p.name);

                // Ensure day is a number and exists
                const dayNum = p.day ? Number(p.day) : 1;

                return {
                    ...p,
                    id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                    day: dayNum,
                    coordinates: sourceAttr?.coordinates || sourceAcc?.coordinates || p.coordinates || { lat: 26.2124, lng: 127.6809 },
                    category: sourceAttr?.category || (sourceAcc ? 'stay' : (p.type || p.category || 'sightseeing')),
                    isCompleted: false,
                    images: p.images || []
                };
            });

            const daysMap: Record<number, LocationPoint[]> = {};
            mappedPoints.forEach((p: any) => {
                const d = p.day;
                if (!daysMap[d]) daysMap[d] = [];
                daysMap[d].push(p);
            });

            let dayCount = 3;
            if (plannerState.plannerData.startDate && plannerState.plannerData.endDate) {
                const start = new Date(plannerState.plannerData.startDate);
                const end = new Date(plannerState.plannerData.endDate);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                }
            }

            const days = Array.from({ length: dayCount }).map((_, i) => ({
                day: i + 1,
                points: daysMap[i + 1] || []
            }));

            const finalPlan: TripPlan = {
                metadata: {
                    title: plannerState.plannerData.title || `${plannerState.plannerData.destination} 여행`,
                    destination: plannerState.plannerData.destination,
                    period: `${plannerState.plannerData.startDate} ~ ${plannerState.plannerData.endDate}`,
                    startDate: plannerState.plannerData.startDate,
                    endDate: plannerState.plannerData.endDate,
                    useRentalCar: plannerState.plannerData.useRentalCar,
                },
                id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                speechData: [],
                defaultFiles: [],
                points: mappedPoints,
                days: days,
                customFiles: [...plannerState.customFiles],
                analyzedFiles: [...plannerState.analyzedFiles],
                recommendations: planData.recommendations || []
            };

            if (plannerState.plannerData.destination) {
                localStorage.removeItem(`points_order_${plannerState.plannerData.destination}`);
            }

            setTrip(finalPlan);
            setAllPoints(finalPlan.points);
            setPlannerStep(8);
        }
    };

    const saveDraft = (step: number, customData: any = {}) => {
        const draft = {
            step,
            data: plannerState.plannerData,
            selectedIds: plannerState.selectedPlaceIds,
            attractions: plannerState.dynamicAttractions,
            hotels: plannerState.recommendedHotels,
            hotelStrategy: plannerState.hotelStrategy,
            customFiles: plannerState.customFiles,
            analyzedFiles: plannerState.analyzedFiles,
            updated: Date.now(),
            ...customData
        };
        try {
            localStorage.setItem("trip_draft_v1", JSON.stringify(draft));
            return true;
        } catch (e) {
            console.error("Save draft failed:", e);
            showToast("용량이 부족하여 저장하지 못했습니다. 불필요한 파일을 삭제해주세요.", "error");
            return false;
        }
    };

    const exportTrip = () => {
        const data = {
            version: "2.0",
            trip,
            points: allPoints,
            checklist: completedItems,
            reviews: userReviews,
            logs: userLogs,
            files: plannerState.customFiles, // Export current planner files if any, or trip files? Original code used customFiles from Context which was mixed.
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${trip?.metadata?.title || "okinawa_trip"}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("여행 데이터가 파일로 추출되었습니다.", "success");
    };

    const importTrip = async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.trip && data.points) {
                setTrip(data.trip);
                setAllPoints(data.points);
                if (data.checklist) setCompletedItems(data.checklist);
                if (data.reviews) setUserReviews(data.reviews);
                if (data.logs) setUserLogs(data.logs);
                if (data.files) setTripCustomFiles(data.files);

                showToast("여행 가이드를 성공적으로 불러왔습니다.", "success");
                setActiveTab("summary");
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            showToast("파일 형식이 올바르지 않거나 손상되었습니다.", "error");
        }
    };

    const copyShareLink = async (targetTrip?: any) => {
        const tripData = targetTrip || trip;
        if (!tripData) return;

        const metadata = tripData.metadata || tripData;
        const title = metadata.title || "여행 가이드";

        showToast("공유 링크를 생성 중입니다...", "info");

        const shareData = {
            metadata: {
                ...metadata,
                isShared: true
            },
            points: tripData.points || allPoints.filter((p: any) => p.day > 0),
            customFiles: tripData.customFiles || []
        };

        try {
            const { data, error } = await supabase
                .from('shared_trips')
                .insert([{
                    trip_data: shareData,
                    title: title,
                    destination: metadata.destination || ""
                }])
                .select();

            if (error) throw error;
            const shareId = data[0].id;
            const VERCEL_DOMAIN = "https://okinawa-lime.vercel.app";
            const shareUrl = `${VERCEL_DOMAIN}/?id=${shareId}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                showToast("링크가 복사되었습니다! 원하는 곳에 붙여넣으세요.", "success");
            } else {
                window.prompt("링크를 복사해 주세요:", shareUrl);
            }
        } catch (dbError: any) {
            console.error("Supabase error:", dbError);
            showToast(`공유 실패: ${dbError.message || "연결 오류"}`, "error");
        }
    };

    return {
        generatePlanWithAI,
        saveDraft,
        exportTrip,
        importTrip,
        copyShareLink
    };
};
