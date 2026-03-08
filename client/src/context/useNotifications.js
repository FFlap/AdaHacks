import {
  createElement,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useState
} from 'react';
import { Outlet } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead as requestMarkNotificationRead
} from '../lib/api.js';
import { useAuth } from './useAuth.js';
import { NotificationsContext } from './context.js';

export function NotificationsProvider({ children }) {
  const { session, signOut } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const loadNotifications = useEffectEvent(async ({ silent = false } = {}) => {
    if (!session?.access_token) {
      startTransition(() => {
        setNotifications([]);
        setStatus('idle');
        setError('');
      });
      return;
    }

    if (!silent) {
      setStatus('loading');
    }
    setError('');

    try {
      const response = await getNotifications(session.access_token);
      startTransition(() => {
        setNotifications(response);
        setStatus('ready');
      });
    } catch (loadError) {
      if (loadError.status === 401) {
        await signOut();
        return;
      }

      setError(loadError.message);
      setStatus('error');
    }
  });

  useEffect(() => {
    loadNotifications();
  }, [session?.access_token, signOut]);

  useEffect(() => {
    if (!session?.access_token) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.access_token, signOut]);

  async function markAsRead(notificationId) {
    const activeNotification = notifications.find((notification) => notification.id === notificationId);

    if (!session?.access_token || !activeNotification || activeNotification.readAt) {
      return activeNotification ?? null;
    }

    const response = await requestMarkNotificationRead(session.access_token, notificationId);

    setNotifications((current) => current.map((notification) => (
      notification.id === notificationId
        ? { ...notification, readAt: response.readAt }
        : notification
    )));

    return {
      ...activeNotification,
      readAt: response.readAt
    };
  }

  const value = {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
    loading: status === 'loading',
    error,
    markAsRead
  };

  return createElement(
    NotificationsContext.Provider,
    { value },
    children ?? createElement(Outlet)
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
