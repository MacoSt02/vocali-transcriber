import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/services/speechmatics.service');

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { createRealtimeToken } from '../../../../src/services/speechmatics.service';
import { handler } from '../../../../src/functions/transcriptions/getRealtimeToken';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockCreateRealtimeToken = createRealtimeToken as jest.Mock;

function buildEvent(authHeader?: string): APIGatewayProxyEvent {
  return { headers: { Authorization: authHeader } } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getRealtimeToken.handler', () => {
  it('verifica la sesion y devuelve el JWT temporal de Speechmatics', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockCreateRealtimeToken.mockResolvedValue({ token: 'temp-jwt' });

    const result = await handler(buildEvent('Bearer valido'));

    expect(mockGetUserIdFromToken).toHaveBeenCalledWith('Bearer valido');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ token: 'temp-jwt' });
  });

  it('devuelve 400 sin pedir token a Speechmatics si la sesion no es valida', async () => {
    mockGetUserIdFromToken.mockRejectedValue(new Error('Missing Authorization header'));

    const result = await handler(buildEvent(undefined));

    expect(result.statusCode).toBe(400);
    expect(mockCreateRealtimeToken).not.toHaveBeenCalled();
  });
});
