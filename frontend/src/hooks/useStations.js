import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStations, updateStationStatus, createStation } from '../services/api';
import { subscribeToUpdates } from '../services/realtime';
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
      setStations(data);
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
      setStations(prev => prev.map(s => s.stationId === updated.stationId ? updated : s));
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
      const updated = await updateStationStatus(id, status, connectorId);
      setStations(prev => prev.map(s => s.stationId === id ? { ...s, ...updated } : s));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addStation = useCallback(async (data) => {
    try {
      const created = await createStation(data);
      setStations(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    stations, filteredStations, filters, setFilters,
    loading, error, updateStation, addStation,
    refreshStations: loadStations,
  };
}
