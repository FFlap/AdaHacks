import {
  chatMessagesResponseSchema,
  chatThreadsSchema,
  sendChatMessageResponseSchema
} from '@adahacks/shared/contracts';
import { HttpError } from './errors.js';
import { getAvatarUrl, toDisplayName } from './profile.js';

function mapChatThreadRow(row, supabaseUrl) {
  return {
    id: row.id,
    counterpart: {
      id: row.counterpart_id,
      fullName: toDisplayName(row.counterpart_full_name, row.counterpart_email),
      avatarUrl: getAvatarUrl(supabaseUrl, row.counterpart_avatar_path)
    },
    initiatedByUserId: row.initiated_by_user_id,
    sourceNotificationId: row.source_notification_id,
    sourceTargetType: row.source_target_type,
    sourceTargetId: row.source_target_id,
    sourceTargetName: row.source_target_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    latestMessagePreview: row.latest_message_preview ?? null,
    latestMessageSenderId: row.latest_message_sender_id ?? null
  };
}

function mapChatMessageRow(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderUserId: row.sender_user_id,
    body: row.body,
    createdAt: row.created_at
  };
}

export function sortParticipantPair(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].sort((left, right) => left.localeCompare(right));
}

async function findThreadIdByPair(client, userAId, userBId) {
  const { data, error } = await client
    .from('chat_threads')
    .select('id')
    .eq('user_a_id', userAId)
    .eq('user_b_id', userBId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function ensureThreadExists(client, threadId) {
  const { data, error } = await client
    .from('chat_threads')
    .select('id')
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new HttpError(404, 'Chat thread not found', 'chat_thread_not_found');
  }
}

export async function listChats(client, supabaseUrl) {
  const { data, error } = await client.rpc('list_chat_threads');

  if (error) {
    throw error;
  }

  return chatThreadsSchema.parse((data ?? []).map((row) => mapChatThreadRow(row, supabaseUrl)));
}

export async function getChatThread(client, supabaseUrl, threadId) {
  const threads = await listChats(client, supabaseUrl);
  const thread = threads.find((candidate) => candidate.id === threadId);

  if (!thread) {
    throw new HttpError(404, 'Chat thread not found', 'chat_thread_not_found');
  }

  return thread;
}

export async function listChatMessages(client, supabaseUrl, threadId) {
  const thread = await getChatThread(client, supabaseUrl, threadId);
  const { data, error } = await client.rpc('list_chat_messages', {
    p_thread_id: threadId
  });

  if (error) {
    throw error;
  }

  return chatMessagesResponseSchema.parse({
    thread,
    messages: (data ?? []).map(mapChatMessageRow)
  });
}

export async function startChatFromNotification(client, supabaseUrl, notificationId, userId) {
  const { data: notification, error: notificationError } = await client
    .from('swipes')
    .select('id, actor_user_id, target_user_id, decision, target_type, target_id')
    .eq('id', notificationId)
    .eq('target_user_id', userId)
    .maybeSingle();

  if (notificationError) {
    throw notificationError;
  }

  if (!notification) {
    throw new HttpError(404, 'Notification not found', 'notification_not_found');
  }

  if (notification.decision !== 'like') {
    throw new HttpError(400, 'Only like notifications can start chats', 'chat_not_available');
  }

  const [userAId, userBId] = sortParticipantPair(notification.actor_user_id, notification.target_user_id);
  let threadId = await findThreadIdByPair(client, userAId, userBId);

  if (!threadId) {
    const { data, error } = await client
      .from('chat_threads')
      .insert({
        user_a_id: userAId,
        user_b_id: userBId,
        initiated_by_user_id: userId,
        source_swipe_id: notification.id,
        source_target_type: notification.target_type,
        source_target_id: notification.target_id
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        threadId = await findThreadIdByPair(client, userAId, userBId);
      } else {
        throw error;
      }
    } else {
      threadId = data.id;
    }
  }

  if (!threadId) {
    throw new HttpError(500, 'Unable to load chat thread', 'chat_thread_unavailable');
  }

  return getChatThread(client, supabaseUrl, threadId);
}

export async function sendChatMessage(client, threadId, userId, input) {
  await ensureThreadExists(client, threadId);

  const { data, error } = await client
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender_user_id: userId,
      body: input.body
    })
    .select('id, thread_id, sender_user_id, body, created_at')
    .single();

  if (error) {
    throw error;
  }

  return sendChatMessageResponseSchema.parse(mapChatMessageRow(data));
}
