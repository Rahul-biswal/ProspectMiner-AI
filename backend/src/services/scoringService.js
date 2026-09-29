/**
 * scoringService.js — Local lead scoring (no OpenAI needed)
 * Pure algorithmic scoring across 4 dimensions: 0–100 scale.
 */

// ── Score: Website quality (0–30) ───────────────────────────────────────────
function scoreWebsiteQuality(scrapedData) {
  if (!scrapedData || !scrapedData.success) return 0;
  let score = 0;
  if (scrapedData.url?.startsWith('https')) score += 10;
  if (scrapedData.content?.length > 500)   score += 8;
  if (scrapedData.content?.length > 2000)  score += 7;
  if (scrapedData.meta?.description?.length > 20) score += 5;
  return Math.min(30, score);
}

// ── Score: Keyword density match (0–25) ─────────────────────────────────────
function scoreKeywordDensity(content = '', query = '') {
  if (!content || !query) return 0;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const contentLower = content.toLowerCase();
  const hits = queryWords.filter(word => contentLower.includes(word)).length;
  if (queryWords.length === 0) return 0;
  return Math.round((hits / queryWords.length) * 25);
}

// ── Score: Business signals (0–15) ──────────────────────────────────────────
function scoreBusinessSignals(lead) {
  let score = 0;
  if (lead.rating && parseFloat(lead.rating) >= 4.5) score += 10;
  else if (lead.rating && parseFloat(lead.rating) >= 4.0) score += 7;
  else if (lead.rating && parseFloat(lead.rating) >= 3.5) score += 4;
  if (lead.reviewCount && parseInt(lead.reviewCount) >= 50) score += 5;
  else if (lead.reviewCount && parseInt(lead.reviewCount) >= 10) score += 3;
  if (lead.phoneNumber) score += 3;
  return Math.min(15, score);
}

// ── Score: Query ↔ enrichment alignment (0–30) ──────────────────────────────
function scoreQueryMatch(lead, enrichment) {
  if (!enrichment) return 10;

  let score = 0;
  const query = (lead.query || '').toLowerCase();
  const queryWords = query.split(/\s+/).filter(w => w.length > 3);

  // Services match
  const allEnrichmentText = [
    ...(enrichment.servicesOffered || []),
    ...(enrichment.specializations || []),
    enrichment.aiSummary || '',
    enrichment.queryRelevanceExplanation || '',
  ].join(' ').toLowerCase();

  const hits = queryWords.filter(w => allEnrichmentText.includes(w)).length;
  if (queryWords.length > 0) {
    score += Math.round((hits / queryWords.length) * 18);
  } else {
    score += 10;
  }

  // Services breadth bonus
  const serviceCount = enrichment.servicesOffered?.length || 0;
  if (serviceCount >= 5) score += 8;
  else if (serviceCount >= 3) score += 5;
  else if (serviceCount >= 1) score += 2;

  // Insights bonus
  const insightCount = enrichment.keyInsights?.length || 0;
  if (insightCount >= 3) score += 4;
  else if (insightCount >= 1) score += 2;

  return Math.min(30, score);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function scoreLead(lead, scrapedData, enrichment) {
  const websiteQuality  = scoreWebsiteQuality(scrapedData);
  const keywordDensity  = scoreKeywordDensity(scrapedData?.content, lead.query);
  const businessSignals = scoreBusinessSignals(lead);
  const queryMatchScore = scoreQueryMatch(lead, enrichment);

  const overallScore = websiteQuality + keywordDensity + businessSignals + queryMatchScore;

  let qualificationScore;
  if (overallScore >= 70)      qualificationScore = 'High';
  else if (overallScore >= 40) qualificationScore = 'Medium';
  else                         qualificationScore = 'Low';

  return {
    scoreBreakdown: { websiteQuality, keywordDensity, queryMatchScore, businessSignals, overallScore },
    qualificationScore,
  };
}

module.exports = { scoreLead };
