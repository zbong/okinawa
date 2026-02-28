export interface LocationPoint {
    id: string;
    name: string;
    originalName?: string;
    category: 'sightseeing' | 'food' | 'dining' | 'activity' | 'cafe' | 'logistics' | 'stay';
    day: number;
    mapcode?: string;
    phone?: string;
    coordinates: { lat: number; lng: number };
    tips: string[];
    isCompleted?: boolean;
    description?: string;
    longDesc?: string;
    weather?: { temp: string; condition: string; wind: string; humidity: string; }
}

export interface ChecklistItem {
    id: string;
    category: string;
    text: string;
    isChecked: boolean;
    isCustom?: boolean;
}

export interface TravelFile {
    name: string;
    path: string;
}

export interface CustomFile {
    id: string;
    name: string;
    type: "image" | "pdf";
    data?: string;        // Base64 (legacy / offline fallback)
    url?: string;         // Supabase Storage public URL (preferred)
    storagePath?: string; // Supabase Storage path (for deletion)
    linkedTo?: string;    // Point ID or category ('flight' | 'accommodation' | 'other')
    date: string;
    parsedData?: any;     // AI 파싱 결과 (for OCR)
}

export interface SpeechItem {
    id: string;
    kor: string;
    jp: string;
    pron: string;
    category: 'basic' | 'shopping' | 'food' | 'emergency' | 'stay';
    lang?: string;
    audio?: string; // Base64 audio data for offline use
}

export interface TripMetadata {
    destination: string;
    title: string;
    period: string;
    startDate: string;
    endDate: string;
    useRentalCar: boolean;
    primaryColor?: string;
    accommodations?: { id?: string, name: string, address?: string, startDate: string, endDate: string, coordinates?: { lat: number; lng: number }, isConfirmed?: boolean }[];
    isShared?: boolean;
    destinationInfo?: {
        country: string;
        language: string;
        languageName: string;
        currency: string;
        currencySymbol: string;
        currencyName: string;
        flag: string;
    };
}

export interface TripPlan {
    id: string;
    metadata: TripMetadata;
    checklists?: ChecklistItem[];
    points: LocationPoint[];
    days?: { day: number; points: LocationPoint[] }[]; // Added for AI generated structure
    speechData: SpeechItem[];
    defaultFiles: TravelFile[];
    customFiles?: any[];
    analyzedFiles?: any[];
    recommendations?: any[];
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
    // New fields for detailed info
    airline?: string;
    flightNumber?: string;
    returnAirline?: string;
    returnFlightNumber?: string;
    returnDepartureDate?: string;
    returnDepartureTime?: string;
    returnArrivalDate?: string;
    returnArrivalTime?: string;
    returnDeparturePoint?: string;
    returnArrivalPoint?: string;
    shipName?: string;
    tourName?: string;
    arrivalDate?: string; // Specific arrival date for the leg

    travelMode: 'plane' | 'ship' | 'car' | string;
    useRentalCar: boolean;
    companion: string;
    transport: 'rental' | 'public' | string;
    accommodations: { id?: string, name: string, address?: string, startDate: string, endDate: string, nights?: number, area?: string, coordinates?: { lat: number; lng: number }, isConfirmed?: boolean }[];
    theme: string;
    pace: 'relaxed' | 'normal' | 'tight' | string;
    // Coordinates for travel entry
    departureCoordinates?: { lat: number; lng: number };
    entryCoordinates?: { lat: number; lng: number };
    peopleCount?: number;
    companionCount?: number;

    // Multi-leg flight support
    outboundFlights?: FlightLeg[];
    inboundFlights?: FlightLeg[];
    destinationInfo?: {
        country: string;
        language: string;
        languageName: string;
        currency: string;
        currencySymbol: string;
        currencyName: string;
        flag: string;
    };
    isDestinationValidated?: boolean;
    checklists?: ChecklistItem[];
}

export interface FlightLeg {
    id: string;
    airline: string;
    flightNumber: string;
    departureContext: {
        airport: string;
        date: string;
        time: string;
    };
    arrivalContext: {
        airport: string;
        date: string;
        time: string;
    };
    linkedFileId?: string; // OCR file ID
}
