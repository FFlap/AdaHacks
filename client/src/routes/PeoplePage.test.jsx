import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PeoplePage from './PeoplePage.jsx';

const authMock = {
  session: {
    access_token: 'token-123'
  }
};

const apiMocks = vi.hoisted(() => ({
  getPeopleFeed: vi.fn()
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../lib/api.js', () => ({
  getPeopleFeed: apiMocks.getPeopleFeed
}));

vi.mock('../components/layout/AppShell.jsx', () => ({
  default: ({ children }) => children
}));

describe('PeoplePage', () => {
  beforeEach(() => {
    apiMocks.getPeopleFeed.mockReset();
    apiMocks.getPeopleFeed.mockResolvedValue([
      {
        id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
        fullName: 'Maya Chen',
        avatarUrl: null,
        bio: 'Frontend builder looking for climate-tech teams.',
        skills: ['React', 'Supabase'],
        createdAt: '2026-03-07T18:00:00.000Z',
        projects: [
          {
            id: '9e6f7cb7-4800-4ef2-8e4f-15ad9e426812',
            name: 'Pulse',
            theme: 'Hackathon'
          }
        ]
      }
    ]);
  });

  it('loads discoverable people from the API', async () => {
    render(<PeoplePage />);

    await waitFor(() => {
      expect(apiMocks.getPeopleFeed).toHaveBeenCalledWith('token-123');
    });

    expect(await screen.findByText('Maya Chen')).toBeInTheDocument();
    expect(screen.getByText('Frontend builder looking for climate-tech teams.')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });
});
