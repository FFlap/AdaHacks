import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProfilePage } from './ProfilePage.jsx';

const authMock = {
  session: {
    access_token: 'token-123',
    user: {
      email: 'ada@example.com'
    }
  },
  signOut: vi.fn()
};

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../lib/api.js', () => ({
  getMe: apiMocks.getMe,
  updateProfile: apiMocks.updateProfile
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    apiMocks.getMe.mockReset();
    apiMocks.updateProfile.mockReset();
    apiMocks.getMe.mockResolvedValue({
      user: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        email: 'ada@example.com'
      },
      profile: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        fullName: 'Ada Lovelace',
        bio: 'Analytical engine enthusiast',
        createdAt: '2026-03-07T18:00:00.000Z',
        updatedAt: '2026-03-07T18:00:00.000Z'
      }
    });
    apiMocks.updateProfile.mockResolvedValue({
      user: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        email: 'ada@example.com'
      },
      profile: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        fullName: 'Ada Byron',
        bio: 'First programmer',
        createdAt: '2026-03-07T18:00:00.000Z',
        updatedAt: '2026-03-07T18:05:00.000Z'
      }
    });
  });

  it('loads and updates the profile through the API layer', async () => {
    render(<ProfilePage />);

    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Ada Byron' }
    });
    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: 'First programmer' }
    });
    fireEvent.submit(screen.getByRole('button', { name: /save profile/i }).closest('form'));

    await waitFor(() => {
      expect(apiMocks.updateProfile).toHaveBeenCalledWith('token-123', {
        fullName: 'Ada Byron',
        bio: 'First programmer'
      });
    });

    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
  });
});
