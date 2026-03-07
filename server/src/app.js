import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import {
  errorResponseSchema,
  meResponseSchema,
  updateProfileInputSchema
} from '@adahacks/shared/contracts';
import { getEnv } from './env.js';
import { HttpError, toErrorResponse } from './errors.js';
import {
  ensureProfile,
  mapProfileRow,
  normalizeSkills,
  profileColumns
} from './profile.js';
import { createAuthClient, createRequestClient } from './supabase.js';

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
  requestClientFactory = createRequestClient
} = {}) {
  const app = express();

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
      const profile = await ensureProfile(client, user.id, env.supabaseUrl);
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

  app.patch('/api/v1/me/profile', async (request, response, next) => {
    try {
      const { user } = request.auth;
      const client = request.supabase;
      const input = updateProfileInputSchema.parse(request.body);
      const nextProfile = {
        id: user.id,
        full_name: input.fullName,
        bio: input.bio,
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

      const payload = meResponseSchema.parse({
        user: {
          id: user.id,
          email: user.email
        },
        profile: mapProfileRow(data, env.supabaseUrl)
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
