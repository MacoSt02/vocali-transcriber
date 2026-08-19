import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GuestRoute from './GuestRoute';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

function renderGuest() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <GuestRoute>
              <div>Login page</div>
            </GuestRoute>
          }
        />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestRoute', () => {
  it('no renderiza nada mientras se resuelve la sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    renderGuest();

    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renderiza el contenido para invitados si no hay sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    renderGuest();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirige al dashboard si ya hay sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    renderGuest();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
