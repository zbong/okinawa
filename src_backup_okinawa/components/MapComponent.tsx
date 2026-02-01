
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationPoint } from '../types';

// Fix for default marker icon issues in Leaflet with Webpack/Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    points: LocationPoint[];
    selectedPoint: LocationPoint | null;
    onPointClick: (p: LocationPoint) => void;
}

const MapComponent: React.FC<MapProps> = ({ points, selectedPoint, onPointClick }) => {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const mountedRef = useRef(true);

    // Initialize Map
    useEffect(() => {
        mountedRef.current = true;

        // Delay initialization slightly to ensure DOM is ready
        const initTimer = setTimeout(() => {
            if (!mountedRef.current) return;
            if (!containerRef.current) return;
            if (mapRef.current) return;

            try {
                console.log("Initializing Leaflet map...");

                // Initial view (Okinawa center approx)
                const map = L.map(containerRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([26.4839, 127.8118], 10);

                L.tileLayer('https://mt0.google.com/vt/lyrs=m&hl=ko&x={x}&y={y}&z={z}', {
                    maxZoom: 19,
                }).addTo(map);

                mapRef.current = map;
                setIsInitialized(true);
            } catch (e) {
                console.error("Error initializing map:", e);
            }
        }, 50);

        // Cleanup
        return () => {
            mountedRef.current = false;
            clearTimeout(initTimer);

            console.log("Cleaning up Leaflet map...");

            // Remove all markers first
            const markers = [...markersRef.current];
            markersRef.current = [];

            markers.forEach(marker => {
                try {
                    marker.off();
                    marker.remove();
                } catch (e) {
                    console.warn("Error removing marker:", e);
                }
            });

            // Remove the map
            const map = mapRef.current;
            if (map) {
                mapRef.current = null;

                try {
                    // Remove all layers
                    map.eachLayer((layer) => {
                        try {
                            map.removeLayer(layer);
                        } catch (e) {
                            console.warn("Error removing layer:", e);
                        }
                    });

                    // Clear all event listeners
                    map.off();

                    // Only call remove if container still exists
                    if (containerRef.current && containerRef.current.parentNode) {
                        map.remove();
                    }
                } catch (e) {
                    console.warn("Error during map cleanup:", e);
                }
            }

            setIsInitialized(false);
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (!isInitialized || !mapRef.current || !mountedRef.current) return;

        const map = mapRef.current;

        try {
            // Clear existing markers
            markersRef.current.forEach(m => {
                try {
                    m.off();
                    m.remove();
                } catch (e) {
                    console.warn("Error removing marker:", e);
                }
            });
            markersRef.current = [];

            // Add new markers
            points.forEach((p, index) => {
                if (!mountedRef.current) return;

                try {
                    // Create a custom numbered icon
                    const numberedIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `<span>${index + 1}</span>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                        popupAnchor: [0, -15]
                    });

                    const marker = L.marker([p.coordinates.lat, p.coordinates.lng], { icon: numberedIcon })
                        .addTo(map)
                        .on('click', () => {
                            if (mountedRef.current) {
                                onPointClick(p);
                            }
                        });

                    marker.bindTooltip(p.name, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10],
                        opacity: 0.9
                    });
                    markersRef.current.push(marker);
                } catch (e) {
                    console.warn("Error creating marker:", e);
                }
            });
        } catch (e) {
            console.error("Error updating markers:", e);
        }

    }, [points, selectedPoint, onPointClick, isInitialized]);

    // Handle Selection & Auto-pan
    useEffect(() => {
        if (!isInitialized || !mapRef.current || !selectedPoint || !mountedRef.current) return;

        try {
            const map = mapRef.current;
            map.setView([selectedPoint.coordinates.lat, selectedPoint.coordinates.lng], 13, {
                animate: true
            });
        } catch (e) {
            console.warn("Error panning to selected point:", e);
        }

    }, [selectedPoint, isInitialized]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
};

export default MapComponent;
