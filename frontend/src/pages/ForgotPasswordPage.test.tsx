import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
const mockedUseAuth = useAuth as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('pide el codigo y pasa al paso de confirmacion', async () => {
    const forgotPassword = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ forgotPassword, confirmForgotPassword: jest.fn() });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledWith('user@example.com'));
    expect(await screen.findByText('Elige una contraseña nueva')).toBeInTheDocument();
  });

  it('confirma la nueva contraseña y navega al login', async () => {
    const forgotPassword = jest.fn().mockResolvedValue(undefined);
    const confirmForgotPassword = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ forgotPassword, confirmForgotPassword });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await screen.findByText('Elige una contraseña nueva');

    fireEvent.change(screen.getByLabelText('Código de verificación'), { target: { value: '654321' } });
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'NewPass1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() =>
      expect(confirmForgotPassword).toHaveBeenCalledWith('user@example.com', '654321', 'NewPass1')
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
