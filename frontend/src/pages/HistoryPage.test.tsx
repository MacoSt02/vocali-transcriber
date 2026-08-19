import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from './HistoryPage';
import * as api from '../services/api';
import * as downloadLib from '../lib/download';
import { useAuth } from '../hooks/useAuth';
import { Transcription } from '../types/transcription';

jest.mock('../hooks/useAuth');
jest.mock('../services/api', () => ({
  getHistory: jest.fn(),
  getDownloadUrl: jest.fn(),
  fetchTranscriptText: jest.fn(),
}));
jest.mock('../lib/download');

const mockedUseAuth = useAuth as jest.Mock;

const item: Transcription = {
  transcriptionId: 'tx-1',
  type: 'FILE',
  status: 'COMPLETED',
  createdAt: '2026-01-01T10:00:00.000Z',
};

function renderHistory() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  );
}

describe('HistoryPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ email: 'user@example.com', logout: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el mensaje de vacio si no hay transcripciones', async () => {
    (api.getHistory as jest.Mock).mockResolvedValue({ items: [], nextCursor: null });

    renderHistory();

    expect(await screen.findByText('Todavía no has transcrito ningún audio.')).toBeInTheDocument();
  });

  it('lista las transcripciones y permite ver el detalle', async () => {
    (api.getHistory as jest.Mock).mockResolvedValue({ items: [item], nextCursor: null });
    (api.getDownloadUrl as jest.Mock).mockResolvedValue({ downloadUrl: 'https://s3.example.com/get' });
    (api.fetchTranscriptText as jest.Mock).mockResolvedValue('texto de la transcripcion');

    renderHistory();

    await screen.findByText('Fichero');
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));

    expect(await screen.findByText('texto de la transcripcion')).toBeInTheDocument();
    expect(api.getDownloadUrl).toHaveBeenCalledWith('tx-1');
  });

  it('descarga la transcripcion seleccionada', async () => {
    (api.getHistory as jest.Mock).mockResolvedValue({ items: [item], nextCursor: null });
    (api.getDownloadUrl as jest.Mock).mockResolvedValue({ downloadUrl: 'https://s3.example.com/get' });
    (api.fetchTranscriptText as jest.Mock).mockResolvedValue('texto de la transcripcion');

    renderHistory();

    await screen.findByText('Fichero');
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }));

    await waitFor(() =>
      expect(downloadLib.downloadTextFile).toHaveBeenCalledWith('transcripcion-tx-1.txt', 'texto de la transcripcion')
    );
  });

  it('deshabilita ver y descargar si la transcripcion no esta completada', async () => {
    (api.getHistory as jest.Mock).mockResolvedValue({
      items: [{ ...item, status: 'PROCESSING' }],
      nextCursor: null,
    });

    renderHistory();

    await screen.findByText('Fichero');
    expect(screen.getByRole('button', { name: 'Ver' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeDisabled();
  });

  it('pagina hacia adelante y hacia atras usando el cursor', async () => {
    (api.getHistory as jest.Mock)
      .mockResolvedValueOnce({ items: [item], nextCursor: 'cursor-2' })
      .mockResolvedValueOnce({ items: [{ ...item, transcriptionId: 'tx-2' }], nextCursor: null });

    renderHistory();

    await screen.findByText('Página 1');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(api.getHistory).toHaveBeenLastCalledWith('cursor-2'));
    expect(await screen.findByText('Página 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Página 1')).toBeInTheDocument();
  });
});
