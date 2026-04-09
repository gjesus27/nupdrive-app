import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface TrackingMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapPoint[];
  route?: [number, number][];
  currentPosition?: [number, number];
  height?: string;
  className?: string;
}

export function TrackingMap({
  center = [-23.5505, -46.6333],
  zoom = 13,
  markers = [],
  route = [],
  currentPosition,
  height = '300px',
  className = '',
}: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);
  const currentRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    markers.forEach(({ lat, lng, label, color }) => {
      const icon = color ? L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }) : undefined;

      const m = L.marker([lat, lng], icon ? { icon } : {}).addTo(mapRef.current!);
      if (label) m.bindPopup(label);
      markersRef.current.push(m);
    });
  }, [markers]);

  // Update route
  useEffect(() => {
    if (!mapRef.current) return;
    routeRef.current?.remove();

    if (route.length > 1) {
      routeRef.current = L.polyline(route, {
        color: '#7c3aed',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeRef.current.getBounds(), { padding: [30, 30] });
    }
  }, [route]);

  // Update current position
  useEffect(() => {
    if (!mapRef.current) return;
    currentRef.current?.remove();

    if (currentPosition) {
      const icon = L.divIcon({
        className: 'current-position',
        html: `<div style="background:#7c3aed;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(124,58,237,0.5);animation:pulse 2s infinite"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      currentRef.current = L.marker(currentPosition, { icon }).addTo(mapRef.current);
      currentRef.current.bindPopup('Posição atual');
    }
  }, [currentPosition]);

  return (
    <div
      ref={containerRef}
      style={{ height, zIndex: 0 }}
      className={`w-full rounded-xl overflow-hidden border ${className}`}
    />
  );
}
