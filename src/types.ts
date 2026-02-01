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
    isCompleted?: boolean;
    weather?: { temp: string; condition: string; wind: string; humidity: string; }
}

export interface TravelFile {
    name: string;
    path: string;
}

export interface SpeechItem {
    id: string;
    kor: string;
    jp: string;
    pron: string;
    category: 'basic' | 'shopping' | 'food' | 'emergency' | 'stay';
}

export interface TripMetadata {
    destination: string;
    title: string;
    period: string;
    startDate: string;
    endDate: string;
    useRentalCar: boolean;
    primaryColor?: string;
    accommodations?: { name: string, startDate: string, endDate: string }[];
}

export interface TripPlan {
    id: string;
    metadata: TripMetadata;
    points: LocationPoint[];
    speechData: SpeechItem[];
    defaultFiles: TravelFile[];
}
