export interface LocationPoint {
    id: string;
    name: string;
    originalName?: string;
    category: 'sightseeing' | 'food' | 'logistics' | 'stay';
    day: number;
    mapcode?: string;
    phone?: string;
    coordinates: { lat: number; lng: number };
    tips: string[];
    isCompleted?: boolean; // New: Checklist status
    weather?: { temp: string; condition: string; wind: string; humidity: string; } // Mock Weather
}

export interface TravelFile {
    name: string;
    path: string;
}
