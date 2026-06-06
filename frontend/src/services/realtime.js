const APPSYNC_URL = import.meta.env.VITE_APPSYNC_URL;
const APPSYNC_API_KEY = import.meta.env.VITE_APPSYNC_API_KEY;

const MOCK_STATUSES = ['AVAILABLE', 'IN_USE', 'OFFLINE', 'MAINTENANCE'];

const SUBSCRIPTION_QUERY = `subscription OnStationUpdate {
  onStationUpdate {
    stationId
    status
    availableConnectors
    waitTimeMinutes
    updatedAt
  }
}`;

function subscribeAppSync(onUpdate, onFallback) {
  const wsUrl = APPSYNC_URL
    .replace('https://', 'wss://')
    .replace('appsync-api', 'appsync-realtime-api');

  const host = new URL(APPSYNC_URL).hostname;

  const header = btoa(JSON.stringify({ host, 'x-api-key': APPSYNC_API_KEY }));

  let ws;
  try {
    ws = new WebSocket(`${wsUrl}?header=${header}&payload=e30=`, ['graphql-ws']);
  } catch {
    onFallback();
    return () => {};
  }

  const subId = 'chargeiq-sub-1';

  // If we don't get connection_ack in 8s, fall back to mock
  const fallbackTimer = setTimeout(() => {
    ws.close();
    onFallback();
  }, 8000);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'connection_init' }));
  };

  ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    switch (msg.type) {
      case 'connection_ack':
        clearTimeout(fallbackTimer);
        ws.send(JSON.stringify({
          id: subId,
          type: 'start',
          payload: {
            data: JSON.stringify({ query: SUBSCRIPTION_QUERY }),
            extensions: {
              authorization: { host, 'x-api-key': APPSYNC_API_KEY },
            },
          },
        }));
        break;

      case 'data': {
        const update = msg.payload?.data?.onStationUpdate;
        if (update?.stationId) onUpdate(update);
        break;
      }

      case 'ka':
        // keep-alive — ignore
        break;

      case 'connection_error':
      case 'error':
        clearTimeout(fallbackTimer);
        ws.close();
        onFallback();
        break;
    }
  };

  ws.onerror = () => {
    clearTimeout(fallbackTimer);
    onFallback();
  };

  ws.onclose = () => {
    clearTimeout(fallbackTimer);
  };

  return () => {
    clearTimeout(fallbackTimer);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: subId, type: 'stop' }));
      ws.close();
    }
  };
}

function subscribeMock(stations, onUpdate) {
  const interval = setInterval(() => {
    if (!stations || stations.length === 0) return;
    const count = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * stations.length);
      const station = { ...stations[idx] };
      const newStatus = MOCK_STATUSES[Math.floor(Math.random() * 2)];
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

export function subscribeToUpdates(stations, onUpdate) {
  if (APPSYNC_URL && APPSYNC_API_KEY) {
    let mockUnsub = null;
    const appSyncUnsub = subscribeAppSync(onUpdate, () => {
      // AppSync failed — fall back to mock for demo
      mockUnsub = subscribeMock(stations, onUpdate);
    });
    return () => {
      appSyncUnsub();
      if (mockUnsub) mockUnsub();
    };
  }
  return subscribeMock(stations, onUpdate);
}
