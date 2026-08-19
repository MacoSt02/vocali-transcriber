import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registra al usuario y pasa al paso de confirmacion', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ register, confirmRegistration: jest.fn() });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(register).toHaveBeenCalledWith('user@example.com', 'Password1'));
    expect(await screen.findByText('Verifica tu cuenta')).toBeInTheDocument();
  });

  it('confirma el registro con el codigo y navega al login', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    const confirmRegistration = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ register, confirmRegistration });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await screen.findByText('Verifica tu cuenta');

    fireEvent.change(screen.getByLabelText('Código de verificación'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar y entrar' }));

    await waitFor(() => expect(confirmRegistration).toHaveBeenCalledWith('user@example.com', '123456'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
