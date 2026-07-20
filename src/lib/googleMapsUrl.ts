/**
 * Build Google Maps navigation/direction URLs.
 */

export function buildGoogleMapsDirectionsUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string {
  const base = 'https://www.google.com/maps/dir/';

  if (origin) {
    return `${base}?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  }

  return `${base}?api=1&destination=${destination.lat},${destination.lng}`;
}

export function buildGoogleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
