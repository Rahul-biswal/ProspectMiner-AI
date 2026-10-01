/**
 * searchService.js — Google Places API (New) powered lead search
 * Uses the modern Places API v1 endpoints.
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1/places';

/**
 * Perform a Text Search using the new Places API.
 */
async function textSearch(query, pageToken = null) {
  const body = { textQuery: query, maxResultCount: 20 };
  if (pageToken) body.pageToken = pageToken;

  const response = await fetch(`${BASE_URL}:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Places API (New) TextSearch failed: ${err?.error?.message || response.status}`);
  }
  return response.json();
}

/**
 * Main function: search for business leads using Google Places API (New).
 */
async function searchLeads(query, location, maxResults = 20) {
  if (!PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables');
  }

  const searchTerm = `${query} in ${location}`;
  console.log(`\n🔍 Google Places API (New): "${searchTerm}" (max ${maxResults})`);

  const places = [];
  let pageToken = null;
  const maxPages = Math.ceil(maxResults / 20);

  for (let page = 0; page < maxPages && places.length < maxResults; page++) {
    // Google requires a short delay before using nextPageToken
    if (pageToken) await new Promise(r => setTimeout(r, 2000));

    const data = await textSearch(searchTerm, pageToken);

    if (!data.places || data.places.length === 0) break;

    places.push(...data.places);
    pageToken = data.nextPageToken || null;
    if (!pageToken) break;
  }

  const topPlaces = places.slice(0, maxResults);
  console.log(`  Found ${topPlaces.length} places from API`);

  // Map API response to lead schema — phone & website already included in Text Search response
  const leads = topPlaces.map(place => {
    const lead = {
      businessName: place.displayName?.text || '',
      address: place.formattedAddress || '',
      phoneNumber: place.nationalPhoneNumber || '',
      websiteUrl: place.websiteUri || '',
      rating: place.rating || null,
      reviewCount: place.userRatingCount || null,
    };
    console.log(`  ✔ ${lead.businessName} | 📞 ${lead.phoneNumber || '—'} | 🌐 ${lead.websiteUrl || '—'}`);
    return lead;
  });

  console.log(`✅ Final: ${leads.length} leads\n`);
  return leads;
}

module.exports = { searchLeads };
