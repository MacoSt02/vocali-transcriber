export type TranscriptionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Transcription {
  transcriptionId: string;
  type: 'FILE' | 'REALTIME';
  status: TranscriptionStatus;
  createdAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface StartTranscriptionResponse {
  transcriptionId: string;
  status: TranscriptionStatus;
}

export interface HistoryResponse {
  items: Transcription[];
  nextCursor: string | null;
}

export interface DownloadResponse {
  downloadUrl: string;
}

export interface RealtimeTokenResponse {
  token: string;
}

export interface SaveRealtimeResponse {
  transcriptionId: string;
  status: TranscriptionStatus;
}
