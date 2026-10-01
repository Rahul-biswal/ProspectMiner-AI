/**
 * searchService.js — Google Places API powered lead search
 * Replaces Puppeteer scraping with reliable, cloud-safe API calls.
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Perform a Google Places Text Search to get a list of matching places.
 */
async function textSearch(query, pageToken = null) {
  const params = new URLSearchParams({
    query,
    key: PLACES_API_KEY,
    ...(pageToken ? { pagetoken: pageToken } : {}),
  });

  const url = `${BASE_URL}/textsearch/json?${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Places Text Search failed: ${response.status}`);
  return response.json();
}

/**
 * Get phone number and website for a specific place by its place_id.
 */
async function getPlaceDetails(placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'formatted_phone_number,website,formatted_address',
    key: PLACES_API_KEY,
  });

  const url = `${BASE_URL}/details/json?${params}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return {};
    const data = await response.json();
    return data.result || {};
  } catch {
    return {};
  }
}

/**
 * Main function: search for business leads using Google Places API.
 */
async function searchLeads(query, location, maxResults = 20) {
  if (!PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables');
  }

  const searchTerm = `${query} in ${location}`;
  console.log(`\n🔍 Google Places API: "${searchTerm}" (max ${maxResults})`);

  const places = [];
  let pageToken = null;
  let pages = 0;
  const maxPages = Math.ceil(maxResults / 20); // Places API returns up to 20 per page

  // Fetch pages until we have enough results
  while (places.length < maxResults && pages < maxPages) {
    // Google requires a short delay before using next_page_token
    if (pageToken) await new Promise(r => setTimeout(r, 2000));

    const data = await textSearch(searchTerm, pageToken);

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Places API denied: ${data.error_message}`);
    }

    if (!data.results || data.results.length === 0) break;

    places.push(...data.results);
    pageToken = data.next_page_token || null;
    pages++;

    if (!pageToken) break;
  }

  const topPlaces = places.slice(0, maxResults);
  console.log(`  Found ${topPlaces.length} places from API`);

  // Fetch details (phone + website) in parallel batches of 10
  const BATCH = 10;
  const leads = [];

  for (let i = 0; i < topPlaces.length; i += BATCH) {
    const chunk = topPlaces.slice(i, i + BATCH);
    const detailResults = await Promise.all(
      chunk.map(place => getPlaceDetails(place.place_id))
    );

    chunk.forEach((place, idx) => {
      const details = detailResults[idx];
      const lead = {
        businessName: place.name || '',
        address: details.formatted_address || place.formatted_address || '',
        phoneNumber: details.formatted_phone_number || '',
        websiteUrl: details.website || '',
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || null,
      };
      leads.push(lead);
      console.log(`  ✔ ${lead.businessName} | 📞 ${lead.phoneNumber || '—'} | 🌐 ${lead.websiteUrl || '—'}`);
    });
  }

  console.log(`✅ Final: ${leads.length} leads\n`);
  return leads;
}

module.exports = { searchLeads };
