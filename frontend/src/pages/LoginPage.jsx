import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const IconPickaxe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
    <path d="M14.5 2.5c.83.83.83 2.17 0 3L7 13l-2-2 7.5-7.5c.83-.83 2.17-.83 3 0z"/>
    <path d="m5 11-3 3 1.5 1.5L6 13l-1-2z"/>
    <path d="M15 9l4.5 4.5-2 2L13 11"/>
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.card} className="animate-slide-up">
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}><IconPickaxe /></div>
          <span style={styles.logoText}>
            Prospect<span style={{ color: 'var(--accent-2)' }}>Miner</span> AI
          </span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to continue mining qualified leads</p>

        {error && (
          <div style={styles.errorBox}>
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconMail /> Email address
              </span>
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconLock /> Password
              </span>
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-cta btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? (
              <><div className="btn-spinner" /> Signing in...</>
            ) : (
              <>Sign In <IconArrow /></>
            )}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <button onClick={onGoRegister} style={styles.switchLink}>
            Create one free →
          </button>
        </p>

        {/* Trust badges */}
        <div style={styles.trustRow}>
          {['AI-Powered', 'Secure & Encrypted', 'No CC Required'].map(t => (
            <span key={t} style={styles.trustBadge}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed', top: '-10%', left: '-10%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-10%', right: '-10%',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-2xl)',
    padding: '44px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-card), 0 0 0 1px rgba(99,102,241,0.06)',
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '38px', height: '38px', borderRadius: '11px',
    background: 'linear-gradient(135deg, #10B981, #34D399)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 22px rgba(99,102,241,0.4)',
    color: 'white',
  },
  logoText: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  title: { fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.03em' },
  subtitle: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
    color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '8px',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '20px 0 16px',
  },
  dividerText: {
    color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 4px',
    background: 'transparent',
    position: 'relative',
    '&::before': { content: '""' },
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem', color: 'var(--text-muted)',
  },
  switchLink: {
    background: 'none', border: 'none', color: 'var(--accent-2)',
    cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
    padding: 0, fontFamily: 'inherit', transition: 'var(--t)',
  },
  trustRow: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    justifyContent: 'center', marginTop: '24px',
  },
  trustBadge: {
    padding: '3px 10px', borderRadius: '100px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
  },
};
