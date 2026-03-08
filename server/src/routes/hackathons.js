// server/src/routes/hackathons.js
import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

// ── Scrape MLH with Puppeteer (runs JS, gets real DOM) ───────────────────────
async function fetchMLHHackathons() {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto('https://mlh.io/seasons/2025/events', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    // Wait for event cards to appear
    await page.waitForSelector('a.event, .event-wrapper, [class*="event"]', { timeout: 8000 })
      .catch(() => console.log('MLH: selector wait timed out, parsing anyway'));

    const hackathons = await page.evaluate(() => {
      const results = [];

      // Try every plausible card container
      const cards = document.querySelectorAll(
        'a.event, .event-wrapper a, [class*="event-tile"], [class*="hackathon-event"]'
      );

      cards.forEach(card => {
        const title = card.querySelector('h3, h2, [class*="name"], [class*="title"]')?.innerText?.trim();
        if (!title) return;

        const url   = card.href || card.querySelector('a')?.href || '';
        const img   = card.querySelector('img')?.src ?? null;
        const date  = card.querySelector('[class*="date"], time')?.innerText?.trim() ?? null;
        const loc   = card.querySelector('[class*="location"], [class*="venue"], [class*="where"]')?.innerText?.trim() ?? null;

        results.push({ title, url, img, date, loc });
      });

      return results;
    });

    return hackathons.map(h => ({
      id:           h.url || h.title,
      title:        h.title,
      url:          h.url,
      thumbnail:    h.img,
      prize:        null,
      deadline:     h.date,
      participants: null,
      location:     h.loc || 'See event page',
      tags:         [],
      isOnline:     h.loc?.toLowerCase().includes('online') ?? false,
      organizerName: 'MLH',
      source:       'mlh',
    }));
  } finally {
    await page.close();
  }
}

// ── Scrape Devpost with Puppeteer ────────────────────────────────────────────
async function fetchDevpostHackathons({ online = false, location = '' }) {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const params = new URLSearchParams({ 'status[]': 'open', 'order_by': 'deadline' });
  if (online) params.append('challenge_type[]', 'online');
  else if (location) params.set('search', location);

  try {
    await page.goto(`https://devpost.com/hackathons?${params}`, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    await page.waitForSelector('.hackathon-tile, article', { timeout: 8000 })
      .catch(() => console.log('Devpost: selector wait timed out'));

    const hackathons = await page.evaluate(() => {
      const results = [];

      document.querySelectorAll('.hackathon-tile, article[class*="hackathon"]').forEach(card => {
        const title        = card.querySelector('h2, h3, .hackathon-name')?.innerText?.trim();
        const url          = card.querySelector('a')?.href ?? '';
        const img          = card.querySelector('img')?.src ?? null;
        const prize        = card.querySelector('.prize-amount, .prizes')?.innerText?.trim() ?? null;
        const deadline     = card.querySelector('.submission-period, .deadline')?.innerText?.trim() ?? null;
        const participants = card.querySelector('.participants, .registrations-count')?.innerText?.trim() ?? null;
        const location     = card.querySelector('.location, [class*="location"]')?.innerText?.trim() ?? null;
        const tags         = [...card.querySelectorAll('.theme-label, [class*="theme"]')]
                               .map(t => t.innerText.trim()).filter(Boolean);

        if (!title) return;
        results.push({ title, url, img, prize, deadline, participants, location, tags });
      });

      return results;
    });

    return hackathons.map((h, i) => ({
      id:           h.url || String(i),
      title:        h.title,
      url:          h.url,
      thumbnail:    h.img,
      prize:        h.prize,
      deadline:     h.deadline,
      participants: h.participants,
      location:     h.location || (online ? 'Online' : 'In-person'),
      tags:         h.tags,
      isOnline:     online || h.location?.toLowerCase().includes('online') || false,
      organizerName: null,
      source:       'devpost',
    }));
  } finally {
    await page.close();
  }
}

function matchesTags(hackathon, tags) {
  if (!tags.length) return true;
  const haystack = [...hackathon.tags, hackathon.title, hackathon.location]
    .join(' ').toLowerCase();
  return tags.some(t =>
    haystack.includes(t.toLowerCase().replace(' / ', ' ').replace('/', ' '))
  );
}

// GET /api/hackathons
router.get('/', async (req, res) => {
  const { online, location, tags: tagsParam } = req.query;
  const filterTags = tagsParam
    ? tagsParam.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  let hackathons = [];
  let source = 'none';

  // Try Devpost first (more hackathons), fall back to MLH
  try {
    hackathons = await fetchDevpostHackathons({
      online: online === 'true',
      location: location ?? '',
    });
    source = 'devpost';
    console.log(`Devpost: fetched ${hackathons.length} hackathons`);
  } catch (err) {
    console.error('Devpost failed:', err.message);
    try {
      hackathons = await fetchMLHHackathons();
      source = 'mlh';
      console.log(`MLH fallback: fetched ${hackathons.length} hackathons`);
    } catch (err2) {
      console.error('MLH failed:', err2.message);
      return res.status(502).json({ error: 'Unable to fetch hackathons. Try again later.' });
    }
  }

  let filtered = hackathons;
  if (online === 'true') filtered = filtered.filter(h => h.isOnline);
  if (filterTags.length) filtered = filtered.filter(h => matchesTags(h, filterTags));

  res.json({ hackathons: filtered, count: filtered.length, source });
});

// Clean up browser on process exit
process.on('exit', () => browser?.close());
process.on('SIGINT', () => browser?.close());

export default router;