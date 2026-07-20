'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Leaflet-based Map Preview with SSR disabled.
// This prevents server-side rendering errors on browser-only 'window' access in Leaflet.
const LeafletMapPreview = dynamic(
  () => import('./LeafletMapPreview'),
  { ssr: false }
);

export default LeafletMapPreview;
