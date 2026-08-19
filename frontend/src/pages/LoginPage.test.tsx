import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<div>Register page</div>} />
        <Route path="/forgot-password" element={<div>Forgot password page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('llama a login con las credenciales y navega al dashboard si funciona', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ login });

    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('user@example.com', 'secret123'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('muestra el mensaje de error si login falla', async () => {
    const login = jest.fn().mockRejectedValue(new Error('Credenciales incorrectas'));
    mockedUseAuth.mockReturnValue({ login });

    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navega a registro y a recuperar contraseña', () => {
    mockedUseAuth.mockReturnValue({ login: jest.fn() });

    renderLogin();

    fireEvent.click(screen.getByText('Crea una'));
    expect(screen.getByText('Register page')).toBeInTheDocument();
  });
});
