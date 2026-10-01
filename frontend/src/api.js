const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://prospectminer-ai.onrender.com' : 'http://localhost:3001');

// Read token from localStorage
function getToken() {
  return localStorage.getItem('pm_token');
}

// Build headers with auth token
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const api = {
  // ── Auth ──
  register: (name, email, password, inviteCode = '') =>
    fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, inviteCode }),
    }).then(r => r.json()),


  login: (email, password) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  getMe: () =>
    fetch(`${API_BASE}/api/auth/me`, {
      headers: authHeaders(),
    }).then(r => r.json()),

  // ── Jobs (all protected) ──
  startJob: (query, location, maxResults) =>
    fetch(`${API_BASE}/api/jobs/start`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ query, location, maxResults }),
    }).then(r => r.json()),

  getJob: (jobId) =>
    fetch(`${API_BASE}/api/jobs/${jobId}`, {
      headers: authHeaders(),
    }).then(r => r.json()),

  listJobs: () =>
    fetch(`${API_BASE}/api/jobs`, {
      headers: authHeaders(),
    }).then(r => r.json()),

  getLeads: (jobId, { score, page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (score) params.set('score', score);
    return fetch(`${API_BASE}/api/jobs/${jobId}/leads?${params}`, {
      headers: authHeaders(),
    }).then(r => r.json());
  },

  getLead: (id) =>
    fetch(`${API_BASE}/api/jobs/leads/${id}`, {
      headers: authHeaders(),
    }).then(r => r.json()),

  deleteJob: (jobId) =>
    fetch(`${API_BASE}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(r => r.json()),

  getExportUrl: (jobId, format = 'csv') => {
    const token = getToken();
    return `${API_BASE}/api/jobs/${jobId}/export?format=${format}&token=${token}`;
  },

  getProgressUrl: (jobId) => {
    const token = getToken();
    return `${API_BASE}/api/jobs/${jobId}/progress?token=${token}`;
  },
};
