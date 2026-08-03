'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // Center of India
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 16;

// Create custom SVG marker icon matching FoodOps theme (Emerald)
const emeraldIcon = L.icon({
  iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="36" height="36">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `)}`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export interface SelectedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

interface LeafletLocationPickerProps {
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelected: (location: SelectedLocation) => void;
  onCancel: () => void;
  title?: string;
}

interface SearchPrediction {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LeafletLocationPicker({
  initialAddress,
  initialLatitude,
  initialLongitude,
  onLocationSelected,
  onCancel,
  title = 'Select Location',
}: LeafletLocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialLatitude && initialLongitude ? [initialLatitude, initialLongitude] : null
  );
  const [address, setAddress] = useState(initialAddress || '');
  const [searchValue, setSearchValue] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<SearchPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reverse Geocoding via OSM Nominatim
  const updateCoordinatesAndAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        {
          headers: {
            'User-Agent': 'FoodOps-Hackathon-MVP/1.0',
          },
        }
      );
      if (!res.ok) throw new Error('Network failure');
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        setSearchValue(data.display_name);
      } else {
        throw new Error('No address found');
      }
    } catch {
      const fallback = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallback);
      setSearchValue(fallback);
    }
  }, []);

  const bindMarkerEvents = useCallback((marker: L.Marker) => {
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateCoordinatesAndAddress(pos.lat, pos.lng);
    });
  }, [updateCoordinatesAndAddress]);

  const updateMarker = useCallback((lat: number, lng: number, fetchAddress: boolean) => {
    if (!mapRef.current) return;

    setMarkerPosition([lat, lng]);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: emeraldIcon,
        draggable: true,
      }).addTo(mapRef.current);
      
      markerRef.current = marker;
      bindMarkerEvents(marker);
    }

    if (fetchAddress) {
      updateCoordinatesAndAddress(lat, lng);
    }
  }, [bindMarkerEvents, updateCoordinatesAndAddress]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Only init once

    const initialCenter = initialLatitude && initialLongitude 
      ? [initialLatitude, initialLongitude] as [number, number]
      : DEFAULT_CENTER;

    const initialZoom = initialLatitude && initialLongitude ? SELECTED_ZOOM : DEFAULT_ZOOM;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // Position custom zoom control on the right
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    // Create marker if we have initial coordinates
    if (initialLatitude && initialLongitude) {
      const marker = L.marker([initialLatitude, initialLongitude], {
        icon: emeraldIcon,
        draggable: true,
      }).addTo(map);
      
      markerRef.current = marker;
      bindMarkerEvents(marker);
    }

    // Map click handler to drop/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng, true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLatitude, initialLongitude, bindMarkerEvents, updateMarker]);

  // Forward Geocoding Search via OSM Nominatim
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&countrycodes=in&limit=5&accept-language=en`,
          {
            headers: {
              'User-Agent': 'FoodOps-Hackathon-MVP/1.0',
            },
          }
        );
        if (res.ok) {
          const data: SearchPrediction[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error('OSM Nominatim search error:', err);
      }
    }, 400);
  };

  const handleSuggestionSelect = (s: SearchPrediction) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);

    setAddress(s.display_name);
    setSearchValue(s.display_name);
    setMarkerPosition([lat, lng]);
    setShowSuggestions(false);
    setSuggestions([]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], SELECTED_ZOOM);
    }

    updateMarker(lat, lng, false);
  };

  const handleConfirm = () => {
    if (!markerPosition || !address) return;
    onLocationSelected({
      address,
      latitude: markerPosition[0],
      longitude: markerPosition[1],
    });
  };

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Click outside suggestions list to close it
  useEffect(() => {
    const handler = () => setShowSuggestions(false);
    if (showSuggestions) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handler);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handler);
      };
    }
  }, [showSuggestions]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden" style={{ height: 'min(90vh, 700px)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">📍 {title}</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input and Auto-complete dropdown */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0 relative z-[2000]">
          <input
            type="text"
            placeholder="Search address, landmark, area or city..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">Search for an address in India, or tap the map directly to drop a pin.</p>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-6 right-6 top-[54px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[2500] max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors"
                  onClick={() => handleSuggestionSelect(s)}
                >
                  <span className="font-semibold block truncate">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Area */}
        <div ref={mapContainerRef} className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-950 relative z-10" style={{ minHeight: '300px' }} />

        {/* Footer info & confirmations */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex-shrink-0">
          {markerPosition && address ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-grow min-w-0">
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Confirmed Coordinates</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{address}</p>
                <p className="text-[11px] text-zinc-400 font-mono">{markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <button onClick={onCancel} className="flex-1 sm:flex-none px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                <button onClick={handleConfirm} className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">✓ Confirm Location</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">Please search or tap the map to place a pin.</p>
              <button onClick={onCancel} className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
