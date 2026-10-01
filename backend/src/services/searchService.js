const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomUserAgent, randomBetween, delay } = require('../utils/helpers');

puppeteer.use(StealthPlugin());

/**
 * Launch a stealth browser instance
 */
// Detect if running on Windows (local dev) to use system Edge
const IS_WINDOWS = process.platform === 'win32';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function launchBrowser() {
  let executablePath;
  if (IS_WINDOWS) {
    const fs = require('fs');
    if (fs.existsSync(EDGE_PATH)) {
      executablePath = EDGE_PATH;
      console.log('🌐 Using system Microsoft Edge for scraping');
    }
  }
  // On Linux/cloud: use Puppeteer bundled Chromium with full sandbox flags
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--lang=en-US,en',
      '--single-process',
      '--no-zygote',
    ],
  });
}

/**
 * Extract details from a single Google Maps place page.
 * Tries multiple selector strategies with proper waiting.
 */
async function extractPlaceDetails(browser, mapsUrl) {
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // Block unnecessary resources (Maps tiles, images, etc.) for massive speedup
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'websocket'];
    if (blockedTypes.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Build full URL (handle both relative and absolute)
  const fullUrl = mapsUrl.startsWith('http')
    ? mapsUrl
    : `https://www.google.com${mapsUrl}`;

  try {
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    // Wait briefly for hydration
    await new Promise(r => setTimeout(r, 1000));

    // Wait for the info panel to settle (the buttons with aria-labels appear)
    try {
      await page.waitForSelector('button[aria-label], a[aria-label]', { timeout: 5000 });
    } catch (_) { /* proceed anyway */ }


    const details = await page.evaluate(() => {
      let website = '';
      let phone = '';
      let address = '';

      // ── Strategy 1: aria-label on buttons and links ──
      document.querySelectorAll('button[aria-label], a[aria-label]').forEach((el) => {
        const lbl = (el.getAttribute('aria-label') || '').trim();
        if (!phone && /^Phone:/i.test(lbl)) {
          phone = lbl.replace(/^Phone:\s*/i, '').trim();
        }
        if (!address && /^Address:/i.test(lbl)) {
          address = lbl.replace(/^Address:\s*/i, '').trim();
        }
      });

      // ── Strategy 2: data-item-id attributes ──
      // Website
      const websiteAnchor = document.querySelector('a[data-item-id="authority"]');
      if (websiteAnchor) website = websiteAnchor.href || '';

      // Phone via data-item-id
      if (!phone) {
        const phoneEl = document.querySelector('[data-item-id*="phone:tel:"], [data-item-id*="phone"]');
        if (phoneEl) {
          const lbl = phoneEl.getAttribute('aria-label') || phoneEl.textContent || '';
          phone = lbl.replace(/^Phone:\s*/i, '').trim();
        }
      }

      // Address via data-item-id
      if (!address) {
        const addrEl = document.querySelector('[data-item-id="address"], [data-item-id*="address"]');
        if (addrEl) {
          const lbl = addrEl.getAttribute('aria-label') || addrEl.textContent || '';
          address = lbl.replace(/^Address:\s*/i, '').trim();
        }
      }

      // ── Strategy 3: scan all visible text for phone pattern ──
      if (!phone) {
        const allText = document.body.innerText || '';
        const phoneMatch = allText.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/);
        if (phoneMatch) phone = phoneMatch[1];
      }

      // ── Strategy 4: look for website links in action buttons ──
      // ── Strategy 4: look for website links in action buttons ──
      if (!website) {
        const anchors = document.querySelectorAll('a[href^="http"]');
        for (const a of anchors) {
          const href = a.href || '';
          // If it's a real external website link, grab it
          if (
            !href.includes('google.com') &&
            !href.includes('goo.gl') &&
            !href.includes('gstatic.com') &&
            !href.includes('youtube.com') &&
            !href.includes('facebook.com') // unless they only have a FB page
          ) {
            website = href;
            break;
          }
        }
      }

      // Cleanup trailing UTM tags from websites
      if (website && website.includes('?')) {
        website = website.split('?')[0];
      }

      return { website, phone, address };
    });

    await page.close();
    return details;
  } catch (err) {
    try { await page.close(); } catch (_) {}
    console.warn(`  ⚠️  Detail extraction failed for ${fullUrl.slice(0, 60)}... : ${err.message}`);
    return { website: '', phone: '', address: '' };
  }
}

/**
 * Scrape Google Maps search results — returns leads with full details
 */
