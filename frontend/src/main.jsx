import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Landing from './pages/Landing';
import './index.css';

function Root() {
  const [showApp, setShowApp] = useState(
    window.location.pathname === '/app' || window.location.hash === '#app'
  );

  const handleGetStarted = () => {
    window.history.pushState({}, '', '/app');
    setShowApp(true);
  };

  if (showApp) return <App />;
  return <Landing onGetStarted={handleGetStarted} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
