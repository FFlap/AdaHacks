import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import {
  chatMessagesResponseSchema,
  chatThreadsSchema,
  errorResponseSchema,
  meResponseSchema,
  notificationReadResponseSchema,
  notificationsSchema,
  peopleFeedSchema,
  projectAnalysisSchema,
  projectFeedSchema,
  sendChatMessageInputSchema,
  sendChatMessageResponseSchema,
  startChatResponseSchema,
  swipeInputSchema,
  swipeResponseSchema,
  updateProfileInputSchema
} from '@adahacks/shared/contracts';
import {
  listChatMessages,
  listChats,
  sendChatMessage,
  startChatFromNotification
} from './chat.js';
import { getEnv } from './env.js';
import { HttpError, toErrorResponse } from './errors.js';
import {
  createSwipe,
  listNotifications,
  markNotificationRead
} from './notifications.js';
import { createOpenRouterClient } from './openrouter.js';
import {
  findDiscoverableProject,
  listDiscoverablePeople,
  listDiscoverableProjects,
  loadProfileWithProjects,
  mapProfileRow,
  normalizeContactLinks,
  normalizeSkills,
  profileColumns,
  syncProjects
} from './profile.js';
import { createAuthClient, createRequestClient } from './supabase.js';
import hackathonRoutes from './routes/hackathons.js';

function isAllowedOrigin(origin, configuredOrigin) {
  if (!origin) {
    return true;
  }

  const configuredOrigins = configuredOrigin
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function extractBearerToken(header = '') {
  if (!header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token', 'missing_token');
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    throw new HttpError(401, 'Missing bearer token', 'missing_token');
  }

  return token;
}

export function createApp({
  env = getEnv(),
  authClientFactory = createAuthClient,
  requestClientFactory = createRequestClient,
  analysisClientFactory = createOpenRouterClient
} = {}) {
  const app = express();
  const analysisClient = analysisClientFactory(env);

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin, env.clientOrigin)) {
        callback(null, true);
        return;
      }

      callback(new HttpError(403, 'Origin not allowed', 'origin_not_allowed'));
    }
  }));
  app.use(express.json());

  // ── Hackathons (public, no auth required) ──────────────────────────────────
  app.use('/api/hackathons', hackathonRoutes);

  app.get('/api/v1/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/v1', async (request, _response, next) => {
    try {
      const token = extractBearerToken(request.headers.authorization);
      const authClient = authClientFactory(env);
      const { data, error } = await authClient.auth.getUser(token);

      if (error || !data.user) {
        throw new HttpError(401, 'Invalid or expired token', 'invalid_token');
      }

      request.auth = {
        token,
        user: data.user
      };
      request.supabase = requestClientFactory(env, token);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/me', async (request, response, next) => {
    try {
      const { user } = request.auth;
      const client = request.supabase;
      const profile = await loadProfileWithProjects(client, user.id, env.supabaseUrl);
      const payload = meResponseSchema.parse({
        user: {
          id: user.id,
          email: user.email
        },
        profile
      });

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/swipes', async (request, response, next) => {
    try {
      const { user } = request.auth;
      const client = request.supabase;
      const input = swipeInputSchema.parse(request.body);
      const payload = swipeResponseSchema.parse(
        await createSwipe(client, user.id, input, env.supabaseUrl)
      );

      response.status(201).json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/projects/:projectId/analysis', async (request, response, next) => {
    try {
      const { projectId } = request.params;
      const { user } = request.auth;
      const client = request.supabase;
      const viewer = await loadProfileWithProjects(client, user.id, env.supabaseUrl);
      const project = await findDiscoverableProject(client, env.supabaseUrl, projectId);

      if (!project) {
        throw new HttpError(404, 'Project not found', 'project_not_found');
      }

      let analysis;

      try {
        analysis = await analysisClient.analyzeProject({ viewer, project });
      } catch {
        throw new HttpError(502, 'Project analysis is unavailable right now', 'analysis_unavailable');
      }

      response.json(projectAnalysisSchema.parse({
        ...analysis,
        projectId
      }));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/projects', async (request, response, next) => {
    try {
      const client = request.supabase;
      const payload = projectFeedSchema.parse(
        await listDiscoverableProjects(client, env.supabaseUrl)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/people', async (request, response, next) => {
    try {
      const client = request.supabase;
      const payload = peopleFeedSchema.parse(
        await listDiscoverablePeople(client, env.supabaseUrl)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/notifications', async (request, response, next) => {
    try {
      const client = request.supabase;
      const payload = notificationsSchema.parse(
        await listNotifications(client, env.supabaseUrl)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/notifications/:notificationId/read', async (request, response, next) => {
    try {
      const { user } = request.auth;
      const client = request.supabase;
      const payload = notificationReadResponseSchema.parse(
        await markNotificationRead(client, request.params.notificationId, user.id)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/chats', async (request, response, next) => {
    try {
      const client = request.supabase;
      const payload = chatThreadsSchema.parse(
        await listChats(client, env.supabaseUrl)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/chats/:threadId/messages', async (request, response, next) => {
    try {
      const client = request.supabase;
      const payload = chatMessagesResponseSchema.parse(
        await listChatMessages(client, env.supabaseUrl, request.params.threadId)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/notifications/:notificationId/chat', async (request, response, next) => {
    try {
      const client = request.supabase;
      const { user } = request.auth;
      const payload = startChatResponseSchema.parse(
        await startChatFromNotification(client, env.supabaseUrl, request.params.notificationId, user.id)
      );

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/chats/:threadId/messages', async (request, response, next) => {
    try {
      const client = request.supabase;
      const { user } = request.auth;
      const input = sendChatMessageInputSchema.parse(request.body);
      const payload = sendChatMessageResponseSchema.parse(
        await sendChatMessage(client, request.params.threadId, user.id, input)
      );

      response.status(201).json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/v1/me/profile', async (request, response, next) => {
    try {
      const { user } = request.auth;
      const client = request.supabase;
      const input = updateProfileInputSchema.parse(request.body);
      const nextProfile = {
        id: user.id,
        full_name: input.fullName,
        bio: input.bio,
        contact_links: normalizeContactLinks(input.contactLinks),
        skills: normalizeSkills(input.skills)
      };

      if (input.avatarPath !== undefined) {
        nextProfile.avatar_path = input.avatarPath;
      }

      const { data, error } = await client
        .from('profiles')
        .upsert(nextProfile, {
          onConflict: 'id'
        })
        .select(profileColumns)
        .single();

      if (error) {
        throw error;
      }

      const projects = await syncProjects(client, user.id, input.projects);
      const payload = meResponseSchema.parse({
        user: {
          id: user.id,
          email: user.email
        },
        profile: {
          ...mapProfileRow(data, env.supabaseUrl),
          projects
        }
      });

      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, next) => {
    void next;
    const { status, payload } = toErrorResponse(error);
    const safePayload = errorResponseSchema.parse(payload);
    response.status(status).json(safePayload);
  });

  return app;
}
