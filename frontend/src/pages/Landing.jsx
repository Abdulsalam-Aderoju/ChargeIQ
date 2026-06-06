import React from 'react';
import './Landing.css';

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    title: 'AI-Powered Search',
    desc: 'Ask in plain English — "Free fast charger near Victoria Island". Amazon Bedrock Claude Haiku parses intent and finds the best match in real time.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Smart Wait Predictions',
    desc: 'Never wait blindly. Our SageMaker ML model predicts queue time based on hour of day, occupancy history, and local traffic patterns.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Live Station Map',
    desc: 'Interactive map of 30+ charging stations across Lagos and Abuja. Green, amber, and red — availability at a glance, updated in real time via AppSync.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Live Availability Alerts',
    desc: 'Subscribe to a station and get an instant email the moment it comes back online. Zero polling — event-driven via Amazon SNS.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <path d="M3 17h4a3 3 0 0 1 3 3v1M7 14H3v4" />
      </svg>
    ),
    title: 'Operator Dashboard',
    desc: 'A full management console for operators — update connector status, register new stations, and monitor utilization across your entire network.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Instant Infrastructure',
    desc: 'Fully serverless — Lambda, API Gateway, DynamoDB, and Amplify. Scales to zero overnight and handles peak demand without a single server to manage.',
  },
];

const AWS_SERVICES = [
  { name: 'Amazon Bedrock', desc: 'Natural language station search', color: '#818cf8' },
  { name: 'Amazon SageMaker', desc: 'Wait-time ML predictions', color: '#34d399' },
  { name: 'AWS Lambda', desc: 'Serverless API handlers', color: '#f59e0b' },
  { name: 'Amazon DynamoDB', desc: 'Station & availability store', color: '#22d3ee' },
  { name: 'Amazon API Gateway', desc: 'HTTP API v2 routing', color: '#a78bfa' },
  { name: 'Amazon AppSync', desc: 'Real-time WebSocket updates', color: '#f472b6' },
  { name: 'Amazon SNS', desc: 'Driver availability alerts', color: '#fb923c' },
  { name: 'AWS Amplify', desc: 'Frontend CI/CD & hosting', color: '#4ade80' },
  { name: 'Amazon CloudWatch', desc: 'Monitoring & observability', color: '#60a5fa' },
];

