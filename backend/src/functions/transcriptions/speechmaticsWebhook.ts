import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTranscript } from '../../services/speechmatics.service';
import { uploadText } from '../../services/s3.service';
import { updateStatus } from '../../repositories/transcription.repository';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { userId, transcriptionId, id: jobId, status } = event.queryStringParameters ?? {};

  if (!userId || !transcriptionId || !jobId) {
    return jsonResponse(400, { message: 'Missing correlation query params' });
  }

  try {
    if (status === 'rejected') {
      await updateStatus(userId, transcriptionId, 'FAILED');
      return jsonResponse(200, { received: true });
    }

    const transcriptText = await getTranscript(jobId);
    const transcriptS3Key = `transcripts/${userId}/${transcriptionId}.txt`;
    await uploadText(transcriptS3Key, transcriptText);
    await updateStatus(userId, transcriptionId, 'COMPLETED', transcriptS3Key);

    return jsonResponse(200, { received: true });
  } catch (err) {
    await updateStatus(userId, transcriptionId, 'FAILED').catch(() => undefined);
    return jsonResponse(500, { message: (err as Error).message });
  }
};
