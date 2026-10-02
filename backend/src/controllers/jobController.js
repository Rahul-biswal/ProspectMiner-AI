const { v4: uuidv4 } = require('uuid');
const Job = require('../models/Job');
const Lead = require('../models/Lead');
const { searchLeads } = require('../services/searchService');
const { scrapeBusinessWebsite } = require('../services/stealthScraper');
const { enrichLead } = require('../services/enrichmentService');
const { scoreLead } = require('../services/scoringService');
const { getEmailIntelligence } = require('../services/emailService');
const { exportAsCSV, exportAsXLSX } = require('../services/exportService');
const path = require('path');

// In-memory SSE clients map: jobId → array of res objects
const sseClients = {};

function sendSSE(jobId) {
  // Push latest state to all connected SSE clients for this job
  return async () => {
    const clients = sseClients[jobId] || [];
    if (!clients.length) return;
    try {
      const job = await Job.findOne({ jobId });
      const recentLeads = await Lead.find({ jobId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('businessName qualificationScore status');
      const payload = JSON.stringify({ job, recentLeads });
      clients.forEach(res => { try { res.write(`data: ${payload}\n\n`); } catch (_) {} });
    } catch (_) {}
  };
}

/**
 * Run the full pipeline in the background (no Redis needed)
 */
async function runPipeline(jobId, query, location, maxResults) {
  const broadcast = sendSSE(jobId);

  try {
    await Job.findOneAndUpdate({ jobId }, { status: 'running' });
    await broadcast();

    // Step 1: Search
    let rawLeads = [];
    try {
      rawLeads = await searchLeads(query, location, maxResults);
    } catch (err) {
      await Job.findOneAndUpdate({ jobId }, { status: 'failed', errorMessage: err.message, completedAt: new Date() });
      await broadcast();
      return;
    }

    // Save raw leads
    const leadDocs = await Lead.insertMany(
      rawLeads.map(l => ({ ...l, jobId, query, location, status: 'pending' }))
    );
    await Job.findOneAndUpdate({ jobId }, { totalLeads: leadDocs.length });
    await broadcast();

    console.log(`📋 ${leadDocs.length} raw leads saved for job ${jobId}`);

    // Step 2: Process leads in parallel batches
    const CONCURRENCY = 3; // Reduced from 8 to prevent Render CPU/RAM exhaustion

    async function processLead(lead) {
      try {
        await Lead.findByIdAndUpdate(lead._id, { status: 'scraping' });

        const [scrapedData, emailResult] = await Promise.all([
          lead.websiteUrl
            ? scrapeBusinessWebsite(lead.websiteUrl)
            : Promise.resolve({ success: false, error: 'No website', url: '' }),
          getEmailIntelligence(lead.websiteUrl),
        ]);

        await Lead.findByIdAndUpdate(lead._id, { status: 'enriching' });

        const enrichment = await enrichLead({ businessName: lead.businessName, query }, scrapedData);

        await Lead.findByIdAndUpdate(lead._id, { status: 'scoring' });

        const { scoreBreakdown, qualificationScore } = await scoreLead(
          { businessName: lead.businessName, query, rating: lead.rating, reviewCount: lead.reviewCount, phoneNumber: lead.phoneNumber },
          scrapedData,
          enrichment
        );

        await Lead.findByIdAndUpdate(lead._id, {
          ...enrichment, scoreBreakdown, qualificationScore,
          emailFormats: emailResult.emailFormats,
          mxRecordValid: emailResult.mxRecordValid,
          status: 'completed',
        });

        await Job.findOneAndUpdate({ jobId }, { $inc: { processedLeads: 1 } });
        await broadcast();
        console.log(`✅ ${lead.businessName} → ${qualificationScore} (${scoreBreakdown.overallScore}/100)`);
      } catch (err) {
        console.error(`❌ ${lead.businessName}:`, err.message);
        await Lead.findByIdAndUpdate(lead._id, { status: 'failed', errorMessage: err.message });
        await Job.findOneAndUpdate({ jobId }, { $inc: { failedLeads: 1 } });
        await broadcast();
      }
    }

    // Chunk leads into batches and run each batch concurrently
    for (let i = 0; i < leadDocs.length; i += CONCURRENCY) {
      // Check if job was cancelled
      const currentJob = await Job.findOne({ jobId });
      if (currentJob && currentJob.status === 'cancelled') {
        console.log(`🛑 Job ${jobId} cancelled by user.`);
        await broadcast();
        return; // Stop pipeline
      }

      const batch = leadDocs.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(lead => processLead(lead)));
      await broadcast();
    }

    await Job.findOneAndUpdate({ jobId }, { status: 'completed', completedAt: new Date() });
    await broadcast();
    console.log(`🎉 Job ${jobId} complete!`);

    // Clean up SSE clients
    delete sseClients[jobId];
  } catch (err) {
    console.error('Pipeline error:', err.message);
    await Job.findOneAndUpdate({ jobId }, { status: 'failed', errorMessage: err.message, completedAt: new Date() });
    await broadcast();
  }
}

// POST /api/jobs/start
async function startJob(req, res) {
  const { query, location, maxResults = 20 } = req.body;
  if (!query || !location) return res.status(400).json({ error: 'query and location are required' });

  const jobId = uuidv4();
  await Job.create({ jobId, query, location, maxResults: Math.min(parseInt(maxResults), 100), status: 'queued' });

  // Fire pipeline in background (non-blocking)
  runPipeline(jobId, query, location, Math.min(parseInt(maxResults), 100));

  res.json({ jobId, message: 'Job started', query, location });
}

// GET /api/jobs/:jobId
async function getJob(req, res) {
  const job = await Job.findOne({ jobId: req.params.jobId });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
}

// GET /api/jobs/:jobId/progress — SSE stream
async function getJobProgress(req, res) {
  const { jobId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering on Render
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  if (!sseClients[jobId]) sseClients[jobId] = [];
  sseClients[jobId].push(res);

  // Send current state immediately
  try {
    const job = await Job.findOne({ jobId });
    const recentLeads = await Lead.find({ jobId }).sort({ updatedAt: -1 }).limit(5).select('businessName qualificationScore status');
    res.write(`data: ${JSON.stringify({ job, recentLeads })}\n\n`);
  } catch (_) {}

  // Heartbeat every 20s to keep connection alive through Render's proxy
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) { clearInterval(heartbeat); }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients[jobId] = (sseClients[jobId] || []).filter(c => c !== res);
  });
}

