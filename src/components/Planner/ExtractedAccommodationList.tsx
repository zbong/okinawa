import React from 'react';
import { Hotel, Trash2 } from 'lucide-react';

interface ExtractedAccommodationListProps {
    accommodations: any[]; // Replace 'any' with proper type later
    setPlannerData: (data: any) => void;
}

export const ExtractedAccommodationList: React.FC<ExtractedAccommodationListProps> = ({
    accommodations,
    setPlannerData
}) => {
    if (!accommodations || accommodations.length === 0) return null;

    return (
        <div
            style={{
                background: "rgba(52, 211, 153, 0.05)",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                marginBottom: "20px",
            }}
        >
            <h4
                style={{
                    color: "#34d399",
                    marginBottom: "15px",
                    fontWeight: 800,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <Hotel size={16} /> 추출된 숙소 정보
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {accommodations.map((acc: any, i: number) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '8px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Hotel size={14} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                                {acc.name}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {acc.startDate} ~ {acc.endDate} ({acc.nights}박)
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setPlannerData((prev: any) => ({
                                    ...prev,
                                    accommodations: prev.accommodations.filter((_: any, idx: number) => idx !== i)
                                }));
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
                * 숙소 상세 설정은 5단계에서 가능합니다.
            </div>
        </div>
    );
};
