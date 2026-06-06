import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

export default function ConnectorIcon({ type, power, status }) {
  const color = STATUS_COLORS[status] || '#6b7280';

  const icon = () => {
    switch (type) {
      case 'CCS2':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
            <line x1="9" y1="15" x2="9" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="15" y1="15" x2="15" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'CHAdeMO':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill={color} />
          </svg>
        );
      case 'Type 2':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="2" />
            <circle cx="9" cy="9" r="1.5" fill={color} />
            <circle cx="15" cy="9" r="1.5" fill={color} />
            <circle cx="9" cy="15" r="1.5" fill={color} />
            <circle cx="15" cy="15" r="1.5" fill={color} />
            <circle cx="12" cy="12" r="1.5" fill={color} />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="2" />
          </svg>
        );
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon()}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{type}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{power} kW</div>
      </div>
    </div>
  );
}
