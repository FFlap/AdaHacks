import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';

const supabaseAuthMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}));

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn()
}));

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: supabaseAuthMocks
  }
}));

vi.mock('../lib/api.js', () => ({
  getMe: apiMocks.getMe
}));

function AuthConsumer() {
  const {
    cachedMe,
    refreshCachedMe,
    setCachedMe,
    signOut,
    status
  } = useAuth();

  return (
    <div>
      <p>{status}</p>
      <p>{cachedMe?.profile?.fullName ?? 'empty'}</p>
      <button
        onClick={() => refreshCachedMe({ force: true })}
        type="button"
      >
        refresh profile
      </button>
      <button
        onClick={() => setCachedMe({
          user: {
            id: 'user-1',
            email: 'ada@example.com'
          },
          profile: {
            fullName: 'Ada Lovelace'
          }
        })}
        type="button"
      >
        cache profile
      </button>
      <button onClick={() => signOut()} type="button">
        sign out
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  let authStateChangeHandler;

  beforeEach(() => {
    authStateChangeHandler = null;
    supabaseAuthMocks.getSession.mockReset();
    supabaseAuthMocks.onAuthStateChange.mockReset();
    supabaseAuthMocks.signInWithPassword.mockReset();
    supabaseAuthMocks.signUp.mockReset();
    supabaseAuthMocks.signOut.mockReset();
    apiMocks.getMe.mockReset();

    supabaseAuthMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
          user: {
            id: 'user-1',
            email: 'ada@example.com'
          }
        }
      },
      error: null
    });
    supabaseAuthMocks.onAuthStateChange.mockImplementation((handler) => {
      authStateChangeHandler = handler;

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      };
    });
    supabaseAuthMocks.signOut.mockResolvedValue({ error: null });
    apiMocks.getMe.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'ada@example.com'
      },
      profile: {
        fullName: 'Ada Remote'
      }
    });
  });

  it('stores and clears the cached profile snapshot on sign out', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('ready')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cache profile/i }));

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(supabaseAuthMocks.signOut).toHaveBeenCalled();
      expect(screen.getByText('empty')).toBeInTheDocument();
    });
  });

  it('clears the cached profile snapshot when auth state changes to signed out', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('ready')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cache profile/i }));
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await act(async () => {
      authStateChangeHandler?.('SIGNED_OUT', null);
    });

    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('deduplicates concurrent me refreshes through the shared cache loader', async () => {
    let resolveRequest;
    apiMocks.getMe.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('ready')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /refresh profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /refresh profile/i }));

    expect(apiMocks.getMe).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({
        user: {
          id: 'user-1',
          email: 'ada@example.com'
        },
        profile: {
          fullName: 'Ada Remote'
        }
      });
    });

    expect(await screen.findByText('Ada Remote')).toBeInTheDocument();
  });
});
