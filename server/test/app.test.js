import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

function createMockSupabaseClient(overrides = {}) {
  return {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(),
    ...overrides
  };
}

const env = {
  port: 4010,
  clientOrigin: 'http://localhost:5173',
  supabaseUrl: 'https://example.supabase.co',
  supabasePublishableKey: 'publishable-key'
};

describe('API', () => {
  it('returns 401 without a bearer token', async () => {
    const app = createApp({ env });

    const response = await request(app).get('/api/v1/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('missing_token');
  });

  it('returns user and profile for an authenticated request', async () => {
    const authClient = createMockSupabaseClient();
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
          email: 'ada@example.com'
        }
      },
      error: null
    });

    const requestClient = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                full_name: 'Ada Lovelace',
                bio: 'Analytical engine enthusiast',
                created_at: '2026-03-07T18:00:00.000Z',
                updated_at: '2026-03-07T18:05:00.000Z'
              },
              error: null
            })
          })
        })
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('ada@example.com');
    expect(response.body.profile.fullName).toBe('Ada Lovelace');
  });

  it('validates profile updates', async () => {
    const authClient = createMockSupabaseClient();
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
          email: 'ada@example.com'
        }
      },
      error: null
    });

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => ({})
    });

    const response = await request(app)
      .patch('/api/v1/me/profile')
      .set('Authorization', 'Bearer valid-token')
      .send({
        fullName: 'Ada',
        bio: 'x'.repeat(500)
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation_error');
  });

  it('persists a valid profile update', async () => {
    const authClient = createMockSupabaseClient();
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
          email: 'ada@example.com'
        }
      },
      error: null
    });

    const requestClient = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                full_name: 'Ada Byron',
                bio: 'First programmer',
                created_at: '2026-03-07T18:00:00.000Z',
                updated_at: '2026-03-07T18:10:00.000Z'
              },
              error: null
            })
          })
        })
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .patch('/api/v1/me/profile')
      .set('Authorization', 'Bearer valid-token')
      .send({
        fullName: 'Ada Byron',
        bio: 'First programmer'
      });

    expect(response.status).toBe(200);
    expect(response.body.profile.bio).toBe('First programmer');
    expect(response.body.profile.id).toBe('34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620');
  });
});
