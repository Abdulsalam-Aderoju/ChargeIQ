import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM, STATUS_COLORS } from '../../utils/constants';
import HeatmapLayer from './HeatmapLayer';
import './StationMap.css';

export default function StationMap({ stations, selectedStation, onStationSelect, showHeatmap, onHeatmapToggle }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      maxZoom: 18,
      minZoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update station data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !stations.length) return;

    const geojson = {
      type: 'FeatureCollection',
      features: stations.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          stationId: s.stationId,
          name: s.name,
          status: s.status,
          availablePorts: s.availablePorts,
          totalPorts: s.totalPorts,
          area: s.area,
          waitMinutes: s.waitMinutes ?? 0,
          totalSessions: s.totalSessions || 0,
        },
      })),
    };

    if (map.getSource('stations')) {
      map.getSource('stations').setData(geojson);
      return;
    }

    map.addSource('stations', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 13,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'stations',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#22d3ee',
        'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 10, 30],
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(34, 211, 238, 0.4)',
      },
    });

    // Cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'stations',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 13,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      },
      paint: { 'text-color': '#0a0e17' },
    });

    // Individual station points
    map.addLayer({
      id: 'station-points',
      type: 'circle',
      source: 'stations',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match', ['get', 'status'],
          'AVAILABLE', STATUS_COLORS.AVAILABLE,
          'IN_USE', STATUS_COLORS.IN_USE,
          'OFFLINE', STATUS_COLORS.OFFLINE,
          'MAINTENANCE', STATUS_COLORS.MAINTENANCE,
          '#6b7280',
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 8, 16, 12],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': 'rgba(255,255,255,0.9)',
        'circle-opacity': 0.92,
      },
    });

    // Station glow ring layer
    map.addLayer({
      id: 'station-glow',
      type: 'circle',
      source: 'stations',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'status'], 'AVAILABLE']],
      paint: {
        'circle-color': 'transparent',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 12, 14, 16, 20],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(52, 211, 153, 0.35)',
        'circle-opacity': 0.6,
      },
    }, 'station-points');

    // Click cluster → zoom in
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('stations').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.flyTo({ center: features[0].geometry.coordinates, zoom: zoom + 1, speed: 1.5 });
      });
    });

    // Click station → select
    map.on('click', 'station-points', (e) => {
      const feature = e.features[0];
      const stationId = feature.properties.stationId;
      const station = stations.find(s => s.stationId === stationId);
      if (station) {
        onStationSelect(station);
      }
    });

    // Hover cursor
    map.on('mouseenter', 'station-points', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'station-points', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

    // Hover popup
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'station-popup-container', offset: 12 });

    map.on('mouseenter', 'station-points', (e) => {
      const props = e.features[0].properties;
      popup.setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`
          <div class="station-popup">
            <strong>${props.name}</strong>
            <div class="popup-meta">${props.availablePorts}/${props.totalPorts} ports free</div>
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'station-points', () => { popup.remove(); });

  }, [stations, mapLoaded, onStationSelect]);

  // Fly to selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedStation) return;

    map.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: 15,
      pitch: 40,
      speed: 1.4,
      curve: 1.5,
    });
  }, [selectedStation, mapLoaded]);

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />

      <button
        className={`heatmap-toggle ${showHeatmap ? 'active' : ''}`}
        onClick={onHeatmapToggle}
        title="Toggle demand heatmap"
      >
        🔥 {showHeatmap ? 'Hide' : 'Show'} Heatmap
      </button>

      {mapLoaded && showHeatmap && (
        <HeatmapLayer map={mapRef.current} stations={stations} />
      )}
    </div>
  );
}
