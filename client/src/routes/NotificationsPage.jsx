import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Avatar,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AppShell from '../components/layout/AppShell.jsx';
import { useNotifications } from '../context/useNotifications.js';

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
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {notifications.length === 0
              ? 'No notifications yet'
              : `You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              When someone swipes right on your profile or projects, you'll see it here.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(groupedByUser).map(([userId, userNotifications]) => {
              const profile = notificationProfiles[userId];
              const latestNotification = userNotifications[0];

              return (
                <Grid item xs={12} sm={6} md={6} key={userId}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)'
                      },
                      backgroundColor: latestNotification.isRead ? '#f9fafb' : '#eef2ff',
                      borderLeft: !latestNotification.isRead ? '4px solid #4338ca' : 'none'
                    }}
                    onClick={() => setExpandedNotification(latestNotification)}
                  >
                    <CardContent>
                      {profile ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            src={profile.avatarUrl || undefined}
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: '#4338ca'
                            }}
                          >
                            {profile.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {profile.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getNotificationMessage(latestNotification)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : null}

                      {userNotifications.length > 1 && (
                        <Chip
                          label={`+${userNotifications.length - 1} more interaction${userNotifications.length - 1 !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {new Date(latestNotification.createdAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Notification Detail Dialog */}
        <Dialog
          open={!!expandedNotification}
          onClose={() => setExpandedNotification(null)}
          maxWidth="sm"
          fullWidth
        >
          {expandedNotification && notificationProfiles[expandedNotification.triggeredByUserId] && (
            <>
              <DialogTitle>
                {notificationProfiles[expandedNotification.triggeredByUserId]?.fullName}
              </DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={notificationProfiles[expandedNotification.triggeredByUserId]?.avatarUrl || undefined}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#4338ca',
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    {notificationProfiles[expandedNotification.triggeredByUserId]?.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Avatar>

                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    {notificationProfiles[expandedNotification.triggeredByUserId]?.fullName}{' '}
                    {getNotificationMessage(expandedNotification)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {notificationProfiles[expandedNotification.triggeredByUserId]?.bio}
                  </Typography>

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.skills?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                        {notificationProfiles[expandedNotification.triggeredByUserId].skills.map(
                          (skill) => (
                            <Chip key={skill} label={skill} size="small" variant="outlined" />
                          )
                        )}
                      </Box>
                    </Box>
                  )}

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.projects?.length > 0 && (
                    <Box sx={{ mb: 2, textAlign: 'left' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Projects ({notificationProfiles[expandedNotification.triggeredByUserId].projects.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {notificationProfiles[expandedNotification.triggeredByUserId].projects.slice(0, 2).map((project) => (
                          <Box
                            key={project.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#f9fafb'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {project.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.description}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {new Date(expandedNotification.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, fontWeight: 500 }}>
                  Connect with {notificationProfiles[expandedNotification.triggeredByUserId]?.fullName.split(' ')[0]}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                  {notificationProfiles[expandedNotification.triggeredByUserId]?.socials?.linkedin && (
                    <Tooltip title="Open LinkedIn">
                      <IconButton
                        component="a"
                        href={notificationProfiles[expandedNotification.triggeredByUserId].socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#0077B5',
                          border: '2px solid #0077B5',
                          '&:hover': {
                            backgroundColor: '#f0f8ff'
                          }
                        }}
                      >
                        <LinkedInIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.socials?.instagram && (
                    <Tooltip title="Open Instagram">
                      <IconButton
                        component="a"
                        href={notificationProfiles[expandedNotification.triggeredByUserId].socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#E4405F',
                          border: '2px solid #E4405F',
                          '&:hover': {
                            backgroundColor: '#fff0f5'
                          }
                        }}
                      >
                        <InstagramIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.socials?.github && (
                    <Tooltip title="Open GitHub">
                      <IconButton
                        component="a"
                        href={notificationProfiles[expandedNotification.triggeredByUserId].socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#333',
                          border: '2px solid #333',
                          '&:hover': {
                            backgroundColor: '#f5f5f5'
                          }
                        }}
                      >
                        <GitHubIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.socials?.twitter && (
                    <Tooltip title="Open Twitter / X">
                      <IconButton
                        component="a"
                        href={notificationProfiles[expandedNotification.triggeredByUserId].socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#1DA1F2',
                          border: '2px solid #1DA1F2',
                          '&:hover': {
                            backgroundColor: '#f0f8ff'
                          }
                        }}
                      >
                        <TwitterIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {notificationProfiles[expandedNotification.triggeredByUserId]?.socials?.dribbble && (
                    <Tooltip title="Open Dribbble">
                      <IconButton
                        component="a"
                        href={notificationProfiles[expandedNotification.triggeredByUserId].socials.dribbble}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#EA4C89',
                          border: '2px solid #EA4C89',
                          '&:hover': {
                            backgroundColor: '#fff5f7'
                          }
                        }}
                      >
                        <EmojiEventsIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ gap: 2, p: 2, justifyContent: 'center' }}>
                <Button
                  onClick={() => handleNoThanks(expandedNotification)}
                  variant="outlined"
                  color="inherit"
                >
                  Dismiss
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </AppShell>
  );
};

export default NotificationsPage;
