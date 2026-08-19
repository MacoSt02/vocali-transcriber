import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { getPresignedUploadUrl } from '../../services/s3.service';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { jsonResponse } from '../../utils/http';

export const MAX_AUDIO_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const { contentType, fileSize } = JSON.parse(event.body ?? '{}');

    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return jsonResponse(400, { message: 'fileSize is required and must be a positive number' });
    }
    if (fileSize > MAX_AUDIO_FILE_SIZE_BYTES) {
      return jsonResponse(400, { message: 'El fichero de audio supera el límite de 20 MB' });
    }

    const key = `audio/${userId}/${uuid()}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType ?? 'audio/mpeg');
    return jsonResponse(200, { uploadUrl, key });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
