// server/src/devpost-scraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ── MLH (primary source) ──────────────────────────────────────────────────────
export async function scrapeMLHHackathons() {
  const { data } = await axios.get('https://mlh.io/seasons/2025/events', {
    headers: HEADERS,
    timeout: 12000,
  });

  const $ = cheerio.load(data);
  const results = [];

  $('.event.feature').each((_, el) => {
    const card = $(el);

    const title = card.find('.event-name').text().trim()
      || card.find('h3').text().trim();

    const url = card.find('a.event-link').attr('href')
      || card.find('a').first().attr('href')
      || '';

    const thumbnail = card.find('.image-wrap img').attr('src')
      || card.find('img').first().attr('src')
      || null;

    const startDate = card.find('meta[itemprop="startDate"]').attr('content')
      || card.find('.event-date').first().text().trim()
      || null;

    const endDate = card.find('meta[itemprop="endDate"]').attr('content') || null;

    const location = card.find('.event-location').text().trim()
      || card.find('[itemprop="location"]').text().trim()
      || null;

    const isOnline = location?.toLowerCase().includes('online')
      || location?.toLowerCase().includes('virtual')
      || false;

    if (!title) return;

    results.push({
      id:           url || title,
      title,
      url:          url.startsWith('http') ? url : `https://mlh.io${url}`,
      thumbnail,
      prize:        null,
      deadline:     startDate && endDate ? `${startDate} – ${endDate}` : startDate,
      participants: null,
      location:     location || (isOnline ? 'Online' : 'In-person'),
      tags:         card.hasClass('high-school') ? ['High School'] : [],
      isOnline,
      organizerName: 'MLH',
      source:       'mlh',
    });
  });

  return results;
}

// ── Devpost HTML (fallback — extracts preloaded JSON from <script> tags) ───────
export async function scrapeDevpostHackathons({ onlineOnly = false, location = '' } = {}) {
  const params = new URLSearchParams({ 'status[]': 'open' });
  if (onlineOnly) params.append('challenge_type[]', 'online');
  else if (location) params.set('search', location);

  const { data } = await axios.get(`https://devpost.com/hackathons?${params}`, {
    headers: HEADERS,
    timeout: 12000,
  });

  const $ = cheerio.load(data);
  const results = [];

  $('script').each((_, el) => {
    const text = $(el).html() || '';
    // Devpost embeds challenge data as JSON inside a script tag
    const match = text.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.+?\});\s*<\/script>/s)
      || text.match(/"challenges"\s*:\s*(\[.+?\])/s);

    if (!match) return;

    try {
      const parsed = JSON.parse(match[1]);
      const hackathons = parsed?.challengeFeed?.challenges
        || parsed?.challenges
        || (Array.isArray(parsed) ? parsed : []);

      hackathons.forEach(h => {
        results.push({
          id:           String(h.id || h.title),
          title:        h.title || 'Untitled',
          url:          h.url || 'https://devpost.com',
          thumbnail:    h.thumbnail_url || null,
          prize:        h.prize_amount ? `$${h.prize_amount}` : null,
          deadline:     h.submission_period_dates || null,
          participants: h.registrations_count
            ? `${h.registrations_count.toLocaleString()} participants`
            : null,
          location:     h.displayed_location?.location || (h.online ? 'Online' : 'In-person'),
          tags:         (h.themes || []).map(t => t.name || t).filter(Boolean),
          isOnline:     !!h.online,
          organizerName: h.organization_name || null,
          source:       'devpost',
        });
      });
    } catch {
      // JSON parse failed
    }
  });

  return results;
}

// ── Scrape team seekers from a specific hackathon page ────────────────────────
export async function scrapeTeamSeekers(hackathonSlug) {
  const results = [];
  let page = 1;

  while (true) {
    const url = `https://devpost.com/${hackathonSlug}/teams?page=${page}`;

    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(data);
      const teamCards = $('li.team');

      if (!teamCards.length) break;

      teamCards.each((_, el) => {
        const card = $(el);
        const members = [];

        card.find('.members li').each((_, m) => {
          members.push({
            username:   $(m).find('a').text().trim(),
            profileUrl: $(m).find('a').attr('href'),
            avatar:     $(m).find('img').attr('src'),
          });
        });

        results.push({
          teamName:           card.find('h4').text().trim(),
          lookingForMembers:  card.find('.looking-for-members').length > 0,
          openSpots:          parseInt(card.find('.open-spots').text()) || null,
          skills:             card.find('.skill-tag').map((_, s) => $(s).text().trim()).get(),
          members,
        });
      });

      if (!$('a[rel="next"]').length) break;
      page++;
    } catch (err) {
      console.error(`Team scrape error page ${page}:`, err.message);
      break;
    }
  }

  return results.filter(t => t.lookingForMembers);
}