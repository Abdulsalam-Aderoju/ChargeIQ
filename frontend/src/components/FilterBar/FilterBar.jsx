import React, { useMemo } from 'react';
import { CONNECTOR_TYPES } from '../../utils/constants';
import './FilterBar.css';

export default function FilterBar({ filters, onFilterChange }) {
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.connectorType) count++;
    if (filters.status) count++;
    if (filters.power) count++;
    return count;
  }, [filters]);

  const setFilter = (key, value) => {
    onFilterChange(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const clearAll = () => onFilterChange({});

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Connector</span>
        {CONNECTOR_TYPES.map(type => (
          <button
            key={type}
            className={`filter-pill ${filters.connectorType === type ? 'active' : ''}`}
            onClick={() => setFilter('connectorType', type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="filter-divider" />

      <div className="filter-group">
        <span className="filter-label">Status</span>
        <button className={`filter-pill ${filters.status === 'AVAILABLE' ? 'active' : ''}`} onClick={() => setFilter('status', 'AVAILABLE')}>
          Available
        </button>
        <button className={`filter-pill ${filters.status === 'IN_USE' ? 'active' : ''}`} onClick={() => setFilter('status', 'IN_USE')}>
          In Use
        </button>
      </div>

      <div className="filter-divider" />

      <div className="filter-group">
        <span className="filter-label">Power</span>
        <button className={`filter-pill ${filters.power === 'FAST' ? 'active' : ''}`} onClick={() => setFilter('power', 'FAST')}>
          ⚡ Fast ≥50kW
        </button>
        <button className={`filter-pill ${filters.power === 'STANDARD' ? 'active' : ''}`} onClick={() => setFilter('power', 'STANDARD')}>
          Standard
        </button>
      </div>

      {activeCount > 0 && (
        <>
          <span className="filter-count">{activeCount}</span>
          <button className="filter-clear" onClick={clearAll}>Clear</button>
        </>
      )}
    </div>
  );
}
