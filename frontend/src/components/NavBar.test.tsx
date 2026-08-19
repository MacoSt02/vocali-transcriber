import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './NavBar';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NavBar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el email del usuario y los enlaces de navegacion', () => {
    mockedUseAuth.mockReturnValue({ email: 'user@example.com', logout: jest.fn() });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Transcribir' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/history');
  });

  it('cierra sesion y navega al login al pulsar el boton', () => {
    const logout = jest.fn();
    mockedUseAuth.mockReturnValue({ email: 'user@example.com', logout });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
