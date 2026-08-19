import axios from 'axios';
import {
  DownloadResponse,
  HistoryResponse,
  RealtimeTokenResponse,
  SaveRealtimeResponse,
  StartTranscriptionResponse,
  UploadUrlResponse,
} from '../types/transcription';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export async function getUploadUrl(contentType: string): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>('/transcriptions/upload-url', { contentType });
  return data;
}

export async function uploadAudioFile(uploadUrl: string, file: File): Promise<void> {
  await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
}

export async function startTranscription(audioKey: string): Promise<StartTranscriptionResponse> {
  const { data } = await api.post<StartTranscriptionResponse>('/transcriptions', { audioKey });
  return data;
}

export async function getHistory(cursor?: string): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>('/transcriptions', { params: cursor ? { cursor } : undefined });
  return data;
}

export async function getDownloadUrl(transcriptionId: string): Promise<DownloadResponse> {
  const { data } = await api.get<DownloadResponse>(`/transcriptions/${transcriptionId}/download`);
  return data;
}

// El .txt en S3 es publico solo via URL prefirmada de corta duracion, sin auth propia,
// por eso tampoco usa la instancia `api`.
export async function fetchTranscriptText(downloadUrl: string): Promise<string> {
  const { data } = await axios.get<string>(downloadUrl, { responseType: 'text' });
  return data;
}

export async function getRealtimeToken(): Promise<RealtimeTokenResponse> {
  const { data } = await api.post<RealtimeTokenResponse>('/transcriptions/realtime/token');
  return data;
}

export async function saveRealtimeTranscription(transcriptText: string): Promise<SaveRealtimeResponse> {
  const { data } = await api.post<SaveRealtimeResponse>('/transcriptions/realtime', { transcriptText });
  return data;
}
