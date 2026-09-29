import { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import JobsPage from './pages/JobsPage';
import ProgressPage from './pages/ProgressPage';
import LeadsPage from './pages/LeadsPage';

/* ── Theme hook ── */
function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('pm-theme') || 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    // Suppress transition flash on init
    root.classList.add('no-transition');
    root.setAttribute('data-theme', theme);
    localStorage.setItem('pm-theme', theme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('no-transition'));
    });
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

/* ── SVG Icons ── */
const IconPickaxe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2.5c.83.83.83 2.17 0 3L7 13l-2-2 7.5-7.5c.83-.83 2.17-.83 3 0z"/>
    <path d="m5 11-3 3 1.5 1.5L6 13l-1-2z"/>
    <path d="M15 9l4.5 4.5-2 2L13 11"/>
    <path d="m17.5 11.5 2 2-5 5-2-2 5-5z"/>
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconXCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

/* ── Authenticated App ── */
function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [page, setPage] = useState('search');
  const [activeJobId, setActiveJobId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const goToProgress = (jobId) => { setActiveJobId(jobId); setPage('progress'); };
  const goToLeads    = (jobId) => { setActiveJobId(jobId); setPage('leads'); };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <a className="logo" onClick={() => setPage('search')}>
            <div className="logo-icon"><IconPickaxe /></div>
            <span className="logo-name">Prospect<span>Miner</span> AI</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div className="nav-links">
              <button className={`nav-link ${page === 'search' ? 'active' : ''}`} onClick={() => setPage('search')}>
                <IconSearch /> New Search
              </button>
              <button className={`nav-link ${page === 'jobs' ? 'active' : ''}`} onClick={() => setPage('jobs')}>
                <IconHistory /> History
              </button>
              {activeJobId && (
                <>
                  <button className={`nav-link ${page === 'progress' ? 'active' : ''}`} onClick={() => setPage('progress')}>
                    <IconActivity /> Progress
                  </button>
                  <button className={`nav-link ${page === 'leads' ? 'active' : ''}`} onClick={() => setPage('leads')}>
                    <IconUsers /> Leads
                  </button>
                </>
              )}
            </div>

            <div className="nav-divider" />

            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '100px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center' }}>
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </span>
              <span style={{ display: 'none' }} className="theme-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <div className="nav-divider" />

            <div className="user-pill">
              <div className="avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
              <span className="user-name">{user?.name}</span>
              <button id="logout-btn" onClick={logout} className="btn btn-ghost btn-sm" style={{ gap: '5px' }}>
                <IconLogOut />
                <span style={{ fontSize: '0.8rem' }}>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Pages */}
      <main style={{ flex: 1 }}>
        {page === 'search'   && <SearchPage onJobStarted={goToProgress} showToast={showToast} />}
        {page === 'jobs'     && <JobsPage onViewProgress={goToProgress} onViewLeads={goToLeads} showToast={showToast} />}
        {page === 'progress' && activeJobId && <ProgressPage jobId={activeJobId} onViewLeads={() => goToLeads(activeJobId)} />}
        {page === 'leads'    && activeJobId && <LeadsPage jobId={activeJobId} showToast={showToast} />}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? <IconCheckCircle /> : <IconXCircle />}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Auth Gate ── */
function AuthGate() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  useTheme(); // apply saved theme on auth screens too

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #10B981, #34D399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(99,102,241,0.4)',
          animation: 'float 2s ease-in-out infinite',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
            <path d="M14.5 2.5c.83.83.83 2.17 0 3L7 13l-2-2 7.5-7.5c.83-.83 2.17-.83 3 0z"/>
          </svg>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }} className="animate-pulse">
          Loading ProspectMiner AI...
        </div>
      </div>
    );
  }

  if (!user) {
    return authPage === 'login'
      ? <LoginPage onGoRegister={() => setAuthPage('register')} />
      : <RegisterPage onGoLogin={() => setAuthPage('login')} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