async function scrapeGoogleMaps(query, location, maxResults = 20) {
  const searchTerm = `${query} ${location}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;

  console.log(`🗺️  Google Maps: "${searchTerm}"`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const leads = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Dismiss cookie/consent banners
    for (const selector of ['[aria-label="Accept all"]', '#L2AGLb', 'button[jsname="higCR"]']) {
      try {
        const btn = await page.$(selector);
        if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 800)); break; }
      } catch (_) {}
    }

    // Wait explicitly for the place cards to appear (guarantees results are loaded)
    try {
      await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 15000 });
      // Extra pause to ensure all attributes and inner elements are populated
      await new Promise(r => setTimeout(r, 1000));
    } catch (_) {
      console.log('  ⚠️ Feed selector timed out, no results found.');
    }

    // Scroll to load up to maxResults
    const scrollTimes = Math.ceil(maxResults / 5);
    for (let i = 0; i < scrollTimes; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) feed.scrollBy(0, 600);
      });
      await delay(400);
    }
    await delay(600);

    // Extract place links and names from the feed
    const placeItems = await page.evaluate((max) => {
      const results = [];
      const seen = new Set();

      // Get all links that point to a Google Maps place
      const links = document.querySelectorAll('a[href*="/maps/place/"]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (!href.includes('/maps/place/')) continue;

        // Walk up to find the card
        let card = link;
        for (let i = 0; i < 6; i++) {
          if (!card.parentElement) break;
          card = card.parentElement;
          if (card.getAttribute('role') === 'article' || card.classList.contains('Nv2PK')) break;
        }

        // Extract business name — try multiple approaches
        const nameEl = card.querySelector('.fontHeadlineSmall') ||
          card.querySelector('[aria-label]') ||
          link;

        let name = nameEl?.getAttribute('aria-label')?.trim() ||
          nameEl?.textContent?.trim() || '';

        // Clean up common noise
        name = name.replace(/\s*·\s*.+$/, '').trim();

        if (!name || seen.has(name) || name.length < 2) continue;
        seen.add(name);

        // Rating
        const ratingEl = card.querySelector('[aria-label*="star"]');
        const ratingText = ratingEl?.getAttribute('aria-label') || '';
        const ratingMatch = ratingText.match(/([\d.]+)\s*star/i);

        // Review count
        const reviewEl = card.querySelector('[aria-label*="review"]');
        const reviewText = reviewEl?.getAttribute('aria-label') || '';
        const reviewMatch = reviewText.match(/([\d,]+)\s*review/i);

        results.push({
          businessName: name,
          mapsUrl: href,
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
          reviewCount: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null,
        });

        if (results.length >= max) break;
      }
      return results;
    }, maxResults);

    console.log(`  Found ${placeItems.length} listings from feed`);

    // Visit place pages in parallel batches of 8
    const BATCH = 8;
    for (let i = 0; i < placeItems.length; i += BATCH) {
      const chunk = placeItems.slice(i, i + BATCH);
      const results = await Promise.all(
        chunk.map(item => extractPlaceDetails(browser, item.mapsUrl))
      );
      chunk.forEach((item, idx) => {
        const details = results[idx];
        leads.push({
          businessName: item.businessName,
          address: details.address,
          phoneNumber: details.phone,
          websiteUrl: details.website,
          rating: item.rating,
          reviewCount: item.reviewCount,
        });
        console.log(`  ✔ ${item.businessName} | 📞 ${details.phone || '—'} | 🌐 ${details.website || '—'}`);
      });
    }

  } catch (err) {
    console.error('Google Maps scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return leads;
}

/**
 * Scrape Google Search for additional leads + websites
 */
async function scrapeGoogleSearch(query, location, maxResults = 10) {
  const searchTerm = encodeURIComponent(`${query} in ${location}`);
  const url = `https://www.google.com/search?q=${searchTerm}&num=20&hl=en`;

  console.log(`🔎 Google Search: "${query} in ${location}"`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const leads = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(randomBetween(1500, 2500));

    // Dismiss consent
    for (const sel of ['#L2AGLb', '[aria-label="Accept all"]']) {
      try {
        const btn = await page.$(sel);
        if (btn) { await btn.click(); await delay(800); break; }
      } catch (_) {}
    }

    const rawLeads = await page.evaluate(() => {
      const results = [];

      // ── Local Business Pack (top 3 map results) ──
      document.querySelectorAll('.rllt__details, .VkpGBb, [data-cid]').forEach((el) => {
        const nameEl = el.querySelector('.OSrXXb, .dbg0pd, h3, [aria-label]');
        const name = nameEl?.textContent?.trim() || nameEl?.getAttribute('aria-label')?.trim();
        const addressEl = el.querySelector('[class*="rllt"] span, .rllt__details span');
        if (name) {
          results.push({
            businessName: name,
            address: addressEl?.textContent?.trim() || '',
            websiteUrl: '',
            phoneNumber: '',
            rating: null,
            reviewCount: null,
          });
        }
      });

      // ── Organic results ──
      document.querySelectorAll('div.g, .tF2Cxc').forEach((div) => {
        const h3 = div.querySelector('h3');
        const link = div.querySelector('a[href^="http"]');
        if (!h3 || !link) return;
        const name = h3.textContent?.trim();
        const href = link.getAttribute('href') || '';
        if (!href.includes('google.com') && name && name.length > 2) {
          results.push({
            businessName: name,
            address: '',
            websiteUrl: href,
            phoneNumber: '',
            rating: null,
            reviewCount: null,
          });
        }
      });

      return results;
    });

    leads.push(...rawLeads.slice(0, maxResults));
    console.log(`  Search found ${rawLeads.length} results`);

  } catch (err) {
    console.error('Google Search scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return leads;
}

/**
 * Combine Maps + Search results, deduplicate by businessName
 */
async function searchLeads(query, location, maxResults = 20) {
  console.log(`\n🔍 Lead search: "${query}" in "${location}" (max ${maxResults})`);

  const [mapsResult, searchResult] = await Promise.allSettled([
    scrapeGoogleMaps(query, location, maxResults),
    scrapeGoogleSearch(query, location, Math.ceil(maxResults / 2)),
  ]);

  const mapsLeads = mapsResult.status === 'fulfilled' ? mapsResult.value : [];
  const searchLeads_ = searchResult.status === 'fulfilled' ? searchResult.value : [];

  console.log(`\n📊 Maps: ${mapsLeads.length} | Search: ${searchLeads_.length}`);

  const seen = new Set(mapsLeads.map(l => l.businessName?.toLowerCase().trim()));
  const merged = [...mapsLeads];

  for (const lead of searchLeads_) {
    const key = lead.businessName?.toLowerCase().trim();
    if (key && !seen.has(key)) {
      merged.push(lead);
      seen.add(key);
    }
  }

  const final = merged.slice(0, maxResults);
  console.log(`✅ Final: ${final.length} unique leads\n`);
  return final;
}

module.exports = { searchLeads };
