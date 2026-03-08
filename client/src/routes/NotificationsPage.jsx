import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useChats } from '../context/useChats.js';
import { useNotifications } from '../context/useNotifications.js';

const contactRenderers = [
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { key: 'twitter', label: 'Twitter / X', icon: TwitterIcon },
  { key: 'github', label: 'GitHub', icon: GitHubIcon },
  { key: 'email', label: 'Email', icon: EmailOutlinedIcon, href: (value) => `mailto:${value}` },
  { key: 'phone', label: 'Phone', icon: LocalPhoneOutlinedIcon, href: (value) => `tel:${value}` }
];

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || 'N';
}

function formatNotificationMessage(notification) {
  const subject = notification.targetType === 'project'
    ? `your project${notification.target.name ? ` ${notification.target.name}` : ''}`
    : 'your profile';

  return notification.decision === 'like'
    ? `liked ${subject}`
    : `passed on ${subject}`;
}

function formatTimestamp(value) {
  return new Date(value).toLocaleString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    markAsRead
  } = useNotifications();
  const { startChatFromMatch } = useChats();
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [startingChatFor, setStartingChatFor] = useState('');
  const [chatError, setChatError] = useState('');

  async function handleOpenNotification(notification) {
    const nextNotification = notification.readAt
      ? notification
      : await markAsRead(notification.id);

    setChatError('');
    setExpandedNotification(nextNotification ?? notification);
  }

  async function handleStartChat() {
    if (!expandedNotification) {
      return;
    }

    setStartingChatFor(expandedNotification.id);
    setChatError('');

    try {
      const thread = await startChatFromMatch(expandedNotification);
      setExpandedNotification(null);
      navigate(`/chat?thread=${thread.id}`);
    } catch (startError) {
      setChatError(startError.message ?? 'Unable to start chat right now.');
    } finally {
      setStartingChatFor('');
    }
  }

  return (
    <AppShell>
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          px: {
            xs: 2,
            sm: 3,
            md: 4
          }
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ '@media (prefers-color-scheme: dark)': { color: '#fff' } }}>
            Every like on your profile and projects shows up here.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ mt: 8, display: 'grid', placeItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={28} />
            <Typography color="#e5e7eb">Loading matches...</Typography>
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        {!loading && !notifications.length ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              textAlign: 'center',
              py: 7,
              '@media (prefers-color-scheme: dark)': {
                backgroundColor: '#2a2828',
                border: '1px solid #3d3a3a'
              }
            }}
          >
            <Typography variant="h6" sx={{ '@media (prefers-color-scheme: dark)': { color: '#f5f0f0' } }}>No matches yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, '@media (prefers-color-scheme: dark)': { color: '#fff' } }}>
              When someone swipes on your profile or one of your projects, it will show up here.
            </Typography>
          </Card>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))'
            },
            alignItems: 'start'
          }}
        >
          {notifications.map((notification) => (
            <Card
              component="button"
              elevation={0}
              key={notification.id}
              onClick={() => handleOpenNotification(notification)}
              sx={{
                width: '100%',
                height: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 4,
                border: notification.readAt ? '1px solid #e5e7eb' : '1px solid #111111',
                backgroundColor: notification.readAt ? '#ffffff' : '#f8fafc',
                p: 0
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={notification.actor.avatarUrl ?? undefined} sx={{ width: 52, height: 52 }}>
                    {getInitials(notification.actor.fullName)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {notification.actor.fullName}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.25 }}>
                      {formatNotificationMessage(notification)}
                    </Typography>
                  </Box>
                  {!notification.readAt ? (
                    <Box
                      aria-label="Unread match"
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: '#111111'
                      }}
                    />
                  ) : null}
                </Stack>

                <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 13 }}>
                  {formatTimestamp(notification.createdAt)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Dialog
          open={!!expandedNotification}
          onClose={() => setExpandedNotification(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 5,
              border: '1px solid #d4d4d4',
              backgroundColor: '#fbfbf9'
            }
          }}
        >
          {expandedNotification ? (
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#6b6b6b'
                      }}
                    >
                      Match
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, letterSpacing: '-0.03em' }}>
                      {expandedNotification.actor.fullName}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                      {formatNotificationMessage(expandedNotification)}
                    </Typography>
                  </Box>
                  <IconButton aria-label="Close match" onClick={() => setExpandedNotification(null)}>
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ px: 3, pb: 3, display: 'grid', gap: 3 }}>
                {chatError ? (
                  <Alert severity="error">
                    {chatError}
                  </Alert>
                ) : null}

                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>About them</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {expandedNotification.actor.bio || 'No bio added yet.'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>Skills</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {expandedNotification.actor.skills.length ? (
                      expandedNotification.actor.skills.map((skill) => (
                        <Chip key={skill} label={skill} variant="outlined" />
                      ))
                    ) : (
                      <Typography color="text.secondary">No skills listed yet.</Typography>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>Projects</Typography>
                  {expandedNotification.actor.projects.length ? (
                    <Stack spacing={1.25}>
                      {expandedNotification.actor.projects.slice(0, 3).map((project) => (
                        <Box
                          key={project.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }}>{project.name}</Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
                            {project.description || project.theme || 'No project summary added yet.'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No projects listed yet.</Typography>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>Contact & socials</Typography>
                  {contactRenderers.some((entry) => expandedNotification.actor.contactLinks[entry.key]) ? (
                    <Stack spacing={1}>
                      {contactRenderers.map((entry) => {
                        const value = expandedNotification.actor.contactLinks[entry.key];

                        if (!value) {
                          return null;
                        }

                        const Icon = entry.icon;
                        const href = entry.href ? entry.href(value) : value;

                        return (
                          <Link
                            color="inherit"
                            href={href}
                            key={entry.key}
                            rel="noopener noreferrer"
                            target={entry.key === 'email' || entry.key === 'phone' ? undefined : '_blank'}
                            underline="none"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 3,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <Icon fontSize="small" />
                            <Box sx={{ display: 'grid' }}>
                              <Typography sx={{ fontSize: 12, color: '#6b6b6b' }}>{entry.label}</Typography>
                              <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
                            </Box>
                          </Link>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No contact links shared yet.</Typography>
                  )}
                </Box>

                {expandedNotification.decision === 'like' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleStartChat}
                      disabled={startingChatFor === expandedNotification.id}
                      sx={{
                        borderRadius: '999px',
                        px: 3,
                        py: 1.1,
                        textTransform: 'none',
                        fontWeight: 700,
                        backgroundColor: '#152028',
                        '&:hover': {
                          backgroundColor: '#25394a'
                        }
                      }}
                    >
                      {startingChatFor === expandedNotification.id ? 'Starting chat...' : 'Start chat'}
                    </Button>
                  </Box>
                ) : null}
              </Box>
            </DialogContent>
          ) : null}
        </Dialog>
      </Container>
    </AppShell>
  );
}