function MapMockup() {
  return (
    <div className="hero-mockup" role="img" aria-label="ChargeIQ station map preview">
      <div className="mockup-titlebar">
        <span className="titlebar-dot dot-red" />
        <span className="titlebar-dot dot-amber" />
        <span className="titlebar-dot dot-green" />
        <span className="titlebar-url">chargeiq.ng/app</span>
      </div>
      <div className="mockup-map">
        <div className="mockup-grid" aria-hidden="true" />

        <div className="mockup-roads" aria-hidden="true">
          <div className="road road-h" style={{ top: '38%' }} />
          <div className="road road-h" style={{ top: '62%' }} />
          <div className="road road-v" style={{ left: '30%' }} />
          <div className="road road-v" style={{ left: '65%' }} />
          <div className="road road-d" style={{ top: '20%', left: '10%' }} />
        </div>

        {[
          { top: '28%', left: '38%', status: 'green', label: 'AVAILABLE', pulse: true },
          { top: '44%', left: '58%', status: 'green', label: 'AVAILABLE', pulse: true },
          { top: '62%', left: '32%', status: 'amber', label: 'IN USE' },
          { top: '22%', left: '67%', status: 'green', label: 'AVAILABLE', pulse: true },
          { top: '72%', left: '64%', status: 'red', label: 'OFFLINE' },
          { top: '52%', left: '22%', status: 'green', label: 'AVAILABLE', pulse: true },
          { top: '35%', left: '75%', status: 'amber', label: 'IN USE' },
          { top: '80%', left: '45%', status: 'red', label: 'OFFLINE' },
        ].map((pin, i) => (
          <div
            key={i}
            className={`mockup-pin pin-${pin.status}${pin.pulse ? ' pin-pulse' : ''}`}
            style={{ top: pin.top, left: pin.left }}
            title={pin.label}
          />
        ))}

        <div className="mockup-card">
          <div className="mcard-header">
            <span className="mcard-dot mcard-dot-green" />
            <span className="mcard-name">Ikeja EV Hub</span>
          </div>
          <div className="mcard-meta">3 of 4 connectors free · ~2 min</div>
          <div className="mcard-connectors">
            <span className="mcard-tag">CCS 150kW</span>
            <span className="mcard-tag">Type 2</span>
          </div>
        </div>

        <div className="mockup-search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="mockup-search-text">Free fast charger near Lekki Phase 1…</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onGetStarted }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <svg className="logo-bolt" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>ChargeIQ <span className="logo-ng">NG</span></span>
          </div>
          <button className="nav-cta" onClick={onGetStarted}>
            Launch App
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow hero-glow-1" aria-hidden="true" />
        <div className="hero-glow hero-glow-2" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-dot" />
              AWS One With AI Hackathon 2026
            </div>
            <h1 className="hero-heading">
              Find Your Charge,<br />
              <span className="heading-accent">Anywhere in Nigeria.</span>
            </h1>
            <p className="hero-body">
              Real-time EV charging intelligence for Lagos and Abuja.
              AI-powered station discovery, live availability, and ML-predicted wait times —
              all on one serverless platform.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={onGetStarted}>
                Get Started
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="hero-powered">
              <span className="powered-label">Powered by</span>
              {['Bedrock', 'SageMaker', 'AppSync', 'Lambda'].map((s) => (
                <span className="powered-pill" key={s}>{s}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <MapMockup />
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stats-inner">
          {[
            { value: '30+', label: 'Charging Stations' },
            { value: '2',   label: 'Cities Covered' },
            { value: '5',   label: 'Operators' },
            { value: 'AI',  label: 'Powered Search' },
          ].map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="section-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-heading">Everything an EV driver needs</h2>
          <p className="section-body">
            From real-time availability to AI-guided search — ChargeIQ NG makes charging effortless.
          </p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <article className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="section-inner">
          <div className="section-eyebrow">How It Works</div>
          <h2 className="section-heading">Charge smarter in three steps</h2>
          <div className="steps-row">
            {[
              {
                num: '01',
                title: 'Open the map',
                desc: 'See every station across Lagos and Abuja colour-coded by live status. No refresh needed — AppSync WebSocket streams updates the moment they happen.',
              },
              {
                num: '02',
                title: 'Search in plain English',
                desc: 'Type a natural question. Amazon Bedrock understands intent, filters by location, connector type, and availability, and returns the best match.',
              },
              {
                num: '03',
                title: 'Navigate and charge',
                desc: 'View wait time predictions, connector details, and operator contact. Subscribe to get an SNS alert the instant the station is free.',
              },
            ].map((step, i) => (
              <div className="step-wrap" key={step.num}>
                <div className="step">
                  <div className="step-num">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
                {i < 2 && <div className="step-arrow" aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="aws-section">
        <div className="section-inner">
          <div className="section-eyebrow">Technology</div>
          <h2 className="section-heading">Built entirely on AWS</h2>
          <p className="section-body">
            Every layer — from the map tile proxy to the ML inference endpoint — runs on Amazon Web Services.
            Zero servers managed. Scales to millions of queries.
          </p>
          <div className="aws-grid">
            {AWS_SERVICES.map((s) => (
              <div className="aws-card" key={s.name} style={{ '--aws-color': s.color }}>
                <div className="aws-dot" />
                <div className="aws-name">{s.name}</div>
                <div className="aws-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="cta-glow" aria-hidden="true" />
        <div className="cta-inner">
          <h2 className="cta-heading">Ready to find your charge?</h2>
          <p className="cta-body">
            Join drivers across Lagos and Abuja already using ChargeIQ NG.
          </p>
          <button className="btn-primary btn-lg" onClick={onGetStarted}>
            Launch the App
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            ChargeIQ NG
          </div>
          <div className="footer-center">
            Built for the <strong>AWS One With AI Hackathon 2026</strong>
          </div>
          <div className="footer-team">
            Abdulkabir · Abdulsalam
          </div>
        </div>
      </footer>
    </div>
  );
}
