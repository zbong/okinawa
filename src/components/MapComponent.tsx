import React, { useEffect, useRef, useState } from 'react';
import { LocationPoint } from '../types';

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
        if (!isMapLoaded || !mapRef.current || !window.google) return;

        const initMap = async () => {
            try {
                if (!googleMapRef.current) {
                    const { Map } = await window.google.maps.importLibrary("maps") as any;
                    const { DirectionsRenderer } = await window.google.maps.importLibrary("routes") as any;

                    const initialCenter = (points && points.length > 0 && points[0].coordinates)
                        ? { lat: Number(points[0].coordinates.lat), lng: Number(points[0].coordinates.lng) }
                        : { lat: 26.2124, lng: 127.6809 };

                    googleMapRef.current = new Map(mapRef.current, {
                        center: initialCenter,
                        zoom: 11,
                        disableDefaultUI: true,
                        zoomControl: true,
                        styles: [
                            {
                                "featureType": "all",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#ffffff" }]
                            },
                            {
                                "featureType": "all",
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#000000" }, { "lightness": 13 }]
                            },
                            {
                                "featureType": "administrative",
                                "elementType": "geometry.fill",
                                "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
                            },
                            {
                                "featureType": "landscape",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#0f172a" }, { "lightness": 17 }]
                            }
                        ]
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
                setMapError("지도 초기화 중 오류가 발생했습니다.");
            }
        };

        initMap();
    }, [isMapLoaded]);

    useEffect(() => {
        if (!isMapInstanceReady || !googleMapRef.current || !window.google) return;

        let isMounted = true;

        const updateMap = async () => {
            const validPoints = (points || []).filter(p => {
                const lat = Number(p?.coordinates?.lat);
                const lng = Number(p?.coordinates?.lng);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            if (markersRef.current) {
                markersRef.current.forEach(m => { try { if (m) m.setMap(null); } catch (e) { } });
                markersRef.current = [];
            }

            try {
                if (!isMounted) return;

                const { Marker } = await window.google.maps.importLibrary("marker") as any;
                const { LatLngBounds } = await window.google.maps.importLibrary("core") as any;
                const bounds = new LatLngBounds();

                validPoints.forEach((p, i) => {
                    const position = { lat: Number(p.coordinates.lat), lng: Number(p.coordinates.lng) };
                    const isSelected = p.id === selectedPoint?.id;

                    const marker = new Marker({
                        position,
                        map: googleMapRef.current,
                        zIndex: isSelected ? 999 : 1,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 12 : 8,
                            fillColor: isSelected ? '#ffffff' : '#3b82f6',
                            fillOpacity: 1,
                            strokeColor: isSelected ? '#3b82f6' : '#ffffff',
                            strokeWeight: 3,
                        }
                    });

                    marker.addListener('click', () => onPointClick(p));
                    markersRef.current.push(marker);
                    bounds.extend(position);
                });

                if (validPoints.length > 0) {
                    googleMapRef.current.fitBounds(bounds);
                }
            } catch (e) {
                console.error("Error updating map:", e);
            }
        };

        updateMap();

        return () => { isMounted = false; };
    }, [points, selectedPoint, onPointClick, isMapInstanceReady]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            {(!isMapLoaded || mapError) && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: mapError ? '#ef4444' : '#94a3b8', zIndex: 10
                }}>
                    {mapError || "지도를 불러오는 중..."}
                </div>
            )}
        </div>
    );
};

export default MapComponent;
