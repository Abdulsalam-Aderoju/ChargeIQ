import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStations, updateStationStatus, createStation } from '../services/api';
import { subscribeToUpdates } from '../services/realtime';
import { normalizeStations, normalizeStation } from '../utils/stationAdapter';
import { haversine } from '../utils/geo';

export function useStations() {
  const [stations, setStations] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStations();
      setStations(normalizeStations(data));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStations(); }, [loadStations]);

  useEffect(() => {
    if (stations.length === 0) return;
    const unsub = subscribeToUpdates(stations, (updated) => {
      const normalized = normalizeStation(updated);
      setStations(prev => prev.map(s =>
        s.stationId === normalized.stationId ? { ...s, ...normalized } : s
      ));
    });
    return unsub;
  }, [stations.length]);

  const filteredStations = useMemo(() => {
    let result = [...stations];

    if (filters.connectorType) {
      result = result.filter(s => s.connectors.some(c => c.type === filters.connectorType));
    }
    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters.power === 'FAST') {
      result = result.filter(s => s.connectors.some(c => c.power >= 50));
    } else if (filters.power === 'STANDARD') {
      result = result.filter(s => s.connectors.some(c => c.power < 50));
    }
    if (filters.maxDistance && userLocation) {
      result = result.filter(s => {
        const dist = haversine(userLocation.lat, userLocation.lng, s.lat, s.lng);
        return dist <= filters.maxDistance;
      });
    }

    return result;
  }, [stations, filters, userLocation]);

  const updateStation = useCallback(async (id, status, connectorId = null) => {
    try {
      await updateStationStatus(id, status, connectorId);
      // Real API returns { message: "ok" } not a station — update state optimistically
      setStations(prev => prev.map(s => {
        if (s.stationId !== id) return s;
        const updatedConnectors = s.connectors.map(c =>
          !connectorId || (c.id || c.connectorId) === connectorId ? { ...c, status } : c
        );
        const allStatuses = updatedConnectors.map(c => c.status);
        const newStatus =
          allStatuses.every(x => x === 'OFFLINE') ? 'OFFLINE' :
          allStatuses.every(x => x === 'MAINTENANCE') ? 'MAINTENANCE' :
          allStatuses.some(x => x === 'AVAILABLE') ? 'AVAILABLE' : 'IN_USE';
        return {
          ...s,
          connectors: updatedConnectors,
          status: newStatus,
          availablePorts: updatedConnectors.filter(c => c.status === 'AVAILABLE').length,
          waitMinutes: newStatus === 'AVAILABLE' ? 0 : s.waitMinutes,
          lastUpdated: new Date().toISOString(),
        };
      }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addStation = useCallback(async (data) => {
    try {
      await createStation(data);
      // Real API returns { message, stationId } not a full station — refetch to get it
      await loadStations();
    } catch (err) {
      setError(err.message);
    }
  }, [loadStations]);

  return {
    stations, filteredStations, filters, setFilters,
    loading, error, updateStation, addStation,
    refreshStations: loadStations,
  };
}
