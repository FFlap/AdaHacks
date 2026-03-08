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

function createProfilesTable(profileRow) {
  return {
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: profileRow,
          error: null
        })
      })
    })
  };
}

function createSwipesTable({ createdSwipe, readReceipt, existingReadReceipt } = {}) {
  return {
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: createdSwipe,
          error: null
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: readReceipt ?? null,
                error: null
              })
            })
          })
        })
      })
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: existingReadReceipt ?? null,
            error: null
          })
        })
      })
    })
  };
}

function createProjectsTable({ existingIds = [], rows = [] } = {}) {
  return {
    select: vi.fn((columns) => {
      if (columns === 'id') {
        return {
          eq: vi.fn().mockResolvedValue({
            data: existingIds.map((id) => ({ id })),
            error: null
          })
        };
      }

      return {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: rows,
            error: null
          })
        })
      };
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null })
      })
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null })
  };
}

const env = {
  port: 4010,
  clientOrigin: 'http://localhost:5173',
  supabaseUrl: 'https://example.supabase.co',
  supabasePublishableKey: 'publishable-key',
  openRouterApiKey: 'openrouter-key',
  openRouterModel: 'arcee-ai/trinity-large-preview:free'
};

describe('API', () => {
  it('returns 401 without a bearer token', async () => {
    const app = createApp({ env });

    const response = await request(app).get('/api/v1/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('missing_token');
  });

  it('returns user, profile, and projects for an authenticated request', async () => {
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

    const profilesTable = createProfilesTable({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Lovelace',
      bio: 'Analytical engine enthusiast',
      avatar_path: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar',
      contact_links: {},
      skills: ['React', 'Supabase'],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:05:00.000Z'
    });
    const projectsTable = createProjectsTable({
      rows: [
        {
          id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
          name: 'Orbit',
          theme: 'Climate',
          description: 'Maps urban heat islands.',
          tech_stack: ['Vite', 'Supabase'],
          created_at: '2026-03-07T18:01:00.000Z'
        }
      ]
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return profilesTable;
        }

        if (table === 'projects') {
          return projectsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
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
    expect(response.body.profile.avatarUrl).toContain('/profile-images/34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar');
    expect(response.body.profile.contactLinks).toEqual({});
    expect(response.body.profile.skills).toEqual(['React', 'Supabase']);
    expect(response.body.profile.projects).toEqual([
      {
        id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
        name: 'Orbit',
        theme: 'Climate',
        description: 'Maps urban heat islands.',
        techStack: ['Vite', 'Supabase']
      }
    ]);
  });

  it('returns a discoverable projects feed for authenticated users', async () => {
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
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            tech_stack: ['Node.js', 'Express'],
            owner_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
            owner_full_name: 'Maya Chen',
            owner_avatar_path: '5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
            owner_email: 'maya@example.com'
          }
        ],
        error: null
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(requestClient.rpc).toHaveBeenCalledWith('list_discoverable_projects');
    expect(response.body).toEqual([
      {
        id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
        name: 'Pulse',
        theme: 'Hackathon',
        description: 'Live team coordination board.',
        techStack: ['Node.js', 'Express'],
        owner: {
          id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
          fullName: 'Maya Chen',
          avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar'
        }
      }
    ]);
  });

  it('returns a project analysis for authenticated users', async () => {
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

    const profilesTable = createProfilesTable({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Lovelace',
      bio: 'Analytical engine enthusiast',
      avatar_path: null,
      contact_links: {},
      skills: ['React', 'Supabase'],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:05:00.000Z'
    });
    const projectsTable = createProjectsTable({
      rows: [
        {
          id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
          name: 'Orbit',
          theme: 'Climate',
          description: 'Maps urban heat islands.',
          tech_stack: ['Vite', 'Supabase'],
          created_at: '2026-03-07T18:01:00.000Z'
        }
      ]
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return profilesTable;
        }

        if (table === 'projects') {
          return projectsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            tech_stack: ['Node.js', 'Express'],
            owner_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
            owner_full_name: 'Maya Chen',
            owner_avatar_path: null,
            owner_email: 'maya@example.com'
          }
        ],
        error: null
      })
    };
    const analyzeProject = vi.fn().mockResolvedValue({
      projectId: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
      matchingSkills: ['Supabase'],
      missingSkills: ['Express'],
      contributionSummary: 'You can help connect the data layer and shape the UI handoff.'
    });

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient,
      analysisClientFactory: () => ({
        analyzeProject
      })
    });

    const response = await request(app)
      .post('/api/v1/projects/9e6f7cb7-4800-4ef2-8e4f-15ad9e426812/analysis')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(analyzeProject).toHaveBeenCalledWith({
      viewer: expect.objectContaining({
        fullName: 'Ada Lovelace',
        skills: ['React', 'Supabase'],
        projects: [
          {
            id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
            name: 'Orbit',
            theme: 'Climate',
            description: 'Maps urban heat islands.',
            techStack: ['Vite', 'Supabase']
          }
        ]
      }),
      project: expect.objectContaining({
        id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
        name: 'Pulse',
        techStack: ['Node.js', 'Express']
      })
    });
    expect(response.body).toEqual({
      projectId: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
      matchingSkills: ['Supabase'],
      missingSkills: ['Express'],
      contributionSummary: 'You can help connect the data layer and shape the UI handoff.'
    });
  });

  it('returns 404 when the project analysis target is missing', async () => {
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

    const profilesTable = createProfilesTable({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Lovelace',
      bio: '',
      avatar_path: null,
      contact_links: {},
      skills: [],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:05:00.000Z'
    });
    const projectsTable = createProjectsTable({ rows: [] });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return profilesTable;
        }

        if (table === 'projects') {
          return projectsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient,
      analysisClientFactory: () => ({
        analyzeProject: vi.fn()
      })
    });

    const response = await request(app)
      .post('/api/v1/projects/9e6f7cb7-4800-4ef2-8e4f-15ad9e426812/analysis')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('project_not_found');
  });

  it('returns 502 when project analysis is unavailable', async () => {
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

    const profilesTable = createProfilesTable({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Lovelace',
      bio: '',
      avatar_path: null,
      contact_links: {},
      skills: [],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:05:00.000Z'
    });
    const projectsTable = createProjectsTable({ rows: [] });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return profilesTable;
        }

        if (table === 'projects') {
          return projectsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            tech_stack: ['Node.js'],
            owner_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
            owner_full_name: 'Maya Chen',
            owner_avatar_path: null,
            owner_email: 'maya@example.com'
          }
        ],
        error: null
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient,
      analysisClientFactory: () => ({
        analyzeProject: vi.fn().mockRejectedValue(new Error('upstream failed'))
      })
    });

    const response = await request(app)
      .post('/api/v1/projects/9e6f7cb7-4800-4ef2-8e4f-15ad9e426812/analysis')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('analysis_unavailable');
  });

  it('returns a discoverable people feed for authenticated users', async () => {
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
      rpc: vi.fn().mockImplementation((fn) => {
        if (fn === 'list_discoverable_people') {
          return Promise.resolve({
            data: [
              {
                id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                full_name: 'Maya Chen',
                avatar_path: '5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
                bio: 'Frontend builder looking for climate-tech teams.',
                skills: ['React', 'Supabase'],
                created_at: '2026-03-07T18:00:00.000Z',
                email: 'maya@example.com',
                projects: [
                  {
                    id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                    name: 'Pulse',
                    theme: 'Hackathon'
                  }
                ]
              }
            ],
            error: null
          });
        }

        throw new Error(`Unexpected rpc: ${fn}`);
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .get('/api/v1/people')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(requestClient.rpc).toHaveBeenCalledWith('list_discoverable_people');
    expect(response.body).toEqual([
      {
        id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        fullName: 'Maya Chen',
        avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
        bio: 'Frontend builder looking for climate-tech teams.',
        skills: ['React', 'Supabase'],
        createdAt: '2026-03-07T18:00:00.000Z',
        projects: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon'
          }
        ]
      }
    ]);
  });

  it('persists a project swipe for the authenticated user', async () => {
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

    const swipesTable = createSwipesTable({
      createdSwipe: {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
        target_type: 'project',
        target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
        decision: 'like'
      }
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'swipes') {
          return swipesTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            tech_stack: ['Node.js', 'Express'],
            owner_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
            owner_full_name: 'Maya Chen',
            owner_avatar_path: null,
            owner_email: 'maya@example.com'
          }
        ],
        error: null
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .post('/api/v1/swipes')
      .set('Authorization', 'Bearer valid-token')
      .send({
        targetType: 'project',
        targetId: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
        decision: 'like'
      });

    expect(response.status).toBe(201);
    expect(swipesTable.upsert).toHaveBeenCalledWith({
      actor_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      target_type: 'project',
      target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
      target_user_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
      decision: 'like'
    }, {
      onConflict: 'actor_user_id,target_type,target_id'
    });
    expect(response.body).toEqual({
      id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
      targetType: 'project',
      targetId: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
      decision: 'like'
    });
  });

  it('returns notifications and marks them read', async () => {
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

    const swipesTable = createSwipesTable({
      readReceipt: {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
        read_at: '2026-03-07T18:15:00.000Z'
      }
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'swipes') {
          return swipesTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn().mockImplementation((fn) => {
        if (fn === 'list_notifications') {
          return Promise.resolve({
            data: [
              {
                id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
                decision: 'pass',
                target_type: 'project',
                target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                target_name: 'Pulse',
                created_at: '2026-03-07T18:10:00.000Z',
                read_at: null,
                actor_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                actor_full_name: '',
                actor_email: 'maya@example.com',
                actor_avatar_path: '5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
                actor_bio: 'Frontend builder looking for climate-tech teams.',
                actor_skills: ['React', 'Supabase'],
                actor_contact_links: {
                  github: 'https://github.com/mayachen'
                },
                actor_projects: [
                  {
                    id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                    name: 'Pulse',
                    theme: 'Hackathon',
                    description: 'Live team coordination board.',
                    techStack: ['Node.js', 'Express']
                  }
                ]
              }
            ],
            error: null
          });
        }

        throw new Error(`Unexpected rpc: ${fn}`);
      })
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
        decision: 'pass',
        targetType: 'project',
        createdAt: '2026-03-07T18:10:00.000Z',
        readAt: null,
        actor: {
          id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
          fullName: 'maya',
          avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
          bio: 'Frontend builder looking for climate-tech teams.',
          skills: ['React', 'Supabase'],
          projects: [
            {
              id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
              name: 'Pulse',
              theme: 'Hackathon',
              description: 'Live team coordination board.',
              techStack: ['Node.js', 'Express']
            }
          ],
          contactLinks: {
            github: 'https://github.com/mayachen'
          }
        },
        target: {
          id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
          name: 'Pulse'
        }
      }
    ]);

    const markReadResponse = await request(app)
      .post('/api/v1/notifications/4ea60354-358e-4f13-8b5e-faf6d6b32d25/read')
      .set('Authorization', 'Bearer valid-token');

    expect(markReadResponse.status).toBe(200);
    expect(markReadResponse.body).toEqual({
      id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
      readAt: '2026-03-07T18:15:00.000Z'
    });
  });

  it('validates profile updates with nested projects', async () => {
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
        bio: 'Builder',
        contactLinks: {},
        skills: [],
        projects: [
          {
            name: '',
            theme: 'Hackathon',
            description: 'Prototype',
            techStack: []
          }
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation_error');
  });

  it('persists a valid profile update and syncs projects', async () => {
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

    const profilesTable = createProfilesTable({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Byron',
      bio: 'First programmer',
      avatar_path: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar',
      contact_links: {
        github: 'https://github.com/adabyron'
      },
      skills: ['React', 'Supabase', 'Node.js'],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:10:00.000Z'
    });
    const projectsTable = createProjectsTable({
      existingIds: ['b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9'],
      rows: [
        {
          id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
          name: 'Orbit',
          theme: 'Climate',
          description: 'Maps urban heat islands.',
          tech_stack: ['Vite', 'Supabase'],
          created_at: '2026-03-07T18:01:00.000Z'
        },
        {
          id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
          name: 'Pulse',
          theme: 'Hackathon',
          description: 'Live team coordination board.',
          tech_stack: ['Node.js', 'Express'],
          created_at: '2026-03-07T18:06:00.000Z'
        }
      ]
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return profilesTable;
        }

        if (table === 'projects') {
          return projectsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
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
        bio: 'First programmer',
        avatarPath: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar',
        contactLinks: {
          github: 'https://github.com/adabyron',
          linkedin: 'https://linkedin.com/in/adabyron'
        },
        skills: ['React', 'Supabase', 'Node.js'],
        projects: [
          {
            id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
            name: 'Orbit',
            theme: 'Climate',
            description: 'Maps urban heat islands.',
            techStack: ['Vite', 'Supabase']
          },
          {
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            techStack: ['Node.js', 'Express']
          }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.profile.bio).toBe('First programmer');
    expect(response.body.profile.id).toBe('34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620');
    expect(response.body.profile.contactLinks).toEqual({
      github: 'https://github.com/adabyron'
    });
    expect(response.body.profile.projects).toHaveLength(2);
    expect(profilesTable.upsert).toHaveBeenCalledWith({
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: 'Ada Byron',
      bio: 'First programmer',
      avatar_path: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar',
      contact_links: {
        github: 'https://github.com/adabyron',
        linkedin: 'https://linkedin.com/in/adabyron'
      },
      skills: ['React', 'Supabase', 'Node.js']
    }, {
      onConflict: 'id'
    });
    expect(projectsTable.upsert).toHaveBeenCalledWith([
      {
        id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
        user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        name: 'Orbit',
        theme: 'Climate',
        description: 'Maps urban heat islands.',
        tech_stack: ['Vite', 'Supabase']
      }
    ], {
      onConflict: 'id'
    });
    expect(projectsTable.insert).toHaveBeenCalledWith([
      {
        user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        name: 'Pulse',
        theme: 'Hackathon',
        description: 'Live team coordination board.',
        tech_stack: ['Node.js', 'Express']
      }
    ]);
  });
});
