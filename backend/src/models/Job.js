const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobId:          { type: String, required: true, unique: true },
  query:          { type: String, required: true },
  location:       { type: String },
  maxResults:     { type: Number, default: 20 },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued',
  },
  totalLeads:     { type: Number, default: 0 },
  processedLeads: { type: Number, default: 0 },
  failedLeads:    { type: Number, default: 0 },
  completedAt:    { type: Date },
  errorMessage:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
