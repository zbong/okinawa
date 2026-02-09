import React from 'react';
import { Compass, Wind, Car, Bus } from 'lucide-react';

interface TransportModeSelectorProps {
    selectedMode: string;
    onSelect: (mode: string, isCar: boolean) => void;
}

const transportModes = [
    { id: "plane", label: "비행기", icon: <Compass size={24} /> },
    { id: "ship", label: "배", icon: <Wind size={24} /> },
    { id: "car", label: "자동차", icon: <Car size={24} /> },
    { id: "public", label: "대중교통", icon: <Bus size={24} /> },
];

/**
 * Transport mode selector grid for travel planning
 */
export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
    selectedMode,
    onSelect
}) => {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "30px",
            }}
        >
            {transportModes.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id, item.id === "car")}
                    style={{
                        padding: "16px",
                        borderRadius: "16px",
                        border:
                            selectedMode === item.id
                                ? "2px solid var(--primary)"
                                : "1px solid rgba(255,255,255,0.1)",
                        background:
                            selectedMode === item.id
                                ? "rgba(0,212,255,0.1)"
                                : "rgba(255,255,255,0.03)",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                    }}
                >
                    {item.icon}
                    <span style={{ fontWeight: 700, fontSize: "12px" }}>
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
    );
};
