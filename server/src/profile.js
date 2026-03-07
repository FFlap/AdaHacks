export function mapProfileRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function ensureProfile(client, userId) {
  const { data, error } = await client
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select('id, full_name, bio, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(data);
}
