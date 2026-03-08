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
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: profileRow,
          error: null
        })
      })
    }),
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

function createChatThreadsTable({
  existingThreadByPair = null,
  createdThread = null,
  insertError = null,
  threadById = null
} = {}) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn((column) => {
        if (column === 'user_a_id') {
          return {
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: existingThreadByPair ? { id: existingThreadByPair.id } : null,
                error: null
              })
            })
          };
        }

        if (column === 'id') {
          return {
            maybeSingle: vi.fn().mockResolvedValue({
              data: threadById,
              error: null
            })
          };
        }

        throw new Error(`Unexpected chat_threads select column: ${column}`);
      })
    })),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: createdThread,
          error: insertError
        })
      })
    })
  };
}

function createChatMessagesTable({ insertedMessage = null, insertError = null } = {}) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: insertedMessage,
          error: insertError
        })
      })
    })
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
    expect(profilesTable.upsert).not.toHaveBeenCalled();
  });

  it('creates a profile on read only when the profile row is missing', async () => {
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

    const insertedProfileRow = {
      id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      full_name: '',
      bio: '',
      avatar_path: null,
      contact_links: {},
      skills: [],
      created_at: '2026-03-07T18:00:00.000Z',
      updated_at: '2026-03-07T18:00:00.000Z'
    };
    const profilesTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }),
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: insertedProfileRow,
            error: null
          })
        })
      })
    };
    const projectsTable = createProjectsTable();
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
    expect(profilesTable.upsert).toHaveBeenCalledWith({ id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620' }, { onConflict: 'id' });
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
                id: '550e8400-e29b-41d4-a716-446655440099',
                decision: 'like',
                target_type: 'profile',
                target_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                target_name: null,
                created_at: '2026-03-07T18:11:00.000Z',
                read_at: null,
                actor_id: '1df30f65-9783-4f4e-b6a1-4a20c2f9dd50',
                actor_full_name: 'Hidden Person',
                actor_email: 'hidden@example.com',
                actor_avatar_path: '1df30f65-9783-4f4e-b6a1-4a20c2f9dd50/avatar',
                actor_bio: 'This should not be visible.',
                actor_skills: ['Go', 'Kubernetes'],
                actor_contact_links: {
                  email: 'hidden@example.com'
                },
                actor_projects: [
                  {
                    id: 'e60dc0a4-8038-4024-bd2f-26c6a7810c0a',
                    name: 'Secret',
                    theme: 'Private',
                    description: 'This should not be visible.',
                    techStack: ['Go']
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
        id: '550e8400-e29b-41d4-a716-446655440099',
        decision: 'like',
        targetType: 'profile',
        createdAt: '2026-03-07T18:11:00.000Z',
        readAt: null,
        actor: {
          id: '1df30f65-9783-4f4e-b6a1-4a20c2f9dd50',
          fullName: 'Hidden Person',
          avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/1df30f65-9783-4f4e-b6a1-4a20c2f9dd50/avatar',
          bio: 'This should not be visible.',
          skills: ['Go', 'Kubernetes'],
          projects: [
            {
              id: 'e60dc0a4-8038-4024-bd2f-26c6a7810c0a',
              name: 'Secret',
              theme: 'Private',
              description: 'This should not be visible.',
              techStack: ['Go']
            }
          ],
          contactLinks: {
            email: 'hidden@example.com'
          }
        },
        target: {
          id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
          name: null
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

  it('starts or reuses a chat from a like notification', async () => {
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

    const swipesTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: '550e8400-e29b-41d4-a716-446655440099',
                actor_user_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                target_type: 'project',
                target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                target_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                decision: 'like'
              },
              error: null
            })
          })
        })
      })
    };
    const chatThreadsTable = createChatThreadsTable({
      createdThread: {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26'
      }
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'swipes') {
          return swipesTable;
        }

        if (table === 'chat_threads') {
          return chatThreadsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn((fn) => {
        if (fn === 'list_chat_threads') {
          return Promise.resolve({
            data: [
              {
                id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
                counterpart_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                counterpart_full_name: 'Maya Chen',
                counterpart_email: 'maya@example.com',
                counterpart_avatar_path: '5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
                initiated_by_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                source_notification_id: '550e8400-e29b-41d4-a716-446655440099',
                source_target_type: 'project',
                source_target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                source_target_name: 'Pulse',
                created_at: '2026-03-07T18:11:00.000Z',
                updated_at: '2026-03-07T18:11:00.000Z',
                last_message_at: '2026-03-07T18:11:00.000Z',
                latest_message_preview: null,
                latest_message_sender_id: null
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
      .post('/api/v1/notifications/550e8400-e29b-41d4-a716-446655440099/chat')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(chatThreadsTable.insert).toHaveBeenCalledWith({
      user_a_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      user_b_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
      initiated_by_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      source_swipe_id: '550e8400-e29b-41d4-a716-446655440099',
      source_target_type: 'project',
      source_target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812'
    });
    expect(response.body).toEqual({
      id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
      counterpart: {
        id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        fullName: 'Maya Chen',
        avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar'
      },
      initiatedByUserId: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      sourceNotificationId: '550e8400-e29b-41d4-a716-446655440099',
      sourceTargetType: 'project',
      sourceTargetId: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
      sourceTargetName: 'Pulse',
      createdAt: '2026-03-07T18:11:00.000Z',
      updatedAt: '2026-03-07T18:11:00.000Z',
      lastMessageAt: '2026-03-07T18:11:00.000Z',
      latestMessagePreview: null,
      latestMessageSenderId: null
    });
  });

  it('lists chat threads for the authenticated participant', async () => {
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
      rpc: vi.fn((fn) => {
        if (fn === 'list_chat_threads') {
          return Promise.resolve({
            data: [
              {
                id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
                counterpart_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                counterpart_full_name: '',
                counterpart_email: 'maya@example.com',
                counterpart_avatar_path: null,
                initiated_by_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                source_notification_id: '550e8400-e29b-41d4-a716-446655440099',
                source_target_type: 'profile',
                source_target_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                source_target_name: null,
                created_at: '2026-03-07T18:11:00.000Z',
                updated_at: '2026-03-07T18:13:00.000Z',
                last_message_at: '2026-03-07T18:13:00.000Z',
                latest_message_preview: 'Yes, I am interested.',
                latest_message_sender_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620'
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
      .get('/api/v1/chats')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
        counterpart: {
          id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
          fullName: 'maya',
          avatarUrl: null
        },
        initiatedByUserId: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        sourceNotificationId: '550e8400-e29b-41d4-a716-446655440099',
        sourceTargetType: 'profile',
        sourceTargetId: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        sourceTargetName: null,
        createdAt: '2026-03-07T18:11:00.000Z',
        updatedAt: '2026-03-07T18:13:00.000Z',
        lastMessageAt: '2026-03-07T18:13:00.000Z',
        latestMessagePreview: 'Yes, I am interested.',
        latestMessageSenderId: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620'
      }
    ]);
  });

  it('reuses an existing chat thread for the same user pair', async () => {
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

    const swipesTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: '550e8400-e29b-41d4-a716-446655440099',
                actor_user_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                target_type: 'profile',
                target_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                target_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                decision: 'like'
              },
              error: null
            })
          })
        })
      })
    };
    const chatThreadsTable = createChatThreadsTable({
      existingThreadByPair: {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26'
      }
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'swipes') {
          return swipesTable;
        }

        if (table === 'chat_threads') {
          return chatThreadsTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn((fn) => {
        if (fn === 'list_chat_threads') {
          return Promise.resolve({
            data: [
              {
                id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
                counterpart_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                counterpart_full_name: 'Maya Chen',
                counterpart_email: 'maya@example.com',
                counterpart_avatar_path: null,
                initiated_by_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                source_notification_id: '11111111-1111-4111-8111-111111111111',
                source_target_type: 'project',
                source_target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                source_target_name: 'Pulse',
                created_at: '2026-03-07T18:11:00.000Z',
                updated_at: '2026-03-07T18:13:00.000Z',
                last_message_at: '2026-03-07T18:13:00.000Z',
                latest_message_preview: 'Existing thread',
                latest_message_sender_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447'
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
      .post('/api/v1/notifications/550e8400-e29b-41d4-a716-446655440099/chat')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(chatThreadsTable.insert).not.toHaveBeenCalled();
    expect(response.body.id).toBe('4ea60354-358e-4f13-8b5e-faf6d6b32d26');
  });

  it('rejects chat start for a pass notification', async () => {
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
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: '550e8400-e29b-41d4-a716-446655440099',
                  actor_user_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                  target_type: 'profile',
                  target_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                  target_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                  decision: 'pass'
                },
                error: null
              })
            })
          })
        })
      }))
    };

    const app = createApp({
      env,
      authClientFactory: () => authClient,
      requestClientFactory: () => requestClient
    });

    const response = await request(app)
      .post('/api/v1/notifications/550e8400-e29b-41d4-a716-446655440099/chat')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('chat_not_available');
  });

  it('lists chat messages and sends a new one for participants', async () => {
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

    const chatThreadsTable = createChatThreadsTable({
      threadById: {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26'
      }
    });
    const chatMessagesTable = createChatMessagesTable({
      insertedMessage: {
        id: '3c563cb7-03e8-45fb-bf8d-1d74d0064d77',
        thread_id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
        sender_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        body: 'Yes, I am interested.',
        created_at: '2026-03-07T18:13:00.000Z'
      }
    });
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'chat_threads') {
          return chatThreadsTable;
        }

        if (table === 'chat_messages') {
          return chatMessagesTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: vi.fn((fn) => {
        if (fn === 'list_chat_threads') {
          return Promise.resolve({
            data: [
              {
                id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
                counterpart_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                counterpart_full_name: 'Maya Chen',
                counterpart_email: 'maya@example.com',
                counterpart_avatar_path: '5ba6c5b5-5341-4638-a164-a3b0f9b88447/avatar',
                initiated_by_user_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
                source_notification_id: '550e8400-e29b-41d4-a716-446655440099',
                source_target_type: 'project',
                source_target_id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
                source_target_name: 'Pulse',
                created_at: '2026-03-07T18:11:00.000Z',
                updated_at: '2026-03-07T18:13:00.000Z',
                last_message_at: '2026-03-07T18:13:00.000Z',
                latest_message_preview: 'Yes, I am interested.',
                latest_message_sender_id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620'
              }
            ],
            error: null
          });
        }

        if (fn === 'list_chat_messages') {
          return Promise.resolve({
            data: [
              {
                id: '7bc24459-cc77-48d0-8e1d-6bd8544e4c9b',
                thread_id: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
                sender_user_id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
                body: 'Hi Ada, want to chat about Pulse?',
                created_at: '2026-03-07T18:12:00.000Z'
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

    const messagesResponse = await request(app)
      .get('/api/v1/chats/4ea60354-358e-4f13-8b5e-faf6d6b32d26/messages')
      .set('Authorization', 'Bearer valid-token');

    expect(messagesResponse.status).toBe(200);
    expect(messagesResponse.body.messages).toEqual([
      {
        id: '7bc24459-cc77-48d0-8e1d-6bd8544e4c9b',
        threadId: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
        senderUserId: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        body: 'Hi Ada, want to chat about Pulse?',
        createdAt: '2026-03-07T18:12:00.000Z'
      }
    ]);

    const sendResponse = await request(app)
      .post('/api/v1/chats/4ea60354-358e-4f13-8b5e-faf6d6b32d26/messages')
      .set('Authorization', 'Bearer valid-token')
      .send({ body: 'Yes, I am interested.' });

    expect(sendResponse.status).toBe(201);
    expect(sendResponse.body).toEqual({
      id: '3c563cb7-03e8-45fb-bf8d-1d74d0064d77',
      threadId: '4ea60354-358e-4f13-8b5e-faf6d6b32d26',
      senderUserId: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
      body: 'Yes, I am interested.',
      createdAt: '2026-03-07T18:13:00.000Z'
    });
  });

  it('rejects sending a chat message when the user is not a participant', async () => {
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

    const chatThreadsTable = createChatThreadsTable({
      threadById: null
    });
    const chatMessagesTable = createChatMessagesTable();
    const requestClient = {
      from: vi.fn((table) => {
        if (table === 'chat_threads') {
          return chatThreadsTable;
        }

        if (table === 'chat_messages') {
          return chatMessagesTable;
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
      .post('/api/v1/chats/4ea60354-358e-4f13-8b5e-faf6d6b32d26/messages')
      .set('Authorization', 'Bearer valid-token')
      .send({ body: 'Hello?' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('chat_thread_not_found');
    expect(chatMessagesTable.insert).not.toHaveBeenCalled();
  });
});
