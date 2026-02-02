import React, { useState, useEffect, useRef } from 'react';
import './styles/design-system.css';
import { okinawaTrip } from './data';
import { LocationPoint, SpeechItem, TripPlan } from './types';
import {
    LayoutDashboard,
    Calendar,
    Map as MapIcon,
    FileText,
    Phone,
    RefreshCw,
    CheckCircle,
    Circle,
    CloudSun,
    Wind,
    Droplets,
    X,
    Moon,
    Sun,
    Star,
    Lock,
    ChevronDown,
    ChevronUp,
    Upload,
    Trash2,
    MessageCircle,
    Volume2,
    MapPin,
    Sparkles,
    ArrowRight,
    Loader2,
    User,
    LogIn,
    UserPlus,
    LogOut,
    Users,
    Heart,
    Compass,
    Utensils,
    Camera,
    Activity,
    Clock,
    Car,
    Bus,
    ExternalLink,
    Hotel,
    Edit3,
    Save,
    Search
} from 'lucide-react';
import { Reorder } from 'framer-motion';

// Google Maps Types
declare global {
    interface Window {
        google: any;
    }
}

// Map UI Components - Removed Leaflet imports as we use Google Maps manually
// const MapComponent = ... (Deleted old implementation)
interface MapComponentProps {
    points: LocationPoint[];
    selectedPoint: LocationPoint | null;
    onPointClick: (point: LocationPoint) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ points, selectedPoint, onPointClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const directionsRendererRef = useRef<any>(null);

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (window.google && window.google.maps) {
                setIsMapLoaded(true);
                clearInterval(interval);
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            if (!window.google) {
                setMapError("Google Maps API 로드 실패 (Timeout)");
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const [isMapInstanceReady, setIsMapInstanceReady] = useState(false);

    useEffect(() => {
        // Wait for the base google object to be available
        if (!isMapLoaded || !mapRef.current || !window.google) return;

        const initMap = async () => {
            try {
                // Initialize Map if not already initialized
                if (!googleMapRef.current) {
                    const { Map } = await window.google.maps.importLibrary("maps") as any;
                    const { DirectionsRenderer } = await window.google.maps.importLibrary("routes") as any;

                    const initialCenter = (points && points.length > 0 && points[0].coordinates)
                        ? { lat: Number(points[0].coordinates.lat), lng: Number(points[0].coordinates.lng) }
                        : { lat: 26.2124, lng: 127.6809 }; // Naha default

                    googleMapRef.current = new Map(mapRef.current, {
                        center: initialCenter,
                        zoom: 11,
                        disableDefaultUI: true,
                        zoomControl: true,
                    });

                    directionsRendererRef.current = new DirectionsRenderer({
                        map: googleMapRef.current,
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: '#00D4FF',
                            strokeWeight: 4,
                            strokeOpacity: 0.8
                        }
                    });

                    setIsMapInstanceReady(true);
                }
            } catch (e) {
                console.error("Map Initialization Error:", e);
                setMapError("지도 초기화 중 오류가 발생했습니다: " + (e as any).message);
            }
        };

        initMap();
    }, [isMapLoaded]);


    // Marker & Route Update Effect
    useEffect(() => {
        if (!isMapInstanceReady || !googleMapRef.current || !window.google) return;

        let isMounted = true;

        const updateMap = async () => {
            // Filter valid points
            const validPoints = (points || []).filter(p => {
                const lat = Number(p?.coordinates?.lat);
                const lng = Number(p?.coordinates?.lng);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            // Clear existing markers safely
            if (markersRef.current) {
                markersRef.current.forEach(m => {
                    try { if (m) m.setMap(null); } catch (e) { } // Ignore cleanup errors
                });
                markersRef.current = [];
            }

            try {
                if (!isMounted) return;

                const { Marker } = await window.google.maps.importLibrary("marker") as any;
                const { LatLngBounds } = await window.google.maps.importLibrary("core") as any;
                const bounds = new LatLngBounds();

                // Double check before creating markers
                if (!isMounted || !googleMapRef.current) return;

                validPoints.forEach((p, i) => {
                    if (!isMounted) return;

                    const position = { lat: Number(p.coordinates.lat), lng: Number(p.coordinates.lng) };
                    const isSelected = p.id === selectedPoint?.id;

                    try {
                        const marker = new Marker({
                            position,
                            map: googleMapRef.current,
                            title: p.name,
                            label: {
                                text: (i + 1).toString(),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: isSelected ? '16px' : '12px',
                            },
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: isSelected ? 14 : 10,
                                fillColor: '#00D4FF',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                            },
                            zIndex: isSelected ? 999 : 1,
                        });

                        marker.addListener('click', () => {
                            if (onPointClick) onPointClick(p);
                        });
                        markersRef.current.push(marker);
                        bounds.extend(position);
                    } catch (markerErr) {
                        console.warn("Error creating individual marker:", markerErr);
                    }
                });

                if (validPoints.length > 0 && googleMapRef.current) {
                    googleMapRef.current.fitBounds(bounds);
                }

                // Route Logic based on Google Maps Limits (Max 25 waypoints + Origin + Destination = 27 total)
                if (validPoints.length >= 2 && validPoints.length <= 25 && directionsRendererRef.current) {
                    const { DirectionsService } = await window.google.maps.importLibrary("routes") as any;
                    const directionsService = new DirectionsService();
                    const origin = { lat: Number(validPoints[0].coordinates.lat), lng: Number(validPoints[0].coordinates.lng) };
                    const destination = { lat: Number(validPoints[validPoints.length - 1].coordinates.lat), lng: Number(validPoints[validPoints.length - 1].coordinates.lng) };
                    const waypoints = validPoints.slice(1, -1).map(p => ({
                        location: { lat: Number(p.coordinates.lat), lng: Number(p.coordinates.lng) },
                        stopover: true
                    }));

                    if (isMounted) {
                        directionsService.route({
                            origin,
                            destination,
                            waypoints,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        }, (result: any, status: string) => {
                            if (!isMounted) return;
                            try {
                                if (status === 'OK' && directionsRendererRef.current) {
                                    directionsRendererRef.current.setDirections(result);
                                } else {
                                    directionsRendererRef.current?.setDirections({ routes: [] });
                                }
                            } catch (cbErr) {
                                console.warn("Directions callback error:", cbErr);
                            }
                        });
                    }
                } else {
                    console.log('🗺️ No valid points for route or renderer missing');
                    directionsRendererRef.current?.setDirections({ routes: [] });
                }

            } catch (e) {
                console.error("🔥 Error updating map (Critical):", e);
            }
        };

        updateMap();

        return () => {
            isMounted = false;
            // Cleanup markers on unmount
            if (markersRef.current) {
                markersRef.current.forEach(m => {
                    try { if (m) m.setMap(null); } catch (e) { }
                });
                markersRef.current = [];
            }
            // Also cleanup directions renderer to prevent glitches
            if (directionsRendererRef.current) {
                try { directionsRendererRef.current.setMap(null); } catch (e) { }
            }
        };
    }, [points, selectedPoint, onPointClick, isMapLoaded, isMapInstanceReady]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>

            {/* Map Container */}
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading / Error Overlay */}
            {(!isMapLoaded || mapError) && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: mapError ? '#ef4444' : '#94a3b8',
                    zIndex: 10
                }}>
                    {mapError ? mapError : "지도를 불러오는 중..."}
                </div>
            )}
        </div>
    );
};



