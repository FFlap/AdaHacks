export const profileColumns = 'id, full_name, bio, avatar_path, skills, created_at, updated_at';

export function normalizeSkills(skills = []) {
  return [...new Set(
    skills
      .map((skill) => skill.trim())
      .filter(Boolean)
  )];
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
