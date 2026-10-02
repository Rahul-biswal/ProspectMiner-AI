import { useEffect, useState } from 'react';
import { api } from '../api';
import LeadModal from '../components/LeadModal';

const SCORE_FILTERS = ['All', 'High', 'Medium', 'Low'];

export default function LeadsPage({ jobId, showToast }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getJob(jobId).then(setJob);
    loadLeads();
  }, [jobId, filter]);

  const loadLeads = async () => {
    setLoading(true);
    const data = await api.getLeads(jobId, { score: filter === 'All' ? undefined : filter });
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const handleExport = (format) => {
    window.open(api.getExportUrl(jobId, format), '_blank');
    showToast(`Downloading ${format.toUpperCase()} export...`);
  };

  const counts = { All: total };
  leads.forEach(l => { counts[l.qualificationScore] = (counts[l.qualificationScore] || 0) + 1; });

  return (
    <div className="container section">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>
            🎯 Leads
            {job && <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '1rem' }}>
              &nbsp;— "{job.query}" in {job.location}
            </span>}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{total} leads found</p>
        </div>
      </div>

      {/* Download Hub Card */}
      <div className="card download-hub" style={{ marginBottom: '24px', padding: '16px 24px', background: 'linear-gradient(to right, var(--bg-card), var(--bg-secondary))' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '4px' }}>Download Hub</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Export your enriched leads directly to your CRM or spreadsheet.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="export-csv-btn" className="btn btn-secondary" onClick={() => handleExport('csv')} style={{ background: 'var(--bg-card)', padding: '8px 16px' }}>
            <span style={{ marginRight: '6px' }}>📊</span> Export CSV
          </button>
          <button id="export-xlsx-btn" className="btn btn-primary" onClick={() => handleExport('xlsx')} style={{ padding: '8px 16px' }}>
            <span style={{ marginRight: '6px' }}>📈</span> Export Excel
          </button>
        </div>
      </div>

      {/* Score summary */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        {['High', 'Medium', 'Low'].map((s) => {
          const c = leads.filter(l => l.qualificationScore === s).length;
          return (
            <div key={s} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(s)}>
              <div className="stat-value" style={{ color: s === 'High' ? 'var(--success)' : s === 'Medium' ? 'var(--warning)' : 'var(--danger)' }}>{c}</div>
              <div className="stat-label">{s} Priority</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: '16px' }}>
        {SCORE_FILTERS.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><div className="animate-pulse" style={{ fontSize: '2rem' }}>⏳</div><p>Loading leads...</p></div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No leads found</div>
          <div className="empty-text">Try a different filter or wait for the job to complete.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Score</th>
                <th>Score Pts</th>
                <th>Services</th>
                <th>Website</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td className="name-cell" style={{ maxWidth: '200px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lead.businessName}</div>
                    {lead.phoneNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phoneNumber}</div>}
                  </td>
                  <td style={{ maxWidth: '160px', fontSize: '0.8rem' }}>{lead.address || lead.location || '—'}</td>
                  <td>
                    {lead.rating ? (
                      <span style={{ color: 'var(--warning)', fontWeight: '700' }}>⭐ {lead.rating}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${lead.qualificationScore?.toLowerCase() || 'pending'}`}>
                      {lead.qualificationScore || 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    {lead.scoreBreakdown?.overallScore ?? '—'}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <div className="tags">
                      {(lead.servicesOffered || []).slice(0, 2).map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                      {lead.servicesOffered?.length > 2 && (
                        <span className="tag" style={{ opacity: 0.6 }}>+{lead.servicesOffered.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {lead.websiteUrl ? (
                      <a href={lead.websiteUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent-light)', fontSize: '0.8rem', textDecoration: 'none' }}>
                        🔗 Visit
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLead(lead)}>
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} showToast={showToast} />}
    </div>
  );
}
