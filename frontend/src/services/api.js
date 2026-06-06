import { stations as seedStations } from '../data/stations';

const API_URL = import.meta.env.VITE_API_URL || null;
const USE_MOCK = !API_URL;

let localStations = [...seedStations];

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
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.connectorType) {
      result = result.filter(s => s.connectors.some(c => c.type === filters.connectorType));
    }
    return result;
  }
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  return fetchApi(`/stations?${params}`);
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
      const conn = station.connectors.find(c => c.id === connectorId);
      if (conn) conn.status = status;
    } else {
      station.status = status;
      station.connectors.forEach(c => { c.status = status; });
    }
    station.availablePorts = station.connectors.filter(c => c.status === 'AVAILABLE').length;
    station.lastUpdated = new Date().toISOString();
    return { ...station };
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
      lastUpdated: new Date().toISOString(),
      totalSessions: 0,
      utilizationPercent: 0,
      rating: 4.0,
      totalPorts: data.connectors?.length || 0,
      availablePorts: data.connectors?.filter(c => c.status === 'AVAILABLE').length || 0,
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
    return await fetchApi('/query/nl', { method: 'POST', body: JSON.stringify({ query }) });
  } catch {
    return mockNLQuery(query);
  }
}

function mockNLQuery(query) {
  const q = query.toLowerCase();
  let scored = localStations.map(station => {
    let score = 0;
    const name = station.name.toLowerCase();
    const area = station.area.toLowerCase();
    const city = station.city.toLowerCase();

    if (name.includes(q) || q.includes(name)) score += 10;
    area.split(' ').forEach(word => { if (q.includes(word) && word.length > 2) score += 5; });
    if (q.includes(city)) score += 2;
    station.connectors.forEach(c => {
      if (q.includes(c.type.toLowerCase())) score += 3;
      if (q.includes('fast') && c.power >= 50) score += 3;
    });
    if (station.status === 'AVAILABLE') score += 4;
    if (q.includes('free') && station.status === 'AVAILABLE') score += 5;
    if (q.includes('available') && station.status === 'AVAILABLE') score += 5;
    return { station, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) {
    const available = localStations.filter(s => s.status === 'AVAILABLE');
    const fallback = available[0] || localStations[0];
    return {
      stationId: fallback.stationId,
      name: fallback.name,
      station: fallback,
      message: `I couldn't find an exact match, but I recommend ${fallback.name} in ${fallback.area}. It has ${fallback.availablePorts} ports available.`,
    };
  }

  const s = best.station;
  const topConnector = s.connectors.find(c => c.status === 'AVAILABLE') || s.connectors[0];
  return {
    stationId: s.stationId,
    name: s.name,
    station: s,
    message: `Based on your request, I recommend ${s.name} in ${s.area}, ${s.city}. It currently has ${s.availablePorts} of ${s.totalPorts} ports available with ${topConnector.type} charging at ${topConnector.power}kW. ${s.waitMinutes > 0 ? `Estimated wait: ${s.waitMinutes} minutes.` : 'No wait time — a port is free now!'}`,
  };
}

export async function getHeatmapData() {
  if (USE_MOCK) {
    return { points: localStations.map(s => ({ lat: s.lat, lng: s.lng, weight: s.totalSessions })) };
  }
  return fetchApi('/analytics/heatmap');
}
