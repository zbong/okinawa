import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Clock, Camera, MapPin, Search, Info, ImageOff } from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";

// ── 한국어/일본어 키워드 → 영어 검색어 매핑 ────────────────────────────────────
const KEYWORD_MAP: Record<string, string> = {
    // 활동
    "쿠킹": "cooking", "요리": "cooking", "클래스": "class", "체험": "experience",
    "스노클링": "snorkeling", "다이빙": "diving", "서핑": "surfing", "카약": "kayak",
    "패러글라이딩": "paragliding", "낚시": "fishing", "하이킹": "hiking",
    // 음식
    "라멘": "ramen", "스시": "sushi", "오키나와": "okinawa", "류큐": "ryukyu",
    "소바": "soba", "타코": "tacos", "아이스크림": "ice cream",
    // 장소 유형
    "해변": "beach", "海": "beach", "바다": "ocean", "산": "mountain",
    "신사": "shrine", "절": "temple", "성": "castle", "시장": "market",
    "공원": "park", "滝": "waterfall", "폭포": "waterfall", "호수": "lake",
    "리조트": "resort", "호텔": "hotel", "카페": "cafe", "레스토랑": "restaurant",
    "박물관": "museum", "수족관": "aquarium", "동물원": "zoo",
    // 오키나와 특화
    "美ら海": "okinawa aquarium", "首里": "shuri castle", "国際": "naha market",
    "マングローブ": "mangrove", "ヤンバル": "yanbaru forest",
};

function extractEnglishKeywords(placeName: string): string {
    const parts: string[] = [];

    // 매핑 테이블에서 매칭되는 키워드 추출
    for (const [ko, en] of Object.entries(KEYWORD_MAP)) {
        if (placeName.includes(ko)) parts.push(en);
    }

    // 기본: 항상 okinawa 포함 (최소 1개 보장)
    if (!parts.includes("okinawa")) parts.unshift("okinawa");

    // 중복 제거 후 최대 3개
    return [...new Set(parts)].slice(0, 3).join(",");
}

// ── Wikimedia Commons 이미지 검색 ─────────────────────────────────────────────
async function fetchWikimediaPhotos(placeName: string): Promise<string[]> {
    try {
        // Step 1: 장소 이름으로 Wikipedia 페이지 이미지 목록 가져오기
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(placeName)}&prop=pageimages&format=json&pithumbsize=800&pilimit=5&origin=*`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        const pages = data?.query?.pages || {};
        const urls: string[] = [];

        for (const page of Object.values(pages) as any[]) {
            if (page.thumbnail?.source) urls.push(page.thumbnail.source);
        }

        // Step 2: 영어로 못찾으면 Commons 검색 fallback
        if (urls.length === 0) {
            const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&srnamespace=6&srlimit=5&format=json&origin=*`;
            const res2 = await fetch(commonsUrl);
            const data2 = await res2.json();
            const results = data2?.query?.search || [];

            for (const item of results.slice(0, 4)) {
                const title = item.title.replace("File:", "");
                const thumbUrl = `https://commons.wikimedia.org/w/index.php?title=Special:FilePath&file=${encodeURIComponent(title)}&width=800`;
                urls.push(thumbUrl);
            }
        }
        return urls.slice(0, 4);
    } catch (e) {
        console.warn("Wikimedia photo fetch failed:", e);
        return [];
    }
}

// ── Loremflickr fallback 이미지 (API 키 불필요) ───────────────────────────────
function getFallbackPhotos(placeName: string): string[] {
    const seed = placeName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const lockA = seed % 9999;
    const lockB = (seed * 3) % 9999;
    const lockC = (seed * 7) % 9999;

    // 슬롯마다 서로 다른 키워드 조합 사용 → 다른 이미지 풀에서 검색
    const primary = extractEnglishKeywords(placeName);
    const parts = primary.split(",");
    const main = parts[0] ?? "okinawa";
    const sub = parts[1] ?? "japan";

    const kwA = `${main},${sub},travel`;      // 예: okinawa,cooking,travel
    const kwB = `japan,${main},culture`;      // 예: japan,cooking,culture
    const kwC = `okinawa,${sub},food`;        // 예: okinawa,cooking,food

    return [
        `https://loremflickr.com/800/500/${kwA}?lock=${lockA}`,
        `https://loremflickr.com/800/500/${kwB}?lock=${lockB}`,
        `https://loremflickr.com/800/500/${kwC}?lock=${lockC}`,
    ];
}

