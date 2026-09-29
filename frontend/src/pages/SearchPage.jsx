import { useState } from 'react';
import { api } from '../api';

/* ── SVG Icons ── */
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px', color: '#F59E0B' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function SearchPage({ onJobStarted, showToast }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);

  const examples = [
    { query: 'Dentists', location: 'Chicago, IL' },
    { query: 'Personal Injury Lawyers', location: 'New York, NY' },
    { query: 'HVAC Companies', location: 'Houston, TX' },
    { query: 'Gyms & Fitness Centers', location: 'Los Angeles, CA' },
  ];

  const features = [
    { icon: <IconShield />, label: 'Stealth Scraping' },
    { icon: <IconBrain />,  label: 'GPT-4o Enrichment' },
    { icon: <IconTarget />, label: 'AI Lead Scoring' },
    { icon: <IconMail />,   label: 'Email Intelligence' },
    { icon: <IconDownload />, label: 'CSV / XLSX Export' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    setLoading(true);
    try {
      const data = await api.startJob(query.trim(), location.trim(), maxResults);
      if (data.jobId) {
        showToast(`Mining "${query}" in ${location}...`);
        onJobStarted(data.jobId);
      } else {
        showToast(data.error || 'Failed to start job', 'error');
      }
    } catch {
      showToast('Could not connect to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ paddingTop: '72px', paddingBottom: '80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        {/* Glow badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div className="glow-badge">
            <IconZap />
            AI-Powered Lead Intelligence
          </div>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
          {[...Array(5)].map((_, i) => <IconStar key={i} />)}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
            Trusted by 2,000+ sales teams
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '800',
          lineHeight: '1.08', marginBottom: '20px', letterSpacing: '-0.04em',
        }}>
          Mine qualified leads,<br />
          <span style={{
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #22D3EE 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            not just contacts
          </span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '1.1rem',
          maxWidth: '540px', margin: '0 auto', lineHeight: '1.7',
        }}>
          Search Google Maps + Google Search, visit every website with AI, and get enriched leads scored High / Medium / Low — ready to close.
        </p>
      </div>

      {/* Search Form */}
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-card), 0 0 0 1px rgba(99,102,241,0.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="query-input">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconSearch /> Business Type
                  </span>
                </label>
                <input
                  id="query-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Dentists, HVAC, Lawyers"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="location-input">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconMapPin /> Location
                  </span>
                </label>
                <input
                  id="location-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Chicago, IL"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Results</span>
                <span style={{
                  color: 'var(--accent-2)', fontWeight: '700',
                  background: 'var(--accent-subtle)', padding: '1px 8px',
                  borderRadius: '100px', fontSize: '0.75rem',
                }}>
                  {maxResults} leads
                </span>
              </label>
              <input
                id="max-results-slider"
                type="range" min={5} max={100} step={5}
                className="form-range"
                value={maxResults}
                onChange={e => setMaxResults(parseInt(e.target.value))}
                style={{ marginTop: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>5 leads</span>
                <span>100 leads</span>
              </div>
            </div>

            <button
              id="start-mining-btn"
              type="submit"
              className="btn btn-cta btn-xl"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <><div className="btn-spinner" /> Starting Job...</>
              ) : (
                <><IconPlay /> Start Mining Leads</>
              )}
            </button>
          </form>
        </div>

        {/* Example Searches */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>
            Try an example search:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {examples.map((ex, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => { setQuery(ex.query); setLocation(ex.location); }}
              >
                <IconSearch />
                {ex.query} · {ex.location}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
          {features.map((f, i) => (
            <div key={i} className="feature-pill">
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
