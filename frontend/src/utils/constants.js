// ============================================
// ChargeIQ NG — Constants & Configuration
// ============================================

/** Status → color mapping (hex) */
export const STATUS_COLORS = {
  AVAILABLE: '#34d399',
  IN_USE: '#fbbf24',
  OFFLINE: '#f87171',
  MAINTENANCE: '#6b7280',
};

/** Status → human-readable label */
export const STATUS_LABELS = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Maintenance',
};

/** Supported connector types */
export const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'Type 2'];

/** Power level thresholds (kW) */
export const POWER_LEVELS = {
  FAST: 50,
  STANDARD: 22,
};

/** MapLibre dark basemap (free, no API key) */
export const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/** Default map center — Lagos [lng, lat] for MapLibre */
export const DEFAULT_CENTER = [3.3792, 6.5244];

/** Default zoom level */
export const DEFAULT_ZOOM = 11;
