import { useState } from 'react';
import { LocationPoint } from '../types';

interface UseOfflineMapProps {
    allPoints: LocationPoint[];
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const useOfflineMap = ({ allPoints, showToast }: UseOfflineMapProps) => {
    const [isPreparingOffline, setIsPreparingOffline] = useState(false);
    const [offlineProgress, setOfflineProgress] = useState(0);

    const prepareOfflineMap = async () => {
        if (!allPoints.length) {
            showToast("먼저 여행 일정을 만들어주세요.", "info");
            return;
        }

        setIsPreparingOffline(true);
        setOfflineProgress(0);

        const zooms = [13, 15, 17];
        // Estimate chunks to fetch
        let completedSteps = 0;

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
                // Randomize server subdomains to avoid throttling
                const server = Math.floor(Math.random() * 4);
                img.src = `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
            });
        };

        try {
            // Count total tiles to fetch for progress bar
            let totalTiles = 0;
            for (const point of allPoints) {
                if (point.coordinates?.lat && point.coordinates?.lng) {
                    totalTiles += zooms.length * 9; // 3x3 grid for each zoom level
                }
            }

            for (const point of allPoints) {
                const lat = Number(point.coordinates?.lat);
                const lng = Number(point.coordinates?.lng);
                if (isNaN(lat) || isNaN(lng)) continue;

                for (const z of zooms) {
                    const { x, y } = latLngToTile(lat, lng, z);
                    const promises = [];
                    // Fetch 3x3 grid around the point
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            promises.push(fetchTile(x + dx, y + dy, z));
                        }
                    }
                    await Promise.all(promises);

                    // Update progress
                    completedSteps += 9;
                    setOfflineProgress(Math.min(100, Math.round((completedSteps / totalTiles) * 100)));
                }
            }
            showToast("오프라인 지도가 준비되었습니다. (캐시됨)", "success");
        } catch (e) {
            console.error(e);
            showToast("오프라인 지도 준비 중 오류가 발생했습니다.", "error");
        } finally {
            setIsPreparingOffline(false);
            setOfflineProgress(0);
        }
    };

    return {
        isPreparingOffline,
        offlineProgress,
        prepareOfflineMap
    };
};
