import {
  createContext,
  createElement,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState
} from 'react';
import { Outlet } from 'react-router-dom';
import {
  getChats as requestChats,
  getChatMessages as requestChatMessages,
  sendChatMessage as requestSendChatMessage,
  startChatFromNotification as requestStartChatFromNotification
} from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './useAuth.js';

const ChatsContext = createContext(null);

function normalizeChatMessage(message = {}) {
  return {
    id: message.id,
    threadId: message.threadId ?? message.thread_id,
    senderUserId: message.senderUserId ?? message.sender_user_id,
    body: message.body ?? '',
    createdAt: message.createdAt ?? message.created_at
  };
}

function normalizeChatThread(thread = {}) {
  const lastMessageBody = thread.lastMessage?.body
    ?? thread.latestMessagePreview
    ?? thread.latest_message_preview
    ?? null;
  const lastMessageSenderId = thread.lastMessage?.senderUserId
    ?? thread.lastMessage?.sender_user_id
    ?? thread.latestMessageSenderId
    ?? thread.latest_message_sender_id
    ?? null;
  const lastMessageCreatedAt = thread.lastMessage?.createdAt
    ?? thread.lastMessage?.created_at
    ?? thread.lastMessageAt
    ?? thread.last_message_at
    ?? null;

  return {
    id: thread.id,
    createdAt: thread.createdAt ?? thread.created_at,
    updatedAt: thread.updatedAt ?? thread.updated_at,
    lastMessageAt: thread.lastMessageAt ?? thread.last_message_at ?? null,
    initiatedByUserId: thread.initiatedByUserId ?? thread.initiated_by_user_id ?? null,
    counterpart: {
      id: thread.counterpart?.id ?? thread.counterpart_id,
      fullName: thread.counterpart?.fullName ?? thread.counterpart_full_name ?? 'Unknown builder',
      avatarUrl: thread.counterpart?.avatarUrl ?? thread.counterpart_avatar_url ?? null
    },
    source: {
      notificationId: thread.source?.notificationId ?? thread.sourceNotificationId ?? thread.source_notification_id ?? null,
      targetType: thread.source?.targetType ?? thread.sourceTargetType ?? thread.source_target_type ?? null,
      targetId: thread.source?.targetId ?? thread.sourceTargetId ?? thread.source_target_id ?? null,
      targetName: thread.source?.targetName ?? thread.sourceTargetName ?? thread.source_target_name ?? null
    },
    lastMessage: lastMessageBody
      ? {
          id: thread.lastMessage?.id ?? null,
          threadId: thread.id,
          senderUserId: lastMessageSenderId,
          body: lastMessageBody,
          createdAt: lastMessageCreatedAt
        }
      : null
  };
}

function mergeThread(currentThreads, nextThread) {
  const remaining = currentThreads.filter((thread) => thread.id !== nextThread.id);
  return [nextThread, ...remaining];
}

function mergeMessage(currentMessages, nextMessage) {
  if (currentMessages.some((message) => message.id === nextMessage.id)) {
    return currentMessages;
  }

  return [...currentMessages, nextMessage].sort((left, right) => (
    new Date(left.createdAt) - new Date(right.createdAt)
  ));
}

function toPreviewBody(body = '') {
  return body.length > 120 ? `${body.slice(0, 117)}...` : body;
}

function toThreadArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.threads)) {
    return response.threads;
  }

  return [];
}

function toMessageArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  return [];
}

