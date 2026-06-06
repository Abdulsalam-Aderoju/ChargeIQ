// ============================================
// ChargeIQ NG — Spinner Component
// ============================================

import React from 'react';

const spinnerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '24px',
  width: '100%',
};

const ringStyle = (size) => ({
  width: size,
  height: size,
  border: `3px solid rgba(34, 211, 238, 0.15)`,
  borderTopColor: '#22d3ee',
  borderRadius: '50%',
  animation: 'rotate 0.8s linear infinite',
});

const labelStyle = {
  color: '#94a3b8',
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
};

/**
 * Loading spinner with accent-colored rotating ring.
 *
 * @param {{ label?: string, size?: number }} props
 */
export default function Spinner({ label, size = 32 }) {
  return (
    <div style={spinnerContainerStyle}>
      <div style={ringStyle(size)} aria-hidden="true" />
      {label && <span style={labelStyle}>{label}</span>}
    </div>
  );
}
