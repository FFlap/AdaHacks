# Notifications Feature

## Overview

The notifications feature provides in-app notifications to users when someone swipes right (likes) on their profile. The system is built on Supabase and includes:

- **Swipes Table**: Tracks all swipe interactions between users
- **Notifications Table**: Stores user notifications triggered by swipe events
- **Automatic Notification Creation**: Database triggers automatically create notifications when a right swipe occurs
- **Client-side Hook**: React hook for easy integration into components

## Database Schema

### Swipes Table

```sql
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY,
  swiped_by_user_id UUID NOT NULL,
  swiped_on_user_id UUID NOT NULL,
  profile_type TEXT NOT NULL (default: 'profile'),
  direction TEXT NOT NULL ('left' or 'right'),
  created_at TIMESTAMPTZ NOT NULL
);
```

**Indexes**:
- `swipes_swiped_by_user_id_idx`: For finding swipes from a user
- `swipes_swiped_on_user_id_idx`: For finding swipes on a profile
- `swipes_created_at_idx`: For ordering by timestamp

### Notifications Table

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  triggered_by_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL ('profile_liked' or 'project_liked'),
  related_swipe_id UUID NULLABLE,
  is_read BOOLEAN NOT NULL (default: false),
  created_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ NULLABLE
);
```

**Indexes**:
- `notifications_user_id_idx`: For finding notifications for a user
- `notifications_user_id_created_at_idx`: For ordered notification listing
- `notifications_is_read_idx`: For unread notification count queries

**RLS Policies**:
- Users can only read their own notifications
- Users can only update their own notifications

## API Endpoints

### 1. Record a Swipe

**Endpoint**: `POST /api/v1/swipes`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "direction": "right" | "left",
  "profileId": "uuid"
}
```

**Response**:
```json
{
  "status": "ok"
}
```

**Description**: Records a swipe action. Right swipes automatically trigger a notification for the swiped-on user.

### 2. Get Notifications

**Endpoint**: `GET /api/v1/notifications`

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "triggeredByUserId": "uuid",
      "notificationType": "profile_liked",
      "isRead": false,
      "createdAt": "2026-03-07T12:00:00Z",
      "readAt": null
    }
  ],
  "unreadCount": 2
}
```

**Description**: Fetches all notifications for the authenticated user, sorted by most recent first.

### 3. Mark Notification as Read

**Endpoint**: `POST /api/v1/notifications/:id/read`

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `id`: The notification ID

**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "triggeredByUserId": "uuid",
  "notificationType": "profile_liked",
  "isRead": true,
  "createdAt": "2026-03-07T12:00:00Z",
  "readAt": "2026-03-07T12:05:00Z"
}
```

**Description**: Marks a single notification as read.

### 4. Mark All Notifications as Read

**Endpoint**: `POST /api/v1/notifications/mark-all-read`

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "notifications": [...],
  "unreadCount": 0
}
```

**Description**: Marks all notifications as read for the authenticated user.

## Client-side Usage

### Using the `recordSwipe` Function

```javascript
import { recordSwipe } from '../lib/api';
import { useAuth } from '../context/useAuth';

function SwipeComponent({ profile }) {
  const { session } = useAuth();

  const handleSwipe = async (direction) => {
    try {
      await recordSwipe(session.access_token, direction, profile.id);
      // Handle success
    } catch (error) {
      console.error('Failed to record swipe:', error);
    }
  };

  return (
    // Component JSX
  );
}
```

### Using the `useNotifications` Hook

```javascript
import { useNotifications } from '../context/useNotifications';

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications();

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      <button onClick={markAllAsRead}>Mark all as read</button>
      
      {notifications.map((notification) => (
        <div key={notification.id}>
          <p>{notification.notificationType}</p>
          <small>{new Date(notification.createdAt).toLocaleString()}</small>
          {!notification.isRead && (
            <button onClick={() => markAsRead(notification.id)}>
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Automatic Notification Logic

The database includes a trigger (`swipes_create_notification`) that:

1. Listens for inserts into the `swipes` table
2. Checks if the swipe direction is `'right'`
3. Looks for existing unread notifications from the same swiper to the same swip-ee
4. If an unread notification exists, updates its timestamp
5. If no unread notification exists, creates a new one

This prevents notification spam while keeping the most recent interaction visible.

## Polling vs Real-time Updates

The `useNotifications` hook uses polling (30-second intervals) to check for new notifications. For real-time updates, you can:

1. Reduce the polling interval
2. Integrate Supabase Realtime subscriptions (requires additional setup)

### Example: Custom Real-time Hook

```javascript
import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase'; // You would need to create this

export function useNotificationsRealtime() {
  const supabase = useSupabase();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          // Handle real-time updates
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [supabase]);

  return notifications;
}
```

## Integration Steps

### 1. Update your components to record swipes

In your swipe handlers, call `recordSwipe`:

```javascript
const handleSwipe = async (direction, profile) => {
  try {
    await recordSwipe(session.access_token, direction, profile.id);
    // Proceed with UI update
  } catch (error) {
    // Handle error
  }
};
```

### 2. Add a notification component

Create a notification drawer or bell icon that shows unread count and displays notifications.

### 3. Fetch notifications on app load

Call the notifications API when the user logs in or the app mounts.

## Error Handling

All API functions throw errors on failure. Handle them appropriately:

```javascript
try {
  await recordSwipe(token, direction, profileId);
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
  } else {
    // Handle other errors
    console.error(error.message);
  }
}
```

## Testing

### Record a swipe
```bash
curl -X POST http://localhost:5000/api/v1/swipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "right", "profileId": "PROFILE_UUID"}'
```

### Get notifications
```bash
curl http://localhost:5000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark as read
```bash
curl -X POST http://localhost:5000/api/v1/notifications/NOTIFICATION_UUID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

1. **Notification Types**: Add support for different notification types (project_liked, message_received, etc.)
2. **Notification Preferences**: Allow users to configure notification settings
3. **Real-time Updates**: Integrate Supabase Realtime for instant notifications
4. **Notification Expiry**: Archive old notifications after a certain period
5. **Push Notifications**: Add support for browser push or mobile notifications
6. **Notification Grouping**: Group similar notifications together
7. **Undo Swipe**: Allow users to undo swipes within a time window
