import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { saveTranscription } from '../../repositories/transcription.repository';
import { uploadText } from '../../services/s3.service';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const { transcriptText } = JSON.parse(event.body ?? '{}');
    if (!transcriptText) throw new Error('Missing transcriptText');

    const transcriptionId = uuid();
    const transcriptS3Key = `transcripts/${userId}/${transcriptionId}.txt`;
    await uploadText(transcriptS3Key, transcriptText);

    const now = new Date().toISOString();
    await saveTranscription({
      userId,
      transcriptionId,
      type: 'REALTIME',
      status: 'COMPLETED',
      transcriptS3Key,
      createdAt: now,
      updatedAt: now,
    });

    return jsonResponse(201, { transcriptionId, status: 'COMPLETED' });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
