import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute.jsx';

const authState = {
  status: 'ready',
  session: null
};

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authState
}));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<p>private</p>} />
        </Route>
        <Route path="/auth" element={<p>auth page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to auth', async () => {
    authState.status = 'ready';
    authState.session = null;

    renderRoute();

    expect(await screen.findByText('auth page')).toBeInTheDocument();
  });

  it('renders the outlet when a session exists', async () => {
    authState.status = 'ready';
    authState.session = {
      access_token: 'token'
    };

    renderRoute();

    expect(await screen.findByText('private')).toBeInTheDocument();
  });
});
