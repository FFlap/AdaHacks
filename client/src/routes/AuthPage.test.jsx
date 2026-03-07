import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthPage } from './AuthPage.jsx';

const authMock = {
  session: null,
  status: 'ready',
  signIn: vi.fn(),
  signUp: vi.fn()
};

vi.mock('../context/AuthContext.jsx', () => ({
  __esModule: true,
  AuthProvider: ({ children }) => children,
}));

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMock
}));

describe('AuthPage', () => {
  beforeEach(() => {
    authMock.signIn.mockReset();
    authMock.signUp.mockReset();
    authMock.session = null;
    authMock.status = 'ready';
  });

  it('submits sign-in credentials', async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
    fireEvent.submit(screen.getAllByRole('button', { name: /login/i })[1].closest('form'));

    await waitFor(() => {
      expect(authMock.signIn).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123'
      });
    });
  });

  it('requires matching passwords on sign-up', async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different123' } });
    fireEvent.submit(screen.getAllByRole('button', { name: /sign up/i })[1].closest('form'));

    expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
    expect(authMock.signUp).not.toHaveBeenCalled();
  });
});
