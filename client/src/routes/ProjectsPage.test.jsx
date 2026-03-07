import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectsPage from './ProjectsPage.jsx';

const authMock = {
  session: {
    access_token: 'token-123'
  }
};

const apiMocks = vi.hoisted(() => ({
  getProjectsFeed: vi.fn()
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../lib/api.js', () => ({
  getProjectsFeed: apiMocks.getProjectsFeed
}));

vi.mock('../components/layout/AppShell.jsx', () => ({
  default: ({ children }) => children
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    apiMocks.getProjectsFeed.mockReset();
    apiMocks.getProjectsFeed.mockResolvedValue([
      {
        id: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
        name: 'Orbit',
        theme: 'Climate',
        description: 'Maps urban heat islands.',
        techStack: ['Vite', 'Supabase'],
        owner: {
          id: '5ba6c5b5-5341-4638-a164-a3b0f9b88447',
          fullName: 'Maya Chen',
          avatarUrl: null
        }
      }
    ]);
  });

  it('loads discoverable projects from the API', async () => {
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(apiMocks.getProjectsFeed).toHaveBeenCalledWith('token-123');
    });

    expect(await screen.findByText('Orbit')).toBeInTheDocument();
    expect(screen.getByText('Maya Chen')).toBeInTheDocument();
    expect(screen.getByText('Maps urban heat islands.')).toBeInTheDocument();
  });
});
