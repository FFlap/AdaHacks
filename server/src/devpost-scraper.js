import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://devpost.com';

/**
 * Scrape hackathons from Devpost
 * @param {Object} options
 * @param {string} options.location - City/region or 'online' for remote
 * @param {boolean} options.onlineOnly - If true, fetch only online/remote hackathons
 * @param {number} options.pages - Number of pages to scrape (default: 2)
 */
export async function scrapeHackathons({ location = '', onlineOnly = false, pages = 2 } = {}) {
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({
      page,
      status: 'open',
      ...(onlineOnly && { 'themes[]': 'Online' }),
      ...(location && !onlineOnly && { search: location }),
    });

    const url = `${BASE_URL}/hackathons?${params}`;
    console.log(`Fetching: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AdaHacks/1.0)' },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const cards = $('article.hackathon-tile');

      if (cards.length === 0) break; // no more pages

      cards.each((_, el) => {
        const card = $(el);
        results.push({
          id: card.attr('data-challenge-id'),
          title: card.find('h2').text().trim(),
          url: BASE_URL + card.find('a.tile-anchor').attr('href'),
          thumbnail: card.find('img').attr('src'),
          prize: card.find('.prize-amount').text().trim() || null,
          deadline: card.find('.submission-period').text().trim(),
          participants: card.find('.participants').text().trim(),
          location: card.find('.info-with-icon.location').text().trim() || 'Online',
          tags: card.find('.theme-label').map((_, t) => $(t).text().trim()).get(),
          isOnline: card.find('.info-with-icon.location').text().toLowerCase().includes('online')
            || card.find('.theme-label').text().toLowerCase().includes('online'),
        });
      });

    } catch (err) {
      console.error(`Error scraping page ${page}:`, err.message);
    }
  }

  return results;
}

/**
 * Scrape "looking for team" posts from a specific hackathon
 * @param {string} hackathonSlug - e.g. "my-hackathon-2025"
 */
export async function scrapeTeamSeekers(hackathonSlug) {
  const results = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/${hackathonSlug}/teams?page=${page}`;
    console.log(`Fetching teams: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AdaHacks/1.0)' },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const teamCards = $('li.team');

      if (teamCards.length === 0) break;

      teamCards.each((_, el) => {
        const card = $(el);
        const members = [];
        card.find('.members li').each((_, m) => {
          members.push({
            username: $(m).find('a').text().trim(),
            profileUrl: BASE_URL + $(m).find('a').attr('href'),
            avatar: $(m).find('img').attr('src'),
          });
        });

        results.push({
          teamName: card.find('h4').text().trim(),
          lookingForMembers: card.find('.looking-for-members').length > 0,
          openSpots: parseInt(card.find('.open-spots').text()) || null,
          skills: card.find('.skill-tag').map((_, s) => $(s).text().trim()).get(),
          members,
          teamUrl: url,
        });
      });

      // Stop if no "next page" link
      if (!$('a[rel="next"]').length) break;
      page++;

    } catch (err) {
      console.error(`Error scraping teams page ${page}:`, err.message);
      break;
    }
  }

  // Filter to only teams actively looking
  return results.filter(t => t.lookingForMembers);
}