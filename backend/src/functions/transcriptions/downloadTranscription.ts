import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { getPresignedDownloadUrl } from '../../services/s3.service';
import { getById } from '../../repositories/transcription.repository';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const id = event.pathParameters?.id;
    if (!id) throw new Error('Missing transcription id');

    const transcription = await getById(userId, id);
    if (!transcription || !transcription.transcriptS3Key) {
      return jsonResponse(404, { message: 'Transcription not found or not ready yet' });
    }

    const downloadUrl = await getPresignedDownloadUrl(transcription.transcriptS3Key);
    return jsonResponse(200, { downloadUrl });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
