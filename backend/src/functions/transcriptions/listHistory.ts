import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { listByUser } from '../../repositories/transcription.repository';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const cursor = event.queryStringParameters?.cursor
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.cursor))
      : undefined;
    const { items, lastKey } = await listByUser(userId, 10, cursor);
    return jsonResponse(200, { items, nextCursor: lastKey ? encodeURIComponent(JSON.stringify(lastKey)) : null });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
