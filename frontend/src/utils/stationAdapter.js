const CONNECTOR_TYPE_NORMALIZE = {
  'CCS': 'CCS',
  'CCS2': 'CCS',
  'Type2': 'Type 2',
  'Type 2': 'Type 2',
  'Type1': 'Type 1',
  'Type 1': 'Type 1',
  'CHAdeMO': 'CHAdeMO',
};

const CONNECTOR_TYPE_TO_API = {
  'CCS': 'CCS',
  'Type 2': 'Type2',
  'Type 1': 'Type1',
  'CHAdeMO': 'CHAdeMO',
};

const CONNECTOR_STATUS_TO_UI = {
  available: "AVAILABLE",
  occupied: "IN_USE",
  offline: "OFFLINE",
  maintenance: "MAINTENANCE",
};

const UI_STATUS_TO_CONNECTOR = {
  AVAILABLE: "available",
  IN_USE: "occupied",
  OFFLINE: "offline",
  MAINTENANCE: "maintenance",
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function deriveUiStatus(station) {
  const connectors = station.connectors || [];
  if (connectors.some((c) => c.status === "available")) return "AVAILABLE";
  if (connectors.length && connectors.every((c) => c.status === "offline")) return "OFFLINE";
  if (connectors.length && connectors.every((c) => c.status === "maintenance")) return "MAINTENANCE";
  return "IN_USE";
}

export function normalizeStation(station) {
  if (!station) return null;

  const connectors = (station.connectors || []).map((connector, index) => ({
    id: connector.id || connector.connectorId || `c${index + 1}`,
    connectorId: connector.connectorId || connector.id || String(index + 1),
    type: CONNECTOR_TYPE_NORMALIZE[connector.type] || connector.type,
    power: toNumber(connector.power ?? connector.powerKw),
    powerKw: String(connector.powerKw ?? connector.power ?? 0),
    status: CONNECTOR_STATUS_TO_UI[connector.status] || connector.status || "OFFLINE",
  }));

  const availablePorts = toNumber(station.availableConnectors ?? station.availablePorts);
  const totalPorts = toNumber(station.totalConnectors ?? station.totalPorts ?? connectors.length);
  const waitMinutes = station.waitTimeMinutes == null
    ? station.waitMinutes
    : toNumber(station.waitTimeMinutes);
  const totalSessions = toNumber(station.totalSessions24h ?? station.totalSessions);

  return {
    ...station,
    lat: toNumber(station.lat ?? station.location?.lat),
    lng: toNumber(station.lng ?? station.location?.lng),
    operatorName: station.operatorName || station.operator || "",
    connectors,
    status: station.status && station.status !== "active" ? station.status : deriveUiStatus(station),
    waitMinutes,
    totalPorts,
    availablePorts,
    totalSessions,
    utilizationPercent: station.utilizationPercent ?? Math.min(100, totalSessions * 4),
    rating: toNumber(station.rating, 0),
    lastUpdated: station.updatedAt || station.lastUpdated || new Date().toISOString(),
  };
}

export function normalizeStations(stations) {
  return (stations || []).map(normalizeStation).filter(Boolean);
}

export function toApiStation(station) {
  const connectors = (station.connectors || []).map((connector, index) => ({
    connectorId: connector.connectorId || connector.id || String(index + 1),
    type: CONNECTOR_TYPE_TO_API[connector.type] || connector.type,
    powerKw: String(connector.powerKw ?? connector.power ?? 0),
    status: UI_STATUS_TO_CONNECTOR[connector.status] || connector.status || "offline",
  }));

  const availableConnectors = connectors.filter((c) => c.status === "available").length;

  return {
    stationId: station.stationId,
    name: station.name,
    operator: station.operator || station.operatorName || "",
    area: station.area || "",
    city: station.city || "Lagos",
    address: station.address || "",
    location: {
      lat: toNumber(station.location?.lat ?? station.lat),
      lng: toNumber(station.location?.lng ?? station.lng),
    },
    connectors,
    status: station.status === "inactive" ? "inactive" : "active",
    availableConnectors: String(availableConnectors),
    totalConnectors: String(connectors.length),
    waitTimeMinutes: String(station.waitTimeMinutes ?? station.waitMinutes ?? 0),
    totalSessions24h: String(station.totalSessions24h ?? station.totalSessions ?? 0),
    rating: String(station.rating ?? "4.0"),
    updatedAt: station.updatedAt || station.lastUpdated || new Date().toISOString(),
  };
}

export function toConnectorApiStatus(status) {
  return UI_STATUS_TO_CONNECTOR[status] || status;
}
