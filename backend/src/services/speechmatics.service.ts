import axios from 'axios';
import FormData from 'form-data';

const BATCH_URL = 'https://asr.api.speechmatics.com/v2';
const MANAGEMENT_URL = 'https://mp.speechmatics.com/v1';
const API_KEY = process.env.SPEECHMATICS_API_KEY as string;

export async function createBatchJob(audioUrl: string, notificationUrl: string): Promise<{ jobId: string }> {
  const config = {
    type: 'transcription',
    transcription_config: { language: 'es' },
    fetch_data: { url: audioUrl },
    notification_config: [{ url: notificationUrl }],
  };

  const form = new FormData();
  form.append('config', JSON.stringify(config));

  const response = await axios.post(`${BATCH_URL}/jobs`, form, {
    headers: { Authorization: `Bearer ${API_KEY}`, ...form.getHeaders() },
  });

  return { jobId: response.data.id };
}

export async function getTranscript(jobId: string): Promise<string> {
  const response = await axios.get(`${BATCH_URL}/jobs/${jobId}/transcript`, {
    params: { format: 'txt' },
    headers: { Authorization: `Bearer ${API_KEY}` },
    responseType: 'text',
  });
  return response.data;
}

export async function createRealtimeToken(): Promise<{ token: string }> {
  const response = await axios.post(
    `${MANAGEMENT_URL}/api_keys?type=rt`,
    { ttl: 60 },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  return { token: response.data.key_value };
}
