jest.mock('axios');

import axios from 'axios';
import FormData from 'form-data';
import { createBatchJob, getTranscript, createRealtimeToken } from '../../../src/services/speechmatics.service';

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('speechmatics.service', () => {
  it('createBatchJob manda fetch_data + notification_config en el multipart y devuelve el jobId', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'job-123' } });

    const result = await createBatchJob('https://s3-signed-url.example.com/audio.mp3', 'https://api.example.com/webhooks/speechmatics');

    expect(result).toEqual({ jobId: 'job-123' });
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    const [url, form, options] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('https://asr.api.speechmatics.com/v2/jobs');
    expect(options?.headers?.Authorization).toBe(`Bearer ${process.env.SPEECHMATICS_API_KEY}`);

    // 'form' es una instancia real de FormData (no un mock): comprobamos el
    // contenido serializado del campo 'config' para verificar que el JSON es correcto.
    const body = (form as FormData).getBuffer().toString('utf-8');
    expect(body).toContain('"type":"transcription"');
    expect(body).toContain('"language":"es"');
    expect(body).toContain('"fetch_data":{"url":"https://s3-signed-url.example.com/audio.mp3"}');
    expect(body).toContain('"notification_config":[{"url":"https://api.example.com/webhooks/speechmatics"}]');
  });

  it('getTranscript pide el formato txt y devuelve el texto plano', async () => {
    mockedAxios.get.mockResolvedValue({ data: 'hola, esto es una transcripcion de prueba' });

    const text = await getTranscript('job-123');

    expect(text).toBe('hola, esto es una transcripcion de prueba');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://asr.api.speechmatics.com/v2/jobs/job-123/transcript',
      expect.objectContaining({
        params: { format: 'txt' },
        headers: { Authorization: `Bearer ${process.env.SPEECHMATICS_API_KEY}` },
      })
    );
  });

  it('createRealtimeToken pide un token de tipo rt de corta duracion a la Management API', async () => {
    mockedAxios.post.mockResolvedValue({ data: { key_value: 'temp-jwt-token' } });

    const result = await createRealtimeToken();

    expect(result).toEqual({ token: 'temp-jwt-token' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://mp.speechmatics.com/v1/api_keys?type=rt',
      { ttl: 60 },
      { headers: { Authorization: `Bearer ${process.env.SPEECHMATICS_API_KEY}` } }
    );
  });
});
