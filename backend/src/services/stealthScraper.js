const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const { getRandomUserAgent, randomBetween, delay } = require('../utils/helpers');

puppeteer.use(StealthPlugin());

/**
 * Visit a business website and extract text content.
 * Tries a fast HTTP fetch first, falls back to stealth browser if blocked.
 */
const IS_WINDOWS = process.platform === 'win32';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function scrapeBusinessWebsite(url) {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Invalid or missing URL', url };
  }

  // FAST PATH: Try a direct HTTP request first (takes 200ms instead of 5s)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);

      // Check if it's a Cloudflare block page
      const pageText = $('body').text().toLowerCase();
      if (!pageText.includes('enable javascript') && !pageText.includes('cloudflare') && !pageText.includes('just a moment')) {
        const meta = {
          title: $('title').text() || '',
          description: $('meta[name="description"]').attr('content') || ''
        };

        $('script, style, noscript, nav, footer, header, aside, iframe').remove();
        const content = $('body').text().replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000);

        if (content.length > 100) {
          return { success: true, content, meta, url, method: 'fast' };
        }
      }
    }
  } catch (err) {
    // Ignore fetch errors (timeouts, SSL errors) and fallback to Puppeteer
  }

  // FALLBACK: Use heavy Puppeteer browser
  let executablePath;
  if (IS_WINDOWS) {
    const fs = require('fs');
    if (fs.existsSync(EDGE_PATH)) executablePath = EDGE_PATH;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-blink-features=AutomationControlled', '--single-process', '--no-zygote'],
  });

  const page = await browser.newPage();

  // Stealth configuration
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport({
    width: 1280 + randomBetween(0, 200),
    height: 800 + randomBetween(0, 100),
  });

  // Block unnecessary resources for speed
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'websocket'];
    if (blockedTypes.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Random pre-navigation delay to simulate human behaviour
  await delay(randomBetween(100, 400));

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); // Reduced timeout for speed
    await delay(randomBetween(500, 1000));

    // Check for CAPTCHA indicators
    const isCaptcha = await page.evaluate(() => {
      const text = document.body?.innerText?.toLowerCase() || '';
      return text.includes('captcha') || text.includes('robot') || text.includes('verify you are human');
    });

    if (isCaptcha) {
      await browser.close();
      return { success: false, error: 'CAPTCHA detected', url };
    }

    // Extract meaningful content — strip nav/header/footer/scripts
    const content = await page.evaluate(() => {
      const body = document.body.cloneNode(true);
      ['script', 'style', 'noscript', 'nav', 'footer', 'header', 'aside', 'iframe'].forEach((tag) => {
        body.querySelectorAll(tag).forEach((el) => el.remove());
      });
      return body.innerText
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 6000); // Limit to 6000 chars for LLM
    });

    // Also extract title and meta description
    const meta = await page.evaluate(() => ({
      title: document.title || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    }));

    await browser.close();
    return { success: true, content, meta, url };

  } catch (err) {
    await browser.close();
    return { success: false, error: err.message, url };
  }
}

module.exports = { scrapeBusinessWebsite };
