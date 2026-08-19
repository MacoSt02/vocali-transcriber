import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from './DashboardPage';
import * as api from '../services/api';
import * as downloadLib from '../lib/download';
import { useAuth } from '../hooks/useAuth';

jest.mock('axios');
jest.mock('../hooks/useAuth');
jest.mock('../services/api', () => ({
  getUploadUrl: jest.fn(),
  uploadAudioFile: jest.fn(),
  startTranscription: jest.fn(),
  getHistory: jest.fn(),
  getDownloadUrl: jest.fn(),
  fetchTranscriptText: jest.fn(),
  saveRealtimeTranscription: jest.fn(),
}));
jest.mock('../lib/download');
jest.mock('../hooks/useRealtimeTranscription', () => ({
  useRealtimeTranscription: () => ({
    status: 'idle',
    partialText: '',
    finalText: '',
    errorMessage: null,
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ email: 'user@example.com', logout: jest.fn() });
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('rechaza un fichero mayor de 20MB y no habilita el boton de transcribir', () => {
    renderDashboard();

    const oversized = new File(['a'.repeat(10)], 'audio.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(oversized, 'size', { value: 21 * 1024 * 1024 });

    fireEvent.change(screen.getByLabelText('Fichero de audio'), { target: { files: [oversized] } });

    expect(screen.getByText('El fichero de audio supera el límite de 20 MB.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transcribir' })).toBeDisabled();
  });

  it('sube el fichero, arranca la transcripcion y muestra el resultado cuando termina', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });

    (api.getUploadUrl as jest.Mock).mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', key: 'audio/key' });
    (api.uploadAudioFile as jest.Mock).mockResolvedValue(undefined);
    (api.startTranscription as jest.Mock).mockResolvedValue({ transcriptionId: 'tx-1' });
    (api.getHistory as jest.Mock).mockResolvedValue({
      items: [{ transcriptionId: 'tx-1', status: 'COMPLETED' }],
      nextCursor: null,
    });
    (api.getDownloadUrl as jest.Mock).mockResolvedValue({ downloadUrl: 'https://s3.example.com/get' });
    (api.fetchTranscriptText as jest.Mock).mockResolvedValue('texto transcrito');

    renderDashboard();

    const file = new File(['contenido'], 'audio.mp3', { type: 'audio/mpeg' });
    fireEvent.change(screen.getByLabelText('Fichero de audio'), { target: { files: [file] } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Transcribir' }));
      await waitFor(() => expect(api.startTranscription).toHaveBeenCalledWith('audio/key'));
    });

    expect(api.getUploadUrl).toHaveBeenCalledWith('audio/mpeg', file.size);
    expect(api.uploadAudioFile).toHaveBeenCalledWith('https://s3.example.com/put', file);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(await screen.findByText('Transcripción lista')).toBeInTheDocument();
    expect(screen.getByText('texto transcrito')).toBeInTheDocument();
  });

  it('descarga la transcripcion completada', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });

    (api.getUploadUrl as jest.Mock).mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', key: 'audio/key' });
    (api.uploadAudioFile as jest.Mock).mockResolvedValue(undefined);
    (api.startTranscription as jest.Mock).mockResolvedValue({ transcriptionId: 'tx-1' });
    (api.getHistory as jest.Mock).mockResolvedValue({
      items: [{ transcriptionId: 'tx-1', status: 'COMPLETED' }],
      nextCursor: null,
    });
    (api.getDownloadUrl as jest.Mock).mockResolvedValue({ downloadUrl: 'https://s3.example.com/get' });
    (api.fetchTranscriptText as jest.Mock).mockResolvedValue('texto transcrito');

    renderDashboard();

    const file = new File(['contenido'], 'audio.mp3', { type: 'audio/mpeg' });
    fireEvent.change(screen.getByLabelText('Fichero de audio'), { target: { files: [file] } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Transcribir' }));
      await waitFor(() => expect(api.startTranscription).toHaveBeenCalledWith('audio/key'));
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    await screen.findByText('Transcripción lista');

    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }));

    expect(downloadLib.downloadTextFile).toHaveBeenCalledWith('transcripcion-tx-1.txt', 'texto transcrito');
  });
});
