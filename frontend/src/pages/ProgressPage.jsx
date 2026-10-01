import { useEffect, useState, useRef } from 'react';
import { api } from '../api';

const STATUS_ICON = { completed: '✅', failed: '❌', enriching: '⏳', scraping: '🔍', pending: '⏸️', scoring: '🎯' };

export default function ProgressPage({ jobId, onViewLeads }) {
  const [job, setJob] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [allLeadsSample, setAllLeadsSample] = useState([]);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    let pollInterval = null;

    // Connect to SSE
    const es = new EventSource(api.getProgressUrl(jobId));
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setJob(data.job);
        if (data.recentLeads) setRecentLeads(data.recentLeads);
        if (data.job?.status === 'completed' || data.job?.status === 'failed') {
          if (data.job.status === 'completed') fetchSample();
          es.close();
          clearInterval(pollInterval);
        }
      } catch (_) {}
    };

    es.onerror = () => es.close();

    // Polling fallback — every 5s, check real job status from REST API
    // This catches the "completed" state even if SSE is dropped by Render's proxy
    pollInterval = setInterval(async () => {
      try {
        const jobData = await api.getJob(jobId);
        setJob(jobData);
        if (jobData?.status === 'completed' || jobData?.status === 'failed') {
          if (jobData.status === 'completed') fetchSample();
          clearInterval(pollInterval);
          es.close();
        }
      } catch (_) {}
    }, 5000);

    // Also poll job immediately
    api.getJob(jobId).then(setJob);

    return () => {
      es.close();
      clearInterval(pollInterval);
    };
  }, [jobId]);

  const fetchSample = async () => {
    const data = await api.getLeads(jobId, { limit: 5 });
    setAllLeadsSample(data.leads || []);
  };

  const pct = job ? Math.round(((job.processedLeads + job.failedLeads) / Math.max(job.totalLeads, 1)) * 100) : 0;
  const isRunning = job && ['queued', 'running'].includes(job.status);
  const isDone = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  const scoreCounts = allLeadsSample.reduce((acc, l) => {
    acc[l.qualificationScore] = (acc[l.qualificationScore] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container section">
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {isRunning && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
            {isDone && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />}
            {isFailed && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />}
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              {isDone ? '🎉 Mining Complete' : isFailed ? '❌ Job Failed' : '⛏️ Mining In Progress...'}
            </h2>
          </div>
          {job && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--accent-light)' }}>"{job.query}"</strong> in <strong style={{ color: 'var(--text-secondary)' }}>{job.location}</strong>
              &nbsp;· Job ID: <code style={{ fontSize: '0.8rem', opacity: 0.6 }}>{jobId.slice(0, 8)}...</code>
            </p>
          )}
        </div>

        {/* Stats */}
        {job && (
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-value">{job.totalLeads}</div>
              <div className="stat-label">Total Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{job.processedLeads}</div>
              <div className="stat-label">Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{job.failedLeads}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{pct}%</div>
              <div className="stat-label">Progress</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRunning ? 'Processing leads...' : isDone ? 'All leads processed' : 'Job status: ' + job?.status}
            </span>
            <span style={{ fontWeight: '700', color: 'var(--accent-light)' }}>
              {job?.processedLeads || 0} / {job?.totalLeads || '?'}
            </span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Live Leads Feed */}
        {recentLeads.length > 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', marginBottom: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              🔴 LIVE — Recent Leads
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentLeads.map((lead, i) => (
                <div key={i} className="live-lead-item">
                  <div>
                    <div className="live-lead-name">{lead.businessName}</div>
                    <div className="live-lead-status">{STATUS_ICON[lead.status] || '⏳'} {lead.status}</div>
                  </div>
                  {lead.qualificationScore && lead.qualificationScore !== 'Unscored' && (
                    <span className={`badge badge-${lead.qualificationScore?.toLowerCase()}`}>
                      {lead.qualificationScore}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done CTA */}
        {isDone && (
          <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Your leads are ready!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              {job.processedLeads} leads enriched and scored. {job.failedLeads > 0 ? `${job.failedLeads} failed.` : ''}
            </p>
            <button id="view-leads-btn" className="btn btn-primary btn-lg" onClick={onViewLeads}>
              View All Leads →
            </button>
          </div>
        )}

        {isFailed && (
          <div className="card" style={{ textAlign: 'center', padding: '40px', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
            <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>Job Failed</h3>
            <p style={{ color: 'var(--text-muted)' }}>{job?.errorMessage || 'An unexpected error occurred.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
