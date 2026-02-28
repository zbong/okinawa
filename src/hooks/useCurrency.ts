import { useState, useEffect } from 'react';
import { DestinationInfo, getDestinationInfo } from '../utils/destinationHelper';

export const useCurrency = (initialRate: number = 9.0) => {
    const [foreignAmount, setForeignAmount] = useState("1000");
    const [krwAmount, setKrwAmount] = useState("9000");
    const [rate, setRate] = useState(initialRate);

    const convert = (val: string, type: "foreign" | "krw") => {
        const num = parseFloat(val.replace(/,/g, ""));
        if (isNaN(num)) {
            if (type === "foreign") {
                setForeignAmount(val);
                setKrwAmount("0");
            } else {
                setKrwAmount(val);
                setForeignAmount("0");
            }
            return;
        }
        if (type === "foreign") {
            setForeignAmount(val);
            setKrwAmount(Math.round(num * rate).toLocaleString());
        } else {
            setKrwAmount(val);
            setForeignAmount(Math.round(num / rate).toString());
        }
    };

    return {
        foreignAmount,
        setForeignAmount,
        krwAmount,
        setKrwAmount,
        rate,
        setRate,
        convert
    };
};

/**
 * 목적지 기반으로 환율을 자동으로 fetch해서 반환하는 훅
 * frankfurter.app (무료, API키 불필요) 사용
 */
export const useLiveRate = (
    destination: string,
    setRate: (r: number) => void,
    setForeignAmount: (v: string) => void,
    setKrwAmount: (v: string) => void,
    destinationInfo?: DestinationInfo | null
) => {
    useEffect(() => {
        if (!destination && !destinationInfo) return;

        // AI가 뽑아온 정보(@types/TripMetadata.destinationInfo)가 있으면 그걸 우선 사용
        const info = (destinationInfo && (destinationInfo as any).currency) ? destinationInfo as any : getDestinationInfo(destination);
        const currency = info.currency;

        if (!currency || currency === "USD" && destination !== "" && !destination.toLowerCase().includes("미국")) {
            // If it's defaulting to USD but destination is not US, try harder to get info
            const secondaryInfo = getDestinationInfo(destination);
            if (secondaryInfo.currency !== "USD") {
                Object.assign(info, secondaryInfo);
            }
        }

        // 기본값 먼저 세팅 (API 응답 오기 전까지)
        setRate(info.defaultRate || 1400.0);
        setForeignAmount("1000");
        setKrwAmount(Math.round(1000 * (info.defaultRate || 1400.0)).toLocaleString());

        // 실시간 환율 fetch (KRW 기준)
        const fetchRate = async () => {
            try {
                console.log(`[Currency] Fetching live rate for ${currency}...`);
                // 1순위: Open Exchange Rates (More reliable for KRW)
                const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
                if (res.ok) {
                    const data = await res.json();
                    const liveRate = data?.rates?.KRW;
                    if (liveRate && typeof liveRate === 'number' && liveRate > 0) {
                        console.log(`[Currency] Success from er-api: ${liveRate}`);
                        setRate(liveRate);
                        setForeignAmount("1000");
                        setKrwAmount(Math.round(1000 * liveRate).toLocaleString());
                        return;
                    }
                }

                // 2순위: Frankfurter (Fallback)
                const res2 = await fetch(`https://api.frankfurter.app/latest?from=${currency}&to=KRW`);
                if (res2.ok) {
                    const data2 = await res2.json();
                    const liveRate2 = data2?.rates?.KRW;
                    if (liveRate2 && typeof liveRate2 === 'number' && liveRate2 > 0) {
                        console.log(`[Currency] Success from frankfurter: ${liveRate2}`);
                        setRate(liveRate2);
                        setForeignAmount("1000");
                        setKrwAmount(Math.round(1000 * liveRate2).toLocaleString());
                    }
                }
            } catch (e) {
                console.warn("[Currency] 환율 fetch 실패, 기본값 유지:", e);
            }
        };

        fetchRate();
    }, [destination, destinationInfo]);
};
