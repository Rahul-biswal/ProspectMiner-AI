/**
 * enrichmentService.js — Local NLP enrichment (no OpenAI needed)
 * Extracts structured data from scraped website content using
 * keyword matching, regex patterns, and heuristics.
 */

// ── Keyword dictionaries ────────────────────────────────────────────────────

const SERVICE_KEYWORDS = {
  'Consulting': ['consult', 'advisory', 'strategy', 'audit', 'assessment', 'analysis'],
  'Design': ['design', 'branding', 'logo', 'ui/ux', 'creative', 'graphics', 'visual'],
  'Development': ['develop', 'software', 'web app', 'mobile app', 'coding', 'programming', 'engineering'],
  'Marketing': ['marketing', 'seo', 'social media', 'ppc', 'advertising', 'campaign', 'digital marketing'],
  'Sales': ['sales', 'crm', 'lead generation', 'outreach', 'business development'],
  'HR & Staffing': ['recruitment', 'staffing', 'hr', 'human resources', 'hiring', 'talent'],
  'Finance': ['accounting', 'bookkeeping', 'tax', 'financial', 'payroll', 'cpa', 'audit'],
  'Legal': ['legal', 'law', 'attorney', 'counsel', 'compliance', 'contract'],
  'Healthcare': ['health', 'medical', 'dental', 'clinic', 'therapy', 'patient', 'wellness'],
  'Real Estate': ['real estate', 'property', 'realty', 'mortgage', 'housing', 'leasing'],
  'Fitness': ['gym', 'fitness', 'personal training', 'workout', 'exercise', 'yoga', 'pilates'],
  'Education': ['training', 'course', 'tutoring', 'education', 'certification', 'coaching'],
  'IT Support': ['it support', 'managed services', 'helpdesk', 'network', 'cybersecurity', 'cloud'],
  'Construction': ['construction', 'renovation', 'contractor', 'remodeling', 'plumbing', 'electrical', 'roofing'],
  'Cleaning': ['cleaning', 'janitorial', 'housekeeping', 'maid', 'sanitation'],
  'Food & Beverage': ['restaurant', 'catering', 'food', 'bakery', 'cafe', 'menu', 'cuisine'],
  'Logistics': ['logistics', 'shipping', 'delivery', 'freight', 'supply chain', 'transportation'],
  'E-commerce': ['e-commerce', 'online store', 'shopify', 'amazon', 'marketplace', 'retail'],
  'Photography': ['photography', 'videography', 'photo', 'video', 'studio', 'media'],
  'Security': ['security', 'surveillance', 'alarm', 'guard', 'cctv'],
};

const CERTIFICATION_PATTERNS = [
  /\b(iso\s*\d{4,5})\b/gi,
  /\b(certified\s+[a-z\s]+(?:professional|specialist|expert|consultant))\b/gi,
  /\b(bbb\s+accredited|better business bureau)\b/gi,
  /\b(licensed\s+(?:and|&)?\s*(?:insured|bonded))\b/gi,
  /\b(google\s+(?:partner|certified))\b/gi,
  /\b(microsoft\s+(?:partner|certified))\b/gi,
  /\b(award[\s-]winning)\b/gi,
  /\b(family[\s-]owned)\b/gi,
  /\b(\d+\+?\s*years?\s+(?:of\s+)?(?:experience|in\s+business|serving))\b/gi,
];

const INSIGHT_PATTERNS = [
  { pattern: /free\s+(?:consultation|estimate|quote|assessment)/gi, template: 'Offers free consultation/quote' },
  { pattern: /24\/?7|twenty[\s-]four\s+hours?|around[\s-]the[\s-]clock/gi, template: 'Available 24/7' },
  { pattern: /same[\s-]day\s+(?:service|delivery|appointment)/gi, template: 'Same-day service available' },
  { pattern: /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|in\s+business)/gi, template: 'Experienced business ($0)' },
  { pattern: /emergency\s+(?:service|repair|support)/gi, template: 'Emergency services offered' },
  { pattern: /financing\s+(?:available|options)|payment\s+plan/gi, template: 'Financing/payment plans available' },
  { pattern: /(?:residential|commercial)\s+(?:and|&)\s+(?:residential|commercial)/gi, template: 'Serves both residential and commercial clients' },
  { pattern: /satisfaction\s+guaranteed|money[\s-]back\s+guarantee/gi, template: 'Satisfaction guaranteed' },
  { pattern: /locally\s+owned|local\s+business|locally\s+operated/gi, template: 'Locally owned and operated' },
  { pattern: /veteran[\s-]owned|minority[\s-]owned|woman[\s-]owned/gi, template: 'Specialty-owned business' },
  { pattern: /open\s+(?:monday|7\s+days)/gi, template: 'Open Monday–Sunday (7 days)' },
  { pattern: /online\s+(?:booking|scheduling|appointment)/gi, template: 'Online booking available' },
];

