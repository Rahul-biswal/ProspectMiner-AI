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

// Global fetch wrapper to handle session expiration (401 Unauthorized)
async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    window.location.href = '/login'; // Force redirect to login
    throw new Error('Session expired');
  }
  return response.json();
}

export const api = {
  // ── Auth ──
  register: (name, email, password, inviteCode = '') =>
    apiFetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, inviteCode }),
    }),

  login: (email, password) =>
    apiFetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    apiFetch(`${API_BASE}/api/auth/me`, {
      headers: authHeaders(),
    }),

  // ── Jobs (all protected) ──
  startJob: (query, location, maxResults) =>
    apiFetch(`${API_BASE}/api/jobs/start`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ query, location, maxResults }),
    }),

  getJob: (jobId) =>
    apiFetch(`${API_BASE}/api/jobs/${jobId}`, {
      headers: authHeaders(),
    }),

  listJobs: () =>
    apiFetch(`${API_BASE}/api/jobs`, {
      headers: authHeaders(),
    }),

  getLeads: (jobId, { score, page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (score) params.set('score', score);
    return apiFetch(`${API_BASE}/api/jobs/${jobId}/leads?${params}`, {
      headers: authHeaders(),
    });
  },

  getLead: (id) =>
    apiFetch(`${API_BASE}/api/jobs/leads/${id}`, {
      headers: authHeaders(),
    }),

  deleteJob: (jobId) =>
    apiFetch(`${API_BASE}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  getExportUrl: (jobId, format = 'csv') => {
    const token = getToken();
    return `${API_BASE}/api/jobs/${jobId}/export?format=${format}&token=${token}`;
  },

  getProgressUrl: (jobId) => {
    const token = getToken();
    return `${API_BASE}/api/jobs/${jobId}/progress?token=${token}`;
  },
};
