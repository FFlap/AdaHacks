import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/useAuth.js';
import { useChats } from '../context/useChats.js';

function formatConversationTimestamp(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || 'C';
}

function getSourceContext(thread) {
  if (thread?.source?.targetType === 'project') {
    return `Started from your project${thread.source.targetName ? ` ${thread.source.targetName}` : ''}`;
  }

  if (thread?.source?.targetType === 'profile') {
    return 'Started from your profile';
  }

  return 'Started from a match';
}

function getPreviewText(thread) {
  if (thread?.lastMessage?.body) {
    return thread.lastMessage.body;
  }

  return getSourceContext(thread);
}

export default function ChatPage() {
  const { session } = useAuth();
  const {
    threads,
    activeThreadId,
    activeThread,
    messages,
    loading,
    loadingMessages,
    sending,
    error,
    openThread,
    sendMessage
  } = useChats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const requestedThreadId = searchParams.get('thread');
  const currentUserId = session?.user?.id ?? null;

  const syncRequestedThread = useEffectEvent(async () => {
    if (requestedThreadId && requestedThreadId !== activeThreadId && threads.some((thread) => thread.id === requestedThreadId)) {
      await openThread(requestedThreadId);
      return;
    }

    if (!requestedThreadId && activeThreadId) {
      setSearchParams({ thread: activeThreadId }, { replace: true });
    }
  });

  useEffect(() => {
    syncRequestedThread();
  }, [requestedThreadId, activeThreadId, threads]);

  const orderedMessages = useMemo(
    () => [...messages].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt)),
    [messages]
  );

  async function handleSelectThread(threadId) {
    setSearchParams({ thread: threadId });
    await openThread(threadId);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextBody = draft.trim();

    if (!activeThreadId || !nextBody) {
      return;
    }

    await sendMessage(activeThreadId, nextBody);
    setDraft('');
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
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Start from a match, then keep the conversation going here in real time.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(280px, 340px) minmax(0, 1fr)'
            },
            alignItems: 'stretch'
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ px: 2.5, py: 2.25, borderBottom: '1px solid #edf2f7' }}>
              <Typography sx={{ fontWeight: 700 }}>Conversations</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
                {threads.length ? `${threads.length} active ${threads.length === 1 ? 'thread' : 'threads'}` : 'No chats yet'}
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
                <CircularProgress color="inherit" size={26} />
              </Box>
            ) : null}

            {!loading && !threads.length ? (
              <Box sx={{ px: 2.5, py: 4 }}>
                <Typography sx={{ fontWeight: 600 }}>No conversations yet</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                  When you tap <strong>Start chat</strong> from a like in Matches, the thread will show up here.
                </Typography>
              </Box>
            ) : null}

            <Stack divider={<Divider flexItem />} sx={{ maxHeight: 680, overflowY: 'auto' }}>
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;

                return (
                  <Box
                    component="button"
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    sx={{
                      width: '100%',
                      border: 0,
                      background: isActive ? '#edf6ff' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      px: 2.5,
                      py: 2,
                      transition: 'background-color 160ms ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#edf6ff' : '#f8fafc'
                      }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar src={thread.counterpart.avatarUrl ?? undefined}>
                        {getInitials(thread.counterpart.fullName)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {thread.counterpart.fullName}
                          </Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                            {formatConversationTimestamp(thread.lastMessageAt ?? thread.createdAt)}
                          </Typography>
                        </Stack>
                        <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: 13 }} noWrap>
                          {getSourceContext(thread)}
                        </Typography>
                        <Typography sx={{ mt: 0.75, fontSize: 14 }} noWrap>
                          {getPreviewText(thread)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Card>

          <Card
            elevation={0}
            sx={{
              minHeight: 620,
              borderRadius: 5,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {!activeThread ? (
              <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', px: 4 }}>
                <Box sx={{ maxWidth: 420, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Pick a conversation
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                    Choose a thread from the left, or start a new one from a match you want to follow up on.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    px: 3,
                    py: 2.5,
                    borderBottom: '1px solid #edf2f7',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={activeThread.counterpart.avatarUrl ?? undefined}
                      sx={{ width: 52, height: 52 }}
                    >
                      {getInitials(activeThread.counterpart.fullName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                        {activeThread.counterpart.fullName}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.35 }}>
                        {getSourceContext(activeThread)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ flex: 1, px: 3, py: 2.5, overflowY: 'auto', backgroundColor: '#fcfdfd' }}>
                  {loadingMessages ? (
                    <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                      <CircularProgress color="inherit" size={24} />
                    </Box>
                  ) : null}

                  {!loadingMessages && !orderedMessages.length ? (
                    <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                      <Box sx={{ maxWidth: 360, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700 }}>Say hi first</Typography>
                        <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                          This chat is ready. Send a message if you want to explore the match.
                        </Typography>
                      </Box>
                    </Box>
                  ) : null}

                  <Stack spacing={1.5}>
                    {orderedMessages.map((message) => {
                      const isOwnMessage = currentUserId && message.senderUserId === currentUserId;

                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: {
                                xs: '88%',
                                sm: '72%'
                              },
                              px: 1.75,
                              py: 1.25,
                              borderRadius: 3,
                              backgroundColor: isOwnMessage ? '#152028' : '#ffffff',
                              color: isOwnMessage ? '#ffffff' : '#152028',
                              border: isOwnMessage ? 'none' : '1px solid #e5e7eb',
                              boxShadow: isOwnMessage ? '0 18px 36px rgba(21, 32, 40, 0.16)' : 'none'
                            }}
                          >
                            <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {message.body}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.75,
                                fontSize: 11,
                                opacity: 0.7,
                                textAlign: isOwnMessage ? 'right' : 'left'
                              }}
                            >
                              {formatConversationTimestamp(message.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                <Divider />

                <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-end">
                    <TextField
                      fullWidth
                      minRows={1}
                      maxRows={4}
                      multiline
                      placeholder={`Message ${activeThread.counterpart.fullName}...`}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!draft.trim() || sending}
                      sx={{
                        minWidth: 128,
                        borderRadius: '999px',
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        backgroundColor: '#152028',
                        '&:hover': {
                          backgroundColor: '#25394a'
                        }
                      }}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}
          </Card>
        </Box>
      </Container>
    </AppShell>
  );
}
