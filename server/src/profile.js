export const profileColumns = 'id, full_name, bio, avatar_path, skills, created_at, updated_at';
export const projectColumns = 'id, name, theme, description, tech_stack, created_at';

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
