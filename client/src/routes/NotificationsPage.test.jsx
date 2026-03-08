import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import NotificationsPage from './NotificationsPage.jsx';

const notificationMocks = vi.hoisted(() => ({
  markAsRead: vi.fn(),
  startChatFromMatch: vi.fn(),
  navigate: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => notificationMocks.navigate
  };
});

vi.mock('../context/useNotifications.js', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
        decision: 'like',
        targetType: 'project',
        createdAt: '2026-03-07T18:10:00.000Z',
        readAt: null,
        actor: {
          id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
          fullName: 'Maya Chen',
          avatarUrl: null,
          bio: 'Frontend builder looking for climate-tech teams.',
          skills: ['React', 'Supabase'],
          projects: [
            {
              id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
              name: 'Pulse',
              theme: 'Hackathon',
              description: 'Live team coordination board.',
              techStack: ['Node.js', 'Express']
            }
          ],
          contactLinks: {
            github: 'https://github.com/mayachen',
            email: 'maya@example.com'
          }
        },
        target: {
          id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
          name: 'Pulse'
        }
      }
    ],
    loading: false,
    error: '',
    markAsRead: notificationMocks.markAsRead
  })
}));

vi.mock('../context/useChats.js', () => ({
  useChats: () => ({
    startChatFromMatch: notificationMocks.startChatFromMatch
  })
}));

vi.mock('../components/layout/AppShell.jsx', () => ({
  default: ({ children }) => children
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    notificationMocks.markAsRead.mockReset();
    notificationMocks.startChatFromMatch.mockReset();
    notificationMocks.navigate.mockReset();
    notificationMocks.markAsRead.mockResolvedValue({
      id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25',
      decision: 'like',
      targetType: 'project',
      createdAt: '2026-03-07T18:10:00.000Z',
      readAt: '2026-03-07T18:12:00.000Z',
      actor: {
        id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        fullName: 'Maya Chen',
        avatarUrl: null,
        bio: 'Frontend builder looking for climate-tech teams.',
        skills: ['React', 'Supabase'],
        projects: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon',
            description: 'Live team coordination board.',
            techStack: ['Node.js', 'Express']
          }
        ],
        contactLinks: {
          github: 'https://github.com/mayachen',
          email: 'maya@example.com'
        }
      },
      target: {
        id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
        name: 'Pulse'
      }
    });
    notificationMocks.startChatFromMatch.mockResolvedValue({
      id: 'thread-123'
    });
  });

  it('opens a notification detail view and can start a chat from a like match', async () => {
    const user = userEvent.setup();

    render(<NotificationsPage />);

    await user.click(screen.getByRole('button', { name: /maya chen/i }));

    await waitFor(() => {
      expect(notificationMocks.markAsRead).toHaveBeenCalledWith('4ea60354-358e-4f13-8b5e-faf6d6b32d25');
    });

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(/liked your project pulse/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Frontend builder looking for climate-tech teams.')).toBeInTheDocument();
    expect(within(dialog).getByText('https://github.com/mayachen')).toBeInTheDocument();
    expect(within(dialog).getByText('maya@example.com')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /start chat/i }));

    await waitFor(() => {
      expect(notificationMocks.startChatFromMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '4ea60354-358e-4f13-8b5e-faf6d6b32d25'
        })
      );
    });

    expect(notificationMocks.navigate).toHaveBeenCalledWith('/chat?thread=thread-123');
  });
});