// ── Core extraction functions ────────────────────────────────────────────────

function extractServices(content = '', title = '', description = '') {
  const combined = `${title} ${description} ${content}`.toLowerCase();
  const found = [];
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) {
      found.push(service);
    }
  }
  return found.slice(0, 8);
}

function extractCertifications(content = '') {
  const found = new Set();
  for (const pattern of CERTIFICATION_PATTERNS) {
    const matches = content.match(pattern) || [];
    matches.forEach(m => found.add(m.trim()));
  }
  return [...found].slice(0, 5);
}

function extractKeyInsights(content = '') {
  const found = [];
  for (const { pattern, template } of INSIGHT_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      const insight = template.replace('$0', match[1] || match[0]);
      found.push(insight.charAt(0).toUpperCase() + insight.slice(1));
    }
  }
  return [...new Set(found)].slice(0, 5);
}

function extractSpecializations(content = '', query = '') {
  const specs = [];
  const lower = content.toLowerCase();
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Location-specific serving
  const locationMatch = content.match(/serving\s+([A-Z][a-zA-Z\s,]+(?:area|region|county)?)/);
  if (locationMatch) specs.push(`Serving ${locationMatch[1].trim()}`);

  // Client type
  if (lower.includes('small business')) specs.push('Small business specialist');
  if (lower.includes('enterprise') || lower.includes('fortune')) specs.push('Enterprise-level clients');
  if (lower.includes('startup')) specs.push('Startup-focused');
  if (lower.includes('non-profit') || lower.includes('nonprofit')) specs.push('Non-profit experience');

  // Query-specific keyword match
  queryWords.forEach(word => {
    const regex = new RegExp(`(\\w+\\s+)?${word}(\\s+\\w+)?`, 'gi');
    const matches = content.match(regex) || [];
    if (matches.length > 2) specs.push(`Specializes in ${word}`);
  });

  return [...new Set(specs)].slice(0, 4);
}

function buildSummary(businessName, title, description, services, content) {
  // Use meta description if available and substantial
  if (description && description.length > 60) {
    return description.trim();
  }
  // Build from title + services
  const serviceList = services.slice(0, 3).join(', ') || 'various services';
  if (title && title.length > 10) {
    return `${businessName} offers ${serviceList}. ${title.replace(/\s*[-|].*$/, '').trim()}.`;
  }
  // Extract first meaningful sentence from content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 40);
  if (sentences.length > 0) {
    return sentences[0].trim() + '.';
  }
  return `${businessName} provides professional ${serviceList}.`;
}

function buildQueryRelevance(services, query, content) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  const contentLower = content.toLowerCase();
  const hits = queryWords.filter(w => contentLower.includes(w)).length;
  const ratio = queryWords.length ? hits / queryWords.length : 0;

  if (ratio >= 0.8 || services.length > 3) {
    return `Strong match — website content closely aligns with "${query}".`;
  } else if (ratio >= 0.4 || services.length > 1) {
    return `Partial match — business offers some services relevant to "${query}".`;
  } else {
    return `Low match — limited alignment found with "${query}" in website content.`;
  }
}

// ── Main export ─────────────────────────────────────────────────────────────

async function enrichLead(lead, scrapedData) {
  if (!scrapedData.success || !scrapedData.content) {
    return {
      servicesOffered: [],
      specializations: [],
      certifications: [],
      aiSummary: `${lead.businessName} — website content unavailable for analysis.`,
      keyInsights: [],
      queryRelevanceExplanation: 'No website data available.',
    };
  }

  const { content, meta } = scrapedData;
  const title = meta?.title || '';
  const description = meta?.description || '';
  const query = lead.query || '';

  const servicesOffered = extractServices(content, title, description);
  const certifications = extractCertifications(content);
  const keyInsights = extractKeyInsights(content);
  const specializations = extractSpecializations(content, query);
  const aiSummary = buildSummary(lead.businessName, title, description, servicesOffered, content);
  const queryRelevanceExplanation = buildQueryRelevance(servicesOffered, query, content);

  console.log(`  🔍 Enriched ${lead.businessName}: ${servicesOffered.length} services, ${keyInsights.length} insights`);

  return { servicesOffered, specializations, certifications, aiSummary, keyInsights, queryRelevanceExplanation };
}

module.exports = { enrichLead };
