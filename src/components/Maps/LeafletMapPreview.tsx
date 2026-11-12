'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const emeraldIcon = L.icon({
  iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="30" height="30">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `)}`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

interface LeafletMapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string;
  height?: string;
}

export default function LeafletMapPreview({
  latitude,
  longitude,
  height = '180px',
}: LeafletMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        boxZoom: false,
        doubleClickZoom: false,
        dragging: false,
        keyboard: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], {
        icon: emeraldIcon,
      }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      mapRef.current.setView([latitude, longitude], 15);
      markerRef.current?.setLatLng([latitude, longitude]);
    }

    return () => {
      // In Next.js dev server, standard cleanups are good to avoid duplicate maps on hot reloading
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 relative z-10 ${height === '150px' ? 'h-[150px]' : 'h-[220px]'}`}
    />
  );
}
