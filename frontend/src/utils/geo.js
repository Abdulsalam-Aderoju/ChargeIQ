// ============================================
// ChargeIQ NG — Geospatial Utilities
// ============================================

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula.
 *
 * @param {number} lat1 — Latitude of point A (degrees)
 * @param {number} lng1 — Longitude of point A (degrees)
 * @param {number} lat2 — Latitude of point B (degrees)
 * @param {number} lng2 — Longitude of point B (degrees)
 * @returns {number} Distance in kilometres
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Compute the bounding box (south-west / north-east) for an array of stations.
 *
 * @param {Array<{lat: number, lng: number}>} stations
 * @returns {{ sw: [number, number], ne: [number, number] }}
 */
export function getBounds(stations) {
  if (!stations || stations.length === 0) {
    return {
      sw: [6.4, 3.2],
      ne: [6.7, 3.6],
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const s of stations) {
    if (s.lat < minLat) minLat = s.lat;
    if (s.lat > maxLat) maxLat = s.lat;
    if (s.lng < minLng) minLng = s.lng;
    if (s.lng > maxLng) maxLng = s.lng;
  }

  // Add a small padding (≈ 0.01° ≈ 1 km)
  const pad = 0.01;
  return {
    sw: [minLat - pad, minLng - pad],
    ne: [maxLat + pad, maxLng + pad],
  };
}

/**
 * Filter stations that fall within a given radius from a reference point.
 *
 * @param {Array<{lat: number, lng: number}>} stations
 * @param {number} lat — Reference latitude
 * @param {number} lng — Reference longitude
 * @param {number} radiusKm — Radius in kilometres
 * @returns {Array} Stations within the radius
 */
export function filterByRadius(stations, lat, lng, radiusKm) {
  return stations.filter(
    (s) => haversine(lat, lng, s.lat, s.lng) <= radiusKm
  );
}

/** Lagos geographic center */
export const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

/** Abuja geographic center */
export const ABUJA_CENTER = { lat: 9.0579, lng: 7.4951 };
