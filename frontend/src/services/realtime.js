const STATUSES = ['AVAILABLE', 'IN_USE', 'OFFLINE', 'MAINTENANCE'];

export function subscribeToUpdates(stations, onUpdate) {
  const interval = setInterval(() => {
    if (!stations || stations.length === 0) return;
    const count = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * stations.length);
      const station = { ...stations[idx] };
      const newStatus = STATUSES[Math.floor(Math.random() * 2)]; // mostly AVAILABLE or IN_USE
      station.status = newStatus;
      station.connectors = station.connectors.map(c => ({
        ...c,
        status: Math.random() > 0.3 ? newStatus : c.status,
      }));
      station.availablePorts = station.connectors.filter(c => c.status === 'AVAILABLE').length;
      station.waitMinutes = newStatus === 'AVAILABLE' ? 0 : Math.floor(Math.random() * 20) + 5;
      station.lastUpdated = new Date().toISOString();
      onUpdate(station);
    }
  }, 15000);

  return () => clearInterval(interval);
}
