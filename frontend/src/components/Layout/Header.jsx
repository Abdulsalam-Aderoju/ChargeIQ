import './Header.css';

export default function Header({ user, role, view, onViewChange, onLogin, onLogout, onCityChange, selectedCity }) {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-logo-icon">⚡</span>
        <span>ChargeIQ NG</span>
      </div>
      <span className="header-subtitle">Nigeria's EV Charging Intelligence</span>

      <nav className="header-nav">
        <button
          className={`nav-tab ${view === 'map' ? 'active' : ''}`}
          onClick={() => onViewChange('map')}
        >
          🗺️ Driver Map
        </button>
        <button
          className={`nav-tab ${view === 'operator' ? 'active' : ''}`}
          onClick={() => onViewChange('operator')}
        >
          ⚙️ Operator Dashboard
        </button>
      </nav>

      <div className="header-right">
        <select
          className="city-select"
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="all">All Cities</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja</option>
        </select>

        {user ? (
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <span className="user-name">{user.name}</span>
            <span className="user-role-badge">{role === 'operator' ? 'Operator' : 'Driver'}</span>
            <button className="btn-sign-out" onClick={onLogout}>Sign Out</button>
          </div>
        ) : (
          <button className="btn-sign-in" onClick={onLogin}>Sign In</button>
        )}
      </div>
    </header>
  );
}
