const ALS_API_KEY = import.meta.env.VITE_ALS_API_KEY;

// Decode HERE FlexiblePolyline → [[lng, lat], ...] for MapLibre
function decodeFlexiblePolyline(encoded) {
  const TABLE = new Array(128).fill(-1);
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    .split('').forEach((c, i) => { TABLE[c.charCodeAt(0)] = i; });

  let pos = 0;

  function nextVar() {
    let shift = 0, result = 0, val;
    do {
      val = TABLE[encoded.charCodeAt(pos++)];
      if (val < 0) throw new Error('bad char');
      result |= (val & 0x1f) << shift;
      shift += 5;
    } while (val & 0x20);
    return result;
  }

  function nextSigned() {
    const v = nextVar();
    return (v & 1) ? ~(v >> 1) : (v >> 1);
  }

  // Header: version then precision+dims packed value
  const version = nextVar();
  if (version !== 1) throw new Error(`Unsupported polyline version ${version}`);
  const headerVal = nextVar();
  const precision = headerVal & 0xf;
  const factor = Math.pow(10, precision);

  const coords = [];
  let lat = 0, lng = 0;
  while (pos < encoded.length) {
    lat += nextSigned();
    lng += nextSigned();
    coords.push([lng / factor, lat / factor]); // [lng, lat] for GeoJSON/MapLibre
  }
  return coords;
}

function extractCoordinates(legs) {
  return legs.flatMap(leg => {
    const geom = leg.Geometry ?? {};
    if (geom.LineString?.length) return geom.LineString;
    if (geom.Polyline) return decodeFlexiblePolyline(geom.Polyline);
    return [];
  });
}

export async function calculateRoute(originLat, originLng, destLat, destLng) {
  const res = await fetch(
    `https://routes.geo.us-east-1.amazonaws.com/v2/routes?key=${ALS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Origin: [originLng, originLat],
        Destination: [destLng, destLat],
        TravelMode: 'Car',
        LegGeometryFormat: 'Simple',
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    throw new Error(`ALS Routes ${res.status}: ${msg}`);
  }

  const data = await res.json();
  const legs = data.Routes?.[0]?.Legs ?? [];
  const coordinates = extractCoordinates(legs);
  const summary = data.Routes?.[0]?.Summary ?? {};

  if (!coordinates.length) throw new Error('Empty route returned');

  return {
    coordinates,
    distanceMeters: summary.Distance ?? 0,
    durationSeconds: summary.Duration ?? 0,
  };
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
