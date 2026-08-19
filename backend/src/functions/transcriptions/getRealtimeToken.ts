import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserIdFromToken } from '../../middlewares/auth.middleware';
import { createRealtimeToken } from '../../services/speechmatics.service';
import { jsonResponse } from '../../utils/http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await getUserIdFromToken(event.headers.Authorization);
    const { token } = await createRealtimeToken();
    return jsonResponse(200, { token });
  } catch (err) {
    return jsonResponse(400, { message: (err as Error).message });
  }
};
