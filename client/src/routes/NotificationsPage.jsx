import AppShell from '../components/layout/AppShell.jsx';

const NotificationsPage = () => {
  const { notifications, handleNotificationResponse, notificationProfiles } = useNotifications();
  const [expandedNotification, setExpandedNotification] = useState(null);

  const handleConnect = (notification) => {
    handleNotificationResponse(notification.id, true);
    setExpandedNotification(null);
    // In real app: navigate(`/profile/${notification.triggeredByUserId}`)
  };

  const handleNoThanks = (notification) => {
    handleNotificationResponse(notification.id, false);
    setExpandedNotification(null);
  };

  const getNotificationMessage = (notification) => {
    if (notification.notificationType === 'profile_liked') {
      return 'swiped right on your profile';
    } else {
      return 'swiped right on your project';
    }
  };

  const groupedByUser = notifications.reduce((acc, notification) => {
    const userId = notification.triggeredByUserId;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(notification);
    return acc;
  }, {});

  return (
    <AppShell>
      <h1>Notifications Page</h1>
    </AppShell>
  );
};

export default NotificationsPage;
