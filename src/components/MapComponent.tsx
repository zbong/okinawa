import React, { useEffect, useRef, useState } from 'react';
import { LocationPoint } from '../types';

interface MapComponentProps {
    points: LocationPoint[];
    selectedPoint: LocationPoint | null;
    onPointClick: (point: LocationPoint) => void;
    theme?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ points, selectedPoint, onPointClick, theme = 'dark' }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const directionsRendererRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const checkGoogle = () => {
            if (window.google && window.google.maps) {
                setIsMapLoaded(true);
                return true;
            }
            return false;
        };

        if (checkGoogle()) return;

        const interval = setInterval(() => {
            if (checkGoogle()) clearInterval(interval);
        }, 200);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            if (!window.google) {
                setMapError("Google Maps API 로딩 타임아웃");
            }
        }, 10000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    const [isMapInstanceReady, setIsMapInstanceReady] = useState(false);

    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || !window.google) return;

        const initMap = async () => {
            try {
                if (!googleMapRef.current) {
                    const { Map } = await window.google.maps.importLibrary("maps") as any;
                    const { DirectionsRenderer } = await window.google.maps.importLibrary("routes") as any;

                    const validInitialPoint = points.find(p => {
                        const lat = Number(p.coordinates?.lat);
                        const lng = Number(p.coordinates?.lng);
                        return !isNaN(lat) && !isNaN(lng) && lat !== 0;
                    });

                    const initialCenter = validInitialPoint
                        ? { lat: Number(validInitialPoint.coordinates.lat), lng: Number(validInitialPoint.coordinates.lng) }
                        : { lat: 26.2124, lng: 127.6809 };

                    googleMapRef.current = new Map(mapRef.current, {
                        center: initialCenter,
                        zoom: 12,
                        disableDefaultUI: true,
                        zoomControl: true,
                        styles: []
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
                setMapError("지도 초기화 오류");
            }
        };

        initMap();
    }, [isMapLoaded, theme]);

    const lastPointsRef = useRef<string>("");

    const markerMapRef = useRef<Map<string, any>>(new Map());
    const lastPointsKeyRef = useRef<string>("");
    const lastSelectedPointIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isMapInstanceReady || !googleMapRef.current || !window.google) return;

        const updateMap = async () => {
            const validPoints = (points || []).filter(p => {
                const lat = Number(p?.coordinates?.lat);
                const lng = Number(p?.coordinates?.lng);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            const currentPointsKey = JSON.stringify(validPoints.map(p => p.id));
            const pointsChanged = currentPointsKey !== lastPointsKeyRef.current;
            const selectionChanged = selectedPoint?.id !== lastSelectedPointIdRef.current;

            if (!pointsChanged && !selectionChanged) return;

            const Marker = window.google.maps.Marker;
            const bounds = new window.google.maps.LatLngBounds();

            // 1. If points changed, clear all and rebuild
            if (pointsChanged) {
                markerMapRef.current.forEach(m => m.setMap(null));
                markerMapRef.current.clear();

                validPoints.forEach((p) => {
                    const position = { lat: Number(p.coordinates.lat), lng: Number(p.coordinates.lng) };
                    const isSelected = p.id === selectedPoint?.id;

                    const marker = new Marker({
                        position,
                        map: googleMapRef.current,
                        zIndex: isSelected ? 999 : 1,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 12 : 8,
                            fillColor: isSelected ? '#ffffff' : '#4facfe',
                            fillOpacity: 1,
                            strokeColor: isSelected ? '#4facfe' : '#ffffff',
                            strokeWeight: 3,
                        }
                    });

                    marker.addListener('click', () => onPointClick(p));
                    markerMapRef.current.set(p.id, marker);
                    bounds.extend(position);
                });

                if (validPoints.length > 0) {
                    googleMapRef.current.fitBounds(bounds);
                }
                lastPointsKeyRef.current = currentPointsKey;
            }
            // 2. If only selection changed, just update icons to avoid flicker
            else if (selectionChanged) {
                validPoints.forEach(p => {
                    const marker = markerMapRef.current.get(p.id);
                    if (marker) {
                        const isSelected = p.id === selectedPoint?.id;
                        marker.setZIndex(isSelected ? 999 : 1);
                        marker.setIcon({
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 12 : 8,
                            fillColor: isSelected ? '#ffffff' : '#4facfe',
                            fillOpacity: 1,
                            strokeColor: isSelected ? '#4facfe' : '#ffffff',
                            strokeWeight: 3,
                        });
                    }
                });
            }

            lastSelectedPointIdRef.current = selectedPoint?.id || null;

            // 3. Clear and Draw Polyline (only if points changed)
            if (pointsChanged) {
                if (polylineRef.current) polylineRef.current.setMap(null);
                if (validPoints.length > 0) {
                    const path = validPoints.map(p => ({
                        lat: Number(p.coordinates.lat),
                        lng: Number(p.coordinates.lng)
                    }));

                    polylineRef.current = new window.google.maps.Polyline({
                        path: path,
                        geodesic: true,
                        strokeColor: '#4facfe',
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        map: googleMapRef.current
                    });
                }
            }

            // 4. If selected point changed, pan to it
            if (selectionChanged && selectedPoint?.coordinates) {
                const pos = { lat: Number(selectedPoint.coordinates.lat), lng: Number(selectedPoint.coordinates.lng) };
                if (!isNaN(pos.lat) && !isNaN(pos.lng) && pos.lat !== 0) {
                    googleMapRef.current.panTo(pos);
                }
            }
        };

        updateMap();
    }, [points, selectedPoint, onPointClick, isMapInstanceReady]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#1a1a1a' }}>
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
