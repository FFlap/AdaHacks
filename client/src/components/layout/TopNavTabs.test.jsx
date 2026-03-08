import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TopNavTabs from './TopNavTabs.jsx';

const authMock = {
  session: {
    access_token: 'token-123'
  }
};

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn()
}));

vi.mock('../../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../../context/useNotifications.js', () => ({
  useNotifications: () => ({
    unreadCount: 1
  })
}));

vi.mock('../../lib/api.js', () => ({
  getMe: apiMocks.getMe
}));

describe('TopNavTabs', () => {
  beforeEach(() => {
    apiMocks.getMe.mockReset();
  });

  it('locks projects and people until the required profile fields are filled', async () => {
    const user = userEvent.setup();

    apiMocks.getMe.mockResolvedValue({
      user: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        email: 'ada@example.com'
      },
      profile: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        fullName: '',
        bio: '',
        avatarUrl: null,
        contactLinks: {},
        skills: [],
        projects: [],
        createdAt: '2026-03-07T18:00:00.000Z',
        updatedAt: '2026-03-07T18:00:00.000Z'
      }
    });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <TopNavTabs />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiMocks.getMe).toHaveBeenCalledWith('token-123');
    });

    const projectsTab = screen.getByText('Projects').closest('[role="tab"]');
    const peopleTab = screen.getByText('People').closest('[role="tab"]');

    expect(projectsTab).toHaveAttribute('aria-disabled', 'true');
    expect(peopleTab).toHaveAttribute('aria-disabled', 'true');

    await user.hover(screen.getByText('Projects'));

    expect(
      await screen.findByText(/add your name, at least one tech stack & frameworks entry, and at least one contact method/i)
    ).toBeInTheDocument();
  });
});
