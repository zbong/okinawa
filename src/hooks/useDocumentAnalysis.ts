import React, { useState, useRef, useCallback } from 'react';
import { PlannerData, FlightLeg } from '../types';
import { extractTextFromFile, parseUniversalDocument, fileToBase64 } from '../utils/ocr';
import { parseWithAI } from '../utils/ai-parser';
import { supabase } from '../utils/supabase';

interface UseDocumentAnalysisProps {
    plannerData: PlannerData;
    setPlannerData: React.Dispatch<React.SetStateAction<PlannerData>>;
    setCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    analyzedFiles: any[]; // Lifted state
    setAnalyzedFiles: React.Dispatch<React.SetStateAction<any[]>>; // Lifted state setter
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    setDeleteConfirmModal: React.Dispatch<React.SetStateAction<any>>; // For mismatch confirm dialog
    user?: any;    // Supabase user (for Storage upload)
    tripId?: string; // Active trip ID (for Storage path prefix)
}

// ─── Supabase Storage Helper ────────────────────────────────────────────────
const uploadFileToStorage = async (
    file: File,
    userId: string,
    tripId: string
): Promise<{ url: string; storagePath: string } | null> => {
    try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${tripId}/${timestamp}_${safeName}`;

        const { error } = await supabase.storage
            .from('trip-files')
            .upload(path, file, { upsert: true, contentType: file.type });

        if (error) {
            console.error('❌ Storage upload failed:', error);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('trip-files')
            .getPublicUrl(path);

        return { url: urlData.publicUrl, storagePath: path };
    } catch (err) {
        console.error('❌ Storage upload error:', err);
        return null;
    }
};
// ─────────────────────────────────────────────────────────────────────────────

export const useDocumentAnalysis = ({ plannerData, setPlannerData, setCustomFiles, analyzedFiles, setAnalyzedFiles, showToast, setDeleteConfirmModal, user, tripId }: UseDocumentAnalysisProps) => {

    // ── Promise 기반 모달 확인 헬퍼 ──────────────────────────────────────
    const showConfirmModal = useCallback((
        title: string,
        message: string,
        confirmText: string,
        cancelText: string
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            setDeleteConfirmModal({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                onConfirm: () => { resolve(true); },
                onCancel: () => { resolve(false); },
            });
        });
    }, [setDeleteConfirmModal]);
    // ─────────────────────────────────────────────────────────────────────
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    // const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]); // Removed internal state
    const ticketFileInputRef = useRef<HTMLInputElement>(null);

    // ── 목적지 키워드 매핑 (목적지 판별 + outbound/inbound 분류 공유) ──────────
    const DEST_KEYWORDS: Record<string, string[]> = {
        "오키나와": ["okinawa", "naha", "oka", "那覇", "沖縄"],
        "hokkaido": ["sapporo", "new chitose", "cts", "hkd", "hokkaido", "hakodate", "asahikawa", "北海道", "札幌", "新千歳"],
        "북해도": ["sapporo", "new chitose", "cts", "hkd", "hokkaido", "hakodate", "asahikawa", "北海道", "札幌", "新千歳"],
        "도쿄": ["tokyo", "narita", "nrt", "haneda", "hnd", "東京", "成田"],
        "osaka": ["osaka", "kansai", "itm", "kix", "大阪", "関西"],
        "오사카": ["osaka", "kansai", "itm", "kix", "大阪", "関西"],
        "후쿠오카": ["fukuoka", "fuk", "福岡"],
        "fukuoka": ["fukuoka", "fuk", "福岡"],
        "제주": ["jeju", "cju", "済州"],
        "bangkok": ["bangkok", "bkk", "suvarnabhumi", "dmk", "バンコク"],
        "방콕": ["bangkok", "bkk", "suvarnabhumi", "dmk", "バンコク"],
        "다낭": ["danang", "dad", "ダナン"],
        "danang": ["danang", "dad", "ダナン"],
        "세부": ["cebu", "ceb", "セブ"],
        "cebu": ["cebu", "ceb"],
    };

    const handleFileAnalysis = useCallback(async (files: File[], linkedTo?: string) => {
        if (files.length === 0) return;
        setIsOcrLoading(true);
        try {
            const updates: Partial<PlannerData> = {};
            let currentAnalyzedFiles = [...analyzedFiles];
            const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            // ── PHASE 1: 모든 파일 pre-parse (파싱 결과 임시 보관) ──────────────
            // 배치 업로드 시 환승 감지를 위해 먼저 모든 파일을 분석
            type PreParsedFile = {
                file: File;
                text: string;
                base64: string;
                mimeType: string;
                isSupportedMultimodal: boolean;
                parsed: any;
                fileIdx: number;
            };
            const preParsedFiles: PreParsedFile[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                const existingIdx = currentAnalyzedFiles.findIndex((f) => f.name === file.name);
                if (existingIdx !== -1) {
                    showToast(`기존 파일(${file.name})을 새로운 분석 결과로 대체합니다.`, "info");
                    currentAnalyzedFiles.splice(existingIdx, 1);
                }

                const fileId = `analyzed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                const fileIdx = currentAnalyzedFiles.length;
                currentAnalyzedFiles.push({ id: fileId, name: file.name, text: "", status: "loading" });
                setAnalyzedFiles([...currentAnalyzedFiles]);

                const mimeType = file.type || "image/jpeg";
                const isSupportedMultimodal =
                    mimeType.startsWith("image/") || mimeType === "application/pdf";

                let text = "";
                let base64 = "";

                if (!isSupportedMultimodal) {
                    text = await extractTextFromFile(file);
                    // For HTML, we also want the raw text/base64 to be available for preview
                    base64 = btoa(unescape(encodeURIComponent(text)));
                } else {
                    base64 = await fileToBase64(file);
                }

                let parsed;
                try {
                    const fileData = isSupportedMultimodal ? { base64, mimeType } : undefined;
                    parsed = await parseWithAI(text, fileData);
                } catch (err) {
                    console.error(`AI Parsing failure for ${file.name}:`, err);
                    if (!isSupportedMultimodal && text) {
                        parsed = parseUniversalDocument(text);
                    } else {
                        currentAnalyzedFiles[fileIdx] = {
                            ...currentAnalyzedFiles[fileIdx],
                            text: text || "(Analysis Failed)",
                            status: "error",
                        };
                        setAnalyzedFiles([...currentAnalyzedFiles]);
                        preParsedFiles.push({ file, text, base64, mimeType, isSupportedMultimodal, parsed: null, fileIdx });
                        continue;
                    }
                }

                if (i > 0) {
                    await sleep(2500);
                }

                currentAnalyzedFiles[fileIdx] = {
                    ...currentAnalyzedFiles[fileIdx],
                    text: text || "(Vision Mode)",
                    parsedData: parsed,
                    status: "done",
                };
                setAnalyzedFiles([...currentAnalyzedFiles]);

                preParsedFiles.push({ file, text, base64, mimeType, isSupportedMultimodal, parsed, fileIdx });
            }

            // ── PHASE 2: 환승 공항 세트 추출 (배치 업로드 시에만) ───────────
            // BFS 전이적 확장: 목적지와 연결된 공항 → 그 공항과 연결된 다음 구간도 확장
            // 예: ICN→NRT→PVG→BKK → transitAirports = {NRT, PVG, BKK} (환승 횟수 무관)
            const transitAirports = new Set<string>();
            const KOREA_AIRPORTS_SET = new Set(["ICN", "GMP", "PUS", "CJU", "TAE", "CJJ", "MWX", "YNY",
                "인천", "김포", "김해", "부산", "제주", "대구", "청주", "무안", "양양",
                "SEOUL", "BUSAN", "JEJU", "RKSI", "RKSS", "RKPK", "RKPC"]);

            if (files.length > 1) {
                const plannedDest = (plannerData.destination || "").toLowerCase();
                const batchMatchEntry = Object.entries(DEST_KEYWORDS).find(([key]) =>
                    plannedDest.includes(key) || key.includes(plannedDest)
                );
                if (batchMatchEntry) {
                    const [, destKeywords] = batchMatchEntry;

                    // Step 1: 목적지와 직접 연결되는 구간의 공항을 초기 시드로 등록
                    preParsedFiles.forEach(({ parsed }) => {
                        if (!parsed || parsed.type !== "flight") return;
                        const dep = (parsed.flight?.departureAirport || parsed.departure || "").toUpperCase();
                        const arr = (parsed.flight?.arrivalAirport || parsed.arrival || "").toUpperCase();
                        const depMatches = destKeywords.some(kw => dep.toLowerCase().includes(kw) || kw.includes(dep.toLowerCase()));
                        const arrMatches = destKeywords.some(kw => arr.toLowerCase().includes(kw) || kw.includes(arr.toLowerCase()));
                        if (depMatches || arrMatches) {
                            if (dep) transitAirports.add(dep);
                            if (arr) transitAirports.add(arr);
                        }
                    });

                    // Step 2: BFS 확장 — transitAirports와 연결된 구간의 비한국 공항도 재귀 추가
                    // (한국 공항은 홈베이스이므로 transitAirports에 포함하지 않음)
                    let changed = true;
                    while (changed) {
                        changed = false;
                        preParsedFiles.forEach(({ parsed }) => {
                            if (!parsed || parsed.type !== "flight") return;
                            const dep = (parsed.flight?.departureAirport || parsed.departure || "").toUpperCase();
                            const arr = (parsed.flight?.arrivalAirport || parsed.arrival || "").toUpperCase();
                            // 도착지가 transit set에 있으면 → 출발지도 환승 공항 (단, 한국 공항은 제외)
                            if (arr && transitAirports.has(arr) && dep && !KOREA_AIRPORTS_SET.has(dep) && !transitAirports.has(dep)) {
                                transitAirports.add(dep);
                                changed = true;
                            }
                            // 출발지가 transit set에 있으면 → 도착지도 환승 공항 (단, 한국 공항은 제외)
                            if (dep && transitAirports.has(dep) && arr && !KOREA_AIRPORTS_SET.has(arr) && !transitAirports.has(arr)) {
                                transitAirports.add(arr);
                                changed = true;
                            }
                        });
                    }

                    console.log("✈️ Transit airports (BFS expanded):", [...transitAirports]);
                }
            }

            // ── PHASE 3: 파싱 결과 처리 (환승 인식 + 모달 + 상태 반영) ──────
            for (const { file, base64, parsed, fileIdx } of preParsedFiles) {
                if (!parsed) continue; // 파싱 실패 건너뜀

                setAnalyzedFiles([...currentAnalyzedFiles]);

                // ── Supabase Storage Upload (로그인 유저만) ──────────────
                let storageUrl: string | undefined;
                let storagePath: string | undefined;

                if (user?.id && tripId) {
                    const uploaded = await uploadFileToStorage(file, user.id, tripId);
                    if (uploaded) {
                        storageUrl = uploaded.url;
                        storagePath = uploaded.storagePath;
                        console.log(`✅ Storage upload success: ${storagePath}`);
                    } else {
                        console.warn('⚠️ Storage 업로드 실패 → base64 폴백 사용');
                    }
                }
                // ─────────────────────────────────────────────────────────

                // Also Add to Custom Files for persistence and display in Document Tab / Step 6
                const newCustomFile: any = {
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type.includes("pdf") ? "pdf" : file.type.includes("html") ? "html" : "image",
                    // Storage URL 우선 사용, 실패 시 base64 폴백
                    url: storageUrl,
                    storagePath: storagePath,
                    data: storageUrl ? undefined : (base64 || undefined),
                    linkedTo: linkedTo || (
                        (parsed.type === "flight") ? "flight" :
                            (parsed.type === "accommodation" || parsed.type === "hotel" || parsed.type === "stay" || parsed.type === "lodging") ? "accommodation" :
                                "other"
                    ),
                    date: new Date().toISOString(),
                    parsedData: parsed
                };

                console.log(`--- [OCR 분석 결과: ${file.name}] ---`);
                console.log("Parsed Type:", parsed.type);
                console.log("Parsed Data:", parsed);
                // ── 목적지 불일치 검사 (파일 추가 전) ────────────────────────
                let shouldSkipFile = false;
                let destMatchEntry: [string, string[]] | undefined;
                if (parsed.type === "flight") {
                    const plannedDest = (plannerData.destination || "").toLowerCase();
                    const flightArrival = (
                        parsed.flight?.arrivalAirport || parsed.arrival || ""
                    ).toLowerCase();
                    const flightDeparture = (
                        parsed.flight?.departureAirport || parsed.departure || ""
                    ).toLowerCase();
                    const flightArrivalUpper = flightArrival.toUpperCase();
                    const flightDepartureUpper = flightDeparture.toUpperCase();

                    if (plannedDest && (flightArrival || flightDeparture)) {
                        const matchEntry = Object.entries(DEST_KEYWORDS).find(([key]) =>
                            plannedDest.includes(key) || key.includes(plannedDest)
                        );
                        destMatchEntry = matchEntry;

                        if (matchEntry) {
                            const [, validKeywords] = matchEntry;
                            const isMatch = validKeywords.some(kw =>
                                flightArrival.includes(kw) || kw.includes(flightArrival) ||
                                flightDeparture.includes(kw) || kw.includes(flightDeparture)
                            );
                            if (!isMatch) {
                                // ── 환승편 자동 감지 ─────────────────────────────────
                                // 배치 업로드 시, transitAirports와 연결된 경우 = 환승편
                                // 조건: 도착/출발 중 하나가 환승 공항이고 나머지가 한국 공항이거나 또 다른 환승 공항
                                const isTransitLeg = files.length > 1 && transitAirports.size > 0 && (
                                    (transitAirports.has(flightArrivalUpper) &&
                                        (KOREA_AIRPORTS_SET.has(flightDepartureUpper) || transitAirports.has(flightDepartureUpper))) ||
                                    (transitAirports.has(flightDepartureUpper) &&
                                        (KOREA_AIRPORTS_SET.has(flightArrivalUpper) || transitAirports.has(flightArrivalUpper)))
                                );

                                if (isTransitLeg) {
                                    // 환승편 자동 추가 (모달 없음)
                                    console.log(`✈️ Transit leg auto-added: ${flightDepartureUpper}→${flightArrivalUpper}`);
                                } else {
                                    // 관련 없는 항공권 → 모달로 확인
                                    const userConfirmed = await showConfirmModal(
                                        '⚠️ 목적지 불일치',
                                        `항공권 구간: ${parsed.flight?.departureAirport || parsed.departure} → ${parsed.flight?.arrivalAirport || parsed.arrival}\n여행 목적지: ${plannerData.destination}\n\n여행 목적지와 관련 없는 항공권입니다. 그래도 추가하시겠습니까?`,
                                        '그래도 추가',
                                        '취소'
                                    );
                                    if (!userConfirmed) {
                                        shouldSkipFile = true;
                                    }
                                }
                            }
                        }
                    }
                }
                // ─────────────────────────────────────────────────────────────

                // 사용자가 취소한 경우 파일 추가 건너뜀 + analyzedFiles에서도 제거
                if (shouldSkipFile) {
                    currentAnalyzedFiles = currentAnalyzedFiles.filter((_, idx) => idx !== fileIdx);
                    setAnalyzedFiles([...currentAnalyzedFiles]);
                    continue;
                }

                setCustomFiles((prev) => {
                    // 동일한 이름과 파일 크기(size)를 가지면 동일 파일로 간주하여 완전히 덮어씁니다.
                    // (스마트폰 등에서 이름만 'image.jpg'로 같은 다른 사진인 경우에는 파일 크기가 다르므로 각각 정상 추가됩니다.)
                    const isDuplicate = prev.some((f: any) => f.name === newCustomFile.name && f.size === newCustomFile.size);
                    if (isDuplicate) {
                        return prev.map((f: any) => (f.name === newCustomFile.name && f.size === newCustomFile.size) ? newCustomFile : f);
                    }
                    return [...prev, newCustomFile];
                });

                if (parsed.type === "flight") {
                    // ─────────────────────────────────────────────────────────

                    // User Requested: Do not auto-fill metadata fields like start date/point which are bound to input fields. Only append to list.
                    // (Logic Removed: Destination, Coordinates, TravelMode, StartDate, EndDate, ArrivalDate updates)

                    // Explicitly reset manual input fields to ensure they are empty after file processing
                    updates.airline = "";
                    updates.flightNumber = "";
                    updates.departureTime = "";
                    updates.arrivalTime = "";
                    updates.returnAirline = "";
                    updates.returnFlightNumber = "";
                    updates.returnDepartureTime = "";
                    updates.returnArrivalTime = "";

                    // Multi-leg Support
                    const newOutbound: FlightLeg[] = updates.outboundFlights || [...(plannerData.outboundFlights || [])];
                    const newInbound: FlightLeg[] = updates.inboundFlights || [...(plannerData.inboundFlights || [])];

                    // Helper to fuzzy check airport equality
                    const isSameAirport = (a: string, b: string) => {
                        if (!a || !b) return false;
                        const normalize = (s: string) => s.replace(/\s|\(.*\)/g, '').toLowerCase();
                        return normalize(a).includes(normalize(b)) || normalize(b).includes(normalize(a)) || a.includes(b) || b.includes(a);
                    };

                    // Helper to ensure HH:mm format
                    const normalizeTime = (t: any, fallback: string = "") => {
                        if (!t) return fallback;
                        const str = String(t).trim();
                        if (/^\d{4}$/.test(str)) return `${str.slice(0, 2)}:${str.slice(2)}`;
                        if (/^\d{1,2}[:.]\d{2}$/.test(str)) {
                            const cleaned = str.replace('.', ':');
                            return cleaned.length === 4 ? `0${cleaned}` : cleaned;
                        }
                        return str || fallback;
                    };

                    // 1. Primary Leg Processing (Extremely Robust Mapping)
                    if (parsed.flight || parsed.departureTime || parsed.startDate) {
                        const flightObj = parsed.flight || {};
                        const rawDepTime = flightObj.departureTime || parsed.departureTime || "";
                        const rawArrTime = flightObj.arrivalTime || parsed.arrivalTime || "";

                        // Last resort: Regex search in summary (handles 10:30 or 10.30)
                        const timeRegex = /\b([012]?\d[:.][0-5]\d)\b/g;
                        const timesFound = (parsed.summary || "").match(timeRegex) || [];
                        const cleanedTimes = timesFound.map((t: string) => t.replace('.', ':').padStart(5, '0').slice(-5));

                        const finalDepTime = normalizeTime(rawDepTime) || (cleanedTimes.length > 0 ? cleanedTimes[0] : "");
                        const finalArrTime = normalizeTime(rawArrTime) || (cleanedTimes.length > 1 ? cleanedTimes[1] : "");

                        const leg: FlightLeg = {
                            id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            airline: flightObj.airline || parsed.airline || "미확인 항공사",
                            flightNumber: flightObj.flightNumber || parsed.flightNumber || "",
                            departureContext: {
                                airport: flightObj.departureAirport || parsed.departure || "출발지",
                                date: flightObj.departureDate || parsed.flightDate || parsed.startDate || "",
                                time: finalDepTime
                            },
                            arrivalContext: {
                                airport: flightObj.arrivalAirport || parsed.arrival || "도착지",
                                date: flightObj.arrivalDate || flightObj.departureDate || parsed.flightDate || parsed.endDate || parsed.startDate || "",
                                time: finalArrTime
                            },
                            linkedFileId: file.name
                        };
                        console.log("✈️ Flight Analysis Success:", leg);

                        // Smart Chaining: Track trip progress
                        const currentDep = updates.departurePoint || plannerData.departurePoint || "";
                        const currentEntry = updates.entryPoint || plannerData.entryPoint || "";

                        let isOutbound = true;

                        const KOREA_AIRPORTS = ["ICN", "GMP", "PUS", "CJU", "TAE", "CJJ", "MWX", "YNY", "인천", "김포", "김해", "부산", "제주", "대구", "청주", "무안", "양양", "SEOUL", "BUSAN", "JEJU", "RKSI", "RKSS", "RKPK", "RKPC"];

                        // 0. Absolute Priority: Check against Korea Airports (Assuming Korea-based trip)
                        // If Arrival is Korea -> Inbound (Returning Home)
                        if (KOREA_AIRPORTS.some(code => isSameAirport(leg.arrivalContext.airport, code))) {
                            isOutbound = false;
                        }
                        // If Departure is Korea -> Outbound (Leaving Home)
                        else if (KOREA_AIRPORTS.some(code => isSameAirport(leg.departureContext.airport, code))) {
                            isOutbound = true;
                        }
                        // 1. Destination Keyword Check: 목적지 키워드가 출발지에 매칭 → inbound 시작
                        //    (예: 방콕여행에서 BKK→PVG는 오는편)
                        else if (destMatchEntry) {
                            const [, destKeywords] = destMatchEntry;
                            const depIsDestination = destKeywords.some(kw =>
                                leg.departureContext.airport.toLowerCase().includes(kw) || kw.includes(leg.departureContext.airport.toLowerCase())
                            );
                            const arrIsDestination = destKeywords.some(kw =>
                                leg.arrivalContext.airport.toLowerCase().includes(kw) || kw.includes(leg.arrivalContext.airport.toLowerCase())
                            );
                            if (depIsDestination && !arrIsDestination) {
                                // 목적지 출발 → 귀국편 (inbound)
                                isOutbound = false;
                            } else if (arrIsDestination && !depIsDestination) {
                                // 목적지 도착 → 가는편 (outbound)
                                isOutbound = true;
                            } else {
                                // 경유편 등 ambiguous → context 기반 fallback
                                if (isSameAirport(leg.departureContext.airport, currentEntry) && isSameAirport(leg.arrivalContext.airport, currentDep)) {
                                    isOutbound = false;
                                } else if (isSameAirport(leg.arrivalContext.airport, currentDep)) {
                                    isOutbound = false;
                                } else {
                                    isOutbound = true;
                                }
                            }
                        }
                        // 2. Context-based Logic (Fallback if no destination keywords matched)
                        else if (isSameAirport(leg.departureContext.airport, currentEntry)) {
                            if (isSameAirport(leg.arrivalContext.airport, currentDep)) {
                                isOutbound = false;
                            } else {
                                isOutbound = true;
                            }
                        } else if (isSameAirport(leg.arrivalContext.airport, currentDep)) {
                            isOutbound = false;
                        } else {
                            // Default / Start / Ambiguous
                            isOutbound = true;
                        }

                        if (isOutbound) {
                            if (!newOutbound.some(l => l.flightNumber === leg.flightNumber)) {
                                newOutbound.push({ ...leg, id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-out` });
                            }
                        } else {
                            if (!newInbound.some(l => l.flightNumber === leg.flightNumber)) {
                                newInbound.push({ ...leg, id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-in` });
                            }
                        }

                        // ── 날짜 불일치 체크 ────────────────────────────────────────
                        // 항공권 날짜가 계획된 여행 날짜 범위를 벗어나면 업데이트 제안
                        const toDateStr = (d: string) => d?.slice(0, 10) ?? ""; // YYYY-MM-DD 정규화
                        const tripStart = toDateStr(plannerData.startDate || "");
                        const tripEnd = toDateStr(plannerData.endDate || "");

                        if (!isOutbound) {
                            // 오는편: 도착 날짜가 여행 종료일보다 늦으면 종료일 업데이트 제안
                            const returnDate = toDateStr(leg.arrivalContext.date || leg.departureContext.date);
                            if (returnDate && tripEnd && returnDate > tripEnd) {
                                const confirmed = await showConfirmModal(
                                    '📅 귀국 날짜가 여행 종료일보다 늦습니다',
                                    `항공권 날짜: ${returnDate}\n계획된 종료일: ${tripEnd}\n\n여행 종료일을 항공권 날짜(${returnDate})로 업데이트하시겠습니까?`,
                                    '날짜 업데이트',
                                    '유지'
                                );
                                if (confirmed) {
                                    updates.endDate = returnDate;
                                }
                            }
                        } else {
                            // 가는편: 출발 날짜가 여행 시작일보다 이르면 시작일 업데이트 제안
                            const departDate = toDateStr(leg.departureContext.date);
                            if (departDate && tripStart && departDate < tripStart) {
                                const confirmed = await showConfirmModal(
                                    '📅 출발 날짜가 여행 시작일보다 이릅니다',
                                    `항공권 날짜: ${departDate}\n계획된 시작일: ${tripStart}\n\n여행 시작일을 항공권 날짜(${departDate})로 업데이트하시겠습니까?`,
                                    '날짜 업데이트',
                                    '유지'
                                );
                                if (confirmed) {
                                    updates.startDate = departDate;
                                }
                            }
                        }
                        // ────────────────────────────────────────────────────────────

                    }

                    // 2. Explicit Return Leg Processing (For tickets showing both ways)
                    if (parsed.flight?.returnDepartureTime || parsed.flight?.returnFlightNumber) {
                        const leg: FlightLeg = {
                            id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-return`,
                            airline: parsed.flight.returnAirline || parsed.flight.airline || "미확인 항공사",
                            flightNumber: parsed.flight.returnFlightNumber || "",
                            departureContext: {
                                airport: parsed.flight.returnDeparturePoint || "오키나와",
                                date: parsed.endDate || "",
                                time: parsed.flight.returnDepartureTime || ""
                            },
                            arrivalContext: {
                                airport: parsed.flight.returnArrivalPoint || "귀국지",
                                date: parsed.endDate || "",
                                time: parsed.flight.returnArrivalTime || ""
                            },
                            linkedFileId: file.name
                        };
                        if (!newInbound.some(l => l.flightNumber === leg.flightNumber)) {
                            newInbound.push(leg);
                        }
                    }

                    updates.outboundFlights = newOutbound;
                    updates.inboundFlights = newInbound;

                    // 3. Sync extracted data to manual input fields for visual feedback
                    if (newOutbound.length > 0) {
                        const firstLeg = newOutbound[0];
                        updates.airline = firstLeg.airline;
                        updates.flightNumber = firstLeg.flightNumber;
                        updates.departurePoint = firstLeg.departureContext.airport;
                        updates.entryPoint = firstLeg.arrivalContext.airport;
                        updates.departureTime = firstLeg.departureContext.time;
                        updates.arrivalTime = firstLeg.arrivalContext.time;
                        updates.startDate = firstLeg.departureContext.date;
                    }

                    if (newInbound.length > 0) {
                        const lastLeg = newInbound[newInbound.length - 1];
                        updates.returnAirline = lastLeg.airline;
                        updates.returnFlightNumber = lastLeg.flightNumber;
                        updates.returnDeparturePoint = lastLeg.departureContext.airport;
                        updates.returnArrivalPoint = lastLeg.arrivalContext.airport;
                        updates.returnDepartureTime = lastLeg.departureContext.time;
                        updates.returnArrivalTime = lastLeg.arrivalContext.time;
                        updates.endDate = lastLeg.departureContext.date;
                    }
                } else if (
                    parsed.type === "hotel" ||
                    parsed.type === "accommodation" ||
                    parsed.type === "stay" ||
                    parsed.type === "lodging" ||
                    (parsed.summary && (parsed.summary.includes("호텔") || parsed.summary.includes("Hotel") || parsed.summary.includes("숙소"))) ||
                    (linkedTo === "accommodation")
                ) {
                    const hotelName = parsed.hotelName || parsed.name || parsed.hotel || parsed.accommodation?.hotelName || parsed.accommodation?.name;
                    if (hotelName && hotelName !== "미확인" && hotelName !== "Unknown") {
                        const newAcc = {
                            name: hotelName,
                            address: parsed.address || parsed.accommodation?.address || "",
                            startDate: parsed.checkInDate || parsed.accommodation?.checkInDate || parsed.startDate || plannerData.startDate || "",
                            endDate: parsed.checkOutDate || parsed.accommodation?.checkOutDate || parsed.endDate || plannerData.endDate || "",
                            coordinates: parsed.coordinates || parsed.accommodation?.coordinates,
                            isConfirmed: true, // OCR에서 온 것은 확정
                        };

                        const currentAccs = (updates.accommodations || [...(plannerData.accommodations || [])]).map((a: any) => ({
                            ...a,
                            isConfirmed: a.isConfirmed === true // Force boolean for existing
                        }));

                        const getStableId = (name: string, addr: string, date: string) => {
                            const n = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                            const a = (addr || "").replace(/[^a-z0-9]/gi, '').toLowerCase();
                            const d = date || "nodate";
                            return a.length > 8 ? `ST-${a.substring(0, 20)}-${d}` : `ST-${n.substring(0, 15)}-${d}`;
                        };

                        const newId = getStableId(hotelName, newAcc.address, newAcc.startDate);
                        const existingIdx = currentAccs.findIndex((a: any) => {
                            const existingId = getStableId(a.name, a.address, a.startDate);
                            if (existingId === newId) return true;

                            // Fallback to aggressive name matching if IDs don't match perfectly
                            const alphaE = a.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
                            const alphaN = hotelName.replace(/[^a-z0-9]/gi, '').toLowerCase();
                            const nameMatch = (alphaE.length > 5 && alphaN.length > 5) && (alphaE.includes(alphaN) || alphaN.includes(alphaE));
                            return nameMatch && a.startDate === newAcc.startDate;
                        });

                        if (existingIdx === -1) {
                            updates.accommodations = [...currentAccs, newAcc];
                            console.log("🏨 [숙소 등록]:", hotelName, newAcc);
                        } else {
                            // 중복 발견 시: 기존 데이터 보강 (확정 상태 등)
                            const updated = [...currentAccs];
                            updated[existingIdx] = {
                                ...updated[existingIdx],
                                isConfirmed: true, // 바우처에서 온 것이므로 확정으로 강제
                                address: updated[existingIdx].address || newAcc.address,
                                endDate: updated[existingIdx].endDate || newAcc.endDate
                            };
                            updates.accommodations = updated;
                            console.log("🏨 [숙소 데이터 보강]:", hotelName);
                        }
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setPlannerData((prev) => ({ ...prev, ...updates }));
                showToast("티켓에서 정보를 추출하여 반영했습니다.", "success");
            }
        } catch (error) {
            console.error("OCR Analysis failed:", error);
            showToast("문서 분석 중 오류가 발생했습니다.", "error");
        } finally {
            setIsOcrLoading(false);
        }
    }, [analyzedFiles, plannerData, setPlannerData, showToast, showConfirmModal, setCustomFiles]);

    const handleTicketOcr = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleFileAnalysis([file]);
    }, [handleFileAnalysis]);

    const handleMultipleOcr = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFileAnalysis(files);
    }, [handleFileAnalysis]);

    return {
        isOcrLoading,
        setIsOcrLoading,
        analyzedFiles,
        setAnalyzedFiles,
        ticketFileInputRef,
        handleFileAnalysis,
        handleTicketOcr,
        handleMultipleOcr
    };
};