// ── 통합 사진 fetch (Wikimedia → Loremflickr fallback) ───────────────────────
async function fetchPlacePhotos(placeName: string): Promise<string[]> {
    const wikiPhotos = await fetchWikimediaPhotos(placeName);
    if (wikiPhotos.length > 0) return wikiPhotos;

    console.info(`[Photos] Wikimedia 결과 없음 → loremflickr fallback: "${placeName}"`);
    return getFallbackPhotos(placeName);
}

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────
export const AttractionDetailModal: React.FC = () => {
    const { theme, activeTab, activePlannerDetail, setActivePlannerDetail, fetchAttractionDetailWithAI, isFetchingDetail, dynamicAttractions } = usePlanner();
    const [photos, setPhotos] = useState<string[]>([]);
    const [photosLoading, setPhotosLoading] = useState(false);
    const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());

    const isLight = theme === 'light';

    // 모달 열릴 때마다 사진 로드 및 상세정보 fetch
    useEffect(() => {
        if (!activePlannerDetail?.name) {
            setPhotos([]);
            return;
        }

        // 상세정보 없으면 AI에 요청 (ai-, unified-, gen- 접두사 모두 대상)
        const hasContent = !!(activePlannerDetail.longDesc || activePlannerDetail.description);
        const needsDetail = !hasContent && activePlannerDetail.id &&
            (activePlannerDetail.id.startsWith("unified-") ||
                activePlannerDetail.id.startsWith("ai-") ||
                activePlannerDetail.id.startsWith("gen-") ||
                activePlannerDetail.id.startsWith("manual-"));

        if (needsDetail && activePlannerDetail.id) {
            console.log(`📡 Detail Modal: Triggering AI Detail Fetch for ${activePlannerDetail.name} (${activePlannerDetail.id})`);
            fetchAttractionDetailWithAI(activePlannerDetail.id);
        }

        setPhotos([]);
        setFailedPhotos(new Set());
        setPhotosLoading(true);
        fetchPlacePhotos(activePlannerDetail.name)
            .then(setPhotos)
            .finally(() => setPhotosLoading(false));
    }, [activePlannerDetail?.id]);

    // 상태 동기화: 스트리밍 중인 상세 정보 반영
    useEffect(() => {
        if (activePlannerDetail?.id) {
            const updated = dynamicAttractions.find(a => a.id === activePlannerDetail.id);
            if (updated && updated.longDesc !== activePlannerDetail.longDesc) {
                setActivePlannerDetail(updated);
            }
        }
    }, [dynamicAttractions]);

    // 탭 변경 시 닫기
    useEffect(() => {
        setActivePlannerDetail(null);
    }, [activeTab, setActivePlannerDetail]);

    const handleImgError = useCallback((src: string) => {
        setFailedPhotos(prev => new Set([...prev, src]));
    }, []);

    const hasDetailedContent = activePlannerDetail && (
        activePlannerDetail.longDesc ||
        activePlannerDetail.description ||
        activePlannerDetail.history ||
        (activePlannerDetail.attractions && activePlannerDetail.attractions.length > 0) ||
        activePlannerDetail.access
    );

    const visiblePhotos = photos.filter(p => !failedPhotos.has(p));

    return (
        <AnimatePresence>
            {activePlannerDetail && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.9)",
                        backdropFilter: "blur(15px)",
                        zIndex: 6000000,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                    }}
                    onClick={() => setActivePlannerDetail(null)}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="glass-card"
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            height: "92vh",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            background: "var(--sheet-bg)",
                            border: "1px solid var(--glass-border)",
                            boxShadow: "var(--card-shadow)",
                            borderRadius: "24px 24px 0 0",
                            margin: "0 auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--glass-border)", position: "relative" }}>
                            <div style={{ width: 40, height: 4, background: "var(--text-dim)", opacity: 0.2, borderRadius: 2, margin: "0 auto 16px" }} />
                            <button
                                onClick={() => setActivePlannerDetail(null)}
                                style={{
                                    position: "absolute", top: 20, right: 20,
                                    background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
                                    border: "none", color: "var(--text-primary)", cursor: "pointer",
                                    padding: "8px", borderRadius: "50%", zIndex: 10,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                            >
                                <X size={20} />
                            </button>
                            <div style={{ color: "var(--primary)", fontWeight: 900, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "8px" }}>
                                ATTRACTION REPORT
                            </div>
                            <h3 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "6px", color: "var(--text-primary)", lineHeight: 1.2 }}>
                                {activePlannerDetail.name}
                            </h3>
                        </div>

                        {/* ── 사진 갤러리 ───────────────────────────────────────── */}
                        {(photosLoading || visiblePhotos.length > 0) && (
                            <div style={{
                                padding: "14px 0 14px 20px",
                                borderBottom: "1px solid var(--glass-border)",
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    display: "flex",
                                    gap: 10,
                                    overflowX: "auto",
                                    paddingRight: 20,
                                    scrollbarWidth: "none",
                                }}>
                                    {photosLoading && photos.length === 0
                                        ? [0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: 140, height: 100, flexShrink: 0,
                                                borderRadius: 12,
                                                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                                                animation: "pulse 1.5s ease-in-out infinite",
                                            }} />
                                        ))
                                        : visiblePhotos.map((src, i) => (
                                            <div key={src} style={{ position: "relative", flexShrink: 0 }}>
                                                <motion.img
                                                    src={src}
                                                    alt={`${activePlannerDetail.name} ${i + 1}`}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    onError={() => handleImgError(src)}
                                                    style={{
                                                        width: 140, height: 100, flexShrink: 0,
                                                        objectFit: "cover",
                                                        borderRadius: 12,
                                                        display: "block",
                                                        cursor: "pointer",
                                                        border: "1px solid var(--glass-border)",
                                                    }}
                                                    onClick={() => window.open(src, "_blank")}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                                {!photosLoading && visiblePhotos.length === 0 && photos.length > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-dim)", fontSize: 12 }}>
                                        <ImageOff size={14} /> 사진을 불러올 수 없습니다
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content Area */}
                        <div style={{
                            flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "30px", textAlign: "left",
                        }}>
                            {isFetchingDetail && !activePlannerDetail.longDesc ? (
                                <div style={{
                                    padding: "40px 20px", textAlign: "center",
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                }}>
                                    <div className="animate-spin" style={{
                                        border: "3px solid transparent", borderTopColor: "var(--primary)", borderRightColor: "var(--primary)",
                                        borderRadius: "50%", width: "40px", height: "40px", marginBottom: "16px"
                                    }} />
                                    <h4 style={{ color: "var(--text-primary)", marginBottom: 8, fontWeight: 700 }}>AI가 생생한 설명서를 작성 중입니다...</h4>
                                </div>
                            ) : !hasDetailedContent && !isFetchingDetail ? (
                                <div style={{
                                    padding: "40px 20px", textAlign: "center",
                                    background: "rgba(0,0,0,0.02)", borderRadius: "20px",
                                    border: "1px dashed var(--glass-border)"
                                }}>
                                    <Info size={40} color="var(--text-dim)" style={{ marginBottom: 16, opacity: 0.5 }} />
                                    <h4 style={{ color: "var(--text-primary)", marginBottom: 8, fontWeight: 700 }}>상세 정보가 없습니다</h4>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
                                        이 정보는 AI 플래너를 통해 여행을 생성할 때 자동으로 채워집니다.<br />
                                        직접 추가한 장소이거나 기존 일정인 경우, 아래 버튼들을 활용해 정보를 확인해 주세요.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {(activePlannerDetail.longDesc || activePlannerDetail.description || isFetchingDetail) && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <FileText size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>장소 개요</h4>
                                                {isFetchingDetail && (
                                                    <span style={{
                                                        fontSize: '11px', background: 'rgba(0,212,255,0.1)',
                                                        padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto',
                                                        display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}>
                                                        <div className="animate-spin" style={{ width: 8, height: 8, border: '1px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                                        작성 중...
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ lineHeight: 1.7, fontSize: "15px", color: "var(--text-primary)", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                                                {activePlannerDetail.longDesc || activePlannerDetail.description}
                                                {isFetchingDetail && <span className="animate-pulse">|</span>}
                                            </p>
                                        </section>
                                    )}

                                    {activePlannerDetail.tips && activePlannerDetail.tips.length > 0 && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <Info size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>실용적인 팁</h4>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {activePlannerDetail.tips.map((item: string, i: number) => (
                                                    <div key={i} style={{
                                                        padding: "14px",
                                                        background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                                                        borderRadius: "12px",
                                                        borderLeft: "3px solid #facc15",
                                                        fontSize: "14px", lineHeight: 1.5,
                                                        color: "var(--text-primary)"
                                                    }}>
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {activePlannerDetail.history && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <Clock size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>역사와 유래</h4>
                                            </div>
                                            <p style={{ lineHeight: 1.7, fontSize: "15px", color: "var(--text-primary)", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                                                {activePlannerDetail.history}
                                            </p>
                                        </section>
                                    )}

                                    {activePlannerDetail.attractions && activePlannerDetail.attractions.length > 0 && (
                                        <section>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px", color: "var(--primary)" }}>
                                                <Camera size={18} />
                                                <h4 style={{ fontSize: "17px", fontWeight: 800 }}>주요 볼거리</h4>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {activePlannerDetail.attractions.map((item: string, i: number) => (
                                                    <div key={i} style={{
                                                        padding: "14px",
                                                        background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                                                        borderRadius: "12px",
                                                        borderLeft: "3px solid var(--primary)",
                                                        fontSize: "14px", lineHeight: 1.5,
                                                        color: "var(--text-primary)"
                                                    }}>
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {activePlannerDetail.access && (
                                        <section style={{ padding: "20px", background: "rgba(0,212,255,0.05)", borderRadius: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px" }}>
                                                <MapPin size={18} color="var(--primary)" />
                                                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>찾아가는 법</h4>
                                            </div>
                                            <p style={{ fontSize: "14px", opacity: 0.8, color: "var(--text-primary)", lineHeight: 1.5 }}>
                                                {activePlannerDetail.access}
                                            </p>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
                            background: "var(--sheet-bg)",
                            borderTop: "1px solid var(--glass-border)",
                            display: "flex", gap: "8px", alignItems: "center",
                        }}>
                            <button
                                onClick={() => {
                                    const lat = activePlannerDetail.coordinates?.lat;
                                    const lng = activePlannerDetail.coordinates?.lng;
                                    const url = (lat && lng)
                                        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlannerDetail.name)}`;
                                    window.open(url, "_blank");
                                }}
                                style={{
                                    flex: 1, padding: "14px", borderRadius: "12px",
                                    background: "var(--primary)", color: "var(--text-on-primary)",
                                    fontWeight: 800, border: "none", fontSize: "14px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                            >
                                <MapPin size={16} /> 길찾기
                            </button>
                            <button
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activePlannerDetail.name)}`, "_blank")}
                                style={{
                                    flex: 1, padding: "14px", borderRadius: "12px",
                                    background: "#3b82f6", color: "white",
                                    fontWeight: 800, border: "none", fontSize: "14px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                            >
                                <Search size={16} /> 구글
                            </button>
                            <button
                                onClick={() => window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(activePlannerDetail.name)}`, "_blank")}
                                style={{
                                    flex: 1, padding: "14px", borderRadius: "12px",
                                    background: "#03C75A", color: "white",
                                    fontWeight: 800, border: "none", fontSize: "14px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                            >
                                <Search size={16} /> 네이버
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};
