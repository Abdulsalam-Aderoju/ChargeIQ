import React, { useEffect } from 'react';

const HEATMAP_SOURCE = 'heatmap-data';
const HEATMAP_LAYER = 'heatmap-layer';

export default function HeatmapLayer({ map, stations }) {
  useEffect(() => {
    if (!map || !stations?.length) return;

    const geojson = {
      type: 'FeatureCollection',
      features: stations.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { weight: s.totalSessions || 1 },
      })),
    };

    // Clean up existing
    if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
    if (map.getSource(HEATMAP_SOURCE)) map.removeSource(HEATMAP_SOURCE);

    map.addSource(HEATMAP_SOURCE, { type: 'geojson', data: geojson });

    map.addLayer({
      id: HEATMAP_LAYER,
      type: 'heatmap',
      source: HEATMAP_SOURCE,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 250, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 15, 40],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.1, 'rgba(34,211,238,0.2)',
          0.3, 'rgba(34,211,238,0.5)',
          0.5, 'rgba(251,191,36,0.6)',
          0.7, 'rgba(248,113,113,0.7)',
          1, 'rgba(248,113,113,0.9)',
        ],
        'heatmap-opacity': 0.7,
      },
    }, 'station-points');

    return () => {
      if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
      if (map.getSource(HEATMAP_SOURCE)) map.removeSource(HEATMAP_SOURCE);
    };
  }, [map, stations]);

  return null;
}
