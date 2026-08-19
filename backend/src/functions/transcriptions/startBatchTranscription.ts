import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { saveTranscription } from '../../repositories/transcription.repository';
import { getPresignedDownloadUrl } from '../../services/s3.service';
import { createBatchJob } from '../../services/speechmatics.service';
import { jsonResponse } from '../../utils/http';

const WEBHOOK_URL = process.env.SPEECHMATICS_WEBHOOK_URL as string;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const { audioKey } = JSON.parse(event.body ?? '{}');
    if (!audioKey) throw new Error('Missing audioKey');

    const transcriptionId = uuid();
    const audioUrl = await getPresignedDownloadUrl(audioKey, 900);
    const notificationUrl = `${WEBHOOK_URL}?userId=${encodeURIComponent(userId)}&transcriptionId=${encodeURIComponent(transcriptionId)}`;

    const { jobId } = await createBatchJob(audioUrl, notificationUrl);

    const now = new Date().toISOString();
    await saveTranscription({
      userId,
      transcriptionId,
      type: 'FILE',
      status: 'PROCESSING',
      audioS3Key: audioKey,
      speechmaticsJobId: jobId,
      createdAt: now,
      updatedAt: now,
    });

    return jsonResponse(202, { transcriptionId, status: 'PROCESSING' });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
