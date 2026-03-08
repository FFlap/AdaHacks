import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ChatPage from './ChatPage.jsx';

const chatMocks = vi.hoisted(() => ({
  openThread: vi.fn(),
  sendMessage: vi.fn(),
  state: {
    threads: [],
    activeThreadId: null,
    activeThread: null,
    messages: [],
    loading: false,
    loadingMessages: false,
    sending: false,
    error: '',
    openThread: vi.fn(),
    sendMessage: vi.fn()
  }
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => ({
    session: {
      user: {
        id: 'viewer-1'
      }
    }
  })
}));

vi.mock('../context/useChats.js', () => ({
  useChats: () => chatMocks.state
}));

vi.mock('../components/layout/AppShell.jsx', () => ({
  default: ({ children }) => children
}));

describe('ChatPage', () => {
  beforeEach(() => {
    chatMocks.openThread.mockReset();
    chatMocks.sendMessage.mockReset();
    chatMocks.state = {
      threads: [],
      activeThreadId: null,
      activeThread: null,
      messages: [],
      loading: false,
      loadingMessages: false,
      sending: false,
      error: '',
      openThread: chatMocks.openThread,
      sendMessage: chatMocks.sendMessage
    };
  });

  it('shows an empty state before any chats exist', () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText(/start chat/i)).toBeInTheDocument();
  });

  it('renders an active thread and sends a message', async () => {
    const user = userEvent.setup();

    chatMocks.state = {
      threads: [
        {
          id: 'thread-1',
          createdAt: '2026-03-07T18:00:00.000Z',
          lastMessageAt: '2026-03-07T18:05:00.000Z',
          counterpart: {
            id: 'user-2',
            fullName: 'Maya Chen',
            avatarUrl: null
          },
          source: {
            targetType: 'project',
            targetName: 'Pulse'
          },
          lastMessage: {
            id: 'message-1',
            body: 'Would love to build this with you.',
            createdAt: '2026-03-07T18:05:00.000Z'
          }
        }
      ],
      activeThreadId: 'thread-1',
      activeThread: {
        id: 'thread-1',
        createdAt: '2026-03-07T18:00:00.000Z',
        lastMessageAt: '2026-03-07T18:05:00.000Z',
        counterpart: {
          id: 'user-2',
          fullName: 'Maya Chen',
          avatarUrl: null
        },
        source: {
          targetType: 'project',
          targetName: 'Pulse'
        },
        lastMessage: {
          id: 'message-1',
          body: 'Would love to build this with you.',
          createdAt: '2026-03-07T18:05:00.000Z'
        }
      },
      messages: [
        {
          id: 'message-1',
          senderUserId: 'user-2',
          body: 'Would love to build this with you.',
          createdAt: '2026-03-07T18:05:00.000Z'
        }
      ],
      loading: false,
      loadingMessages: false,
      sending: false,
      error: '',
      openThread: chatMocks.openThread,
      sendMessage: chatMocks.sendMessage
    };

    render(
      <MemoryRouter initialEntries={['/chat?thread=thread-1']}>
        <ChatPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Maya Chen')).toHaveLength(2);
    expect(screen.getAllByText('Started from your project Pulse')).toHaveLength(2);
    expect(screen.getAllByText('Would love to build this with you.')).toHaveLength(2);

    await user.type(screen.getByPlaceholderText(/message maya chen/i), 'Interested. Want to chat tomorrow?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(chatMocks.sendMessage).toHaveBeenCalledWith('thread-1', 'Interested. Want to chat tomorrow?');
  });
});
