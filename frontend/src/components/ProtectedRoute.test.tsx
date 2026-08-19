import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/" element={<div>Login page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Contenido privado</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('no renderiza nada mientras se resuelve la sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    renderProtected();

    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirige a la home si no hay sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    renderProtected();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('renderiza el contenido protegido si hay sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    renderProtected();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
