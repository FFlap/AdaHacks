// server/src/routes/hackathons.js
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();
const BASE = 'https://devpost.com';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; AdaHacks/1.0)' };

/**
 * Scrape one page of hackathons from Devpost.
 * Returns an array of hackathon objects shaped for HackathonSwipeCard.
 */
async function scrapeHackathonPage(params) {
  const url = `${BASE}/hackathons?${params}`;
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  const $ = cheerio.load(data);
  const results = [];

  $('article.hackathon-tile, li.hackathon-tile').each((_, el) => {
    const card = $(el);

    const title = card.find('h2, .hackathon-name').first().text().trim();
    const href  = card.find('a.tile-anchor, a.hackathon-link').attr('href') ?? '';
    const url   = href.startsWith('http') ? href : BASE + href;
    const id    = card.attr('data-challenge-id') ?? url;

    const thumbnail =
      card.find('img.challenge-thumbnail, img').first().attr('src') ?? null;

    const prize =
      card.find('.prize-amount, .prizes').first().text().trim() || null;

    const deadline =
      card.find('.submission-period, .deadline').first().text().trim() || null;

    const participants =
      card.find('.participants, .registrations-count').first().text().trim() || null;

    const locationText =
      card.find('.info-with-icon.location, .hackathon-location').first().text().trim() || 'Online';

    const tags = [];
    card.find('.theme-label, .challenge-label').each((_, t) => {
      const txt = $(t).text().trim();
      if (txt) tags.push(txt);
    });

    if (!title) return; // skip empty cards

    results.push({ id, title, url, thumbnail, prize, deadline, participants, location: locationText, tags });
  });

  return results;
}

// ── Filter by interest tags client sent ────────────────────────────────────────
function matchesTags(hackathon, tags) {
  if (!tags.length) return true;
  const haystack = [...hackathon.tags, hackathon.title].join(' ').toLowerCase();
  return tags.some(t => haystack.includes(t.toLowerCase()));
}

// ── GET /api/hackathons ────────────────────────────────────────────────────────
// Query params:
//   online=true          → remote/online hackathons
//   location=Toronto     → in-person near a city
//   tags=AI+ML,Health    → filter by interest tags (comma-separated)
//   pages=2              → how many Devpost pages to scrape (default 2)
router.get('/', async (req, res) => {
  try {
    const { online, location, tags: tagsParam, pages: pagesParam } = req.query;
    const maxPages = Math.min(parseInt(pagesParam) || 2, 5);
    const filterTags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : [];

    const allResults = [];

    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({ page, status: 'open' });

      if (online === 'true') {
        // Devpost uses 'Online' as a theme for remote hacks
        params.append('themes[]', 'Online');
      } else if (location) {
        params.set('search', location);
      }

      const pageResults = await scrapeHackathonPage(params);
      if (!pageResults.length) break; // no more pages
      allResults.push(...pageResults);
    }

    // Apply interest tag filter
    const filtered = filterTags.length
      ? allResults.filter(h => matchesTags(h, filterTags))
      : allResults;

    res.json({ hackathons: filtered, count: filtered.length });
  } catch (err) {
    console.error('Devpost scrape error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hackathons from Devpost.' });
  }
});

export default router;