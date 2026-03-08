import { projectAnalysisSchema } from '@adahacks/shared/contracts';

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

function buildMessages({ viewer, project }) {
  return [
    {
      role: 'system',
      content: [
        'You analyze whether a signed-in builder is a fit for another builder’s project.',
        'Write directly to the signed-in builder using second-person phrasing like "you" and "your".',
        'Return JSON only with this exact shape:',
        '{"projectId":"uuid","matchingSkills":["skill"],"missingSkills":["skill"],"contributionSummary":"short paragraph"}',
        'Use only the data provided.',
        'matchingSkills should list concrete overlaps between the viewer and the project.',
        'missingSkills should list realistic gaps implied by the project that the viewer does not clearly show.',
        'contributionSummary should explain how you could help, using your skills and your prior projects.',
        'Keep arrays short and deduplicated, and keep contributionSummary under 110 words.'
      ].join('\n')
    },
    {
      role: 'user',
      content: JSON.stringify({
        viewer: {
          fullName: viewer.fullName,
          bio: viewer.bio,
          skills: viewer.skills,
          projects: viewer.projects.map((item) => ({
            name: item.name,
            theme: item.theme,
            description: item.description,
            techStack: item.techStack
          }))
        },
        project: {
          id: project.id,
          ownerName: project.owner.fullName,
          name: project.name,
          theme: project.theme,
          description: project.description,
          techStack: project.techStack
        }
      })
    }
  ];
}

export function createOpenRouterClient(env, fetchImpl = fetch) {
  return {
    async analyzeProject({ viewer, project }) {
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
          messages: buildMessages({ viewer, project })
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const text = stripCodeFence(extractMessageContent(payload));
      const parsed = JSON.parse(text);

      return projectAnalysisSchema.parse(parsed);
    }
  };
}
