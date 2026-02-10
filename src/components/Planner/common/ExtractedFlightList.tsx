import React from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { formatAirport, formatFlight } from '../../../utils/airline-data';

interface ExtractedFlightListProps {
    outboundFlights: any[];
    inboundFlights: any[];
    setPlannerData: (data: any) => void; // Replace 'any' with proper type from context later
}

export const ExtractedFlightList: React.FC<ExtractedFlightListProps> = ({
    outboundFlights,
    inboundFlights,
    setPlannerData
}) => {
    return (
        <>
            {/* Outbound Section */}
            <div
                style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: "20px",
                }}
            >
                <h4
                    style={{
                        color: "#60a5fa",
                        marginBottom: "15px",
                        fontWeight: 800,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    🛫 가는 편 (출국)
                </h4>

                {/* Outbound Flights List */}
                {outboundFlights && outboundFlights.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {outboundFlights.map((leg, i) => (
                            <div key={leg.id || i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                        [{leg.departureContext.date}] {formatAirport(leg.departureContext.airport)} ({leg.departureContext.time.slice(-5)}) <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {formatAirport(leg.arrivalContext.airport)} ({leg.arrivalContext.time.slice(-5)})
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        {formatFlight(leg.airline, leg.flightNumber)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setPlannerData((prev: any) => ({
                                            ...prev,
                                            outboundFlights: (prev.outboundFlights || []).filter((l: any) => l.id !== leg.id)
                                        }));
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Inbound Section */}
            <div
                style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <h4
                    style={{
                        color: "#fbbf24",
                        marginBottom: "15px",
                        fontWeight: 800,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    🛬 오는 편 (귀국)
                </h4>

                {/* Inbound Flights List */}
                {inboundFlights && inboundFlights.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {inboundFlights.map((leg, i) => (
                            <div key={leg.id || i} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                        [{leg.departureContext.date}] {formatAirport(leg.departureContext.airport)} ({leg.departureContext.time.slice(-5)}) <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {formatAirport(leg.arrivalContext.airport)} ({leg.arrivalContext.time.slice(-5)})
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        {formatFlight(leg.airline, leg.flightNumber)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setPlannerData((prev: any) => ({
                                            ...prev,
                                            inboundFlights: (prev.inboundFlights || []).filter((l: any) => l.id !== leg.id)
                                        }));
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
