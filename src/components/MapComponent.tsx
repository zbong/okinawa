
import React, { useEffect, useRef } from 'react';
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

    // Initialize Map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

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

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Add new markers
        points.forEach(p => {
            const marker = L.marker([p.coordinates.lat, p.coordinates.lng])
                .addTo(map)
                .on('click', () => onPointClick(p));

            // Simple popup or tooltip
            marker.bindPopup(`<b>${p.name}</b>`);

            markersRef.current.push(marker);

            // If this is the selected point, open popup
            if (selectedPoint && selectedPoint.id === p.id) {
                marker.openPopup();
            }
        });

    }, [points, selectedPoint, onPointClick]);

    // Handle Selection & Auto-pan
    useEffect(() => {
        if (!mapRef.current || !selectedPoint) return;

        const map = mapRef.current;
        map.setView([selectedPoint.coordinates.lat, selectedPoint.coordinates.lng], 13, {
            animate: true
        });

    }, [selectedPoint]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
};

export default MapComponent;
