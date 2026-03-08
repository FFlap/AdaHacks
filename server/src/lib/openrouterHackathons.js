const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function extractMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((part) => part?.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }

  return '';
}

function stripCodeFence(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeViewer(viewer) {
  const profile = viewer?.profile ?? viewer ?? {};

  return {
    fullName: profile.fullName ?? null,
    bio: profile.bio ?? null,
    skills: safeArray(profile.skills),
    interests: safeArray(profile.interests),
    projects: safeArray(profile.projects).map((item) => ({
      name: item?.name ?? null,
      theme: item?.theme ?? null,
      description: item?.description ?? null,
      techStack: safeArray(item?.techStack)
    }))
  };
}

function buildMessages({ viewer, hackathon }) {
  return [
    {
      role: 'system',
      content: [
        'You generate a concise, personalized summary of a hackathon for a signed-in user.',
        'Write clearly and directly.',
        'Return JSON only with this exact shape:',
        '{"summary":"short paragraph"}',
        'Use only the provided hackathon and viewer data.',
        'Explain what the hackathon is about and why it may be relevant to the user.',
        'Do not include bullet points.',
        'Keep it under 90 words.'
      ].join('\n')
    },
    {
      role: 'user',
      content: JSON.stringify({
        viewer: normalizeViewer(viewer),
        hackathon: {
          title: hackathon?.title ?? null,
          organizerName: hackathon?.organizerName ?? null,
          location: hackathon?.location ?? null,
          deadline: hackathon?.deadline ?? null,
          prize: hackathon?.prize ?? null,
          participants: hackathon?.participants ?? null,
          tags: safeArray(hackathon?.tags),
          url: hackathon?.url ?? null,
          source: hackathon?.source ?? null
        }
      })
    }
  ];
}

export function createHackathonOpenRouterClient(env, fetchImpl = fetch) {
  return {
    async analyzeHackathon({ viewer, hackathon }) {
      const response = await fetchImpl(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.clientOrigin,
          'X-Title': 'AdaHacks'
        },
        body: JSON.stringify({
          model: env.openRouterModel,
          temperature: 0.3,
          messages: buildMessages({ viewer, hackathon })
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`OpenRouter request failed with status ${response.status}: ${body}`);
      }

      const payload = await response.json();
      const text = stripCodeFence(extractMessageContent(payload));
      const parsed = JSON.parse(text);

      return {
        summary: typeof parsed?.summary === 'string' ? parsed.summary.trim() : ''
      };
    }
  };
}