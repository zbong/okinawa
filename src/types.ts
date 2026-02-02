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
    description?: string;
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
    days?: { day: number; points: LocationPoint[] }[]; // Added for AI generated structure
    speechData: SpeechItem[];
    defaultFiles: TravelFile[];
}

export interface PlannerData {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    arrivalTime: string;
    departureTime: string;
    departurePoint: string;
    entryPoint: string;
    travelMode: 'plane' | 'ship' | 'car' | string;
    useRentalCar: boolean;
    companion: string;
    transport: 'rental' | 'public' | string;
    accommodations: { name: string, startDate: string, endDate: string }[];
    theme: string;
    pace: 'relaxed' | 'normal' | 'tight' | string;
}
