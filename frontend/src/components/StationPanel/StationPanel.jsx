import StatusBadge from '../common/StatusBadge';
import ConnectorIcon from '../common/ConnectorIcon';
import './StationPanel.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="panel-stars">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span className="panel-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function StationPanel({ station, nlMessage, onClose }) {
  if (!station) return null;

  const portPercent = station.totalPorts > 0
    ? (station.availablePorts / station.totalPorts) * 100
    : 0;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

  return (
    <>
      <div className="station-panel-overlay" onClick={onClose} />
      <div className="station-panel">
        <button className="panel-close" onClick={onClose} aria-label="Close panel">✕</button>

        {nlMessage && (
          <div className="nl-message">
            <div className="nl-message-header">
              <span className="bedrock-badge">✨ Amazon Bedrock</span>
            </div>
            <p>{nlMessage}</p>
          </div>
        )}

        <div className="panel-header">
          <h2 className="panel-name">{station.name}</h2>
          <p className="panel-address">{station.address}</p>
          <span className="panel-operator">{station.operatorName}</span>
        </div>

        <div className="panel-status-row">
          <StatusBadge status={station.status} pulse={station.status === 'AVAILABLE'} />
          <Stars rating={station.rating || 4.0} />
        </div>

        <div className="panel-ports">
          <div className="panel-ports-label">
            <span className="ports-text">
              <strong>{station.availablePorts}</strong> of {station.totalPorts} ports free
            </span>
          </div>
          <div className="ports-bar">
            <div className="ports-fill" style={{ width: `${portPercent}%` }} />
          </div>
        </div>

        {station.waitMinutes != null && station.waitMinutes > 0 && (
          <div className="panel-wait">
            <span className="wait-icon">⏱️</span>
            <div>
              <div className="wait-time">{station.waitMinutes} min estimated wait</div>
              <span className="sagemaker-badge">Predicted by Amazon SageMaker</span>
            </div>
          </div>
        )}

        {station.waitMinutes === 0 && station.status === 'AVAILABLE' && (
          <div className="panel-wait panel-wait-free">
            <span className="wait-icon">⚡</span>
            <div className="wait-time" style={{ color: 'var(--success)' }}>No wait — port available now!</div>
          </div>
        )}

        <div className="panel-section">
          <h3 className="panel-section-title">Connectors</h3>
          <div className="connector-list">
            {station.connectors.map((c) => (
              <div key={c.id} className="connector-item">
                <ConnectorIcon type={c.type} power={c.power} status={c.status} />
                <div style={{ marginLeft: 'auto' }}>
                  <StatusBadge status={c.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h3 className="panel-section-title">Utilization</h3>
          <div className="utilization-row">
            <div className="utilization-bar-panel">
              <div
                className="utilization-fill-panel"
                style={{
                  width: `${station.utilizationPercent || 0}%`,
                  background: station.utilizationPercent > 80 ? 'var(--warning)' : 'var(--accent)',
                }}
              />
            </div>
            <span className="utilization-pct">{station.utilizationPercent || 0}%</span>
          </div>
          <div className="utilization-meta">
            {station.totalSessions} total sessions · Updated {timeAgo(station.lastUpdated)}
          </div>
        </div>

        <div className="panel-actions">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            📍 Get Directions
          </a>
          <button className="btn-secondary" onClick={() => alert('You will be notified via Amazon SNS when this station is free!')}>
            🔔 Notify Me
          </button>
        </div>

        <div className="panel-aws-badge">
          Real-time data via Amazon AppSync · Stored in Amazon DynamoDB
        </div>
      </div>
    </>
  );
}