// GET /api/jobs/:jobId/leads
async function getJobLeads(req, res) {
  const { jobId } = req.params;
  const { score, page = 1, limit = 50 } = req.query;
  const filter = { jobId };
  if (score) filter.qualificationScore = score;
  const leads = await Lead.find(filter).sort({ 'scoreBreakdown.overallScore': -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
  const total = await Lead.countDocuments(filter);
  res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
}

// GET /api/jobs/leads/:id  (individual lead)
async function getLead(req, res) {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
}

// GET /api/jobs/:jobId/export
async function exportLeads(req, res) {
  const { jobId } = req.params;
  const { format = 'csv' } = req.query;
  const leads = await Lead.find({ jobId }).sort({ 'scoreBreakdown.overallScore': -1 });
  if (!leads.length) return res.status(404).json({ error: 'No leads found' });
  let filePath;
  if (format === 'xlsx') {
    filePath = await exportAsXLSX(leads, jobId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } else {
    filePath = await exportAsCSV(leads, jobId);
    res.setHeader('Content-Type', 'text/csv');
  }
  res.setHeader('Content-Disposition', `attachment; filename="leads_${jobId}.${format}"`);
  res.sendFile(path.resolve(filePath));
}

// DELETE /api/jobs/:jobId
async function deleteJob(req, res) {
  const { jobId } = req.params;
  await Job.findOneAndDelete({ jobId });
  await Lead.deleteMany({ jobId });
  res.json({ message: 'Deleted' });
}

// GET /api/jobs
async function listJobs(req, res) {
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(20);
  res.json(jobs);
}

// POST /api/jobs/:jobId/cancel
async function cancelJob(req, res) {
  const { jobId } = req.params;
  const job = await Job.findOne({ jobId });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status === 'running' || job.status === 'queued') {
    job.status = 'cancelled';
    await job.save();
    return res.json({ message: 'Job cancelled' });
  }
  res.status(400).json({ error: 'Job is not running' });
}

module.exports = { startJob, getJob, getJobProgress, getJobLeads, getLead, exportLeads, deleteJob, listJobs, cancelJob };
