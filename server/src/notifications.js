import {
  notificationReadResponseSchema,
  notificationsSchema,
  swipeResponseSchema
} from '@adahacks/shared/contracts';
import { HttpError } from './errors.js';
import {
  findDiscoverablePerson,
  findDiscoverableProject,
  getAvatarUrl,
  mapProjectRow,
  normalizeContactLinks,
  normalizeSkills,
  toDisplayName
} from './profile.js';

function mapNotificationProjects(projects = []) {
  return projects.map((project) => mapProjectRow({
    id: project.id,
    name: project.name,
    theme: project.theme,
    description: project.description,
    tech_stack: project.techStack ?? []
  }));
}

function mapNotificationRow(row, supabaseUrl) {
  return {
    id: row.id,
    decision: row.decision,
    targetType: row.target_type,
    createdAt: row.created_at,
    readAt: row.read_at,
    actor: {
      id: row.actor_id,
      fullName: toDisplayName(row.actor_full_name, row.actor_email),
      avatarUrl: getAvatarUrl(supabaseUrl, row.actor_avatar_path),
      bio: row.actor_bio ?? '',
      skills: normalizeSkills(row.actor_skills ?? []),
      projects: mapNotificationProjects(row.actor_projects ?? []),
      contactLinks: normalizeContactLinks(row.actor_contact_links ?? {})
    },
    target: {
      id: row.target_id,
      name: row.target_name ?? null
    }
  };
}

export async function createSwipe(client, actorUserId, input, supabaseUrl) {
  let payload;

  if (input.targetType === 'project') {
    const project = await findDiscoverableProject(client, supabaseUrl, input.targetId);

    if (!project) {
      throw new HttpError(404, 'Project not found', 'project_not_found');
    }

    payload = {
      actor_user_id: actorUserId,
      target_type: 'project',
      target_id: project.id,
      target_user_id: project.owner.id,
      decision: input.decision
    };
  } else {
    const person = await findDiscoverablePerson(client, supabaseUrl, input.targetId);

    if (!person) {
      throw new HttpError(404, 'Person not found', 'person_not_found');
    }

    payload = {
      actor_user_id: actorUserId,
      target_type: 'profile',
      target_id: person.id,
      target_user_id: person.id,
      decision: input.decision
    };
  }

  const { data, error } = await client
    .from('swipes')
    .upsert(payload, { onConflict: 'actor_user_id,target_type,target_id' })
    .select('id, target_type, target_id, decision')
    .single();

  if (error) {
    throw error;
  }

  return swipeResponseSchema.parse({
    id: data.id,
    targetType: data.target_type,
    targetId: data.target_id,
    decision: data.decision
  });
}

export async function listNotifications(client, supabaseUrl) {
  const { data, error } = await client.rpc('list_notifications');

  if (error) {
    throw error;
  }

  return notificationsSchema.parse(
    data.map((row) => mapNotificationRow(row, supabaseUrl))
  );
}

export async function markNotificationRead(client, notificationId, userId) {
  const timestamp = new Date().toISOString();
  const updateQuery = client
    .from('swipes')
    .update({ read_at: timestamp })
    .eq('id', notificationId)
    .eq('target_user_id', userId)
    .is('read_at', null)
    .select('id, read_at');
  const { data, error } = await updateQuery.maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return notificationReadResponseSchema.parse({
      id: data.id,
      readAt: data.read_at
    });
  }

  const { data: existing, error: existingError } = await client
    .from('swipes')
    .select('id, read_at')
    .eq('id', notificationId)
    .eq('target_user_id', userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing?.read_at) {
    throw new HttpError(404, 'Notification not found', 'notification_not_found');
  }

  return notificationReadResponseSchema.parse({
    id: existing.id,
    readAt: existing.read_at
  });
}
