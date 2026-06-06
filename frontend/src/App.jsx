import { useState, useCallback } from 'react';
import { useStations } from './hooks/useStations';
import { useAuth } from './hooks/useAuth';
import './App.css';
import Header from './components/Layout/Header';
import StationMap from './components/Map/StationMap';
import StationPanel from './components/StationPanel/StationPanel';
import NLSearch from './components/NLSearch/NLSearch';
import FilterBar from './components/FilterBar/FilterBar';
import AuthModal from './components/Auth/AuthModal';
import Dashboard from './components/Operator/Dashboard';

function App() {
  const [view, setView] = useState('map');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [nlMessage, setNlMessage] = useState(null);
  const [selectedCity, setSelectedCity] = useState('all');

  const { user, role, isAuthenticated, login, signup, logout } = useAuth();
  const {
    stations,
    filteredStations,
    filters,
    setFilters,
    loading,
    updateStation,
    addStation,
  } = useStations();

  const displayStations = selectedCity === 'all'
    ? filteredStations
    : filteredStations.filter(s => s.city.toLowerCase() === selectedCity.toLowerCase());

  const handleNLResult = useCallback((result) => {
    if (result && result.station) {
      setSelectedStation(result.station);
      setNlMessage(result.message);
    }
  }, []);

  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    setNlMessage(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedStation(null);
    setNlMessage(null);
  }, []);

  const handleLogin = useCallback(async (email, password, selectedRole) => {
    await login(email, password, selectedRole);
    setShowAuth(false);
  }, [login]);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    setSelectedStation(null);
    setNlMessage(null);
  }, []);

  return (
    <div className="app">
      <Header
        user={user}
        role={role}
        view={view}
        onViewChange={handleViewChange}
        onLogin={() => setShowAuth(true)}
        onLogout={logout}
        onCityChange={setSelectedCity}
        selectedCity={selectedCity}
      />

      {view === 'map' ? (
        <div className="map-view">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
          />
          <div className="map-area">
            <StationMap
              stations={displayStations}
              selectedStation={selectedStation}
              onStationSelect={handleStationSelect}
              showHeatmap={showHeatmap}
              onHeatmapToggle={() => setShowHeatmap(prev => !prev)}
            />
            <NLSearch
              onResult={handleNLResult}
              stations={stations}
            />
          </div>
          {selectedStation && (
            <StationPanel
              station={selectedStation}
              nlMessage={nlMessage}
              onClose={handleClosePanel}
            />
          )}
        </div>
      ) : (
        <Dashboard
          stations={stations}
          onUpdateStation={updateStation}
          onAddStation={addStation}
        />
      )}

      {showAuth && (
        <AuthModal
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}

      <footer className="app-footer">
        <div className="footer-services">
          <span className="footer-label">Built on AWS</span>
          <span className="footer-pill">Amplify</span>
          <span className="footer-pill">Cognito</span>
          <span className="footer-pill">DynamoDB</span>
          <span className="footer-pill">Lambda</span>
          <span className="footer-pill">API Gateway</span>
          <span className="footer-pill">Bedrock</span>
          <span className="footer-pill">SageMaker</span>
          <span className="footer-pill">Location Service</span>
          <span className="footer-pill">AppSync</span>
          <span className="footer-pill">SNS</span>
          <span className="footer-pill">S3</span>
          <span className="footer-pill">CloudWatch</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
