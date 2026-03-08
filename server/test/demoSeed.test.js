import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_AVATAR_BUCKET,
  buildDemoAvatarPath,
  seedDemoProfiles
} from '../src/demoSeed.js';

function createMockAdminClient({ existingUsers = [] } = {}) {
  const authUsers = [...existingUsers];
  const uploads = [];
  const profileUpserts = [];
  const projectDeletes = [];
  const projectUpserts = [];

  return {
    authUsers,
    uploads,
    profileUpserts,
    projectDeletes,
    projectUpserts,
    auth: {
      admin: {
        listUsers: vi.fn().mockImplementation(async () => ({
          data: { users: authUsers },
          error: null
        })),
        createUser: vi.fn().mockImplementation(async (payload) => {
          const user = {
            id: `user-${authUsers.length + 1}`,
            email: payload.email,
            app_metadata: payload.app_metadata,
            user_metadata: payload.user_metadata
          };

          authUsers.push(user);

          return {
            data: { user },
            error: null
          };
        }),
        updateUserById: vi.fn().mockImplementation(async (userId, payload) => {
          const existing = authUsers.find((user) => user.id === userId);
          const user = {
            ...existing,
            email: payload.email,
            app_metadata: payload.app_metadata,
            user_metadata: payload.user_metadata
          };
          const index = authUsers.findIndex((candidate) => candidate.id === userId);
          authUsers[index] = user;

          return {
            data: { user },
            error: null
          };
        })
      }
    },
    storage: {
      from: vi.fn((bucket) => {
        if (bucket !== DEMO_AVATAR_BUCKET) {
          throw new Error(`Unexpected bucket: ${bucket}`);
        }

        return {
          upload: vi.fn(async (path, body, options) => {
            uploads.push({ path, body, options });
            return { error: null };
          })
        };
      })
    },
    from: vi.fn((table) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn(async (row) => {
            profileUpserts.push(row);
            return { error: null };
          })
        };
      }

      if (table === 'projects') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(async (_column, value) => {
              projectDeletes.push(value);
              return { error: null };
            })
          })),
          upsert: vi.fn(async (row) => {
            projectUpserts.push(row);
            return { error: null };
          })
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    })
  };
}

function createDataset() {
  return [
    {
      email: 'seeded.builder@demo.adahacks.local',
      fullName: 'Seeded Builder',
      bio: 'Builds seeded demo data for test coverage.',
      skills: ['React', 'Supabase'],
      contactLinks: {
        github: 'https://github.com/seededbuilder'
      },
      avatarSourceUrl: 'https://example.com/avatar.jpg',
      project: {
        id: '4f87d84f-b8fd-4702-b9f4-66b2d06fd111',
        name: 'Seeded Project',
        theme: 'Testing',
        description: 'Verifies idempotent seeding behavior.',
        techStack: ['React', 'Supabase']
      }
    }
  ];
}

describe('seedDemoProfiles', () => {
  let fetchImpl;

  beforeEach(() => {
    fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: {
        get: vi.fn(() => 'image/jpeg')
      },
      arrayBuffer: vi.fn(async () => new TextEncoder().encode('avatar-bytes').buffer)
    }));
  });

  it('is idempotent across reruns and uses the expected avatar path', async () => {
    const dataset = createDataset();
    const adminClient = createMockAdminClient();

    const firstResult = await seedDemoProfiles({
      adminClient,
      dataset,
      fetchImpl,
      logger: { info: vi.fn() }
    });
    const secondResult = await seedDemoProfiles({
      adminClient,
      dataset,
      fetchImpl,
      logger: { info: vi.fn() }
    });

    expect(firstResult.count).toBe(1);
    expect(secondResult.count).toBe(1);
    expect(adminClient.auth.admin.createUser).toHaveBeenCalledTimes(1);
    expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledTimes(1);
    expect(adminClient.projectDeletes).toEqual(['user-1', 'user-1']);
    expect(adminClient.projectUpserts).toHaveLength(2);
    expect(adminClient.profileUpserts).toHaveLength(2);
    expect(adminClient.uploads[0].path).toBe(buildDemoAvatarPath('user-1'));
    expect(adminClient.uploads[1].path).toBe(buildDemoAvatarPath('user-1'));
    expect(adminClient.profileUpserts[0].avatar_path).toBe(buildDemoAvatarPath('user-1'));
  });

  it('refuses to reconcile an existing user without the demo seed tag', async () => {
    const dataset = createDataset();
    const adminClient = createMockAdminClient({
      existingUsers: [
        {
          id: 'user-9',
          email: dataset[0].email,
          app_metadata: {},
          user_metadata: {}
        }
      ]
    });

    await expect(seedDemoProfiles({
      adminClient,
      dataset,
      fetchImpl,
      logger: { info: vi.fn() }
    })).rejects.toThrow(/not tagged as adahacks-demo/i);

    expect(adminClient.auth.admin.createUser).not.toHaveBeenCalled();
    expect(adminClient.profileUpserts).toHaveLength(0);
    expect(adminClient.projectUpserts).toHaveLength(0);
    expect(adminClient.uploads).toHaveLength(0);
  });
});
