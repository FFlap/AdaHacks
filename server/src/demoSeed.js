import { demoSeedPeople } from './demoSeedData.js';

export const DEMO_SEED_TAG = 'adahacks-demo';
export const DEMO_AVATAR_BUCKET = 'profile-images';
export const DEMO_PASSWORD = 'AdaHacksDemo!2026';
const AUTH_PAGE_SIZE = 200;
const fallbackAvatarContentType = 'image/jpeg';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createSeedLogger(logger = console) {
  return {
    info(message) {
      if (typeof logger?.info === 'function') {
        logger.info(message);
        return;
      }

      if (typeof logger?.log === 'function') {
        logger.log(message);
      }
    }
  };
}

function buildSeedAppMetadata(existingMetadata = {}) {
  return {
    ...existingMetadata,
    seedTag: DEMO_SEED_TAG,
    demoProfile: true
  };
}

function buildSeedUserMetadata(person, existingMetadata = {}) {
  return {
    ...existingMetadata,
    fullName: person.fullName
  };
}

export function buildDemoAvatarPath(userId) {
  return `${userId}/avatar`;
}

export function isDemoSeedUser(user) {
  return user?.app_metadata?.seedTag === DEMO_SEED_TAG;
}

export async function loadAuthUsersByEmail(adminClient, emails) {
  const targets = new Set(emails.map(normalizeEmail));
  const usersByEmail = new Map();
  let page = 1;

  while (usersByEmail.size < targets.size) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE
    });

    if (error) {
      throw new Error(error.message || 'Unable to list Supabase auth users.');
    }

    const users = data?.users ?? [];

    users.forEach((user) => {
      const email = typeof user.email === 'string' ? normalizeEmail(user.email) : '';

      if (targets.has(email)) {
        usersByEmail.set(email, user);
      }
    });

    if (users.length < AUTH_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return usersByEmail;
}

function normalizeAvatarContentType(value) {
  const contentType = value?.split(';')[0]?.trim().toLowerCase();

  if (contentType === 'image/png' || contentType === 'image/webp' || contentType === 'image/jpeg') {
    return contentType;
  }

  return fallbackAvatarContentType;
}

async function downloadAvatar(fetchImpl, avatarSourceUrl) {
  const response = await fetchImpl(avatarSourceUrl);

  if (!response.ok) {
    throw new Error(`Avatar download failed with status ${response.status}.`);
  }

  const body = Buffer.from(await response.arrayBuffer());

  if (!body.length) {
    throw new Error('Avatar download returned an empty file.');
  }

  return {
    body,
    contentType: normalizeAvatarContentType(response.headers.get('content-type'))
  };
}

async function ensureDemoAuthUser(adminClient, person, existingUser) {
  if (existingUser) {
    if (!isDemoSeedUser(existingUser)) {
      throw new Error(`Auth user ${person.email} exists but is not tagged as ${DEMO_SEED_TAG}.`);
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      email: person.email,
      email_confirm: true,
      app_metadata: buildSeedAppMetadata(existingUser.app_metadata),
      user_metadata: buildSeedUserMetadata(person, existingUser.user_metadata)
    });

    if (error) {
      throw new Error(error.message || `Unable to update auth user ${person.email}.`);
    }

    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: person.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    app_metadata: buildSeedAppMetadata(),
    user_metadata: buildSeedUserMetadata(person)
  });

  if (error) {
    throw new Error(error.message || `Unable to create auth user ${person.email}.`);
  }

  return data.user;
}

async function uploadDemoAvatar(adminClient, userId, person, fetchImpl) {
  const avatarPath = buildDemoAvatarPath(userId);
  const avatar = await downloadAvatar(fetchImpl, person.avatarSourceUrl);
  const { error } = await adminClient.storage
    .from(DEMO_AVATAR_BUCKET)
    .upload(avatarPath, avatar.body, {
      upsert: true,
      cacheControl: '3600',
      contentType: avatar.contentType
    });

  if (error) {
    throw new Error(error.message || `Unable to upload avatar for ${person.email}.`);
  }

  return avatarPath;
}

async function upsertDemoProfile(adminClient, userId, person, avatarPath) {
  const { error } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      full_name: person.fullName,
      bio: person.bio,
      avatar_path: avatarPath,
      contact_links: person.contactLinks,
      skills: person.skills
    }, {
      onConflict: 'id'
    });

  if (error) {
    throw new Error(error.message || `Unable to upsert profile for ${person.email}.`);
  }
}

async function replaceDemoProjects(adminClient, userId, person) {
  const { error: deleteError } = await adminClient
    .from('projects')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(deleteError.message || `Unable to clear projects for ${person.email}.`);
  }

  const { error: upsertError } = await adminClient
    .from('projects')
    .upsert({
      id: person.project.id,
      user_id: userId,
      name: person.project.name,
      theme: person.project.theme,
      description: person.project.description,
      tech_stack: person.project.techStack
    }, {
      onConflict: 'id'
    });

  if (upsertError) {
    throw new Error(upsertError.message || `Unable to seed project for ${person.email}.`);
  }
}

export async function seedDemoProfiles({
  adminClient,
  dataset = demoSeedPeople,
  fetchImpl = fetch,
  logger = console
} = {}) {
  if (!adminClient) {
    throw new Error('adminClient is required.');
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetchImpl must be a function.');
  }

  const log = createSeedLogger(logger);
  const usersByEmail = await loadAuthUsersByEmail(adminClient, dataset.map((entry) => entry.email));
  const seededUsers = [];

  for (const person of dataset) {
    const emailKey = normalizeEmail(person.email);
    const authUser = await ensureDemoAuthUser(adminClient, person, usersByEmail.get(emailKey));
    usersByEmail.set(emailKey, authUser);

    const avatarPath = await uploadDemoAvatar(adminClient, authUser.id, person, fetchImpl);
    await upsertDemoProfile(adminClient, authUser.id, person, avatarPath);
    await replaceDemoProjects(adminClient, authUser.id, person);

    seededUsers.push({
      userId: authUser.id,
      email: person.email,
      avatarPath,
      projectId: person.project.id
    });
    log.info(`Seeded ${person.fullName} <${person.email}>`);
  }

  return {
    count: seededUsers.length,
    users: seededUsers
  };
}
