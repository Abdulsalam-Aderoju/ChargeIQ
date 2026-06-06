import React, { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ onLogin, onClose }) {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await onLogin(email, password, role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-header">
          <span className="auth-logo">⚡</span>
          <h2>ChargeIQ NG</h2>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')}>Sign In</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="auth-role-label">I am a:</div>
          <div className="auth-role-group">
            <button
              type="button"
              className={`auth-role-option ${role === 'driver' ? 'selected' : ''}`}
              onClick={() => setRole('driver')}
            >
              🚗 EV Driver
            </button>
            <button
              type="button"
              className={`auth-role-option ${role === 'operator' ? 'selected' : ''}`}
              onClick={() => setRole('operator')}
            >
              ⚙️ Station Operator
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="cognito-badge">🔒 Secured by Amazon Cognito</div>
      </div>
    </div>
  );
}
