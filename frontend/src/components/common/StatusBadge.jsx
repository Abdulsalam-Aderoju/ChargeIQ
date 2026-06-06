import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

export default function StatusBadge({ status, size = 'md', pulse = false }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const label = STATUS_LABELS[status] || status;

  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: size === 'sm' ? '2px 8px' : '4px 12px',
    borderRadius: '20px',
    fontSize: size === 'sm' ? '0.675rem' : '0.8rem',
    fontWeight: 600,
    color: color,
    background: `${color}20`,
    border: `1px solid ${color}30`,
    whiteSpace: 'nowrap',
    animation: pulse && status === 'AVAILABLE' ? 'pulse 2s ease-in-out infinite' : 'none',
  };

  const dotStyles = {
    width: size === 'sm' ? '6px' : '8px',
    height: size === 'sm' ? '6px' : '8px',
    borderRadius: '50%',
    background: color,
    boxShadow: status === 'AVAILABLE' ? `0 0 8px ${color}` : 'none',
  };

  return (
    <span style={styles}>
      <span style={dotStyles} />
      {label}
    </span>
  );
}
