import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { getPresignedUploadUrl } from '../../services/s3.service';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const { contentType } = JSON.parse(event.body ?? '{}');
    const key = `audio/${userId}/${uuid()}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType ?? 'audio/mpeg');
    return jsonResponse(200, { uploadUrl, key });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
