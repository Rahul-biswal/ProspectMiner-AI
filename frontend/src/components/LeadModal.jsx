export default function LeadModal({ lead, onClose, showToast }) {
  const scoreColor = { High: 'var(--success)', Medium: 'var(--warning)', Low: 'var(--danger)' };
  const bd = lead.scoreBreakdown || {};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const scoreDimensions = [
    { label: 'Website Quality', value: bd.websiteQuality || 0, max: 30 },
    { label: 'Keyword Density', value: bd.keywordDensity || 0, max: 25 },
    { label: 'Query Match', value: bd.queryMatchScore || 0, max: 30 },
    { label: 'Business Signals', value: bd.businessSignals || 0, max: 15 },
  ];

  const initials = (lead.businessName || 'B').substring(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cover Photo / Header Banner */}
        <div style={{ height: '100px', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)', position: 'relative' }}>
          <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '0 32px 32px', display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '-40px', position: 'relative' }}>
          
          {/* Left Column (Profile & Contact) */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Avatar & Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--bg-card)', border: '4px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)', boxShadow: 'var(--shadow-card)', marginBottom: '12px' }}>
                {initials}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '8px' }}>{lead.businessName}</h2>
              <span className={`badge badge-${lead.qualificationScore?.toLowerCase() || 'pending'}`} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                {lead.qualificationScore || 'Unscored'} Priority
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {lead.websiteUrl && (
                <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1 }}>
                  🌐 Visit Site
                </a>
              )}
              {lead.phoneNumber && (
                <a href={`tel:${lead.phoneNumber.replace(/\D/g, '')}`} className="btn btn-secondary" style={{ flex: 1 }}>
                  📞 Call
                </a>
              )}
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

            {/* Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Location</div>
                <div style={{ color: 'var(--text-secondary)' }}>{lead.address || 'Not available'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Phone</div>
                <div style={{ color: 'var(--text-secondary)' }}>{lead.phoneNumber || 'Not available'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Google Rating</div>
                <div style={{ color: 'var(--warning)', fontWeight: 700 }}>{lead.rating ? `⭐ ${lead.rating}` : 'No rating'}</div>
              </div>
            </div>

            {/* Extracted Emails */}
            {lead.emailFormats?.length > 0 && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Generated Emails</div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: lead.mxRecordValid ? 'var(--success-light)' : 'var(--danger-light)', color: lead.mxRecordValid ? 'var(--success)' : 'var(--danger)' }}>
                    MX {lead.mxRecordValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {lead.emailFormats.slice(0, 3).map((em, i) => (
                    <div key={i} onClick={() => copyToClipboard(em)} style={{ fontSize: '0.8rem', color: 'var(--accent-2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                      {em} <span style={{ opacity: 0.5 }}>⎘</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Insights & Scoring) */}
          <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '52px' }}>
            
            {/* AI Summary */}
            {lead.aiSummary && (
              <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>🤖 AI Executive Summary</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>{lead.aiSummary}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Score Ring */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={scoreColor[lead.qualificationScore] || 'var(--text-muted)'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(bd.overallScore / 100) * 264} 264`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: scoreColor[lead.qualificationScore] || 'var(--text-primary)' }}>{bd.overallScore || 0}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Qualification Score</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Algorithmically determined by 4 distinct ranking metrics.</div>
                </div>
              </div>

              {/* Score Breakdown Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                {scoreDimensions.map((dim) => (
                  <div key={dim.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{dim.label}</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dim.value}/{dim.max}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${(dim.value / dim.max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: '100px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags & Services */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Detected Services</div>
                {lead.servicesOffered?.length ? (
                  <div className="tags">{lead.servicesOffered.map((s, i) => <span key={i} className="tag">{s}</span>)}</div>
                ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Key Insights</div>
                {lead.keyInsights?.length ? (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0, padding: 0 }}>
                    {lead.keyInsights.map((ins, i) => (
                      <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--success)' }}>✦</span> {ins}
                      </li>
                    ))}
                  </ul>
                ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
