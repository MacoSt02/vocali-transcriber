import axios from 'axios';
import {
  api,
  fetchTranscriptText,
  getDownloadUrl,
  getHistory,
  getRealtimeToken,
  getUploadUrl,
  saveRealtimeTranscription,
  setAuthToken,
  setUnauthorizedHandler,
  startTranscription,
  uploadAudioFile,
} from './api';

describe('api service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    setAuthToken(null);
    setUnauthorizedHandler(null);
  });

  it('getUploadUrl pide una URL prefirmada con el content type indicado', async () => {
    const post = jest.spyOn(api, 'post').mockResolvedValue({
      data: { uploadUrl: 'https://s3.example.com/put', key: 'audio/u1/abc' },
    });

    const result = await getUploadUrl('audio/mpeg');

    expect(post).toHaveBeenCalledWith('/transcriptions/upload-url', { contentType: 'audio/mpeg' });
    expect(result).toEqual({ uploadUrl: 'https://s3.example.com/put', key: 'audio/u1/abc' });
  });

  it('uploadAudioFile sube el fichero por PUT sin pasar por la instancia autenticada', async () => {
    const put = jest.spyOn(axios, 'put').mockResolvedValue({});
    const file = new File(['contenido'], 'audio.mp3', { type: 'audio/mpeg' });

    await uploadAudioFile('https://s3.example.com/put', file);

    expect(put).toHaveBeenCalledWith('https://s3.example.com/put', file, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  });

  it('startTranscription manda el audioKey y devuelve el id creado', async () => {
    const post = jest.spyOn(api, 'post').mockResolvedValue({ data: { transcriptionId: 'tx-1', status: 'PROCESSING' } });

    const result = await startTranscription('audio/u1/abc');

    expect(post).toHaveBeenCalledWith('/transcriptions', { audioKey: 'audio/u1/abc' });
    expect(result.transcriptionId).toBe('tx-1');
  });

  it('getHistory omite el parametro cursor cuando no se pasa', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { items: [], nextCursor: null } });

    await getHistory();

    expect(get).toHaveBeenCalledWith('/transcriptions', { params: undefined });
  });

  it('getHistory reenvia el cursor cuando se pasa', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { items: [], nextCursor: null } });

    await getHistory('cursor-abc');

    expect(get).toHaveBeenCalledWith('/transcriptions', { params: { cursor: 'cursor-abc' } });
  });

  it('getDownloadUrl pide la url de descarga de la transcripcion indicada', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { downloadUrl: 'https://s3.example.com/get' } });

    const result = await getDownloadUrl('tx-1');

    expect(get).toHaveBeenCalledWith('/transcriptions/tx-1/download');
    expect(result.downloadUrl).toBe('https://s3.example.com/get');
  });

  it('fetchTranscriptText lee el texto plano de la url prefirmada, sin la instancia autenticada', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: 'hola mundo' });

    const text = await fetchTranscriptText('https://s3.example.com/get');

    expect(get).toHaveBeenCalledWith('https://s3.example.com/get', { responseType: 'text' });
    expect(text).toBe('hola mundo');
  });

  it('getRealtimeToken pide el JWT temporal de Speechmatics', async () => {
    const post = jest.spyOn(api, 'post').mockResolvedValue({ data: { token: 'jwt-temp' } });

    const result = await getRealtimeToken();

    expect(post).toHaveBeenCalledWith('/transcriptions/realtime/token');
    expect(result.token).toBe('jwt-temp');
  });

  it('saveRealtimeTranscription manda el texto acumulado para persistirlo', async () => {
    const post = jest
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { transcriptionId: 'tx-rt-1', status: 'COMPLETED' } });

    const result = await saveRealtimeTranscription('texto transcrito en directo');

    expect(post).toHaveBeenCalledWith('/transcriptions/realtime', { transcriptText: 'texto transcrito en directo' });
    expect(result.transcriptionId).toBe('tx-rt-1');
  });

  it('el interceptor anade el header Authorization cuando hay un token guardado', async () => {
    setAuthToken('id-token-123');
    // No mockeamos api.post (eso saltaria por encima del interceptor); sustituimos el
    // adapter de transporte para inspeccionar la config ya procesada por los interceptors.
    const originalAdapter = api.defaults.adapter;
    const adapter = jest
      .fn()
      .mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
    api.defaults.adapter = adapter;

    try {
      await startTranscription('audio/u1/abc');

      const sentConfig = adapter.mock.calls[0][0];
      expect(sentConfig.headers.get('Authorization')).toBe('Bearer id-token-123');
    } finally {
      api.defaults.adapter = originalAdapter;
    }
  });
});
