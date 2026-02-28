import { useState } from 'react';
import { LocationPoint } from '../types';
import { cacheFileFromUrl } from '../utils/fileCache';

interface UseOfflineMapProps {
    allPoints: LocationPoint[];
    customFiles?: any[];
    defaultFiles?: any[];
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const useOfflineMap = ({ allPoints, customFiles = [], defaultFiles = [], showToast }: UseOfflineMapProps) => {
    const [isPreparingOffline, setIsPreparingOffline] = useState(false);
    const [offlineProgress, setOfflineProgress] = useState(0);
    const [offlinePhase, setOfflinePhase] = useState<'files' | 'map' | 'idle'>('idle');

    const prepareOfflineMap = async () => {
        if (!allPoints.length && !customFiles.length && !defaultFiles.length) {
            showToast("먼저 여행 일정을 만들어주세요.", "info");
            return;
        }

        setIsPreparingOffline(true);
        setOfflineProgress(0);

        const zooms = [13, 15, 17];

        const latLngToTile = (lat: number, lng: number, zoom: number) => {
            const n = Math.pow(2, zoom);
            const x = Math.floor((lng + 180) / 360 * n);
            const lat_rad = lat * Math.PI / 180;
            const y = Math.floor((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2 * n);
            return { x, y };
        };

        const fetchTile = (x: number, y: number, z: number) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                const server = Math.floor(Math.random() * 4);
                img.src = `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
            });
        };

        try {
            // ─── 1단계: 파일 캐싱 ───────────────────────────────
            setOfflinePhase('files');

            const allFiles = [
                ...customFiles.map(f => ({ id: f.id || f.name, url: f.url || f.data || f.path })),
                ...defaultFiles.map(f => ({ id: f.name, url: f.path || f.url }))
            ].filter(f => f.url && (f.url.startsWith('http') || f.url.startsWith('data:')));

            const totalFiles = allFiles.length;
            let cachedFiles = 0;
            let failedFiles = 0;

            for (const file of allFiles) {
                try {
                    await cacheFileFromUrl(file.id, file.url);
                    cachedFiles++;
                } catch {
                    failedFiles++;
                    console.warn(`[FileCache] Failed to cache: ${file.id}`);
                }
                const fileProgress = Math.round(((cachedFiles + failedFiles) / Math.max(totalFiles, 1)) * 40);
                setOfflineProgress(fileProgress); // 0~40%를 파일에 할당
            }

            // ─── 2단계: 지도 타일 캐싱 ──────────────────────────
            setOfflinePhase('map');

            const validPoints = allPoints.filter(p => p.coordinates?.lat && p.coordinates?.lng);
            let totalTiles = validPoints.length * zooms.length * 9;
            let completedTiles = 0;

            for (const point of validPoints) {
                const lat = Number(point.coordinates?.lat);
                const lng = Number(point.coordinates?.lng);
                if (isNaN(lat) || isNaN(lng)) continue;

                for (const z of zooms) {
                    const { x, y } = latLngToTile(lat, lng, z);
                    const promises = [];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            promises.push(fetchTile(x + dx, y + dy, z));
                        }
                    }
                    await Promise.all(promises);

                    completedTiles += 9;
                    const mapProgress = Math.round((completedTiles / Math.max(totalTiles, 1)) * 60);
                    setOfflineProgress(40 + mapProgress); // 40~100%를 지도에 할당
                }
            }

            setOfflineProgress(100);

            const fileMsg = totalFiles > 0 ? ` (파일 ${cachedFiles}개 저장)` : '';
            const mapMsg = validPoints.length > 0 ? ', 지도 캐싱 완료' : '';
            showToast(`오프라인 준비 완료${fileMsg}${mapMsg}`, "success");

        } catch (e) {
            console.error(e);
            showToast("오프라인 준비 중 오류가 발생했습니다.", "error");
        } finally {
            setIsPreparingOffline(false);
            setOfflineProgress(0);
            setOfflinePhase('idle');
        }
    };

    return {
        isPreparingOffline,
        offlineProgress,
        offlinePhase,
        prepareOfflineMap
    };
};
