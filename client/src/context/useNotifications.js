import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/api';

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = session.access_token;
      const data = await getNotifications(token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, session?.access_token]);

  useEffect(() => {
    fetchNotifications();
    // Set up polling interval (e.g., check for new notifications every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!session?.access_token) {
        return;
      }

      try {
        await markNotificationAsRead(session.access_token, notificationId);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        setError(err.message || 'Failed to mark notification as read');
      }
    },
    [session?.access_token]
  );

  const markAllAsRead = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      const data = await markAllNotificationsAsRead(session.access_token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
    }
  }, [session?.access_token]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