interface CustomFile {
    id: string;
    name: string;
    type: 'image' | 'pdf';
    data: string; // Base64
    linkedTo?: string; // Point ID
    date: string;
}
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any, errorInfo: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught:", error, errorInfo);
        this.setState({ errorInfo });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: '#1e293b', color: 'white', padding: '40px', overflow: 'auto', textAlign: 'left' }}>
                    <h1 style={{ color: '#ff5555', fontSize: '24px', marginBottom: '20px' }}>🚨 심각한 오류 발생</h1>
                    <p style={{ marginBottom: '20px', opacity: 0.8 }}>앱 실행 중 치명적인 오류가 발생했습니다. 아래 내용을 개발자에게 전달해 주세요.</p>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            새로고침
                        </button>
                        <button
                            onClick={() => {
                                const errorText = `Error: ${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack}`;
                                navigator.clipboard.writeText(errorText);
                                alert('에러 내용이 클립보드에 복사되었습니다.');
                            }}
                            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            📋 에러 내용 복사
                        </button>
                    </div>

                    <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', fontFamily: 'monospace' }}>
                        <h3 style={{ color: '#f87171', margin: '0 0 10px 0' }}>Error Message:</h3>
                        <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap', marginBottom: '20px', fontSize: '14px' }}>
                            {this.state.error?.toString()}
                        </pre>

                        <h3 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Component Stack:</h3>
                        <pre style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.5 }}>
                            {this.state.errorInfo?.componentStack || 'No stack trace available'}
                        </pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const App: React.FC = () => {
    // DEBUG: Global Error Handler & Render Log
    useEffect(() => {
        const errorHandler = (event: ErrorEvent) => console.error('🔥🔥🔥 GLOBAL ERROR:', event.error);
        const promiseHandler = (event: PromiseRejectionEvent) => console.error('🔥🔥🔥 UNHANDLED PROMISE:', event.reason);
        window.addEventListener('error', errorHandler);
        window.addEventListener('unhandledrejection', promiseHandler);
        console.log('✅ Global Error Handlers Attached');
        return () => {
            window.removeEventListener('error', errorHandler);
            window.removeEventListener('unhandledrejection', promiseHandler);
        };
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('trip_draft_v1');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.data) {
                    const hasData = (parsed.data.destination || '').trim() !== '' || (parsed.data.title || '').trim() !== '';
                    if (!hasData && parsed.step === 0) {
                        localStorage.removeItem('trip_draft_v1');
                        console.log('🧹 Cleaned up empty draft.');
                    }
                }
            }
        } catch (e) {
            console.error("Draft cleanup error:", e);
        }
    }, []);

    // Top Level Navigation State
    // DEV MODE: Force login state, but start at landing (list view)
    const [view, setView] = useState<'landing' | 'login' | 'signup' | 'app' | 'debug'>('landing');

    console.log(`🎨 App Re-render. Current View: ${view}`);

    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ name: string, homeAddress?: string } | null>({ name: 'Tester', homeAddress: '경기도 평택시 서재로 36 자이아파트' });
    const [dynamicAttractions, setDynamicAttractions] = useState<any[]>([]);

    const [isEditingPoint, setIsEditingPoint] = useState(false);

    const savePointEdit = (id: string, updates: Partial<LocationPoint>) => {
        const updatedPoints = allPoints.map(p => p.id === id ? { ...p, ...updates } : p);
        setAllPoints(updatedPoints);
        if (selectedPoint && selectedPoint.id === id) {
            setSelectedPoint({ ...selectedPoint, ...updates });
        }
        setIsEditingPoint(false);
        showToast('정보가 수정되었습니다.');
    };
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);

    const [isSearchingAttractions, setIsSearchingAttractions] = useState(false);
    const [attractionCategoryFilter, setAttractionCategoryFilter] = useState<'all' | 'sightseeing' | 'food' | 'cafe'>('all');

    // Fetch dynamic attractions using AI with Caching
    const fetchAttractionsWithAI = async (destination: string) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || !destination) return;

        // 1. Check Cache First (7 days validity)
        const CACHE_KEY = 'attraction_recommendation_cache';
        const cachedStr = localStorage.getItem(CACHE_KEY);
        const cache = cachedStr ? JSON.parse(cachedStr) : {};
        const destinationKey = destination.toLowerCase().trim();

        if (cache[destinationKey]) {
            const { timestamp, data } = cache[destinationKey];
            const now = Date.now();
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            if (now - timestamp < sevenDaysInMs) {
                console.log(`Using cached attractions for ${destination}`);
                setDynamicAttractions(data);
                return;
            }
        }

        setIsSearchingAttractions(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
              Search for top 15 tourist attractions in "${destination}" including popular restaurants and cafes.
              
              Requirements:
              Requirements:
              1. Diversity: Provide a mix of Sightseeing (6), Restaurants (4), Cafes (3), and Activities (2).
              2. Quality: Select places with high reputation (implicitly 4.0+ rating).
              3. Context: Strongly consider the companion type ("${plannerData.companion || 'Not specified'}") for recommendations.
              4. Info: accurate coordinates, estimated rating, and price level.
              5. Language: Korean.

              Return EXACTLY a JSON array of objects with this structure (no markdown):
              [{
                "id": "unique_id",
                "name": "Place Name",
                "category": "sightseeing" | "food" | "cafe" | "activity",
                "desc": "Short attractive description",
                "longDesc": "Detailed description why it's popular",
                "rating": 4.5,
                "reviewCount": 1200,
                "priceLevel": "Cheap" | "Moderate" | "Expensive",
                "attractions": ["Highlight 1", "Highlight 2"],
                "tips": ["Best time to visit", "Signature dish if restaurant"],
                "coordinates": {"lat": 26.123, "lng": 127.123},
                "link": "https://www.google.com/search?q=PlaceName"
              }]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            // Clean JSON string from potential markdown backticks
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const attractions = JSON.parse(jsonMatch[0]);
                setDynamicAttractions(attractions);

                // 2. Update Cache
                const CACHE_KEY = 'attraction_recommendation_cache';
                const cachedStr = localStorage.getItem(CACHE_KEY);
                const currentCache = cachedStr ? JSON.parse(cachedStr) : {};

                currentCache[destination.toLowerCase().trim()] = {
                    timestamp: Date.now(),
                    data: attractions
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));

                console.log("Successfully fetched attractions for", destination, attractions);
            } else {
                console.error("Failed to find JSON array in response:", text);
            }
        } catch (error) {
            console.error("Fetch Attractions Error:", error);
            setDynamicAttractions([]);
        } finally {
            setIsSearchingAttractions(false);
        }
    };

    const fetchHotelsWithAI = async (destination: string) => {
        setIsSearchingHotels(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
                Search for top 5 popular hotels/accommodations in "${destination}".
                Requirements:
                1. Diversity: Luxury, Business, Guesthouse, etc.
                2. Context: For companion type "${plannerData.companion || 'all'}".
                3. Language: Korean.

                Return EXACTLY a JSON array of objects (no markdown):
                [{"name": "Hotel Name", "desc": "Brief description"}]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                setRecommendedHotels(JSON.parse(jsonMatch[0]));
            }
        } catch (e) {
            console.error("Hotel search failed:", e);
        } finally {
            setIsSearchingHotels(false);
        }
    };


    // AI Plan Generation
    const generatePlanWithAI = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            alert('Gemini API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
            return;
        }

        setPlannerStep(8);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const selectedPlaces = dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id));
            const prompt = `
              You are a premium travel planner. Create a detailed ${plannerData.destination} travel itinerary.
              - Period: ${plannerData.startDate} to ${plannerData.endDate}
              - Departure: ${plannerData.departurePoint}
              - Destination Entry Point: ${plannerData.entryPoint}
              - Selected Attractions: ${selectedPlaces.map(p => p.name).join(', ')}
              - Mode of Transport: ${plannerData.transport} (Rental: ${plannerData.useRentalCar})
              - Companion: ${plannerData.companion || 'Not specified'}
              - Travel Pace: ${plannerData.pace}
               - Preferred Accommodations (Already Booked): ${plannerData.accommodations.length > 0 ? plannerData.accommodations.map((a: any) => `${a.name} (From ${a.startDate} To ${a.endDate})`).join(', ') : 'Not specified'}
               
               [USER'S SPECIAL REQUEST]:
               "${customAiPrompt || 'No special requests. Just optimize the route.'}"
               (Please prioritized this request above all else if it conflicts with default logic.)

               [CRITICAL ROUTE RULES]:
               1. GEOGRAPHICAL OPTIMIZATION: Group attractions that are near each other. Minimize the total travel distance and avoid "zig-zagging" back and forth across the city/region.
               2. ACCOMMODATION ALIGNMENT: 
                  - For each day, if an accommodation is specified for that night, the day's itinerary should ideally start and END near that hotel. 
                  - If the user moves hotels, the logic should reflect checking out and moving to the next area.
               3. TRAVEL PACE: 
                  - 'relaxed': 2-3 main spots per day. Lots of "rest" time.
                  - 'standard': 4-5 spots per day. Balanced.
                  - 'tight': 6-7 spots per day. Dynamic and busy.
               4. SMART OMISSION: If the user selected too many attractions for the period and pace, prioritize the most famous ones and BOLDLY OMIT others. Do not squeeze them all in if it ruins the experience.
               5. DAILY COMPLETENESS: You MUST generate a daily itinerary for EVERY SINGLE DAY from ${plannerData.startDate} to ${plannerData.endDate}. Even if short of places, suggest local walks, markets, or rest.

              Please return ONLY a JSON object exactly matching this structure (no other text):
              {
                "id": "generated-plan",
                "title": "${plannerData.destination} ${plannerData.companion || ''} 여행",
                "period": "${plannerData.startDate} ~ ${plannerData.endDate}",
                "destination": "${plannerData.destination}",
                "color": "#00D4FF",
                "progress": 0,
                "days": [
                  {
                    "day": 1,
                    "points": [
                      { 
                        "id": "gen_p1", 
                        "name": "Location Name", 
                        "category": "sightseeing" | "food" | "cafe" | "stay" | "transport", 
                        "coordinates": {"lat": 26.2124, "lng": 127.6809}, 
                        "tips": ["One liner tip in Korean"], 
                        "description": "Short description in Korean",
                        "phone": "Contact info if any", 
                        "mapcode": "Mapcode for rental car users" 
                      }
                    ]
                  }
                ],
                "defaultFiles": [],
                "speechData": []
              }
              Language: Korean (descriptions, tips, titles).
              Coordinates: Must be highly accurate for ${plannerData.destination}.
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Extract JSON from text (sometimes AI wraps it in markdown)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const planData = JSON.parse(jsonMatch[0]);

                // Flatten days into points with day property
                const flattenedPoints: LocationPoint[] = [];
                if (planData.days && Array.isArray(planData.days)) {
                    planData.days.forEach((dayObj: any) => {
                        if (dayObj.points && Array.isArray(dayObj.points)) {
                            dayObj.points.forEach((p: any) => {
                                // Try to find better coordinates from known attractions if available
                                const knownAttraction = dynamicAttractions.find((a: any) => a.id === p.id || a.name === p.name);
                                const validCoords = knownAttraction?.coordinates || p.coordinates || { lat: 0, lng: 0 };


                                flattenedPoints.push({
                                    ...p,
                                    id: p.id || `gen-${Math.random().toString(36).substr(2, 9)}`,
                                    day: dayObj.day || 1,
                                    category: p.category || 'sightseeing',
                                    coordinates: {
                                        lat: Number(validCoords.lat),
                                        lng: Number(validCoords.lng)
                                    }
                                });
                            });
                        }
                    });
                }

                const finalPlan: TripPlan = {
                    ...okinawaTrip, // Spread default structure (speechData, defaultFiles, etc.)
                    id: `trip-${Math.random().toString(36).substr(2, 9)}`,
                    metadata: {
                        ...okinawaTrip.metadata,
                        destination: plannerData.destination,
                        title: plannerData.title || planData.title || `${plannerData.destination} 맞춤 여행`,
                        period: planData.period || `${plannerData.startDate} ~ ${plannerData.endDate}`,
                        startDate: plannerData.startDate,
                        endDate: plannerData.endDate,
                        useRentalCar: plannerData.useRentalCar,
                        primaryColor: planData.color || '#00D4FF',
                        accommodations: plannerData.accommodations
                    },
                    points: flattenedPoints
                };

                setTrip(finalPlan);
                setPlannerStep(9);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert("코스 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
            setPlannerStep(7.5);
        } finally {
            // isGenerating removed
        }
    };

    // Mock Trips - Initial Load
    const [trips, setTrips] = useState<any[]>(() => {
        const saved = localStorage.getItem('user_trips_v2');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse trips:", e);
            }
        }
        return [okinawaTrip]; // Simply return the full okinawaTrip as the default
    });

    useEffect(() => {
        localStorage.setItem('user_trips_v2', JSON.stringify(trips));
    }, [trips]);

    const [activeTab, setActiveTab] = useState<string>('summary');
    const [overviewMode, setOverviewMode] = useState<'map' | 'text'>('map');
    const [scheduleDay, setScheduleDay] = useState<number>(1);
    const [scheduleViewMode, setScheduleViewMode] = useState<'map' | 'list'>('list');
    const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
    const [weatherIndex, setWeatherIndex] = useState(0);
    const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<LocationPoint | null>(null);
    const [expandedSection, setExpandedSection] = useState<'review' | 'log' | 'localSpeech' | null>(null);
    const [trip, setTrip] = useState<TripPlan>(okinawaTrip); // Default to okinawaTrip for types, but logic handles view switching

    // Toast Notification State
    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [customAiPrompt, setCustomAiPrompt] = useState('');
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };

    // Planning State
    // Planning State - With Draft Restoration
    const [isPlanning, setIsPlanning] = useState(() => {
        // Always start at landing, even if draft exists
        return false;
    });

    const [plannerStep, setPlannerStep] = useState(() => {
        const saved = localStorage.getItem('trip_draft_v1');
        return saved ? JSON.parse(saved).step : 0;
    });

    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('trip_draft_v1');
        return saved ? JSON.parse(saved).selectedIds : [];
    });

    const [activePlannerDetail, setActivePlannerDetail] = useState<any | null>(null);
    // attractionCategoryFilter is already defined above
    const [isReEditModalOpen, setIsReEditModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<any>(null);

    // Delete Confirmation Modal State
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [plannerData, setPlannerData] = useState(() => {
        const saved = localStorage.getItem('trip_draft_v1');
        const defaultData = {
            title: '',
            destination: '',
            startDate: '',
            endDate: '',
            arrivalTime: '10:00',
            departureTime: '18:00',
            departurePoint: '',
            entryPoint: '',
            travelMode: 'plane',
            useRentalCar: false,
            companion: '',
            transport: 'rental',
            accommodations: [] as { name: string, startDate: string, endDate: string }[],
            theme: '',
            pace: 'normal',
        };
        return saved ? { ...defaultData, ...JSON.parse(saved).data } : defaultData;
    });

    // Restore dynamic attractions if available in draft
    useEffect(() => {
        const saved = localStorage.getItem('trip_draft_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.attractions && parsed.attractions.length > 0) {
                setDynamicAttractions(parsed.attractions);
            }
        }
    }, []);

    // Auto-Save Draft Effect
    useEffect(() => {
        if (isPlanning) {
            // Only save if there's some data or we've moved past step 0
            const hasData = plannerData.destination.trim() !== '' || (plannerData as any).title?.trim() !== '';
            if (!hasData && plannerStep === 0) return;

            const draft = {
                step: plannerStep,
                data: plannerData,
                selectedIds: selectedPlaceIds,
                attractions: dynamicAttractions
            };
            localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
        }
    }, [isPlanning, plannerStep, plannerData, selectedPlaceIds, dynamicAttractions]);




    // Saved Points Order State
    const [allPoints, setAllPoints] = useState<LocationPoint[]>(() => {
        if (!trip?.metadata?.destination) return trip.points || [];
        const saved = localStorage.getItem(`points_order_${trip.metadata.destination}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return trip.points || [];
            }
        }
        return trip.points || [];
    });

    const isDraggingRef = useRef(false);

    // Sync allPoints when trip changes (e.g., selecting a trip or generating a new one)
    useEffect(() => {
        if (trip && trip.metadata?.destination) {
            const saved = localStorage.getItem(`points_order_${trip.metadata.destination}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Basic validation: must be an array
                    if (Array.isArray(parsed)) {
                        setAllPoints(parsed);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse saved points order:", e);
                }
            }
            setAllPoints(trip.points || []);
        } else if (trip && trip.points) {
            setAllPoints(trip.points);
        }
    }, [trip]);

    useEffect(() => {
        if (trip && trip.metadata && trip.metadata.destination) {
            localStorage.setItem(`points_order_${trip.metadata.destination}`, JSON.stringify(allPoints));
        }
    }, [allPoints, trip]);

    // Checklist State
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem(`checklist_${trip.metadata.destination}`);
        return saved ? JSON.parse(saved) : {};
    });

    // Review & Log State
    const [userReviews, setUserReviews] = useState<Record<string, { rating: number, text: string }>>(() => {
        const saved = localStorage.getItem(`reviews_${trip.metadata.destination}`);
        return saved ? JSON.parse(saved) : {};
    });

    const [userLogs, setUserLogs] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem(`logs_${trip.metadata.destination}`);
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        if (trip.metadata?.destination) {
            localStorage.setItem(`reviews_${trip.metadata.destination}`, JSON.stringify(userReviews));
        }
    }, [userReviews, trip.metadata?.destination]);

    useEffect(() => {
        if (trip.metadata?.destination) {
            localStorage.setItem(`logs_${trip.metadata.destination}`, JSON.stringify(userLogs));
        }
    }, [userLogs, trip.metadata?.destination]);

    // Custom Files State
    const [customFiles, setCustomFiles] = useState<CustomFile[]>(() => {
        const saved = localStorage.getItem(`files_${trip.metadata.destination}`);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (trip.metadata?.destination) {
            localStorage.setItem(`files_${trip.metadata.destination}`, JSON.stringify(customFiles));
        }
    }, [customFiles, trip.metadata?.destination]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const newFile: CustomFile = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.includes('image') ? 'image' : 'pdf',
                data: base64,
                linkedTo,
                date: new Date().toLocaleDateString()
            };
            setCustomFiles(prev => [newFile, ...prev]);
        };
        reader.readAsDataURL(file);
    };

    const deleteFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('정말 이 파일을 삭제하시겠습니까?')) {
            setCustomFiles(prev => prev.filter(f => f.id !== id));
        }
    };


    // Theme State
    const [theme, setTheme] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        document.body.style.backgroundColor = trip.metadata?.primaryColor || 'var(--bg-color)';
    }, [trip.metadata?.primaryColor]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Currency
    const [jpyAmount, setJpyAmount] = useState('1000');
    const [krwAmount, setKrwAmount] = useState('9000');
    const [rate, setRate] = useState(9.0);

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/JPY')
            .then(r => r.json())
            .then(d => { if (d?.rates?.KRW) setRate(d.rates.KRW); })
            .catch(e => console.warn(e));
    }, []);

    useEffect(() => {
        if (trip.metadata?.destination) {
            localStorage.setItem(`checklist_${trip.metadata.destination}`, JSON.stringify(completedItems));
        }
    }, [completedItems, trip.metadata?.destination]);

    // NEW: Sync all sub-states when trip changes
    useEffect(() => {
        if (!trip.metadata?.destination) return;

        const dest = trip.metadata.destination;

        // Reload all related data for this destination
        const savedChecklist = localStorage.getItem(`checklist_${dest}`);
        setCompletedItems(savedChecklist ? JSON.parse(savedChecklist) : {});

        const savedReviews = localStorage.getItem(`reviews_${dest}`);
        setUserReviews(savedReviews ? JSON.parse(savedReviews) : {});

        const savedLogs = localStorage.getItem(`logs_${dest}`);
        setUserLogs(savedLogs ? JSON.parse(savedLogs) : {});

        const savedFiles = localStorage.getItem(`files_${dest}`);
        setCustomFiles(savedFiles ? JSON.parse(savedFiles) : []);

        // Reset navigation states
        setScheduleDay(1);
        setSelectedPoint(null);
    }, [trip.metadata?.destination]);

    // Cleanup old attraction cache (older than 7 days)
    useEffect(() => {
        const CACHE_KEY = 'attraction_recommendation_cache';
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
            try {
                const cache = JSON.parse(cachedStr);
                const now = Date.now();
                const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
                let hasChanges = false;

                Object.keys(cache).forEach(key => {
                    if (now - cache[key].timestamp > sevenDaysInMs) {
                        delete cache[key];
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                    console.log("Cleaned up expired attraction cache items.");
                }
            } catch (e) {
                console.error("Cache cleanup error:", e);
            }
        }
    }, []);

    // Close bottom sheet when switching tabs
    useEffect(() => {
        setSelectedPoint(null);
        setExpandedSection(null);
    }, [activeTab]);

    const toggleComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const updateReview = (id: string, rating: number, text: string) => {
        setUserReviews(prev => ({
            ...prev,
            [id]: { rating, text }
        }));
    };

    const updateLog = (id: string, text: string) => {
        setUserLogs(prev => ({
            ...prev,
            [id]: text
        }));
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const convert = (val: string, type: 'jpy' | 'krw') => {
        const num = parseFloat(val.replace(/,/g, ''));
        if (isNaN(num)) {
            if (type === 'jpy') { setJpyAmount(val); setKrwAmount('0'); }
            else { setKrwAmount(val); setJpyAmount('0'); }
            return;
        }
        if (type === 'jpy') {
            setJpyAmount(val);
            setKrwAmount(Math.round(num * rate).toLocaleString());
        } else {
            setKrwAmount(val);
            setJpyAmount(Math.round(num / rate).toString());
        }
    };

    const getPoints = () => {
        return allPoints.filter(p => p.day === scheduleDay);
    };

    const handleReorder = (newOrder: LocationPoint[]) => {
        // 현재 선택된 날짜가 아닌 포인트들 분리
        const otherPoints = allPoints.filter(p => p.day !== scheduleDay);
        // 새 순서와 합치기 (주의: newOrder는 현재 날짜의 포인트들만 담고 있음)
        // 원래 데이터 순서를 유지하기 위해, 날짜별로 다시 정렬하거나 하는 것이 좋겠지만
        // 여기서는 간단히 다른 날짜 데이터를 앞/뒤에 붙이는 식으로 처리하기엔 원래 순서가 섞일 수 있음.
        // 가장 안전한 방법: 전체 리스트에서 해당 포인트들의 위치만 교체.

        // 하지만 더 간단한 방법:
        // 1. 현재 날짜의 포인트들을 제외한 리스트를 만듦.
        // 2. 현재 날짜의 포인트들을 newOrder로 대체.
        // 3. 다시 날짜별로 정렬하거나, 그냥 합침 (일차별 필터링을 하므로 순서만 맞으면 됨).

        // 구현:
        // 다른 날짜의 데이터는 그대로 유지하고, 현재 날짜의 데이터만 newOrder로 교체
        // 단, allPoints 배열 내에서의 상대적 위치는 유지되지 않을 수 있음.
        // 하지만 getPoints()는 filter로 가져오므로, allPoints 내의 순서는 중요하지 않고
        // filter된 결과 내의 순서가 중요함.
        // -> 아님. filter 결과의 순서는 allPoints 내의 순서를 따름.
        // 따라서 allPoints 내에서도 순서를 맞춰줘야 함.

        // 개선된 로직:
        // 전체 리스트 재구성: [Day 1, Day 2, ...] 순서로 정렬되어 있다고 가정하면 쉬움.
        // 그냥 날짜와 상관없이 다른 포인트 + 새 순서 포인트 로 합치면 됨.
        // 다만 날짜별 그룹핑을 유지하고 싶다면, scheduleDay를 기준으로 정렬 로직이 필요.

        // 여기서는 간단하게:
        // 1. 현재 날짜가 아닌 것들 (otherPoints)
        // 2. 현재 날짜인 것들 (newOrder)
        // 3. 합쳐서 날짜순, 그리고 인덱스순 정렬? 
        // 아니면 그냥 합치면 됨. 어차피 렌더링할 때 filter(day === x) 하니까.

        setAllPoints([...otherPoints, ...newOrder]);
    };

    const deletePoint = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteConfirmModal({
            isOpen: true,
            title: '장소 삭제',
            message: '이 장소를 일정에서 삭제하시겠습니까?',
            onConfirm: () => {
                const updatedPoints = allPoints.filter(p => p.id !== id);
                setAllPoints(updatedPoints);
                showToast('장소가 삭제되었습니다.');
                setDeleteConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
            }
        });
    };

    const addPoint = (category: 'sightseeing' | 'food' | 'logistics' | 'stay' = 'sightseeing') => {
        const name = window.prompt('장소 이름을 입력해주세요:');
        if (!name) return;

        const newPoint: LocationPoint = {
            id: `point-${Date.now()}`,
            name,
            category,
            coordinates: { lat: 26.2124, lng: 127.6809 }, // Default to Naha
            tips: ['사용자가 직접 추가한 장소입니다.'],
            day: scheduleDay,
            description: ''
        };

        setAllPoints([...allPoints, newPoint]);
        showToast('장소가 추가되었습니다.');
    };

    const addAccommodation = () => {
        const name = window.prompt('숙소 이름을 입력해주세요:');
        if (!name) return;
        const startDate = window.prompt('시작 날짜 (YYYY-MM-DD):', trip.metadata.startDate);
        if (!startDate) return;
        const endDate = window.prompt('종료 날짜 (YYYY-MM-DD):', startDate);
        if (!endDate) return;

        const newAcc = { name, startDate, endDate };
        const updatedTrip = {
            ...trip,
            metadata: {
                ...trip.metadata,
                accommodations: [...(trip.metadata.accommodations || []), newAcc]
            }
        };

        setTrip(updatedTrip);
        setTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
        showToast('숙소가 추가되었습니다.');
    };

    const deleteAccommodation = (index: number) => {
        setDeleteConfirmModal({
            isOpen: true,
            title: '숙소 삭제',
            message: '이 숙소 정보를 삭제하시겠습니까?',
            onConfirm: () => {
                const updatedAccs = (trip.metadata.accommodations || []).filter((_, i) => i !== index);
                const updatedTrip = {
                    ...trip,
                    metadata: {
                        ...trip.metadata,
                        accommodations: updatedAccs
                    }
                };

                setTrip(updatedTrip);
                setTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
                showToast('숙소 정보가 삭제되었습니다.');
                setDeleteConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
            }
        });
    };



    // Get formatted date string
    const getFormattedDate = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayName = days[now.getDay()];
        return `${month}월 ${date}일 ${dayName}`;
    };

    // Get weather for specific day index (0=today, 1=tomorrow, 2=day after)
    const getWeatherForDay = (dayIndex: number) => {
        const location = selectedWeatherLocation?.name || '오키나와 (나하)';

        // If we have selected location weather, use it as base
        if (selectedWeatherLocation?.weather) {
            const baseWeather = selectedWeatherLocation.weather;
            // Simulate different weather for different days
            const tempVariation = dayIndex === 0 ? 0 : dayIndex === 1 ? -2 : 1;
            const temp = parseInt(baseWeather.temp) + tempVariation;

            return {
                location,
                temp: `${temp}°`,
                condition: dayIndex === 0 ? baseWeather.condition :
                    dayIndex === 1 ? '구름 조금' : '대체로 맑음',
                wind: baseWeather.wind,
                humidity: baseWeather.humidity
            };
        }

        // Default 3-day forecast for Naha
        const forecasts = [
            { temp: '22°', condition: '맑음', wind: '3 m/s', humidity: '60%' },
            { temp: '20°', condition: '구름 조금', wind: '5 m/s', humidity: '70%' },
            { temp: '23°', condition: '대체로 맑음', wind: '4 m/s', humidity: '55%' }
        ];

        return {
            location,
            ...forecasts[dayIndex]
        };
    };

    const calculateProgress = () => {
        const total = trip.points.length;
        const complete = Object.values(completedItems).filter(Boolean).length;
        return Math.round((complete / total) * 100);
    };

    const bottomSheetTop = activeTab === 'summary' ? '380px' : '280px';

    return (
        <ErrorBoundary>
            <div style={{ position: 'absolute', top: 0, right: 0, color: 'lime', zIndex: 9999, padding: 5, background: 'rgba(0,0,0,0.5)' }}>
                Debug: App Rendered
            </div>
            <div className="app">
                {/* AnimatePresence removed to fix black screen crash */}
                <>
                    {view === 'landing' && !isPlanning && (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '30px',
                                background: 'radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)',
                                zIndex: 999999,
                                position: 'relative'
                            }}
                        >
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ width: 100, height: 100, borderRadius: '30px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <img src="/logo.png" alt="빠니보살" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-2px', color: '#ffffff', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>빠니보살</h1>
                                <p style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 700, marginBottom: '40px', letterSpacing: '1px' }}>AI로 자유여행 하기</p>

                                {!isLoggedIn ? (
                                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button
                                            onClick={() => setView('login')}
                                            className="primary-button"
                                            style={{ width: '100%' }}
                                        >
                                            로그인
                                        </button>
                                        <button
                                            onClick={() => setView('signup')}
                                            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 'bold' }}
                                        >
                                            회원가입
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                        {/* List Style Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>나의 여행 기록</h2>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{currentUser?.name}님의 여정들</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    onClick={() => {
                                                        // Always start fresh new trip
                                                        localStorage.removeItem('trip_draft_v1');

                                                        setIsPlanning(true);
                                                        setPlannerStep(0);
                                                        setPlannerData({
                                                            title: '',
                                                            destination: '',
                                                            startDate: '',
                                                            endDate: '',
                                                            arrivalTime: '10:00',
                                                            departureTime: '18:00',
                                                            departurePoint: currentUser?.homeAddress || '',
                                                            entryPoint: '',
                                                            travelMode: 'plane',
                                                            useRentalCar: false,
                                                            companion: '',
                                                            transport: 'rental',
                                                            accommodations: [],
                                                            theme: '',
                                                            pace: 'normal',
                                                        });
                                                        setSelectedPlaceIds([]);
                                                        setDynamicAttractions([]);
                                                    }}
                                                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, color: 'black', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,212,255,0.3)' }}
                                                >
                                                    <Sparkles size={16} /> 새 여행
                                                </button>
                                                <button
                                                    onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }}
                                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                                                >
                                                    <LogOut size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setView('debug')}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-dim)', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', cursor: 'pointer' }}
                                                >
                                                    데이터 디버그
                                                </button>
                                            </div>
                                        </div>
                                        {/* Trip List with Grouping */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingRight: '4px', flex: 1, textAlign: 'left' }}>

                                            {/* Draft Section */}
                                            {localStorage.getItem('trip_draft_v1') && (() => {
                                                const draft = JSON.parse(localStorage.getItem('trip_draft_v1')!);
                                                const dest = draft.data.destination || '여행지 미정';
                                                const step = draft.step || 0;
                                                return (
                                                    <div>
                                                        <div style={{ padding: '0 8px 12px', fontSize: '12px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, rgba(245,158,11,0.5), transparent)' }} />
                                                            작성 중인 여행
                                                            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, rgba(245,158,11,0.5), transparent)' }} />
                                                        </div>
                                                        <motion.div
                                                            whileTap={{ scale: 0.98 }}
                                                            className="glass-card"
                                                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', position: 'relative' }}
                                                            onClick={() => {
                                                                // Resume Draft
                                                                setIsPlanning(true);
                                                                setPlannerStep(step);
                                                                setPlannerData(draft.data);
                                                                setSelectedPlaceIds(draft.selectedIds);
                                                                if (draft.attractions) setDynamicAttractions(draft.attractions);
                                                            }}
                                                        >
                                                            <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                                                                <Edit3 size={24} />
                                                            </div>
                                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                                <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>{dest} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>작성 중...</span></div>
                                                                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
                                                                    Step {step + 1} 진행 중
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmModal({
                                                                        isOpen: true,
                                                                        title: '작성 중인 여행 삭제',
                                                                        message: '작성 중인 내용을 삭제하시겠습니까?',
                                                                        onConfirm: () => {
                                                                            localStorage.removeItem('trip_draft_v1');
                                                                            showToast('작성 중인 내용이 삭제되었습니다.');
                                                                            setLastUpdate(Date.now());
                                                                            setDeleteConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
                                                                        }
                                                                    });
                                                                }}
                                                                style={{ padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </motion.div>
                                                    </div>
                                                );
                                            })()}
                                            {(() => {
                                                const groups: Record<string, { title: string, items: any[] }> = {};
                                                const groupKeys: string[] = [];

                                                trips.forEach((t: any) => {
                                                    const period = t.period || (t.metadata && t.metadata.period) || '2000.01.01';
                                                    const year = period.substring(0, 4);
                                                    const key = t.groupId || `year-${year}`;
                                                    const title = t.groupTitle || `${year}년`;

                                                    if (!groups[key]) {
                                                        groups[key] = { title, items: [] };
                                                        groupKeys.push(key);
                                                    }
                                                    groups[key].items.push(t);
                                                });

                                                // Remove duplicate keys and sort
                                                const uniqueKeys = Array.from(new Set(groupKeys)).sort((a, b) => b.localeCompare(a));

                                                return uniqueKeys.map(key => (
                                                    <div key={key}>
                                                        <div style={{ padding: '0 8px 12px', fontSize: '12px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '2px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, rgba(0,212,255,0.5), transparent)' }} />
                                                            {groups[key].title}
                                                            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, rgba(0,212,255,0.5), transparent)' }} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            {groups[key].items.map((tripItem: any) => {
                                                                const displayTitle = tripItem.title || (tripItem.metadata && tripItem.metadata.title) || '무제 여행';
                                                                const displayPeriod = tripItem.period || (tripItem.metadata && tripItem.metadata.period) || '날짜 미정';
                                                                const displayColor = tripItem.color || (tripItem.metadata && tripItem.metadata.primaryColor) || '#00d4ff';

                                                                return (
                                                                    <div
                                                                        key={tripItem.id}
                                                                        onClick={() => {
                                                                            // Clean landing state and load trip
                                                                            if (tripItem.id === 'okinawa' || tripItem.id === okinawaTrip.id) {
                                                                                setTrip(okinawaTrip);
                                                                                setView('app');
                                                                            } else if (tripItem.points && tripItem.points.length > 0) {
                                                                                try {
                                                                                    // Reconstruct with base defaults to ensure no missing fields
                                                                                    const loadedTrip: TripPlan = {
                                                                                        ...okinawaTrip,
                                                                                        ...tripItem,
                                                                                        metadata: {
                                                                                            ...okinawaTrip.metadata,
                                                                                            ...(tripItem.metadata || {}),
                                                                                            destination: tripItem.destination || tripItem.metadata?.destination || 'Destination',
                                                                                            title: tripItem.title || tripItem.metadata?.title || 'Untitled Trip',
                                                                                            period: tripItem.period || tripItem.metadata?.period || 'Dates TBD'
                                                                                        }
                                                                                    };
                                                                                    console.log("Loading Trip:", loadedTrip);
                                                                                    setTrip(loadedTrip);
                                                                                    setView('app');
                                                                                } catch (err) {
                                                                                    console.error("Failed to load trip:", err);
                                                                                    alert("여행 데이터를 불러오는 중 오류가 발생했습니다.");
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="glass-card"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.1s' }}
                                                                    >
                                                                        <div style={{ width: 50, height: 50, borderRadius: '12px', background: `${displayColor}20`, border: `1px solid ${displayColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: displayColor }}>
                                                                            <MapPin size={24} />
                                                                        </div>
                                                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                                                            <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>{displayTitle}</div>
                                                                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: 2 }}>{displayPeriod}</div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                            <div style={{ textAlign: 'right' }}>
                                                                                <div style={{ fontSize: '14px', fontWeight: 800, color: displayColor }}>{tripItem.progress}%</div>
                                                                                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>달성도</div>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    console.log("Re-edit button clicked!");
                                                                                    setTripToEdit(tripItem);
                                                                                    setIsReEditModalOpen(true);
                                                                                }}
                                                                                style={{ position: 'relative', zIndex: 1000, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'var(--primary)', cursor: 'pointer', pointerEvents: 'auto' }}
                                                                                title="경로 재설정"
                                                                            >
                                                                                <Edit3 size={16} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setDeleteConfirmModal({
                                                                                        isOpen: true,
                                                                                        title: '여행 가이드 삭제',
                                                                                        message: '이 여행 가이드를 삭제하시겠습니까?',
                                                                                        onConfirm: () => {
                                                                                            const updated = trips.filter(t => t.id !== tripItem.id);
                                                                                            setTrips(updated);
                                                                                            localStorage.setItem('trips_v1', JSON.stringify(updated));
                                                                                            showToast('여행 가이드가 삭제되었습니다.');
                                                                                            setDeleteConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {view === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '30px',
                                justifyContent: 'center',
                                background: 'radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)'
                            }}
                        >
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <LogIn size={28} /> 로그인
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.6, fontSize: '13px' }}>이메일</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                        <input type="email" placeholder="email@example.com" style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'white' }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.6, fontSize: '13px' }}>비밀번호</label>
                                    <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'white' }} />
                                </div>
                                <button
                                    onClick={() => { setIsLoggedIn(true); setCurrentUser({ name: '사용자', homeAddress: '경기도 평택시 서재로 36 자이아파트' }); setView('landing'); }}
                                    className="primary-button"
                                    style={{ marginTop: '10px' }}
                                >
                                    로그인하기
                                </button>
                                <button onClick={() => setView('landing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>뒤로 가기</button>
                            </div>
                        </motion.div>
                    )}

                    {view === 'signup' && (
                        <motion.div
                            key="signup"
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '30px',
                                justifyContent: 'center',
                                background: 'radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)'
                            }}
                        >
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <UserPlus size={28} /> 회원가입
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.6, fontSize: '13px' }}>이름</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                        <input type="text" placeholder="홍길동" style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'white' }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.6, fontSize: '13px' }}>집 주소 (여행 출발지)</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                        <input id="signup-address" type="text" placeholder="예: 서울특별시 강남구..." style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'white' }} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const nameInput = (document.querySelector('input[placeholder="홍길동"]') as HTMLInputElement)?.value || '신규여행자';
                                        const addrInput = (document.getElementById('signup-address') as HTMLInputElement)?.value || '';
                                        setIsLoggedIn(true);
                                        setCurrentUser({ name: nameInput, homeAddress: addrInput });
                                        setView('landing');
                                    }}
                                    className="primary-button"
                                >
                                    회원가입 완료
                                </button>
                                <button onClick={() => setView('landing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>뒤로 가기</button>
                            </div>
                        </motion.div>
                    )}

                    {view === 'app' && (
                        <motion.div
                            key="app"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
                        >
                            <nav className="nav-tabs">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('🔄 Main Nav X Clicked. Returning to landing...');
                                        setSelectedPoint(null);
                                        setActivePlannerDetail(null);
                                        // Force clear any pending map states
                                        // Small delay to allow map cleanup
                                        setTimeout(() => {
                                            console.log('⏰ Timeout Executed. Calling setView("landing")...');
                                            try {
                                                setView('landing');
                                                console.log('✅ setView("landing") called successfully.');
                                            } catch (err) {
                                                console.error('❌ Error during setView:', err);
                                            }
                                        }, 50);
                                    }}
                                    style={{ padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-primary)', marginRight: '8px' }}
                                >
                                    <X size={20} />
                                </button>
                                <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => { setSelectedPoint(null); setActivePlannerDetail(null); setActiveTab('summary'); }}>
                                    <LayoutDashboard size={18} /> <span style={{ marginLeft: '4px' }}>개요</span>
                                </button>
                                <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => { setSelectedPoint(null); setActivePlannerDetail(null); setActiveTab('schedule'); }}>
                                    <Calendar size={18} /> <span style={{ marginLeft: '4px' }}>일정</span>
                                </button>
                                <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => { setSelectedPoint(null); setActivePlannerDetail(null); setActiveTab('files'); }}>
                                    <FileText size={18} /> <span style={{ marginLeft: '4px' }}>서류</span>
                                </button>
                                <button className={`tab ${activeTab === 'exchange' ? 'active' : ''}`} onClick={() => { setSelectedPoint(null); setActivePlannerDetail(null); setActiveTab('exchange'); }}>
                                    <RefreshCw size={18} /> <span style={{ marginLeft: '4px' }}>환율</span>
                                </button>
                                <button className={`tab ${activeTab === 'speech' ? 'active' : ''}`} onClick={() => { setSelectedPoint(null); setActivePlannerDetail(null); setActiveTab('speech'); }}>
                                    <MessageCircle size={18} /> <span style={{ marginLeft: '4px' }}>회화</span>
                                </button>
                                <button className="tab" onClick={toggleTheme} style={{ marginLeft: 'auto', padding: '6px 10px', minWidth: 'auto' }}>
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                            </nav>

                            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', display: 'flex', flexDirection: 'column' }}>
                                {activeTab === 'summary' && (
                                    <div className="overview-content">
                                        {/* Toggle Switch */}
                                        <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', padding: 4, borderRadius: 24, marginBottom: 20, flexShrink: 0 }}>
                                            <button
                                                onClick={() => setOverviewMode('map')}
                                                style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: overviewMode === 'map' ? 'var(--primary)' : 'transparent', color: overviewMode === 'map' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                지도로 보기
                                            </button>
                                            <button
                                                onClick={() => setOverviewMode('text')}
                                                style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: overviewMode === 'text' ? 'var(--primary)' : 'transparent', color: overviewMode === 'text' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                내용 보기
                                            </button>
                                        </div>

                                        {overviewMode === 'map' ? (
                                            <div style={{ flex: 1, width: '100%', borderRadius: '16px', overflow: 'hidden', minHeight: '300px' }}>
                                                <MapComponent points={trip.points} selectedPoint={selectedPoint} onPointClick={(p) => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} />
                                            </div>
                                        ) : (
                                            <>
                                                <section style={{ marginBottom: 24 }}>
                                                    <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                                                        <motion.div
                                                            key={weatherIndex}
                                                            className="glass-card"
                                                            drag="x"
                                                            dragConstraints={{ left: 0, right: 0 }}
                                                            dragElastic={0.2}
                                                            whileTap={{ cursor: 'grabbing' }}
                                                            whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
                                                            onDragEnd={(_, info) => {
                                                                console.log('Drag ended, offset:', info.offset.x);
                                                                const threshold = 40;
                                                                if (info.offset.x > threshold) {
                                                                    console.log('Swiped right - going to previous day');
                                                                    setWeatherIndex((prev) => (prev - 1 + 3) % 3);
                                                                } else if (info.offset.x < -threshold) {
                                                                    console.log('Swiped left - going to next day');
                                                                    setWeatherIndex((prev) => (prev + 1) % 3);
                                                                }
                                                            }}
                                                            animate={{ x: 0, scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                            style={{
                                                                background: weatherIndex === 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                                                                    weatherIndex === 1 ? 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' :
                                                                        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                                                                border: 'none', position: 'absolute', top: 0, left: 0, right: 0, height: '100%', padding: '20px', cursor: 'grab', touchAction: 'pan-y'
                                                            }}
                                                        >
                                                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                                                <div>
                                                                    <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginBottom: 2 }}>
                                                                        {getFormattedDate(weatherIndex)}
                                                                    </div>
                                                                    <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>
                                                                        {getWeatherForDay(weatherIndex).location}
                                                                    </div>
                                                                    <div style={{ fontSize: 42, fontWeight: 800 }}>
                                                                        {getWeatherForDay(weatherIndex).temp}
                                                                    </div>
                                                                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                                                                        {getWeatherForDay(weatherIndex).condition}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <CloudSun size={64} color="white" />
                                                                </div>
                                                            </div>
                                                            <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 20, color: 'white' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                                    <Wind size={16} /> <span>{getWeatherForDay(weatherIndex).wind}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                                    <Droplets size={16} /> <span>습도 {getWeatherForDay(weatherIndex).humidity}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                    {/* Pagination Dots */}
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, padding: '8px 0' }}>
                                                        {[0, 1, 2].map(i => (
                                                            <div
                                                                key={i}
                                                                onClick={() => {
                                                                    console.log('Dot clicked:', i);
                                                                    setWeatherIndex(i);
                                                                }}
                                                                style={{
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: '50%',
                                                                    background: weatherIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                                                    transition: 'all 0.3s',
                                                                    cursor: 'pointer',
                                                                    border: weatherIndex === i ? '2px solid white' : 'none'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </section>

                                                <section className="overview-section">
                                                    <h2><Calendar size={20} style={{ marginRight: 8 }} /> 여행 개요</h2>
                                                    <div className="glass-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: 18, color: 'var(--text-primary)' }}>{trip.metadata?.period || '날짜 정보 없음'}</h3>
                                                                <p style={{ color: 'var(--text-secondary)' }}>{trip.metadata?.title || '제목 없음'}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
                                                                    {calculateProgress()}%
                                                                </span>
                                                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>진행률</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 10, background: 'var(--glass-border)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                                                            <div style={{ width: `${calculateProgress()}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.3s' }} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { setIsPlanning(true); setPlannerStep(0); }}
                                                        className="glass-card"
                                                        style={{ width: '100%', marginTop: 12, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        <Sparkles size={18} /> 새로운 여행 가이드 생성하기
                                                    </button>
                                                </section>


                                                {/* Accommodation Management */}
                                                <section className="overview-section">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Hotel size={18} color="var(--primary)" /> 숙소 관리
                                                        </h3>
                                                        <button
                                                            onClick={addAccommodation}
                                                            style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--primary)', border: 'none', color: 'black', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}
                                                        >
                                                            숙소 추가
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {(!trip.metadata.accommodations || trip.metadata.accommodations.length === 0) ? (
                                                            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', opacity: 0.6, fontSize: '13px', background: 'rgba(255,255,255,0.02)' }}>
                                                                등록된 숙소가 없습니다. 상단의 '추가' 버튼으로 등록하세요.
                                                            </div>
                                                        ) : (
                                                            trip.metadata.accommodations.map((acc, idx) => (
                                                                <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px' }}>{acc.name}</div>
                                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{acc.startDate} ~ {acc.endDate}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => deleteAccommodation(idx)}
                                                                        style={{ background: 'rgba(255,78,80,0.1)', border: 'none', color: '#ff4e50', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </section>

                                                {/* Logistics/Key Info */}
                                                <section className="overview-section">
                                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 10, marginBottom: 15 }}>📋 주요 정보 (교통)</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {trip.points.filter(p => ['logistics'].includes(p.category)).map(p => (
                                                            <div key={p.id} className="glass-card" onClick={() => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                                                    <div style={{ fontSize: 12, color: 'var(--primary)' }}>{p.category.toUpperCase()}</div>
                                                                </div>
                                                                {p.phone && <Phone size={16} style={{ color: 'var(--text-secondary)' }} />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="list-view">
                                        {/* View Mode Toggle */}
                                        <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', padding: 4, borderRadius: 24, marginBottom: 16, flexShrink: 0 }}>
                                            <button onClick={() => setScheduleViewMode('map')} style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: scheduleViewMode === 'map' ? 'var(--primary)' : 'transparent', color: scheduleViewMode === 'map' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                지도 보기
                                            </button>
                                            <button onClick={() => setScheduleViewMode('list')} style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: scheduleViewMode === 'list' ? 'var(--primary)' : 'transparent', color: scheduleViewMode === 'list' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                목록 보기
                                            </button>
                                        </div>

                                        <section style={{ marginBottom: 16, display: scheduleViewMode === 'list' ? 'block' : 'none' }}>
                                            <div style={{ position: 'relative', width: '100%', height: '72px' }}>
                                                <motion.div
                                                    key={`schedule-weather-${weatherIndex}`}
                                                    className="glass-card"
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0.2}
                                                    whileTap={{ cursor: 'grabbing' }}
                                                    whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
                                                    onDragEnd={(_, info) => {
                                                        const threshold = 40;
                                                        if (info.offset.x > threshold) {
                                                            setWeatherIndex((prev) => (prev - 1 + 3) % 3);
                                                        } else if (info.offset.x < -threshold) {
                                                            setWeatherIndex((prev) => (prev + 1) % 3);
                                                        }
                                                    }}
                                                    animate={{ x: 0, scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                    style={{
                                                        background: weatherIndex === 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                                                            weatherIndex === 1 ? 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' :
                                                                'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                                                        border: 'none', position: 'absolute', top: 0, left: 0, right: 0, height: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', cursor: 'grab', touchAction: 'pan-y'
                                                    }}
                                                >
                                                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: 'white', gap: 12 }}>
                                                        {/* 날짜 */}
                                                        <div style={{ fontSize: 13, fontWeight: 600, minWidth: '60px' }}>
                                                            {getFormattedDate(weatherIndex).split(' ')[1]} {getFormattedDate(weatherIndex).split(' ')[2]}
                                                        </div>

                                                        {/* 구분선 */}
                                                        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.4)' }}></div>

                                                        {/* 지역 */}
                                                        <div style={{ fontSize: 13, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {getWeatherForDay(weatherIndex).location}
                                                        </div>

                                                        {/* 날씨 아이콘 및 온도 */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <CloudSun size={24} color="white" />
                                                            <div style={{ fontSize: 20, fontWeight: 700 }}>
                                                                {getWeatherForDay(weatherIndex).temp}
                                                            </div>
                                                        </div>

                                                        {/* 습도 */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.9, background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                                                            <Droplets size={12} />
                                                            <span>{getWeatherForDay(weatherIndex).humidity}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                            {/* Pagination Dots */}
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, padding: '8px 0' }}>
                                                {[0, 1, 2].map(i => (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            console.log('Schedule dot clicked:', i);
                                                            setWeatherIndex(i);
                                                        }}
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            background: weatherIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                                            transition: 'all 0.3s',
                                                            cursor: 'pointer',
                                                            border: weatherIndex === i ? '2px solid white' : 'none'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </section>



                                        <div
                                            className="day-tabs"
                                            ref={(el) => {
                                                if (!el) return;
                                                // Draggable Scroll Logic
                                                let isDown = false;
                                                let startX: number;
                                                let scrollLeft: number;

                                                el.onmousedown = (e) => {
                                                    isDown = true;
                                                    el.style.cursor = 'grabbing';
                                                    startX = e.pageX - el.offsetLeft;
                                                    scrollLeft = el.scrollLeft;
                                                };
                                                el.onmouseleave = () => {
                                                    isDown = false;
                                                    el.style.cursor = 'grab';
                                                };
                                                el.onmouseup = () => {
                                                    isDown = false;
                                                    el.style.cursor = 'grab';
                                                };
                                                el.onmousemove = (e) => {
                                                    if (!isDown) return;
                                                    e.preventDefault();
                                                    const x = e.pageX - el.offsetLeft;
                                                    const walk = (x - startX) * 2; // Scroll-fast
                                                    el.scrollLeft = scrollLeft - walk;
                                                };
                                            }}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '16px',
                                                overflowX: 'auto',
                                                paddingBottom: '8px',
                                                paddingRight: '40px', /* Ensure last tab is visible */
                                                whiteSpace: 'nowrap',
                                                cursor: 'grab',
                                                userSelect: 'none'
                                            }}>
                                            {(() => {
                                                // Dynamic Tab Generation: Priority to Actual Data
                                                let dayCount = 0;

                                                if (trip.days && trip.days.length > 0) {
                                                    // Trust generated days but trim trailing empty days
                                                    let maxDay = trip.days.length;
                                                    for (let i = trip.days.length - 1; i >= 0; i--) {
                                                        const d = trip.days[i];
                                                        if (!d.points || d.points.length === 0) maxDay--;
                                                        else break;
                                                    }
                                                    dayCount = Math.max(maxDay, 1);
                                                } else if (trip.points && trip.points.length > 0) {
                                                    // Fallback 1: Calculate from flat points array
                                                    const maxPointDay = trip.points.reduce((max, p) => (p.day > max ? p.day : max), 0);
                                                    dayCount = Math.max(maxPointDay, 1);
                                                } else {
                                                    // Fallback 2: Pure Date Calculation
                                                    const start = new Date(trip.metadata?.startDate || plannerData.startDate);
                                                    const end = new Date(trip.metadata?.endDate || plannerData.endDate);
                                                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                        const diffTime = end.getTime() - start.getTime();
                                                        // Accurate day count
                                                        dayCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                    }
                                                }

                                                // Safety clamp: Minimum 1 day
                                                if (dayCount < 1) dayCount = 1;

                                                return Array.from({ length: dayCount }, (_, i) => i + 1).map(d => (

                                                    <button
                                                        key={d}
                                                        onClick={() => {
                                                            // 1. Close details immediately to prevent state conflict
                                                            setSelectedPoint(null);
                                                            setActivePlannerDetail(null); // Close guide detail as well
                                                            setWeatherIndex(0);

                                                            // 2. Defer day change to ensure UI is clean before re-rendering map
                                                            setTimeout(() => {
                                                                setScheduleDay(d);
                                                            }, 0);
                                                        }}
                                                        style={{
                                                            minWidth: '60px', /* Ensure clickable area */
                                                            flex: '0 0 auto', /* Prevent shrinking */
                                                            padding: '10px 20px',
                                                            borderRadius: '24px',
                                                            border: '1px solid var(--glass-border)',
                                                            background: scheduleDay === d ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                            color: scheduleDay === d ? 'black' : 'var(--text-secondary)',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {d}일차
                                                    </button>
                                                ));
                                            })()}
                                        </div>

                                        {/* 숙소 정보 섹션 */}
                                        <div className="glass-card" style={{ marginBottom: '24px', padding: '16px', border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.02)', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '8px' }}>
                                                <Hotel size={18} color="var(--primary)" />
                                                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>오늘의 숙소</span>
                                            </div>
                                            {(() => {
                                                const baseDateStr = trip.metadata?.startDate || plannerData.startDate;
                                                if (!baseDateStr) return <div style={{ fontSize: '13px', opacity: 0.6 }}>날짜 정보가 없습니다.</div>;

                                                const todayDate = new Date(baseDateStr);
                                                if (isNaN(todayDate.getTime())) return <div style={{ fontSize: '13px', opacity: 0.6 }}>날짜 정보가 올바르지 않습니다.</div>;

                                                todayDate.setDate(todayDate.getDate() + (scheduleDay - 1));
                                                const todayStr = todayDate.toISOString().split('T')[0];
                                                const accommodations = trip.metadata?.accommodations || plannerData.accommodations || [];
                                                const foundAcc = accommodations.find((a: any) => todayStr >= a.startDate && todayStr <= a.endDate);

                                                if (foundAcc) {
                                                    return (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '16px' }}>{foundAcc.name}</div>
                                                            <button
                                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(foundAcc.name)}`, '_blank')}
                                                                style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                                                            >길찾기</button>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '13px', opacity: 0.6 }}>등록된 숙소가 없습니다.</div>
                                                        <button
                                                            onClick={() => {
                                                                const currentArea = trip.metadata?.destination || plannerData.destination;
                                                                window.open(`https://www.google.com/maps/search/${currentArea}+호텔`, '_blank');
                                                            }}
                                                            style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        >
                                                            <Compass size={14} /> 주변 검색
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Map - 지도 보기일 때만 렌더링 */}
                                        {scheduleViewMode === 'map' && (
                                            <div style={{ height: '350px', width: '100%', flexShrink: 0, borderRadius: '16px', overflow: 'hidden' }}>
                                                {/* 날짜 변경 시 지도를 완전히 새로 그리기 위해 key prop 사용 - ErrorBoundary 추가 */}
                                                <ErrorBoundary>
                                                    <MapComponent
                                                        // key prop REMOVED to prevent unmounting and crashing Google Maps
                                                        points={getPoints()}
                                                        selectedPoint={selectedPoint}
                                                        onPointClick={(p) => { setSelectedPoint(p); setSelectedWeatherLocation(p); }}
                                                    />
                                                </ErrorBoundary>
                                            </div>
                                        )}

                                        {/* List - 목록 보기일 때만 표시 */}
                                        {scheduleViewMode === 'list' && (
                                            <ErrorBoundary>
                                                <Reorder.Group
                                                    axis="y"
                                                    values={getPoints()}
                                                    onReorder={handleReorder}
                                                    style={{ padding: 0, margin: 0, listStyle: 'none' }}
                                                >
                                                    {getPoints().map(p => {
                                                        const isDone = !!completedItems[p.id];
                                                        return (
                                                            <Reorder.Item
                                                                key={p.id}
                                                                value={p}
                                                                style={{ marginBottom: 12 }}
                                                                onDragStart={() => { isDraggingRef.current = true; }}
                                                                onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 100); }}
                                                            >
                                                                <div
                                                                    className="glass-card"
                                                                    onClick={() => {
                                                                        if (isDraggingRef.current) return;
                                                                        setSelectedPoint(p);
                                                                        setSelectedWeatherLocation(p);
                                                                    }}
                                                                    style={{ display: 'flex', alignItems: 'center', opacity: isDone ? 0.6 : 1, transition: 'opacity 0.2s', cursor: 'grab', userSelect: 'none' }}
                                                                >
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>{p.name}</div>
                                                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.category.toUpperCase()}</div>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                                        <button
                                                                            onClick={(e) => deletePoint(p.id, e)}
                                                                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 5 }}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => toggleComplete(p.id, e)}
                                                                            style={{ background: 'transparent', border: 'none', color: isDone ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: 5 }}
                                                                        >
                                                                            {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                                        </button>
                                                                    </div>

                                                                </div>
                                                            </Reorder.Item>
                                                        );
                                                    })}

                                                </Reorder.Group>
                                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                                    <button
                                                        onClick={() => addPoint('sightseeing')}
                                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                                                    >
                                                        <MapPin size={14} /> 장소 추가
                                                    </button>
                                                    <button
                                                        onClick={() => addPoint('food')}
                                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                                                    >
                                                        <Utensils size={14} /> 맛집 추가
                                                    </button>
                                                </div>

                                            </ErrorBoundary>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'files' && (
                                    <div className="file-grid" style={{ paddingBottom: 80 }}>
                                        {/* Upload Button */}
                                        <div className="file-card" style={{ border: '2px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e)}
                                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                            />
                                            <Upload size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>새 파일 업로드</div>
                                        </div>

                                        {/* Custom Files */}
                                        {customFiles.map(f => (
                                            <div key={f.id} className="file-card">
                                                <img src={f.data} alt={f.name} className="file-img" />
                                                <div className="file-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.name}</span>
                                                    <button onClick={(e) => deleteFile(f.id, e)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                {f.linkedTo && (
                                                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--primary)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'black', fontWeight: 'bold' }}>
                                                        연결됨
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Default Files */}
                                        {trip.defaultFiles.map(f => (
                                            <div key={f.name} className="file-card">
                                                <img src={f.path} alt={f.name} className="file-img" />
                                                <div className="file-info">{f.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'exchange' && (
                                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <div className="converter-card" style={{ padding: 20, borderRadius: 16, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
                                            <h3 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>💱 환율 계산기</h3>

                                            <div style={{ marginBottom: 15 }}>
                                                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>JPY</label>
                                                <input
                                                    type="number"
                                                    value={jpyAmount}
                                                    onChange={e => convert(e.target.value, 'jpy')}
                                                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', marginTop: 5 }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: 20 }}>
                                                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>KRW</label>
                                                <input
                                                    type="text"
                                                    value={krwAmount}
                                                    onChange={e => convert(e.target.value, 'krw')}
                                                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', marginTop: 5 }}
                                                />
                                            </div>

                                            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginBottom: 20 }}>
                                                100 JPY ≈ {Math.round(rate * 100).toLocaleString()} KRW
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'speech' && (
                                    <div className="speech-view" style={{ padding: '16px' }}>
                                        <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '18px' }}>
                                            <MessageCircle size={20} color="var(--primary)" />
                                            일본어 필수 회화
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {trip.speechData.filter(item => item.category === 'basic').map(item => (
                                                <div
                                                    key={item.id}
                                                    className="glass-card"
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px 14px'
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.8 }}>{item.kor}</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.jp}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--primary)', opacity: 0.9 }}>{item.pron}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => speak(item.jp)}
                                                        style={{
                                                            background: 'var(--primary)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: 32,
                                                            height: 32,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: 'black'
                                                        }}
                                                    >
                                                        <Volume2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </main>

                            {/* Currency Logic Moved to Tab */}
                            {/* Removed FAB and Overlay Modal */}

                            {/* Bottom Sheet */}
                            <AnimatePresence>
                                {selectedPoint && (
                                    <>
                                        <motion.div
                                            className="bottom-sheet"
                                            initial={{ y: '100%' }}
                                            animate={{ y: 0 }}
                                            exit={{ y: '100%' }}
                                            style={{
                                                zIndex: 9999,
                                                position: 'absolute',
                                                top: bottomSheetTop,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                height: `calc(100% - ${bottomSheetTop})`,
                                                maxHeight: 'none',
                                                borderTopLeftRadius: '24px',
                                                borderTopRightRadius: '24px',
                                                background: 'var(--sheet-bg)',
                                                overflowY: 'auto',
                                                padding: '24px'
                                            }}
                                        >
                                            {/* Close Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('❌ X Button Clicked! Closing details...');
                                                    console.log('Current selectedPoint:', selectedPoint);
                                                    setSelectedPoint(null);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 16,
                                                    right: 16,
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    zIndex: 10,
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            >
                                                <X size={18} color="white" />
                                            </button>

                                            {/* Handle with hint */}
                                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                                <div className="handle" onClick={() => setSelectedPoint(null)} style={{ cursor: 'pointer' }} />
                                                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>아래로 밀어서 닫기</div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPoint.name}</h3>
                                                    <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedPoint.category.toUpperCase()}</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsEditingPoint(!isEditingPoint)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: isEditingPoint ? 'var(--primary)' : 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </div>


                                            {isEditingPoint ? (
                                                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>장소 이름</label>
                                                        <input
                                                            id="edit-name"
                                                            defaultValue={selectedPoint.name}
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>전화번호</label>
                                                        <input
                                                            id="edit-phone"
                                                            defaultValue={selectedPoint.phone || ''}
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>맵코드</label>
                                                        <input
                                                            id="edit-mapcode"
                                                            defaultValue={selectedPoint.mapcode || ''}
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                        <button
                                                            onClick={() => setIsEditingPoint(false)}
                                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 600 }}
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const name = (document.getElementById('edit-name') as HTMLInputElement).value;
                                                                const phone = (document.getElementById('edit-phone') as HTMLInputElement).value;
                                                                const mapcode = (document.getElementById('edit-mapcode') as HTMLInputElement).value;
                                                                savePointEdit(selectedPoint.id, { name, phone, mapcode });
                                                            }}
                                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: 800 }}
                                                        >
                                                            저장하기
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>

                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="primary-button"
                                                        style={{ background: 'var(--primary)', color: 'black', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}
                                                    >
                                                        <MapIcon size={18} /> 길찾기 (구글맵)
                                                    </a>
                                                    {selectedPoint.phone && (
                                                        <a href={`tel:${selectedPoint.phone}`} className="primary-button" style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                            <Phone size={18} /> 전화
                                                        </a>
                                                    )}
                                                    {selectedPoint.mapcode && (
                                                        <div className="glass-card" style={{ padding: '12px', textAlign: 'center', margin: 0 }}>
                                                            <div style={{ fontSize: '10px', opacity: 0.5 }}>맵코드</div>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPoint.mapcode}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="overview-section">
                                                <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>여행 팁</h4>
                                                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                                                    {selectedPoint.tips.map((tip, idx) => (<li key={idx}>{tip}</li>))}
                                                </ul>
                                            </div>

                                            {/* Linked Files Section */}
                                            <div className="overview-section" style={{ marginTop: 24 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>📎 관련 서류</h4>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}>
                                                        <Upload size={14} /> 추가
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedPoint.id)} />
                                                    </label>
                                                </div>

                                                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                                                    {customFiles.filter(f => f.linkedTo === selectedPoint.id).length === 0 ? (
                                                        <div style={{ padding: '12px', width: '100%', textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.1)', borderRadius: 12 }}>
                                                            등록된 서류가 없습니다.
                                                        </div>
                                                    ) : (
                                                        customFiles.filter(f => f.linkedTo === selectedPoint.id).map(f => (
                                                            <div key={f.id} style={{ minWidth: 100, width: 100, position: 'relative' }}>
                                                                <div
                                                                    style={{ width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', marginBottom: 4, cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                                                                >
                                                                    <img src={f.data} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                                                                <button
                                                                    onClick={(e) => deleteFile(f.id, e)}
                                                                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'white', cursor: 'pointer' }}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Local Conversation Section */}
                                            {(trip.speechData.some((s: SpeechItem) => s.category === selectedPoint.category) || selectedPoint.category === 'sightseeing') && (
                                                <div style={{ marginTop: 16 }}>
                                                    <button
                                                        onClick={() => setExpandedSection(expandedSection === 'localSpeech' ? null : 'localSpeech')}
                                                        style={{
                                                            width: '100%',
                                                            padding: '16px',
                                                            background: 'var(--glass-bg)',
                                                            borderRadius: '16px',
                                                            border: '1px solid var(--glass-border)',
                                                            color: 'var(--text-primary)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <MessageCircle size={18} color="var(--primary)" />
                                                            <span>현지 회화 (추천)</span>
                                                        </div>
                                                        {expandedSection === 'localSpeech' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>

                                                    {expandedSection === 'localSpeech' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden', marginTop: 8, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                                        >
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                {trip.speechData
                                                                    .filter(s => s.category === selectedPoint.category || (selectedPoint.category === 'sightseeing' && s.category === 'shopping'))
                                                                    .map(item => (
                                                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.kor}</div>
                                                                                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.jp} <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 500, marginLeft: 4 }}>{item.pron}</span></div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => speak(item.jp)}
                                                                                style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black' }}
                                                                            >
                                                                                <Volume2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Rating & Review Section Toggle */}
                                            <div style={{ marginTop: 16 }}>
                                                <button
                                                    onClick={() => setExpandedSection(expandedSection === 'review' ? null : 'review')}
                                                    style={{
                                                        width: '100%',
                                                        padding: '16px',
                                                        background: 'var(--glass-bg)',
                                                        borderRadius: '16px',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'var(--text-primary)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Star size={18} color={userReviews[selectedPoint.id]?.rating ? '#FFD700' : 'var(--text-secondary)'} fill={userReviews[selectedPoint.id]?.rating ? '#FFD700' : 'transparent'} />
                                                        <span>평가 및 리뷰</span>
                                                    </div>
                                                    {expandedSection === 'review' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>

                                                {expandedSection === 'review' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden', marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                                    >
                                                        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    size={24}
                                                                    fill={(userReviews[selectedPoint.id]?.rating || 0) >= star ? '#FFD700' : 'transparent'}
                                                                    color={(userReviews[selectedPoint.id]?.rating || 0) >= star ? '#FFD700' : 'var(--text-secondary)'}
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => updateReview(selectedPoint.id, star, userReviews[selectedPoint.id]?.text || '')}
                                                                />
                                                            ))}
                                                        </div>
                                                        <textarea
                                                            placeholder="이 장소에 대한 한줄평을 남겨주세요"
                                                            value={userReviews[selectedPoint.id]?.text || ''}
                                                            onChange={(e) => updateReview(selectedPoint.id, userReviews[selectedPoint.id]?.rating || 0, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                background: 'var(--input-bg)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                color: 'var(--text-primary)',
                                                                fontSize: '14px',
                                                                resize: 'none',
                                                                height: '80px'
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Private Log Section Toggle */}
                                            <div style={{ marginTop: 12 }}>
                                                <button
                                                    onClick={() => setExpandedSection(expandedSection === 'log' ? null : 'log')}
                                                    style={{
                                                        width: '100%',
                                                        padding: '16px',
                                                        background: 'var(--glass-bg)',
                                                        borderRadius: '16px',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'var(--text-primary)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Lock size={18} color={userLogs[selectedPoint.id] ? 'var(--primary)' : 'var(--text-secondary)'} />
                                                        <span>나만의 기록</span>
                                                    </div>
                                                    {expandedSection === 'log' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>

                                                {expandedSection === 'log' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden', marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                                    >
                                                        <textarea
                                                            placeholder="개인적인 메모나 기록을 남기세요..."
                                                            value={userLogs[selectedPoint.id] || ''}
                                                            onChange={(e) => updateLog(selectedPoint.id, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                background: 'var(--input-bg)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                color: 'var(--text-primary)',
                                                                fontSize: '14px',
                                                                resize: 'none',
                                                                height: '100px'
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>

                                            <button className="primary-button" style={{ width: '100%', marginTop: '20px', background: 'var(--input-bg)', color: 'var(--text-primary)' }} onClick={() => { setSelectedPoint(null); setIsEditingPoint(false); }}>닫기</button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </>


                {/* Planning Wizard Overlay */}

                <AnimatePresence>
                    {isPlanning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(30px)', zIndex: 5000000, display: 'flex', flexDirection: 'column', color: 'white' }}
                        >
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setIsPlanning(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 30px 60px', overflowY: 'auto' }}>
                                <div style={{ width: '100%', maxWidth: '700px', textAlign: 'center' }}>
                                    {plannerStep === 0 && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                            <div style={{ width: 120, height: 120, borderRadius: '40px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', color: 'black', boxShadow: '0 20px 50px rgba(0,212,255,0.4)', transform: 'rotate(-5deg)' }}>
                                                <Sparkles size={60} />
                                            </div>
                                            <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '16px' }}>프리미엄 AI 여행 설계</h1>
                                            <p style={{ opacity: 0.7, marginBottom: '48px', lineHeight: 1.6, fontSize: '19px' }}>당신의 취향을 분석하여 최적의 경로를 제안합니다.</p>
                                            <button onClick={() => setPlannerStep(1)} className="primary-button" style={{ padding: '20px 48px', fontSize: '20px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto' }}>설계 시작하기 <ArrowRight size={22} /></button>

                                            <button onClick={() => setIsPlanning(false)} style={{ marginTop: "24px", padding: "16px 32px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 600, cursor: "pointer", fontSize: "16px", margin: "0 auto", display: "flex", alignItems: "center" }}>취소하고 돌아가기</button>
                                        </motion.div>
                                    )}

                                    {plannerStep === 1 && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '800px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '20px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>언제, 어디로 떠나시나요?</h2>
                                            <p style={{ opacity: 0.6, marginBottom: '32px' }}>달력에서 여행 기간을 선택해 주세요.</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', textAlign: 'left' }}>
                                                {/* Destination & Info */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    {/* Title Input */}
                                                    <div className="glass-card" style={{ padding: '20px' }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', opacity: 0.8 }}>여행 제목</label>
                                                        <input
                                                            type="text"
                                                            placeholder="예: 우리가족 오사카 3박4일"
                                                            value={(plannerData as any).title || ''}
                                                            onChange={(e) => setPlannerData({ ...plannerData, title: e.target.value } as any)}
                                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
                                                        />
                                                    </div>

                                                    <div className="glass-card" style={{ padding: '20px' }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', opacity: 0.8 }}>여행 목적지</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                onClick={() => {
                                                                    if (plannerData.destination) {
                                                                        window.open(`https://www.google.com/maps/search/${encodeURIComponent(plannerData.destination)}`, '_blank');
                                                                    } else {
                                                                        alert('목적지를 먼저 입력해 주세요.');
                                                                    }
                                                                }}
                                                                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,212,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', color: 'var(--primary)', cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center' }}
                                                                title="주소 검색"
                                                            >
                                                                <MapPin size={18} />
                                                            </button>
                                                            <input
                                                                type="text"
                                                                placeholder="예: 일본 오사카, 제주도 등"
                                                                value={plannerData.destination}
                                                                onChange={(e) => setPlannerData({ ...plannerData, destination: e.target.value })}
                                                                style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="glass-card" style={{ padding: '20px', flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '15px', color: 'var(--primary)', opacity: 0.8 }}>선택된 일정</label>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ fontSize: '11px', opacity: 0.4, marginBottom: '4px' }}>시작일</div>
                                                                <div style={{ fontWeight: 800, fontSize: '18px' }}>{plannerData.startDate || '날짜 선택'}</div>
                                                            </div>
                                                            <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ fontSize: '11px', opacity: 0.4, marginBottom: '4px' }}>종료일</div>
                                                                <div style={{ fontWeight: 800, fontSize: '18px' }}>{plannerData.endDate || '날짜 선택'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Custom Calendar Grid */}
                                                <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                        <h3 style={{ fontSize: '17px', fontWeight: 800 }}>2026년 2월</h3>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '8px', cursor: 'pointer' }}>&lt;</button>
                                                            <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '8px', cursor: 'pointer' }}>&gt;</button>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                                                        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                                                            <div key={d} style={{ fontSize: '11px', fontWeight: 700, opacity: 0.3, marginBottom: '8px' }}>{d}</div>
                                                        ))}
                                                        {Array.from({ length: 28 }).map((_, i) => {
                                                            const day = i + 1;
                                                            const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                                            const isSelected = plannerData.startDate === dateStr || plannerData.endDate === dateStr;
                                                            const isInRange = plannerData.startDate && plannerData.endDate && dateStr > plannerData.startDate && dateStr < plannerData.endDate;

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => {
                                                                        if (!plannerData.startDate || (plannerData.startDate && plannerData.endDate)) {
                                                                            setPlannerData({ ...plannerData, startDate: dateStr, endDate: '' });
                                                                        } else {
                                                                            if (dateStr < plannerData.startDate) {
                                                                                setPlannerData({ ...plannerData, startDate: dateStr, endDate: plannerData.startDate });
                                                                            } else {
                                                                                setPlannerData({ ...plannerData, endDate: dateStr });
                                                                            }
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '10px 0',
                                                                        borderRadius: '10px',
                                                                        fontSize: '14px',
                                                                        fontWeight: (isSelected || isInRange) ? 800 : 500,
                                                                        cursor: 'pointer',
                                                                        background: isSelected ? 'var(--primary)' : isInRange ? 'rgba(0,212,255,0.15)' : 'transparent',
                                                                        color: isSelected ? 'black' : 'white',
                                                                        opacity: (day < 1) ? 0.2 : 1,
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    {day}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPlannerStep(2)}
                                                disabled={!plannerData.destination || !plannerData.startDate || !plannerData.endDate}
                                                style={{
                                                    width: '100%',
                                                    marginTop: '30px',
                                                    padding: '20px',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    background: (plannerData.destination && plannerData.startDate && plannerData.endDate) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                    color: (plannerData.destination && plannerData.startDate && plannerData.endDate) ? 'black' : 'rgba(255,255,255,0.3)',
                                                    fontWeight: 900,
                                                    fontSize: '18px',
                                                    cursor: (plannerData.destination && plannerData.startDate && plannerData.endDate) ? 'pointer' : 'not-allowed',
                                                    boxShadow: (plannerData.destination && plannerData.startDate && plannerData.endDate) ? '0 10px 30px rgba(0,212,255,0.3)' : 'none'
                                                }}
                                            >
                                                다음 단계로 (이동수단 선택)
                                            </button>

                                            <button onClick={() => setIsPlanning(false)} style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>취소하고 돌아가기</button>
                                        </motion.div>
                                    )}

                                    {plannerStep === 2 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '700px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 2 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 2 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px', textAlign: 'center' }}>어떻게 오시나요?</h2>

                                            {/* Transport Buttons Grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                                                {[
                                                    { id: 'plane', label: '비행기', icon: <Compass size={24} /> },
                                                    { id: 'ship', label: '배', icon: <Wind size={24} /> },
                                                    { id: 'car', label: '자차', icon: <Car size={24} /> },
                                                    { id: 'public', label: '대중교통', icon: <Bus size={24} /> }
                                                ].map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            const isCar = item.id === 'car';
                                                            setPlannerData({
                                                                ...plannerData,
                                                                travelMode: item.id as any,
                                                                // If switching to car, auto-fill entry point to 'Driving'
                                                                entryPoint: isCar ? 'Direct Driving' : '',
                                                                // Auto-fill departure from user profile if car and empty
                                                                departurePoint: (isCar && !plannerData.departurePoint && currentUser?.homeAddress)
                                                                    ? currentUser.homeAddress
                                                                    : plannerData.departurePoint
                                                            });
                                                        }}
                                                        style={{
                                                            padding: '16px', borderRadius: '16px',
                                                            border: plannerData.travelMode === item.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                                            background: plannerData.travelMode === item.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                            color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {item.icon}
                                                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Dynamic Form Area */}
                                            <div style={{ textAlign: 'left', marginBottom: '30px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                {/* Ticket Upload Simulation (Except Car) */}
                                                {plannerData.travelMode !== 'car' && (
                                                    <div
                                                        onClick={() => {
                                                            // Mocking Auto-fill
                                                            const mockData: any = {
                                                                plane: { departure: '인천국제공항', arrival: '나하 공항' },
                                                                ship: { departure: '부산항 국제여객터미널', arrival: '오사카 국제페리터미널' },
                                                                public: { departure: '서울역', arrival: '부산역' }
                                                            };
                                                            const data = mockData[plannerData.travelMode as string];
                                                            if (data) {
                                                                if (confirm(`'티켓_예매내역.pdf'를 업로드 하시겠습니까?\n(자동으로 정보를 입력합니다)`)) {
                                                                    setPlannerData({
                                                                        ...plannerData,
                                                                        departurePoint: data.departure,
                                                                        entryPoint: data.arrival
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            width: '100%', padding: '20px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '16px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', marginBottom: '25px',
                                                            background: 'rgba(255,255,255,0.02)'
                                                        }}
                                                    >
                                                        <Upload size={20} color="var(--primary)" />
                                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                                            {plannerData.travelMode === 'plane' ? 'e-티켓/항공권 업로드' : plannerData.travelMode === 'ship' ? '승선권 업로드' : '승차권/예매내역 업로드'}
                                                        </span>
                                                        <span style={{ fontSize: '12px', opacity: 0.5 }}>(자동 입력)</span>
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gap: '20px' }}>
                                                    {/* Field 1: Departure */}
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--primary)', opacity: 0.8 }}>
                                                            {plannerData.travelMode === 'plane' ? '출발 공항' :
                                                                plannerData.travelMode === 'ship' ? '출발 항구' :
                                                                    plannerData.travelMode === 'car' ? '출발지 (집 주소)' : '출발 터미널/역'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder={
                                                                plannerData.travelMode === 'plane' ? "예: 인천공항, 김포공항" :
                                                                    plannerData.travelMode === 'ship' ? "예: 부산항" :
                                                                        plannerData.travelMode === 'car' ? "예: 서울시 강남구..." : "예: 서울역, 고속버스터미널"
                                                            }
                                                            value={plannerData.departurePoint}
                                                            onChange={(e) => setPlannerData({ ...plannerData, departurePoint: e.target.value })}
                                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '15px' }}
                                                        />
                                                    </div>

                                                    {/* Field 2: Arrival (Hidden for Car) */}
                                                    {plannerData.travelMode !== 'car' && (
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--primary)', opacity: 0.8 }}>
                                                                {plannerData.travelMode === 'plane' ? '도착 공항' :
                                                                    plannerData.travelMode === 'ship' ? '도착 항구' : '도착 터미널/역'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder={
                                                                    plannerData.travelMode === 'plane' ? "예: 나하 공항, 간사이 공항" :
                                                                        plannerData.travelMode === 'ship' ? "예: 오오사카항" : "예: 강릉역, 속초터미널"
                                                                }
                                                                value={plannerData.entryPoint === 'Direct Driving' ? '' : plannerData.entryPoint}
                                                                onChange={(e) => setPlannerData({ ...plannerData, entryPoint: e.target.value })}
                                                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '15px' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(1)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전</button>
                                                <button
                                                    onClick={() => {
                                                        showToast("임시 저장되었습니다. 목록에서 언제든 이어서 작성하세요.");
                                                        setTimeout(() => setIsPlanning(false), 1500);
                                                    }}
                                                    style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                >
                                                    <Save size={18} /> 저장
                                                </button>
                                                <button
                                                    onClick={() => setPlannerStep(4)}
                                                    disabled={!plannerData.departurePoint || (!plannerData.entryPoint && plannerData.travelMode !== 'car')}
                                                    style={{
                                                        flex: 2, padding: '20px', borderRadius: '20px', border: 'none',
                                                        background: (plannerData.departurePoint && (plannerData.entryPoint || plannerData.travelMode === 'car')) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                        color: (plannerData.departurePoint && (plannerData.entryPoint || plannerData.travelMode === 'car')) ? 'black' : 'rgba(255,255,255,0.3)',
                                                        fontWeight: 800
                                                    }}
                                                >
                                                    다음 단계로
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3 (Theme) Skipped */}

                                    {plannerStep === 4 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '600px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 4 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 4 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px', textAlign: 'center' }}>누구와 함께 가시나요?</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                                                {[{ id: 'alone', label: '혼자서', icon: <User size={28} /> }, { id: 'couple', label: '연인과', icon: <Heart size={28} /> }, { id: 'friends', label: '친구와', icon: <Users size={28} /> }, { id: 'family', label: '가족과', icon: <Users size={28} /> }].map(item => (
                                                    <button key={item.id} onClick={() => setPlannerData({ ...plannerData, companion: item.id })} style={{ padding: '25px', borderRadius: '20px', border: plannerData.companion === item.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: plannerData.companion === item.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>{item.icon}<span style={{ fontWeight: 700 }}>{item.label}</span></button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(2)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전</button>
                                                <button
                                                    onClick={() => {
                                                        const draft = { step: plannerStep, data: plannerData, selectedIds: selectedPlaceIds, updated: Date.now() };
                                                        localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
                                                        showToast("작성 중인 내용이 저장되었습니다.");
                                                        setTimeout(() => setIsPlanning(false), 1000);
                                                    }}
                                                    style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                >
                                                    <Save size={18} /> 저장
                                                </button>
                                                <button onClick={() => setPlannerStep(5)} disabled={!plannerData.companion} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: plannerData.companion ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: plannerData.companion ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>다음 단계로</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 5 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '600px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 5 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 5 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px', textAlign: 'center' }}>현지 교통수단</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                                                {[{ id: 'rental', label: '렌터카 이용', icon: <Car size={28} /> }, { id: 'bus', label: '대중교통', icon: <Bus size={28} /> }, { id: 'taxi', label: '택시/투어', icon: <Compass size={28} /> }, { id: 'train', label: '도보/기타', icon: <User size={28} /> }].map(item => (
                                                    <button key={item.id} onClick={() => setPlannerData({ ...plannerData, transport: item.id })} style={{ padding: '25px', borderRadius: '20px', border: plannerData.transport === item.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: plannerData.transport === item.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>{item.icon}<span style={{ fontWeight: 700 }}>{item.label}</span></button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(4)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전</button>
                                                <button
                                                    onClick={() => {
                                                        const draft = { step: plannerStep, data: plannerData, selectedIds: selectedPlaceIds, updated: Date.now() };
                                                        localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
                                                        showToast("작성 중인 내용이 저장되었습니다.");
                                                        setTimeout(() => setIsPlanning(false), 1000);
                                                    }}
                                                    style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                >
                                                    <Save size={18} /> 저장
                                                </button>
                                                <button onClick={() => setPlannerStep(6)} disabled={!plannerData.transport} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: plannerData.transport ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: plannerData.transport ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>다음 단계로</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 6 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '600px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 6 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 6 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px', textAlign: 'center' }}>여행 페이스</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                                                {[{ id: 'slow', label: '여유롭게 (하루 2-3곳)', icon: <Clock size={24} /> }, { id: 'normal', label: '적당히 (하루 4-5곳)', icon: <Clock size={24} /> }, { id: 'fast', label: '빡빡하게 (하루 6곳+)', icon: <Clock size={24} /> }].map(item => (
                                                    <button key={item.id} onClick={() => setPlannerData({ ...plannerData, pace: item.id as any })} style={{ padding: '25px', borderRadius: '20px', border: plannerData.pace === item.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: plannerData.pace === item.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', alignItems: 'center', gap: 15 }}>{item.icon}<span style={{ fontWeight: 700 }}>{item.label}</span></button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(5)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전</button>
                                                <button
                                                    onClick={() => {
                                                        const draft = { step: plannerStep, data: plannerData, selectedIds: selectedPlaceIds, updated: Date.now() };
                                                        localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
                                                        showToast("작성 중인 내용이 저장되었습니다.");
                                                        setTimeout(() => setIsPlanning(false), 1000);
                                                    }}
                                                    style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                >
                                                    <Save size={18} /> 저장
                                                </button>
                                                <button onClick={() => {
                                                    setPlannerStep(7);
                                                    if (dynamicAttractions.length === 0) {
                                                        fetchAttractionsWithAI(plannerData.destination);
                                                    }
                                                }} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: 800 }}>장소 선택으로</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 7 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '900px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '30px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 7 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 7 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>{plannerData.destination}의 어디를 가고 싶으신가요?</h2>

                                            {isSearchingAttractions ? (
                                                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                                                    <Loader2 size={60} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 20px' }} />
                                                    <p style={{ opacity: 0.6 }}>AI가 {plannerData.destination}의 숨은 명소들을 찾고 있습니다...</p>
                                                </div>
                                            ) : dynamicAttractions.length === 0 ? (
                                                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                                    <p style={{ opacity: 0.6, marginBottom: '20px' }}>명소를 불러오지 못했습니다.</p>
                                                    <button onClick={() => fetchAttractionsWithAI(plannerData.destination)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 700 }}>다시 검색하기</button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Category Filter Tabs */}
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
                                                        {[
                                                            { id: 'all', label: '전체', icon: null },
                                                            { id: 'sightseeing', label: '관광명소', icon: <Camera size={16} /> },
                                                            { id: 'food', label: '식당/맛집', icon: <Utensils size={16} /> },
                                                            { id: 'cafe', label: '카페', icon: <Compass size={16} /> },
                                                        ].map(tab => (
                                                            <button
                                                                key={tab.id}
                                                                onClick={() => setAttractionCategoryFilter(tab.id as any)}
                                                                style={{
                                                                    padding: '10px 18px',
                                                                    borderRadius: '20px',
                                                                    border: 'none',
                                                                    background: attractionCategoryFilter === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                                    color: attractionCategoryFilter === tab.id ? 'black' : 'white',
                                                                    fontWeight: 700,
                                                                    fontSize: '14px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                {tab.icon} {tab.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const name = window.prompt("추가할 장소의 이름을 입력하세요:");
                                                            if (name) {
                                                                const newPlace = {
                                                                    id: `manual-${Date.now()}`,
                                                                    name: name,
                                                                    category: attractionCategoryFilter === 'all' ? 'sightseeing' : attractionCategoryFilter,
                                                                    desc: '사용자가 직접 추가한 장소',
                                                                    longDesc: '사용자가 직접 추가한 장소입니다.',
                                                                    rating: 0,
                                                                    reviewCount: 0,
                                                                    priceLevel: '',
                                                                    coordinates: { lat: 0, lng: 0 } // AI will try to fix this later or default
                                                                };
                                                                setDynamicAttractions(prev => [newPlace, ...prev]);
                                                                setSelectedPlaceIds(prev => [...prev, newPlace.id]);
                                                                showToast(`${name}이(가) 목록에 추가되고 선택되었습니다.`);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: '16px',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 6
                                                        }}
                                                    >
                                                        <MapPin size={16} /> 직접 장소 추가하기
                                                    </button>


                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px', maxHeight: '500px', overflowY: 'auto', padding: '10px', textAlign: 'left' }}>
                                                        {dynamicAttractions
                                                            .filter(item => attractionCategoryFilter === 'all' || item.category === attractionCategoryFilter)
                                                            .map(item => {
                                                                const isSelected = selectedPlaceIds.includes(item.id);
                                                                return (
                                                                    <div
                                                                        key={item.id}
                                                                        onClick={() => setActivePlannerDetail(item)}
                                                                        className="glass-card"
                                                                        style={{
                                                                            padding: '20px',
                                                                            borderRadius: '20px',
                                                                            border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                                                            background: isSelected ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                                            cursor: 'pointer',
                                                                            position: 'relative',
                                                                            transition: 'all 0.2s ease',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '12px'
                                                                        }}
                                                                    >
                                                                        {/* Header: Name & Selection Checkbox */}
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                                                                                    <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                                                                                        {item.category === 'food' ? '식당' : item.category === 'cafe' ? '카페' : '관광'}
                                                                                    </span>
                                                                                    {item.priceLevel && (
                                                                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                                            {item.priceLevel === 'Expensive' ? '💰💰💰' : item.priceLevel === 'Moderate' ? '💰💰' : '💰'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '4px', color: isSelected ? 'var(--primary)' : 'white' }}>{item.name}</div>
                                                                            </div>
                                                                            <div
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedPlaceIds(isSelected ? selectedPlaceIds.filter(id => id !== item.id) : [...selectedPlaceIds, item.id]);
                                                                                }}
                                                                                style={{
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    borderRadius: '50%',
                                                                                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    color: isSelected ? 'black' : 'transparent',
                                                                                    border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                                                                    flexShrink: 0,
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                <CheckCircle size={16} />
                                                                            </div>
                                                                        </div>

                                                                        {/* Rating */}
                                                                        {item.rating && (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#fbbf24', fontWeight: 700 }}>
                                                                                <Star size={14} fill="#fbbf24" /> {item.rating} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({item.reviewCount || '100+'})</span>
                                                                            </div>
                                                                        )}

                                                                        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4, opacity: 0.9 }}>
                                                                            {item.desc}
                                                                        </div>

                                                                        <div style={{ fontSize: '12px', opacity: 0.6, lineHeight: 1.5, textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                            {item.longDesc}
                                                                        </div>


                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </>
                                            )}

                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(6)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전</button>
                                                <button onClick={() => {
                                                    // If editing an existing trip, remove it from the trips list
                                                    if (tripToEdit) {
                                                        const updatedTrips = trips.filter(t => t.id !== tripToEdit.id);
                                                        setTrips(updatedTrips);
                                                        localStorage.setItem('trips_v1', JSON.stringify(updatedTrips));
                                                    }

                                                    const draft = {
                                                        step: plannerStep,
                                                        data: plannerData,
                                                        selectedIds: selectedPlaceIds,
                                                        updated: Date.now(),
                                                        isEdit: tripToEdit ? true : false,
                                                        originalTripId: tripToEdit?.id
                                                    };
                                                    localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
                                                    showToast("현재 선택한 장소들이 임시 저장되었습니다.");
                                                    setTripToEdit(null);
                                                    setTimeout(() => setIsPlanning(false), 1000);
                                                }} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Save size={18} /> 저장</button>
                                                <button onClick={() => setPlannerStep(7.5)} disabled={selectedPlaceIds.length === 0 || isSearchingAttractions} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '18px' }}>다음 단계로</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 7.5 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '800px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 7 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 7 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>어디서 주무시나요?</h2>
                                            <p style={{ opacity: 0.6, marginBottom: '32px', textAlign: 'center' }}>이미 예약한 숙소가 있다면 여러 개 등록할 수 있습니다.</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                                <div className="glass-card" style={{ padding: '30px', border: '2px dashed rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15, cursor: 'pointer' }} onClick={() => fetchHotelsWithAI(plannerData.destination)}>
                                                    <Sparkles size={32} color="var(--primary)" />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>AI 숙소 추천받기</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{plannerData.destination}의 인기 숙소를 추천합니다</div>
                                                    </div>
                                                </div>

                                                <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15, cursor: 'pointer' }} onClick={() => showToast("준비 중인 기능입니다.")}>
                                                    <Upload size={32} color="var(--primary)" />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '16px' }}>바우처/확약서 인식</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>이메일이나 PDF를 업로드하세요</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: 15, marginBottom: '30px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Hotel size={24} color="var(--primary)" />
                                                    <span style={{ fontWeight: 800 }}>직접 숙소 등록</span>
                                                </div>
                                                <input id="acc-name" type="text" placeholder="숙소 이름 (예: 힐튼 나하)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <input id="acc-start" type="date" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '12px' }} />
                                                    <input id="acc-end" type="date" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '12px' }} />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const name = (document.getElementById('acc-name') as HTMLInputElement).value;
                                                        const start = (document.getElementById('acc-start') as HTMLInputElement).value;
                                                        const end = (document.getElementById('acc-end') as HTMLInputElement).value;
                                                        if (!name || !start || !end) return alert('숙소 이름과 날짜를 모두 입력해 주세요.');
                                                        setPlannerData({ ...plannerData, accommodations: [...plannerData.accommodations, { name, startDate: start, endDate: end }] });
                                                        (document.getElementById('acc-name') as HTMLInputElement).value = '';
                                                        (document.getElementById('acc-start') as HTMLInputElement).value = '';
                                                        (document.getElementById('acc-end') as HTMLInputElement).value = '';
                                                    }}
                                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    숙소 추가하기
                                                </button>
                                            </div>

                                            {recommendedHotels.length > 0 && (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>AI 추천 숙소</h4>
                                                        <button onClick={() => setRecommendedHotels([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer' }}>닫기</button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                                        {recommendedHotels.map((h, i) => (
                                                            <div key={i} onClick={() => { const nameInput = document.getElementById('acc-name') as HTMLInputElement; if (nameInput) nameInput.value = h.name; showToast(`${h.name}를 선택했습니다. 날짜를 입력하고 추가 버튼을 누르세요.`); }} className="glass-card" style={{ minWidth: '200px', padding: '15px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                                                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>{h.name}</div>
                                                                <div style={{ fontSize: '11px', opacity: 0.6 }}>{h.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {plannerData.accommodations.length > 0 && (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '15px', paddingLeft: '5px' }}>등록된 숙소 리스트 ({plannerData.accommodations.length})</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {plannerData.accommodations.map((acc: any, idx: number) => (
                                                            <div key={idx} className="glass-card" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{acc.name}</div>
                                                                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{acc.startDate} ~ {acc.endDate}</div>
                                                                </div>
                                                                <button onClick={() => setPlannerData({ ...plannerData, accommodations: plannerData.accommodations.filter((_: any, i: number) => i !== idx) })} style={{ background: 'rgba(255,78,80,0.1)', border: 'none', color: '#ff4e50', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><X size={16} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(7)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전 (장소 수정)</button>
                                                <button onClick={() => { showToast("임시 저장되었습니다. 목록에서 언제든 이어서 작성하세요."); setTimeout(() => setIsPlanning(false), 1500); }} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Save size={18} /> 저장</button>
                                                <button onClick={() => setIsReviewModalOpen(true)} disabled={selectedPlaceIds.length === 0 || isSearchingAttractions} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '18px' }}>최종 검토 및 생성</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 8 && (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 8 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 8 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <Loader2 size={100} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '32px', display: 'block', margin: '0 auto' }} />
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, textAlign: 'center' }}>AI가 최적의 동선을 설계 중입니다...</h2>
                                            <p style={{ opacity: 0.6, marginTop: '16px', textAlign: 'center' }}>사용자의 취향과 명소 간의 실시간 거리를 분석하고 있습니다.</p>
                                        </motion.div>
                                    )}

                                    {plannerStep === 9 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>설계된 맞춤 코스 프리뷰</h2>
                                            <p style={{ opacity: 0.6, marginBottom: '32px', textAlign: 'center' }}>발행 전 마지막으로 코스를 확인해 주세요.</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                                                {dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id)).map((rec, i) => (
                                                    <div key={rec.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{i + 1}</div>
                                                        <div style={{ textAlign: 'left' }}>
                                                            <div style={{ fontWeight: 800, fontSize: '18px' }}>{rec.name}</div>
                                                            <div style={{ fontSize: '14px', opacity: 0.6 }}>{rec.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(7)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>장소 수정</button>
                                                <button onClick={() => {
                                                    if (!trip || !trip.points || trip.points.length === 0) {
                                                        showToast('여행 데이터가 충분히 생성되지 않았습니다. 다시 시도해 주세요.');
                                                        return;
                                                    }
                                                    const publishedTrip = {
                                                        ...trip,
                                                        title: trip.metadata.title,
                                                        period: trip.metadata.period,
                                                        destination: trip.metadata.destination,
                                                        color: trip.metadata.primaryColor || '#00d4ff',
                                                        id: `trip-${Date.now()}`,
                                                        progress: 0
                                                    };
                                                    setTrips(prevTrips => [publishedTrip, ...prevTrips]);
                                                    localStorage.removeItem('trip_draft_v1');
                                                    setIsPlanning(false);
                                                    setPlannerStep(0);
                                                    setView('landing');
                                                    showToast('여행 가이드 발행이 완료되었습니다! 목록에서 확인해 보세요.');
                                                }} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: 900, fontSize: '18px' }}>가이드 발행하기</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>


                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Attraction Detail Modal */}
                <AnimatePresence>
                    {activePlannerDetail && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 6000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                            onClick={() => setActivePlannerDetail(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                                className="glass-card"
                                style={{ width: '100%', maxWidth: '800px', height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.15)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{ padding: '40px 40px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button onClick={() => setActivePlannerDetail(null)} style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', zIndex: 10 }}><X size={24} /></button>
                                    <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>ATTRACTION REPORT</div>
                                    <h3 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>{activePlannerDetail.name}</h3>
                                    <p style={{ fontSize: '18px', opacity: 0.7, fontWeight: 500 }}>{activePlannerDetail.desc}</p>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><FileText size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>장소 개요</h4></div>
                                        <p style={{ lineHeight: 1.8, fontSize: '16px', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{activePlannerDetail.longDesc}</p>
                                    </section>
                                    {activePlannerDetail.history && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><Clock size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>역사와 유래</h4></div>
                                            <p style={{ lineHeight: 1.8, fontSize: '16px', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{activePlannerDetail.history}</p>
                                        </section>
                                    )}
                                    {activePlannerDetail.attractions && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><Camera size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>주요 볼거리</h4></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {activePlannerDetail.attractions.map((item: string, i: number) => (
                                                    <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '3px solid var(--primary)', fontSize: '15px', lineHeight: 1.6 }}>{item}</div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    <section style={{ padding: '24px', background: 'rgba(0,212,255,0.05)', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '12px' }}><MapPin size={20} color="var(--primary)" /><h4 style={{ fontSize: '18px', fontWeight: 800 }}>찾아가는 법</h4></div>
                                        <p style={{ fontSize: '15px', opacity: 0.8 }}>{activePlannerDetail.access}</p>
                                    </section>
                                </div>
                                <div style={{ padding: '30px 40px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <a href={activePlannerDetail.link} target="_blank" rel="noreferrer" style={{ padding: '18px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><ExternalLink size={20} /></a>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activePlannerDetail.name)}`, '_blank')}
                                        style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#3b82f6', color: 'white', fontWeight: 900, border: 'none', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        <Search size={18} /> 구글 검색
                                    </button>
                                    <button
                                        onClick={() => window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(activePlannerDetail.name)}`, '_blank')}
                                        style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#03C75A', color: 'white', fontWeight: 900, border: 'none', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        <Search size={18} /> 네이버 검색
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {view === 'debug' && (
                    <motion.div
                        key="debug"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="overview-content"
                        style={{ padding: '20px', height: '100%', overflowY: 'auto', background: '#0f172a' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ color: 'var(--primary)', margin: 0 }}>Storage Debugger</h1>
                            <button onClick={() => setView('landing')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>돌아가기</button>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <button onClick={() => { if (window.confirm('초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#ff4e50', color: 'white', border: 'none' }}>전체 초기화</button>
                            <button onClick={() => window.location.reload()} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'black', border: 'none' }}>새로고침</button>
                        </div>
                        <section style={{ marginBottom: 30 }}>
                            <h3 style={{ color: 'white' }}>user_trips_v2</h3>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, overflowX: 'auto', fontSize: 12, color: '#10b981' }}>{JSON.stringify(JSON.parse(localStorage.getItem('user_trips_v2') || '[]'), null, 2)}</pre>
                        </section>
                    </motion.div>
                )}

                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
                            style={{ position: 'fixed', top: '50%', left: '50%', background: 'rgba(20, 20, 30, 0.95)', backdropFilter: 'blur(16px)', color: 'white', padding: '32px 48px', borderRadius: '24px', zIndex: 7000000, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}
                        >
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 20px' }}><CheckCircle size={32} /></div>
                            <div style={{ fontWeight: 800, fontSize: '18px' }}>저장 완료!</div>
                            <div style={{ opacity: 0.8, marginTop: 4 }}>{toast.message}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Re-Edit Confirmation Modal */}
            {isReEditModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9000000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ width: '100%', maxWidth: '450px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                    >
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Edit3 size={30} />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '12px', color: 'white' }}>경로를 재설정하시겠습니까?</h2>
                        <p style={{ opacity: 0.7, marginBottom: '32px', lineHeight: 1.6, fontSize: '15px' }}>
                            선택하신 여행의 장소 선택 단계로 이동합니다.<br />
                            기존 동선 순서는 초기화되며, AI가 새로운 최적 경로를 제안합니다.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIsReEditModalOpen(false)}
                                style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (tripToEdit) {
                                        setPlannerData({
                                            title: tripToEdit.metadata.title,
                                            destination: tripToEdit.metadata.destination,
                                            startDate: tripToEdit.metadata.startDate,
                                            endDate: tripToEdit.metadata.endDate,
                                            arrivalTime: '10:00',
                                            departureTime: '18:00',
                                            departurePoint: '',
                                            entryPoint: '',
                                            travelMode: 'plane',
                                            companion: '',
                                            transport: tripToEdit.metadata.useRentalCar ? 'rental' : 'bus', // Simplification
                                            pace: 'standard',
                                            accommodations: tripToEdit.metadata.accommodations || []
                                        });

                                        // Load existing places from the trip into dynamicAttractions
                                        const existingPlaces = tripToEdit.points.map((p: any) => ({
                                            id: p.id,
                                            name: p.name,
                                            category: p.category || 'attraction',
                                            desc: p.description || p.desc || '',
                                            longDesc: p.longDesc || p.description || '',
                                            rating: p.rating,
                                            reviewCount: p.reviewCount,
                                            priceLevel: p.priceLevel || '',
                                            coordinates: p.coordinates || { lat: 0, lng: 0 },
                                            link: p.link || '',
                                            access: p.access || '',
                                            history: p.history || '',
                                            attractions: p.attractions || []
                                        }));

                                        setDynamicAttractions(existingPlaces);

                                        const existingIds = tripToEdit.points.map((p: any) => p.id);
                                        setSelectedPlaceIds(existingIds);
                                        setAttractionCategoryFilter('all'); // Request: Default to 'all'

                                        // Fetch additional attractions if needed
                                        fetchAttractionsWithAI(tripToEdit.metadata.destination);

                                        setIsPlanning(true);
                                        setPlannerStep(7);
                                        setIsReEditModalOpen(false);
                                        // Keep tripToEdit for save logic
                                    }
                                }}
                                style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                            >
                                확인 및 수정
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 상세 정보 모달 (Review Modal) */}
            {isReviewModalOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(20, 20, 25, 0.95)', backdropFilter: 'blur(20px)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                >
                    <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', textAlign: 'left' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CheckCircle color="var(--primary)" size={32} /> 경로 검토 및 요청
                        </h2>

                        {(() => {
                            const start = new Date(plannerData.startDate);
                            const end = new Date(plannerData.endDate);
                            const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
                            const placeCount = selectedPlaceIds.length;
                            let minPerDay = 3; let maxPerDay = 6;
                            if (plannerData.pace === 'slow') { minPerDay = 1; maxPerDay = 3; }
                            if (plannerData.pace === 'fast') { minPerDay = 5; maxPerDay = 8; }
                            const minTotal = Math.floor(days * minPerDay);
                            const maxTotal = Math.ceil(days * maxPerDay);
                            let color = '#4ade80'; let msg = '여행 기간과 선택한 장소의 비율이 적절합니다!'; let subMsg = 'AI가 최적의 동선을 짤 수 있습니다.';
                            if (placeCount < minTotal) { color = '#fbbf24'; msg = `여행 기간(${days}일)에 비해 장소가 조금 부족해 보여요.`; subMsg = `(${minTotal}곳 이상 권장, 현재 ${placeCount}곳) 남는 시간은 어떻게 보낼까요?`; }
                            else if (placeCount > maxTotal) { color = '#f87171'; msg = `여행 기간(${days}일)에 비해 장소가 너무 많습니다.`; subMsg = `(${maxTotal}곳 이하 권장, 현재 ${placeCount}곳) 일부 장소는 제외될 수 있습니다.`; }

                            return (
                                <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '16px', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', gap: '16px' }}>
                                    <div style={{ width: 4, background: color, borderRadius: '4px' }} />
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '18px', color: color, marginBottom: '4px' }}>{msg}</div>
                                        <div style={{ fontSize: '14px', opacity: 0.8 }}>{subMsg}</div>
                                    </div>
                                </div>
                            );
                        })()}

                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>AI에게 특별히 요청할 사항이 있나요?</label>
                        <textarea
                            placeholder="예: 맛집 위주로 짜줘 등..."
                            value={customAiPrompt}
                            onChange={(e) => setCustomAiPrompt(e.target.value)}
                            style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '15px', resize: 'none', marginBottom: '32px' }}
                        />

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                            <button onClick={() => { setIsReviewModalOpen(false); generatePlanWithAI(); }} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'black', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Sparkles size={20} /> AI 코스 생성 시작</button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal.isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            width: '100%', maxWidth: '420px',
                            background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '24px',
                            padding: '32px',
                            textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <div style={{
                            width: 60, height: 60,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            border: '2px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            <Trash2 size={28} />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '12px', color: 'white' }}>
                            {deleteConfirmModal.title}
                        </h2>
                        <p style={{ opacity: 0.7, marginBottom: '32px', lineHeight: 1.6, fontSize: '15px', color: '#cbd5e1' }}>
                            {deleteConfirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } })}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={deleteConfirmModal.onConfirm}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </ErrorBoundary >
    );
};

export default App;
