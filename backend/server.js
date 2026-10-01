require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const jobRoutes = require('./src/routes/jobs');
const authRoutes = require('./src/routes/auth');
const { protect } = require('./src/middleware/auth');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://prospect-miner-ai-ashy.vercel.app'; // Your live Vercel URL

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use('/exports', express.static('exports'));

// ── Public routes ──
app.use('/api/auth', authRoutes);

// ── Protected routes ──
app.use('/api/jobs', protect, jobRoutes);

// Root — API info
app.get('/', (_req, res) => res.json({
  name: 'ProspectMiner AI API',
  status: '🟢 Running',
  version: '1.0.0',
  frontend: FRONTEND_URL === '*' ? 'http://localhost:5173' : FRONTEND_URL,
  auth: {
    register: 'POST /api/auth/register',
    login: 'POST /api/auth/login',
    me: 'GET /api/auth/me  (Bearer token required)',
  },
  endpoints: {
    startJob: 'POST /api/jobs/start  🔒',
    listJobs: 'GET /api/jobs  🔒',
    progress: 'GET /api/jobs/:id/progress  🔒',
    leads: 'GET /api/jobs/:id/leads  🔒',
    export: 'GET /api/jobs/:id/export?format=csv|xlsx  🔒',
  },
}));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 ProspectMiner AI backend running on http://localhost:${PORT}`);
    console.log(`🔒 Auth routes: /api/auth/register  /api/auth/login`);
    console.log(`🛡️  Protected:   /api/jobs/* (requires Bearer token)\n`);
  });
});
