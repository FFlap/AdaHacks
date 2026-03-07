import { notificationsResponseSchema } from '@adahacks/shared/contracts';

export const notificationColumns =
  'id, user_id, triggered_by_user_id, notification_type, is_read, created_at, read_at';

export function mapNotificationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    triggeredByUserId: row.triggered_by_user_id,
    notificationType: row.notification_type,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at
  };
}

export async function getNotifications(client, userId) {
  const { data: notifications, error } = await client
    .from('notifications')
    .select(notificationColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const unmappedNotifications = notifications.map(mapNotificationRow);

  const { data: unreadData, error: countError } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (countError) {
    throw countError;
  }

  const unreadCount = unreadData.length || 0;

  return {
    notifications: unmappedNotifications,
    unreadCount
  };
}

export async function markNotificationAsRead(client, notificationId, userId) {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: now
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select(notificationColumns)
    .single();

  if (error) {
    throw error;
  }

  return mapNotificationRow(data);
}

export async function markAllNotificationsAsRead(client, userId) {
  const now = new Date().toISOString();

  const { error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: now
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return getNotifications(client, userId);
}

export async function recordSwipe(client, swipedByUserId, swipedOnUserId, direction) {
  const { data, error } = await client
    .from('swipes')
    .insert({
      swiped_by_user_id: swipedByUserId,
      swiped_on_user_id: swipedOnUserId,
      direction
    })
    .select('id, created_at')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    createdAt: data.created_at
  };
}
