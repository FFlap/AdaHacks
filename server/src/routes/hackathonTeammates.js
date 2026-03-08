import express from 'express';
import { scrapeTeamSeekers } from '../devpost-scraper.js';

const router = express.Router();

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function extractHackathonSlug(hackathonUrl = '') {
  try {
    const url = new URL(hackathonUrl);

    // Most hackathon pages look like: https://somehackathon.devpost.com/
    if (url.hostname.endsWith('.devpost.com') && url.hostname !== 'devpost.com') {
      return url.hostname.replace('.devpost.com', '');
    }

    // Fallback for rarer path-based cases
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return parts[0];
    }

    return null;
  } catch {
    return null;
  }
}

function computeMatchScore(team, userSkills, selectedTags) {
  const normalizedTeamSkills = safeArray(team.skills).map(normalizeText);
  const normalizedUserSkills = safeArray(userSkills).map(normalizeText);
  const normalizedSelectedTags = safeArray(selectedTags).map(normalizeText);

  const skillMatches = normalizedUserSkills.filter((skill) =>
    normalizedTeamSkills.some(
      (teamSkill) => teamSkill.includes(skill) || skill.includes(teamSkill)
    )
  );

  const tagMatches = normalizedSelectedTags.filter((tag) =>
    normalizedTeamSkills.some(
      (teamSkill) => teamSkill.includes(tag) || tag.includes(teamSkill)
    )
  );

  const uniqueSkillMatches = [...new Set(skillMatches)];
  const uniqueTagMatches = [...new Set(tagMatches)];

  let score = 0;
  score += uniqueSkillMatches.length * 3;
  score += uniqueTagMatches.length * 2;
  score += team.openSpots ? Math.min(team.openSpots, 3) : 0;

  return {
    score,
    matchingSkills: uniqueSkillMatches,
    matchingTags: uniqueTagMatches,
  };
}

router.post('/', async (req, res) => {
  try {
    const { hackathonUrl, viewer, selectedTags } = req.body ?? {};

    if (!hackathonUrl) {
      return res.status(400).json({ error: 'hackathonUrl is required.' });
    }

    if (!hackathonUrl.includes('devpost.com')) {
      return res.json({ teammates: [], source: 'unsupported' });
    }

    const slug = extractHackathonSlug(hackathonUrl);

    if (!slug) {
      return res.json({ teammates: [], source: 'unsupported' });
    }

    const userSkills = safeArray(viewer?.skills);

    let teams = [];
    try {
      teams = await scrapeTeamSeekers(slug);
    } catch (error) {
      console.error('Team scrape failed:', error?.message || error);
      return res.json({ teammates: [], source: 'devpost' });
    }

    const ranked = teams
      .map((team) => {
        const match = computeMatchScore(team, userSkills, selectedTags);

        return {
          teamName: team.teamName,
          lookingForMembers: team.lookingForMembers,
          openSpots: team.openSpots,
          skills: safeArray(team.skills),
          members: safeArray(team.members),
          score: match.score,
          matchingSkills: match.matchingSkills,
          matchingTags: match.matchingTags,
        };
      })
      .filter((team) => team.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return res.json({
      teammates: ranked,
      source: 'devpost',
    });
  } catch (error) {
    console.error('Hackathon teammate matching failed:', error);
    return res.status(500).json({ error: 'Failed to fetch teammate suggestions.' });
  }
});

export default router;