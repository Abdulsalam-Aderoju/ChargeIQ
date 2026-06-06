import { useState } from 'react';
import { queryNL } from '../../services/api';
import './NLSearch.css';

const EXAMPLE_QUERIES = [
  'Free charger near Victoria Island',
  'Fast charging in Ikeja',
  'Available station in Lekki',
  'CCS2 charger in Wuse, Abuja',
];

export default function NLSearch({ onResult, stations }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await queryNL(searchQuery);
      if (result && result.stationId) {
        const station = result.station || stations.find(s => s.stationId === result.stationId);
        onResult({ station, message: result.message });
      }
    } catch (err) {
      console.error('NL query error:', err);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="nl-search">
      <div className={`nl-search-input-wrapper ${loading ? 'searching' : ''}`}>
        <span className="nl-search-icon">🔍</span>
        <input
          className="nl-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask ChargeIQ... e.g. "find a free fast charger near Lekki"'
          disabled={loading}
        />
        <button
          className="nl-search-btn"
          onClick={() => handleSubmit()}
          disabled={loading || !query.trim()}
        >
          {loading ? '⏳' : '→'}
        </button>
      </div>

      {loading && (
        <div className="nl-loading">
          <div className="shimmer" style={{ height: '16px', width: '80%', margin: '8px auto 0' }} />
        </div>
      )}

      <div className="nl-chips">
        {EXAMPLE_QUERIES.map((eq) => (
          <button key={eq} className="nl-chip" onClick={() => { setQuery(eq); handleSubmit(eq); }}>
            {eq}
          </button>
        ))}
      </div>

      <div className="nl-badge">Powered by Amazon Bedrock</div>
    </div>
  );
}
