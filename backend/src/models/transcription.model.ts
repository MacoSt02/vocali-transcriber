export type TranscriptionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type TranscriptionType = 'FILE' | 'REALTIME';

export interface Transcription {
  userId: string;
  transcriptionId: string;
  type: TranscriptionType;
  status: TranscriptionStatus;
  audioS3Key?: string;
  speechmaticsJobId?: string;
  transcriptS3Key?: string;
  transcriptText?: string;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}
