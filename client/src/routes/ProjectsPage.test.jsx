import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectsPage from './ProjectsPage.jsx';

const authMock = {
  session: {
    access_token: 'token-123'
  }
};

const apiMocks = vi.hoisted(() => ({
  analyzeProject: vi.fn(),
  getProjectsFeed: vi.fn()
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../lib/api.js', () => ({
  analyzeProject: apiMocks.analyzeProject,
  getProjectsFeed: apiMocks.getProjectsFeed
}));

vi.mock('../components/layout/AppShell.jsx', () => ({
  default: ({ children }) => children
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    apiMocks.analyzeProject.mockReset();
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
    apiMocks.analyzeProject.mockResolvedValue({
      projectId: 'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9',
      matchingSkills: ['Supabase'],
      missingSkills: ['Node.js'],
      contributionSummary: 'You can help on the data model and wire the frontend state to the API.'
    });
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

  it('opens the project analysis modal and caches the result per project', async () => {
    const user = userEvent.setup();

    render(<ProjectsPage />);

    expect(await screen.findByText('Orbit')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open project analysis for orbit/i }));

    await waitFor(() => {
      expect(apiMocks.analyzeProject).toHaveBeenCalledWith(
        'token-123',
        'b92a1ba0-e6d6-4e92-b95b-11e7c79b74c9'
      );
    });

    expect(await screen.findByText('You already match')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Supabase')).toBeInTheDocument();
    expect(within(dialog).getByText('Node.js')).toBeInTheDocument();
    expect(
      within(dialog).getByText('You can help on the data model and wire the frontend state to the API.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close project analysis/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /open project analysis for orbit/i }));

    await waitFor(() => {
      expect(screen.getByText('How you can contribute')).toBeInTheDocument();
    });
    expect(apiMocks.analyzeProject).toHaveBeenCalledTimes(1);
  });
});
