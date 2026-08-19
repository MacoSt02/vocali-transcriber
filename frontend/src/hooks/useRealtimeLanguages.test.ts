import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useRealtimeLanguages } from './useRealtimeLanguages';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useRealtimeLanguages', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('empieza con la lista reducida de idiomas por defecto', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {})); // nunca resuelve durante este test
    const { result } = renderHook(() => useRealtimeLanguages());

    expect(result.current).toEqual(expect.arrayContaining([{ code: 'es', label: 'Español' }]));
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('sustituye la lista por defecto por los idiomas de Speechmatics, ordenados por nombre', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        metadata: {
          language_pack_info: {
            es: { language_description: 'Spanish' },
            en: { language_description: 'English' },
            de: { language_description: 'German' },
          },
        },
        realtime: { transcription: [{ languages: ['es', 'en', 'de'] }] },
      },
    });

    const { result } = renderHook(() => useRealtimeLanguages());

    await waitFor(() => {
      expect(result.current).toEqual([
        { code: 'en', label: 'English' },
        { code: 'de', label: 'German' },
        { code: 'es', label: 'Spanish' },
      ]);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('https://eu2.rt.speechmatics.com/v1/discovery/features');
  });

  it('se queda con la lista reducida por defecto si Speechmatics no responde', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useRealtimeLanguages());

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    expect(result.current).toEqual(expect.arrayContaining([{ code: 'es', label: 'Español' }]));
  });
});
