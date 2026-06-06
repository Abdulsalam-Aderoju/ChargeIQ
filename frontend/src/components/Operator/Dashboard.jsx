import React, { useState, useMemo } from 'react';
import StatusBadge from '../common/StatusBadge';
import StationEditor from './StationEditor';
import './Dashboard.css';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard({ stations, onUpdateStation, onAddStation }) {
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.toLowerCase();
    return stations.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  }, [stations, search]);

  const kpis = useMemo(() => {
    const total = stations.length;
    const available = stations.filter(s => s.status === 'AVAILABLE').length;
    const avgWait = stations.filter(s => s.waitMinutes > 0).reduce((sum, s) => sum + s.waitMinutes, 0) / (stations.filter(s => s.waitMinutes > 0).length || 1);
    const avgUtil = stations.reduce((sum, s) => sum + (s.utilizationPercent || 0), 0) / (total || 1);
    return { total, available, avgWait: Math.round(avgWait), avgUtil: Math.round(avgUtil) };
  }, [stations]);

  const handleStatusChange = (stationId, newStatus) => {
    onUpdateStation(stationId, newStatus);
  };

  const handleSaveStation = (data) => {
    onAddStation(data);
    setShowEditor(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">⚙️ Operator Dashboard</h1>
        <button className="add-station-btn" onClick={() => setShowEditor(true)}>
          + Add Station
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-label">Total Stations</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-value">{kpis.available}</div>
          <div className="kpi-label">Available Now</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.avgWait}<span className="kpi-unit">min</span></div>
          <div className="kpi-label">Avg Wait Time</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.avgUtil}<span className="kpi-unit">%</span></div>
          <div className="kpi-label">Avg Utilization</div>
        </div>
      </div>

      <input
        className="table-search"
        type="text"
        placeholder="Search stations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="station-table-wrapper">
        <table className="station-table">
          <thead>
            <tr>
              <th>Station Name</th>
              <th>Area</th>
              <th>City</th>
              <th>Status</th>
              <th>Ports</th>
              <th>Wait</th>
              <th>Utilization</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(station => (
              <tr key={station.stationId}>
                <td className="station-name-cell">{station.name}</td>
                <td>{station.area}</td>
                <td>{station.city}</td>
                <td><StatusBadge status={station.status} size="sm" /></td>
                <td>{station.availablePorts}/{station.totalPorts}</td>
                <td>{station.waitMinutes != null ? `${station.waitMinutes}m` : '—'}</td>
                <td>
                  <div className="utilization-cell">
                    <div className="utilization-bar">
                      <div
                        className="utilization-fill"
                        style={{
                          width: `${station.utilizationPercent || 0}%`,
                          background: (station.utilizationPercent || 0) > 80 ? 'var(--warning)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <span>{station.utilizationPercent || 0}%</span>
                  </div>
                </td>
                <td className="updated-cell">{timeAgo(station.lastUpdated)}</td>
                <td>
                  <select
                    className="status-select"
                    value={station.status}
                    onChange={(e) => handleStatusChange(station.stationId, e.target.value)}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-aws-badge">
        Data stored in Amazon DynamoDB · Real-time updates via Amazon AppSync · Predictions by Amazon SageMaker
      </div>

      {showEditor && (
        <StationEditor
          station={null}
          onSave={handleSaveStation}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
