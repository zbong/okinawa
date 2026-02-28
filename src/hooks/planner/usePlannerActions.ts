import { supabase } from '../../utils/supabase';
import { TripPlan, LocationPoint } from '../../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retryWithBackoff } from '../../utils/ai-parser';
import { saveAudioBlob } from '../../utils/audioCache';
import { cacheFileFromUrl } from '../../utils/fileCache';
import { getDestinationInfo } from '../../utils/destinationHelper';

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
    customFiles: any[];
    analyzedFiles: any[];
    setCompletedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setUserReviews: React.Dispatch<React.SetStateAction<Record<string, { rating: number; text: string }>>>;
    setUserLogs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    user: any;
    setTrips: React.Dispatch<React.SetStateAction<TripPlan[]>>;
    setPlannerData: React.Dispatch<React.SetStateAction<any>>;
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
    customFiles,
    analyzedFiles,
    setCompletedItems,
    setUserReviews,
    setUserLogs,
    setCustomFiles,
    user,
    setTrips,
    setPlannerData
}: UsePlannerActionsProps) => {

    const generatePlanWithAI = async (customPrompt?: string) => {
        try {
            const planData = await generatePlan(customPrompt);
            if (!planData) {
                throw new Error("AI가 일정을 생성하지 못했습니다. (데이터 미수신)");
            }

            const mappedPoints = (planData.points || []).map((p: any) => {
                const isSafeMatch = (aName: string, pName: string) => {
                    const cleanA = aName.replace(/\s+/g, '');
                    const cleanP = pName.replace(/\s+/g, '');
                    if (cleanA === cleanP) return true;
                    if (cleanA.length > 2 && cleanP.length > 2) {
                        return cleanA.includes(cleanP) || cleanP.includes(cleanA);
                    }
                    return false;
                };

                const sourceAttr = plannerState.dynamicAttractions.find((a: any) => isSafeMatch(a.name, p.name));
                const sourceAcc = plannerState.plannerData.accommodations.find((a: any) => isSafeMatch(a.name, p.name));

                // Ensure day is a number and exists
                const dayNum = p.day ? Number(p.day) : 1;

                // Prioritize rich content: Source longDesc -> AI Plan longDesc -> Source desc -> AI Plan desc
                const richDescription = sourceAttr?.longDesc || p.longDesc || p.description || p.desc || sourceAttr?.desc || sourceAttr?.description || sourceAcc?.desc || "";

                if (!richDescription) {
                    console.warn(`⚠️ No description found for point: ${p.name}`);
                }

                const getValidCoords = (c: any) => c && (Number(c.lat) !== 0 || Number(c.lng) !== 0) ? c : null;
                const finalCoords = getValidCoords(sourceAttr?.coordinates) || getValidCoords(sourceAcc?.coordinates) || getValidCoords(p.coordinates) || { lat: 0, lng: 0 };

                return {
                    ...p,
                    id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                    day: dayNum,
                    coordinates: finalCoords,
                    category: sourceAttr?.category || (sourceAcc ? 'stay' : (p.type || p.category || 'sightseeing')),
                    longDesc: sourceAttr?.longDesc || p.longDesc || "",
                    description: richDescription || "",  // 빈 문자열은 AI로 나중에 채움
                    isCompleted: false,
                    images: p.images || sourceAttr?.images || []
                };
            });

            // ━━━ 부족한 상세 설명 AI 자동 보충 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            // 숙소 체크인/출발, 우리집 같은 logistics 포인트는 제외
            const SKIP_KEYWORDS = ['출발', '우리집', '체크인', '공항'];
            const missingDesc = mappedPoints.filter((p: any) =>
                (!p.description || p.description.length < 30) &&
                p.category !== 'stay' &&
                p.category !== 'logistics' &&
                !SKIP_KEYWORDS.some(kw => p.name?.includes(kw))
            );

            if (apiKey && missingDesc.length > 0) {
                showToast(`장소 설명 ${missingDesc.length}개를 AI가 자동으로 채우고 있습니다...`, "info");
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const destination = plannerState.plannerData.destination;
                const companion = plannerState.plannerData.companion;

                // 429 에러 방지를 위해 순차 처리 + 지연 시간 추가
                const CONCURRENCY = 1;
                for (let i = 0; i < missingDesc.length; i += CONCURRENCY) {
                    const p = missingDesc[i];
                    try {
                        const prompt = `[장소: "${p.name}"] [여행지: ${destination}] [동행자: ${companion}]
위 장소에 대해 전문 여행 가이드북 작가처럼 3문장 이상으로 상세하게 설명해주세요. 한국어로.
DESC: (여기에 본문 작성)`;
                        const result = await retryWithBackoff(() => model.generateContent(prompt), 1);
                        const text = result.response.text().trim();
                        const match = text.match(/DESC:\s*([\s\S]*?)$/);
                        if (match) {
                            const filled = match[1].trim();
                            const idx = mappedPoints.findIndex((mp: any) => mp.id === p.id);
                            if (idx !== -1) mappedPoints[idx].description = filled;
                        }
                    } catch (e) {
                        console.warn(`[AI 보충] 실패: ${p.name}`, e);
                    }
                    // 각 장소 설명 생성 사이 1초 대기 (API 부하 감소)
                    await new Promise(r => setTimeout(r, 1000));
                }
                console.log(`[AI 보충] 완료: ${missingDesc.length}개`);
            }

            // ━━━ 이미지 URL 오프라인 케싱 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            const imagePoints = mappedPoints.filter((p: any) => p.images && p.images.length > 0);
            if (imagePoints.length > 0) {
                const cachePromises = imagePoints.flatMap((p: any) =>
                    (p.images as string[]).map((url: string, i: number) =>
                        cacheFileFromUrl(`img-${p.id}-${i}`, url)
                            .catch(e => console.warn(`[ImageCache] 실패: ${url}`, e))
                    )
                );
                await Promise.allSettled(cachePromises);
                console.log(`[ImageCache] ${imagePoints.length}개 장소 이미지 케싱 완료`);
            }

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

            // AI로 목적지 언어에 맞는 회화 데이터 생성
            let speechDataWithAudio: any[] = [];
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                const destination = plannerState.plannerData.destination;
                if (apiKey && destination) {
                    showToast(`${destination} 현지 회화를 생성 중입니다...`, "info");
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
                    const prompt = `Generate 10 essential travel phrases for visiting "${destination}".
                    CRITICAL: If the destination is in Japan, use EXCLUSIVELY Standard Japanese (Hyojungo). DO NOT use regional dialects like Okinawan.
                    For other countries, use the official standard language.
                    Return JSON array ONLY. 
                    Format: [{"kor": "한국어 의미", "local": "현지어 표기 (현지 문자)", "pron": "발음 (한국어 음역)", "lang": "ISO Language code"}]
                    Include: greeting, thank you, sorry, how much, menu please, delicious, restroom, check-in, this please, goodbye.
                    Ensure the "local" field contains the script of the actual standard local language.`;

                    const result = await retryWithBackoff(() => model.generateContent(prompt), 1);
                    const text = result.response.text().trim();
                    let parsed: any[] = [];
                    try {
                        parsed = JSON.parse(text);
                    } catch (e) {
                        const jsonMatch = text.match(/\[[\s\S]*\]/);
                        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                    }

                    if (parsed && parsed.length > 0) {
                        // ── Audio Caching Phase (Offline Support) ──
                        speechDataWithAudio = await Promise.all(parsed.map(async (item: any, idx: number) => {
                            const localText = item.local || '';
                            const rawLang = item.lang || 'ja-JP';
                            const lang = rawLang.split('-').slice(0, 2).join('-');
                            const audioKey = `audio-${destination}-${idx}-${Date.now()}`;

                            try {
                                const ttsUrl = `/api/tts?ie=UTF-8&q=${encodeURIComponent(localText)}&tl=${lang}&client=tw-ob`;
                                const resp = await fetch(ttsUrl);
                                if (resp.ok) {
                                    const blob = await resp.blob();
                                    await saveAudioBlob(audioKey, blob);
                                }
                            } catch (e) {
                                console.warn(`⚠️ Failed to cache audio offline for "${localText}":`, e);
                            }

                            return {
                                id: `ai-speech-${idx}`,
                                category: 'basic',
                                kor: item.kor || '',
                                jp: localText,
                                pron: item.pron || '',
                                audio: audioKey,
                                lang: lang
                            };
                        }));
                    }
                }
            } catch (e) {
                console.warn('AI speech generation failed, using basic fallback:', e);
                // Fallback basic phrases
                const fallbacks = [
                    { kor: '안녕하세요', local: 'こんにちは', pron: '곤니치와', lang: 'ja-JP' },
                    { kor: '감사합니다', local: 'ありがとうございます', pron: '아리가토고자이마스', lang: 'ja-JP' },
                    { kor: '죄송합니다', local: 'すみません', pron: '스미마센', lang: 'ja-JP' },
                    { kor: '얼마인가요?', local: 'いくらですか？', pron: '이쿠라데스카?', lang: 'ja-JP' }
                ];
                speechDataWithAudio = fallbacks.map((f, i) => ({ id: `fallback-${i}`, category: 'basic', ...f }));
            }

            let dInfo = plannerState.plannerData.destinationInfo || trip?.metadata?.destinationInfo;

            // 🛡️ SUPER FALLBACK: If dInfo is still missing or defaults to USD while destination is not USA, try hard matching
            if (!dInfo || (!dInfo.currency || dInfo.currency === "USD") && plannerState.plannerData.destination && !plannerState.plannerData.destination.toLowerCase().includes("미국")) {
                const fallback = getDestinationInfo(plannerState.plannerData.destination);
                if (fallback.currency !== "USD" || plannerState.plannerData.destination.toLowerCase().includes("미국")) {
                    dInfo = fallback;
                }
            }

            console.log("[usePlannerActions] Finalizing trip with destinationInfo:", dInfo);

            const finalPlan: TripPlan = {
                metadata: {
                    title: plannerState.plannerData.title || `${plannerState.plannerData.destination} 여행`,
                    destination: plannerState.plannerData.destination,
                    period: `${plannerState.plannerData.startDate} ~ ${plannerState.plannerData.endDate}`,
                    startDate: plannerState.plannerData.startDate,
                    endDate: plannerState.plannerData.endDate,
                    useRentalCar: plannerState.plannerData.useRentalCar,
                    destinationInfo: dInfo || { country: "Unknown", currency: "USD", currencySymbol: "$", currencyName: "달러", flag: "🌐", language: "ko-KR", languageName: "한국어" }
                },
                id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                speechData: speechDataWithAudio,
                defaultFiles: [],
                points: mappedPoints,
                days: days,
                customFiles: [...customFiles],
                analyzedFiles: [...analyzedFiles],
                recommendations: planData.recommendations || [],
                checklists: plannerState.plannerData.checklists || []
            };

            if (plannerState.plannerData.destination) {
                localStorage.removeItem(`points_order_${plannerState.plannerData.destination}`);
            }

            setTrip(finalPlan);
            setAllPoints(finalPlan.points);
            setPlannerStep(8);
            showToast("여행 가이드가 완성되었습니다!", "success");
        } catch (error) {
            console.error("[usePlannerActions] generatePlanWithAI Error:", error);
            throw error; // PlannerStep7에서 catch하여 처리하도록 전파
        }
    };

    const saveDraft = async (step: number, customData: any = {}): Promise<string | null> => {
        if (!user) {
            showToast("로그인이 필요합니다.", "error");
            return null;
        }
        const plannerData = plannerState.plannerData;
        // ✅ Deduplicate and normalize accommodations before saving
        const rawAccs = plannerData.accommodations || [];
        const cleanedAccs: any[] = [];
        const getStableId = (name: string, addr: string, date: string) => {
            const n = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
            const a = (addr || "").replace(/[^a-z0-9]/gi, '').toLowerCase();
            const d = date || "nodate";
            return a.length > 8 ? `ST-${a.substring(0, 20)}-${d}` : `ST-${n.substring(0, 15)}-${d}`;
        };

        rawAccs.forEach((acc: any) => {
            const newId = getStableId(acc.name, acc.address, acc.startDate);
            const existingIdx = cleanedAccs.findIndex(existing => {
                const existingId = getStableId(existing.name, existing.address, existing.startDate);
                if (existingId === newId) return true;

                const alphaE = existing.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const alphaN = acc.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const nameMatch = (alphaE.length > 5 && alphaN.length > 5) && (alphaE.includes(alphaN) || alphaN.includes(alphaE));
                return nameMatch && acc.startDate === existing.startDate;
            });

            if (existingIdx > -1) {
                if (acc.isConfirmed) {
                    cleanedAccs[existingIdx].isConfirmed = true;
                    if (!cleanedAccs[existingIdx].address) cleanedAccs[existingIdx].address = acc.address;
                }
            } else {
                cleanedAccs.push({ ...acc, isConfirmed: !!acc.isConfirmed });
            }
        });

        // ✅ Sync cleaned data back to state so debug UI reflects it immediately
        setPlannerData((prev: any) => ({ ...prev, accommodations: cleanedAccs }));

        const draftPayload = {
            user_id: user.id,
            title: plannerData.title || `${plannerData.destination || "미정"} 여행 초안`,
            destination: plannerData.destination || "미정",
            start_date: plannerData.startDate || null,
            end_date: plannerData.endDate || null,
            metadata: {
                ...plannerData,
                accommodations: cleanedAccs, // Use cleaned list
                is_draft: true,
                draft_step: step,
                selectedIds: plannerState.selectedPlaceIds,
                attractions: plannerState.dynamicAttractions,
                hotels: plannerState.recommendedHotels,
                hotelStrategy: plannerState.hotelStrategy,
                scheduleDensity: plannerState.scheduleDensity,
                customAiPrompt: plannerState.customAiPrompt,
                updated: Date.now(),
                ...customData
            },
            points: allPoints || [],
            custom_files: customFiles || [],
            analyzed_files: analyzedFiles || [],
            completed_items: completedItems || {},
            user_reviews: userReviews || {},
            user_logs: userLogs || {},
            speech_data: trip?.speechData || [],
        };

        try {
            const existingId = plannerState.draftId;
            let savedId: string | null = null;

            if (existingId) {
                // Upsert existing draft
                const { error } = await supabase.from('trips').update(draftPayload).eq('id', existingId);
                if (error) throw error;
                savedId = existingId;
            } else {
                // Create new draft
                const { data, error } = await supabase.from('trips').insert([draftPayload]).select('id').single();
                if (error) throw error;
                if (data?.id && plannerState.setDraftId) {
                    plannerState.setDraftId(data.id);
                }
                savedId = data?.id || null;
            }

            // ✅ Optimistic update: sync local trips state so LandingPage shows latest draft_step
            if (savedId) {
                const localDraft: any = {
                    ...draftPayload,
                    id: savedId,
                    points: allPoints || [],
                    days: [],
                    speechData: [],
                    customFiles: customFiles || [],
                    analyzedFiles: analyzedFiles || [],
                    defaultFiles: [],
                };
                setTrips(prev => {
                    const exists = prev.some(t => t.id === savedId);
                    if (exists) {
                        return prev.map(t => t.id === savedId ? localDraft : t);
                    }
                    return [localDraft, ...prev];
                });
            }

            return savedId;
        } catch (e: any) {
            console.error("Save draft to DB failed:", e);
            showToast("저장 실패: " + (e.message || "알 수 없는 오류"), "error");
            return null;
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
            files: customFiles, // Export from core state
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
                if (data.files) setCustomFiles(data.files);

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
            customFiles: tripData.customFiles || [],
            speechData: tripData.speechData || []
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
