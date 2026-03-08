export const profileColumns = 'id, full_name, bio, avatar_path, contact_links, skills, created_at, updated_at';
export const projectColumns = 'id, name, theme, description, tech_stack, created_at';

const contactLinkKeys = ['linkedin', 'instagram', 'twitter', 'github', 'email', 'phone'];

export function normalizeSkills(skills = []) {
  return [...new Set(
    skills
      .map((skill) => skill.trim())
      .filter(Boolean)
  )];
}

export function normalizeProject(project) {
  return {
    id: project.id,
    name: project.name.trim(),
    theme: project.theme.trim(),
    description: project.description.trim(),
    techStack: normalizeSkills(project.techStack ?? [])
  };
}

export function normalizeContactLinks(contactLinks = {}) {
  return contactLinkKeys.reduce((accumulator, key) => {
    const value = typeof contactLinks?.[key] === 'string' ? contactLinks[key].trim() : '';

    if (value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function encodeStoragePath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getAvatarUrl(supabaseUrl, avatarPath) {
  if (!avatarPath) {
    return null;
  }

  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/profile-images/${encodeStoragePath(avatarPath)}`;
}

export function mapProfileRow(row, supabaseUrl) {
  return {
    id: row.id,
    fullName: row.full_name,
    bio: row.bio,
    avatarUrl: getAvatarUrl(supabaseUrl, row.avatar_path),
    contactLinks: normalizeContactLinks(row.contact_links ?? {}),
    skills: normalizeSkills(row.skills ?? []),
    projects: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapProjectRow(row) {
  return {
    id: row.id,
    name: row.name,
    theme: row.theme,
    description: row.description,
    techStack: normalizeSkills(row.tech_stack ?? [])
  };
}

export async function ensureProfile(client, userId, supabaseUrl) {
  const { data, error } = await client
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select(profileColumns)
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(data, supabaseUrl);
}

export async function loadProfileWithProjects(client, userId, supabaseUrl) {
  const profile = await ensureProfile(client, userId, supabaseUrl);
  profile.projects = await listProjects(client, userId);
  return profile;
}

export function toDisplayName(fullName, email) {
  const normalizedName = fullName?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  const localPart = email?.split('@')[0]?.trim();

  if (localPart) {
    return localPart;
  }

  return 'Anonymous builder';
}

export async function listProjects(client, userId) {
  const { data, error } = await client
    .from('projects')
    .select(projectColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(mapProjectRow);
}

export function mapProjectFeedRow(row, supabaseUrl) {
  return {
    id: row.id,
    name: row.name,
    theme: row.theme,
    description: row.description,
    techStack: normalizeSkills(row.tech_stack ?? []),
    owner: {
      id: row.owner_id,
      fullName: toDisplayName(row.owner_full_name, row.owner_email),
      avatarUrl: getAvatarUrl(supabaseUrl, row.owner_avatar_path)
    }
  };
}

export async function listDiscoverableProjects(client, supabaseUrl) {
  const { data, error } = await client.rpc('list_discoverable_projects');

  if (error) {
    throw error;
  }

  return data.map((row) => mapProjectFeedRow(row, supabaseUrl));
}

export async function findDiscoverableProject(client, supabaseUrl, projectId) {
  const projects = await listDiscoverableProjects(client, supabaseUrl);
  return projects.find((project) => project.id === projectId) ?? null;
}

function mapPeopleProjectSummary(project = {}) {
  return {
    id: project.id,
    name: project.name,
    theme: project.theme ?? ''
  };
}

export function mapPeopleFeedRow(row, supabaseUrl) {
  return {
    id: row.id,
    fullName: toDisplayName(row.full_name, row.email),
    avatarUrl: getAvatarUrl(supabaseUrl, row.avatar_path),
    bio: row.bio ?? '',
    skills: normalizeSkills(row.skills ?? []),
    createdAt: row.created_at,
    projects: (row.projects ?? []).map(mapPeopleProjectSummary)
  };
}

export async function listDiscoverablePeople(client, supabaseUrl) {
  const { data, error } = await client.rpc('list_discoverable_people');

  if (error) {
    throw error;
  }

  return data.map((row) => mapPeopleFeedRow(row, supabaseUrl));
}

export async function findDiscoverablePerson(client, supabaseUrl, personId) {
  const people = await listDiscoverablePeople(client, supabaseUrl);
  return people.find((person) => person.id === personId) ?? null;
}

export async function syncProjects(client, userId, projects) {
  const normalizedProjects = projects.map(normalizeProject);
  const { data: existingRows, error: existingError } = await client
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (existingError) {
    throw existingError;
  }

  const incomingIds = new Set(
    normalizedProjects
      .map((project) => project.id)
      .filter(Boolean)
  );
  const projectsToDelete = existingRows
    .map((row) => row.id)
    .filter((id) => !incomingIds.has(id));

  if (projectsToDelete.length) {
    const { error } = await client
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .in('id', projectsToDelete);

    if (error) {
      throw error;
    }
  }

  if (normalizedProjects.length) {
    const rows = normalizedProjects.map((project) => ({
      ...(project.id ? { id: project.id } : {}),
      user_id: userId,
      name: project.name,
      theme: project.theme,
      description: project.description,
      tech_stack: project.techStack
    }));
    const { error } = await client
      .from('projects')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      throw error;
    }
  }

  return listProjects(client, userId);
}
