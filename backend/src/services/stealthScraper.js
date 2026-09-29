const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomUserAgent, randomBetween, delay } = require('../utils/helpers');

puppeteer.use(StealthPlugin());

/**
 * Visit a business website stealthily and extract text content
 */
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function scrapeBusinessWebsite(url) {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Invalid or missing URL', url };
  }

  const fs = require('fs');
  const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : undefined;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-blink-features=AutomationControlled'],
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await delay(randomBetween(500, 1200));

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