export function ChatsProvider({ children }) {
  const { session } = useAuth();
  const [threads, setThreads] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [messagesStatus, setMessagesStatus] = useState('idle');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const loadThreads = useEffectEvent(async () => {
    if (!session?.access_token) {
      startTransition(() => {
        setThreads([]);
        setMessagesByThread({});
        setActiveThreadId(null);
        setStatus('idle');
        setMessagesStatus('idle');
        setError('');
      });
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await requestChats(session.access_token);
      const nextThreads = toThreadArray(response).map(normalizeChatThread);

      startTransition(() => {
        setThreads(nextThreads);
        setStatus('ready');
        setActiveThreadId((current) => (
          current && nextThreads.some((thread) => thread.id === current)
            ? current
            : nextThreads[0]?.id ?? null
        ));
      });
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  });

  const loadMessages = useEffectEvent(async (threadId) => {
    if (!session?.access_token || !threadId) {
      return;
    }

    if (messagesByThread[threadId]?.length) {
      return;
    }

    setMessagesStatus('loading');
    setError('');

    try {
      const response = await requestChatMessages(session.access_token, threadId);
      const nextMessages = toMessageArray(response).map(normalizeChatMessage);

      startTransition(() => {
        setMessagesByThread((current) => ({
          ...current,
          [threadId]: nextMessages
        }));
        setMessagesStatus('ready');
      });
    } catch (loadError) {
      setError(loadError.message);
      setMessagesStatus('error');
    }
  });

  useEffect(() => {
    loadThreads();
  }, [session?.access_token]);

  useEffect(() => {
    loadMessages(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!session?.access_token || !activeThreadId) {
      return undefined;
    }

    const channel = supabase.channel(`chat:${activeThreadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${activeThreadId}`
      }, ({ new: nextRecord }) => {
        const nextMessage = normalizeChatMessage(nextRecord);

        startTransition(() => {
          setMessagesByThread((current) => ({
            ...current,
            [activeThreadId]: mergeMessage(current[activeThreadId] ?? [], nextMessage)
          }));
          setThreads((current) => {
            const activeThread = current.find((thread) => thread.id === activeThreadId);

            if (!activeThread) {
              return current;
            }

            return mergeThread(current, {
              ...activeThread,
              lastMessageAt: nextMessage.createdAt,
              lastMessage: nextMessage
            });
          });
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.access_token, activeThreadId]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  async function openThread(threadId) {
    setActiveThreadId(threadId);
    await loadMessages(threadId);
  }

  async function startChatFromMatch(notification) {
    if (!session?.access_token) {
      throw new Error('You need to be signed in to start a chat.');
    }

    setError('');

    let nextThread;

    try {
      const response = await requestStartChatFromNotification(session.access_token, notification.id);
      nextThread = normalizeChatThread(response.thread ?? response);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }

    startTransition(() => {
      setThreads((current) => mergeThread(current, nextThread));
      setActiveThreadId(nextThread.id);
    });

    await loadMessages(nextThread.id);

    return nextThread;
  }

  async function sendMessage(threadId, body) {
    if (!session?.access_token) {
      throw new Error('You need to be signed in to send messages.');
    }

    const normalizedBody = body.trim();

    if (!normalizedBody) {
      return null;
    }

    setSending(true);
    setError('');

    try {
      const response = await requestSendChatMessage(session.access_token, threadId, normalizedBody);
      const nextMessage = normalizeChatMessage(response.message ?? response);

      startTransition(() => {
        setMessagesByThread((current) => ({
          ...current,
          [threadId]: mergeMessage(current[threadId] ?? [], nextMessage)
        }));
        setThreads((current) => {
          const active = current.find((thread) => thread.id === threadId);

          if (!active) {
            return current;
          }

          return mergeThread(current, {
            ...active,
            lastMessageAt: nextMessage.createdAt,
            lastMessage: {
              ...nextMessage,
              body: toPreviewBody(nextMessage.body)
            }
          });
        });
      });

      return nextMessage;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setSending(false);
    }
  }

  const value = {
    threads,
    activeThreadId,
    activeThread,
    messages: activeThreadId ? (messagesByThread[activeThreadId] ?? []) : [],
    loading: status === 'loading',
    loadingMessages: messagesStatus === 'loading',
    sending,
    error,
    openThread,
    startChatFromMatch,
    sendMessage,
    refreshThreads: loadThreads
  };

  return createElement(
    ChatsContext.Provider,
    { value },
    children ?? createElement(Outlet)
  );
}

export function useChats() {
  const context = useContext(ChatsContext);

  if (!context) {
    throw new Error('useChats must be used within a ChatsProvider');
  }

  return context;
}
