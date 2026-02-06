import { useState, useRef, useCallback } from 'react';
import { PlannerData } from '../types';
import { extractTextFromFile, parseUniversalDocument, fileToBase64 } from '../utils/ocr';
import { parseWithAI } from '../utils/ai-parser';

interface UseDocumentAnalysisProps {
    plannerData: PlannerData;
    setPlannerData: React.Dispatch<React.SetStateAction<PlannerData>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const useDocumentAnalysis = ({ plannerData, setPlannerData, showToast }: UseDocumentAnalysisProps) => {
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
    const [customAiPrompt, setCustomAiPrompt] = useState("");

    const resolveAirportName = (code: string | undefined) => {
        if (!code) return "";
        const map: Record<string, string> = {
            ICN: "인천국제공항 (ICN)",
            GMP: "김포국제공항 (GMP)",
            KIX: "간사이국제공항 (KIX)",
            NRT: "나리타국제공항 (NRT)",
            HND: "하네다공항 (HND)",
            FUK: "후쿠오카공항 (FUK)",
            CTS: "신치토세공항 (CTS)",
            OKA: "나하공항 (OKA)",
            CJU: "제주국제공항 (CJU)",
            PUS: "김해국제공항 (PUS)",
            TAE: "대구국제공항 (TAE)",
            CJJ: "청주국제공항 (CJJ)",
            MWX: "무안국제공항 (MWX)",
            YNY: "양양국제공항 (YNY)",
        };
        if (code.length === 3 && code === code.toUpperCase())
            return map[code] || code;
        return code;
    };

    const handleFileAnalysis = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        setIsOcrLoading(true);
        try {
            const updates: Partial<PlannerData> = {};
            // Use functional update to ensure we have fresh state if called directly,
            // but here we rely on analyzedFiles from closure. 
            // Better to use functional update for setAnalyzedFiles inside the loop if possible, 
            // or copy current analyzedFiles at start.
            let currentAnalyzedFiles = [...analyzedFiles];

            const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (currentAnalyzedFiles.some((f) => f.name === file.name)) {
                    showToast(`이미 추가된 파일입니다: ${file.name}`);
                    continue;
                }

                const fileIdx = currentAnalyzedFiles.length;
                currentAnalyzedFiles.push({ name: file.name, text: "", status: "loading" });
                setAnalyzedFiles([...currentAnalyzedFiles]);

                const mimeType = file.type || "image/jpeg";
                const isSupportedMultimodal =
                    mimeType.startsWith("image/") || mimeType === "application/pdf";

                let text = "";
                let base64 = "";

                if (!isSupportedMultimodal) {
                    text = await extractTextFromFile(file);
                } else {
                    base64 = await fileToBase64(file);
                }

                let parsed;
                try {
                    const fileData = isSupportedMultimodal
                        ? { base64, mimeType }
                        : undefined;
                    // Pass customAiPrompt if needed, but current implementation in context didn't seem to pass it?
                    // Ah, looking at context code, it didn't use customAiPrompt in parseWithAI call?
                    // Line 700: parsed = await parseWithAI(text, fileData);
                    // If customAiPrompt is intended to be used, we should pass it.
                    // But I will stick to original logic for now which didn't use it in line 700.
                    // Wait, let me check if customAiPrompt was used anywhere.
                    // It was state but maybe not passed effectively?
                    // I'll stick to exact copy first.
                    parsed = await parseWithAI(text, fileData);
                } catch (err) {
                    console.error(`AI Parsing failure for ${file.name}:`, err);
                    if (!isSupportedMultimodal && text) {
                        parsed = parseUniversalDocument(text);
                    } else {
                        currentAnalyzedFiles[fileIdx] = {
                            name: file.name,
                            text: text || "(Analysis Failed)",
                            status: "error",
                        };
                        setAnalyzedFiles([...currentAnalyzedFiles]);
                        continue;
                    }
                }

                if (i > 0) {
                    await sleep(1000);
                }

                currentAnalyzedFiles[fileIdx] = {
                    name: file.name,
                    text: text || "(Vision Mode)",
                    parsedData: parsed,
                    status: "done",
                };
                setAnalyzedFiles([...currentAnalyzedFiles]);

                if (parsed.type === "flight") {
                    const arrival = parsed.flight?.arrivalAirport || parsed.arrival;
                    if (arrival && arrival !== "도착지 미확인")
                        updates.destination = arrival;

                    if (parsed.flight?.departureAirport)
                        updates.departurePoint = resolveAirportName(
                            parsed.flight.departureAirport,
                        );
                    if (parsed.flight?.arrivalAirport)
                        updates.entryPoint = resolveAirportName(
                            parsed.flight.arrivalAirport,
                        );
                    if (parsed.flight?.departureCoordinates)
                        updates.departureCoordinates = parsed.flight.departureCoordinates;
                    if (parsed.flight?.arrivalCoordinates)
                        updates.entryCoordinates = parsed.flight.arrivalCoordinates;

                    updates.travelMode = "plane";

                    if (parsed.flight?.departureDate) {
                        updates.startDate = parsed.flight.departureDate;
                    } else if (parsed.startDate && parsed.startDate !== "미확인") {
                        updates.startDate = parsed.startDate;
                    }

                    if (parsed.flight?.arrivalDate) {
                        updates.arrivalDate = parsed.flight.arrivalDate;
                    }

                    const overallEnd = parsed.endDate || parsed.flight?.arrivalDate;
                    if (overallEnd && overallEnd !== "미확인")
                        updates.endDate = overallEnd;

                    if (parsed.flight?.departureTime)
                        updates.departureTime = parsed.flight.departureTime;
                    if (parsed.flight?.arrivalTime)
                        updates.arrivalTime = parsed.flight.arrivalTime;
                    if (parsed.flight?.returnDepartureTime)
                        updates.returnDepartureTime = parsed.flight.returnDepartureTime;
                    if (parsed.flight?.returnArrivalTime)
                        updates.returnArrivalTime = parsed.flight.returnArrivalTime;

                    if (parsed.flight?.airline) updates.airline = parsed.flight.airline;
                    if (parsed.flight?.flightNumber)
                        updates.flightNumber = parsed.flight.flightNumber;
                    if (parsed.flight?.returnAirline)
                        updates.returnAirline = parsed.flight.returnAirline;
                    if (parsed.flight?.returnFlightNumber)
                        updates.returnFlightNumber = parsed.flight.returnFlightNumber;
                } else if (parsed.type === "hotel" || parsed.type === "accommodation") {
                    const hotelName = parsed.hotelName || parsed.name;
                    if (hotelName && hotelName !== "미확인") {
                        const newAcc = {
                            name: hotelName,
                            address: parsed.address || "",
                            startDate: parsed.checkInDate || parsed.startDate || "",
                            endDate: parsed.checkOutDate || parsed.endDate || "",
                            coordinates: parsed.coordinates,
                        };
                        const existing = plannerData.accommodations || [];
                        // Note: plannerData here is from closure, might be stale if multiple updates happen quickly?
                        // But since we are accumulating updates in `updates` object and merging at the end, it should be fine for one batch.
                        // However, strictly speaking we should look at `updates.accommodations` too if multiple hotels in one batch.
                        const currentAccs = updates.accommodations || existing;
                        if (!currentAccs.some((a: any) => a.name === hotelName)) {
                            updates.accommodations = [...currentAccs, newAcc];
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
    }, [analyzedFiles, plannerData, setPlannerData, showToast]);

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
        customAiPrompt,
        setCustomAiPrompt,
        handleFileAnalysis,
        handleTicketOcr,
        handleMultipleOcr
    };
};
