'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Leaflet-based Location Picker with SSR disabled.
// This prevents server-side rendering errors on browser-only 'window' access in Leaflet.
const LeafletLocationPicker = dynamic(
  () => import('./LeafletLocationPicker'),
  { ssr: false }
);

export default LeafletLocationPicker;
export type { SelectedLocation } from './LeafletLocationPicker';
