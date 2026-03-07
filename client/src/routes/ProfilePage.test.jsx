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

const mediaMocks = vi.hoisted(() => ({
  uploadAvatar: vi.fn(),
  validateAvatarFile: vi.fn()
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

vi.mock('../lib/api.js', () => ({
  getMe: apiMocks.getMe,
  updateProfile: apiMocks.updateProfile
}));

vi.mock('../lib/profileMedia.js', () => ({
  avatarAccept: 'image/png,image/jpeg,image/webp',
  uploadAvatar: mediaMocks.uploadAvatar,
  validateAvatarFile: mediaMocks.validateAvatarFile
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    apiMocks.getMe.mockReset();
    apiMocks.updateProfile.mockReset();
    mediaMocks.uploadAvatar.mockReset();
    mediaMocks.validateAvatarFile.mockReset();
    mediaMocks.validateAvatarFile.mockReturnValue('');
    apiMocks.getMe.mockResolvedValue({
      user: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        email: 'ada@example.com'
      },
      profile: {
        id: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620',
        fullName: 'Ada Lovelace',
        bio: 'Analytical engine enthusiast',
        avatarUrl: null,
        skills: ['React', 'Supabase'],
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
        avatarUrl: 'https://example.supabase.co/storage/v1/object/public/profile-images/34cd/avatar',
        skills: ['React', 'Supabase', 'Node.js'],
        createdAt: '2026-03-07T18:00:00.000Z',
        updatedAt: '2026-03-07T18:05:00.000Z'
      }
    });
    mediaMocks.uploadAvatar.mockResolvedValue('34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar');
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
    fireEvent.change(screen.getByLabelText(/tech stack & frameworks/i), {
      target: { value: 'Node.js' }
    });
    fireEvent.keyDown(screen.getByLabelText(/tech stack & frameworks/i), {
      key: 'Enter'
    });
    fireEvent.change(screen.getByLabelText(/profile picture/i), {
      target: {
        files: [new File(['avatar'], 'avatar.png', { type: 'image/png' })]
      }
    });
    fireEvent.submit(screen.getByRole('button', { name: /save profile/i }).closest('form'));

    await waitFor(() => {
      expect(mediaMocks.uploadAvatar).toHaveBeenCalled();
      expect(apiMocks.updateProfile).toHaveBeenCalledWith('token-123', {
        fullName: 'Ada Byron',
        bio: 'First programmer',
        avatarPath: '34cd1065-d6c8-4f3d-b1dc-d6ee5ca28620/avatar',
        skills: ['React', 'Supabase', 'Node.js']
      });
    });

    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
  });

  it('shows a validation error when the avatar file is rejected', async () => {
    mediaMocks.validateAvatarFile.mockReturnValue('Use a PNG, JPG, or WebP image.');
    render(<ProfilePage />);

    await screen.findByDisplayValue('Ada Lovelace');

    fireEvent.change(screen.getByLabelText(/profile picture/i), {
      target: {
        files: [new File(['avatar'], 'avatar.gif', { type: 'image/gif' })]
      }
    });

    expect(await screen.findByText(/use a png, jpg, or webp image/i)).toBeInTheDocument();
    expect(mediaMocks.uploadAvatar).not.toHaveBeenCalled();
  });
});
