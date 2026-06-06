import stationData from '../data/stations';

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || null;
const USE_MOCK = !API_URL;

let localStations = stationData.map((station) => ({
  ...station,
  connectors: station.connectors.map((connector) => ({ ...connector })),
}));

async function fetchApi(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getStations(filters = {}) {
  if (USE_MOCK) {
    let result = [...localStations];
    if (filters.city) result = result.filter(s => s.city.toLowerCase() === filters.city.toLowerCase());
    if (filters.area) result = result.filter(s => s.area.toLowerCase().includes(filters.area.toLowerCase()));
    if (filters.status) result = result.filter(s => s.status === filters.status.toUpperCase());
    if (filters.connectorType) {
      result = result.filter(s => s.connectors.some(c => c.type === filters.connectorType));
    }
    return result;
  }

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const res = await fetchApi(`/stations?${params}`);
  // Abdulsalam's Lambda wraps the array: { stations: [...], count: N }
  return Array.isArray(res) ? res : (res.stations || []);
}

export async function getStation(id) {
  if (USE_MOCK) return localStations.find(s => s.stationId === id) || null;
  return fetchApi(`/stations/${id}`);
}

export async function updateStationStatus(id, status, connectorId = null) {
  if (USE_MOCK) {
    const station = localStations.find(s => s.stationId === id);
    if (!station) throw new Error('Station not found');

    if (connectorId) {
      const conn = station.connectors.find(c => (c.id || c.connectorId) === connectorId);
      if (conn) conn.status = status;
    } else {
      station.connectors.forEach(c => { c.status = status; });
    }

    const statuses = station.connectors.map(c => c.status);
    if (statuses.every(s => s === 'OFFLINE')) station.status = 'OFFLINE';
    else if (statuses.every(s => s === 'MAINTENANCE')) station.status = 'MAINTENANCE';
    else if (statuses.some(s => s === 'AVAILABLE')) station.status = 'AVAILABLE';
    else station.status = 'IN_USE';

    station.availablePorts = station.connectors.filter(c => c.status === 'AVAILABLE').length;
    station.waitMinutes = station.status === 'AVAILABLE' ? 0 : (station.waitMinutes || 5);
    station.lastUpdated = new Date().toISOString();
    return { ...station, connectors: station.connectors.map(c => ({ ...c })) };
  }

  return fetchApi(`/stations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, connectorId }),
  });
}

export async function createStation(data) {
  if (USE_MOCK) {
    const newStation = {
      ...data,
      stationId: `st-${String(localStations.length + 1).padStart(3, '0')}`,
      rating: data.rating || 4.0,
      totalSessions: 0,
      availablePorts: (data.connectors || []).filter(c => c.status === 'AVAILABLE').length,
      totalPorts: (data.connectors || []).length,
      lastUpdated: new Date().toISOString(),
    };
    localStations.push(newStation);
    return newStation;
  }

  return fetchApi('/stations', { method: 'POST', body: JSON.stringify(data) });
}

export async function queryNL(query) {
  if (USE_MOCK) {
    return mockNLQuery(query);
  }
  try {
    const raw = await fetchApi('/query/nl', { method: 'POST', body: JSON.stringify({ query }) });
    // Abdulsalam's Lambda returns { response: "...", stations: [...] }
    // Ours returns { stationId, name, message } — handle both
    if (raw.stations && raw.stations.length > 0) {
      const best = raw.stations[0];
      return {
        stationId: best.stationId,
        name: best.name,
        message: raw.response || `I recommend ${best.name} in ${best.area || best.city}.`,
      };
    }
    return raw;
  } catch {
    return mockNLQuery(query);
  }
}

function mockNLQuery(query) {
  const q = query.toLowerCase();
  const scored = localStations.map(station => {
    let score = 0;
    const name = station.name.toLowerCase();
    const area = station.area.toLowerCase();
    const city = station.city.toLowerCase();

    if (name.includes(q) || q.includes(name)) score += 10;
    area.split(' ').forEach(word => { if (q.includes(word) && word.length > 2) score += 5; });
    if (q.includes(city)) score += 2;
    station.connectors.forEach(c => {
      if (q.includes(c.type.toLowerCase())) score += 3;
      if (q.includes('fast') && (c.power || 0) >= 50) score += 3;
    });
    const hasAvailable = station.connectors.some(c => c.status === 'AVAILABLE');
    if (hasAvailable) score += 4;
    if ((q.includes('free') || q.includes('available')) && hasAvailable) score += 5;
    return { station, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) {
    const fallback = localStations.find(s => s.status === 'AVAILABLE') || localStations[0];
    return {
      stationId: fallback.stationId,
      name: fallback.name,
      message: `I couldn't find an exact match, but I recommend ${fallback.name} in ${fallback.area}. It has ${fallback.availablePorts} connector(s) available.`,
    };
  }

  const s = best.station;
  const topConnector = s.connectors.find(c => c.status === 'AVAILABLE') || s.connectors[0];
  const wait = s.waitMinutes || 0;
  return {
    stationId: s.stationId,
    name: s.name,
    message: `Based on your request, I recommend ${s.name} in ${s.area}, ${s.city}. Currently ${s.availablePorts} of ${s.totalPorts} connectors available — ${topConnector.type} at ${topConnector.power}kW. ${wait > 0 ? `Estimated wait: ${wait} minutes.` : 'No wait — a connector is free now!'}`,
  };
}

export async function getHeatmapData() {
  if (USE_MOCK) {
    return { points: localStations.map(s => ({ lat: s.lat, lng: s.lng, weight: s.totalSessions || 0 })) };
  }
  return fetchApi('/analytics/heatmap');
}
