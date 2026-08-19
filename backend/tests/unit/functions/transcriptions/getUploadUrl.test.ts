import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/services/s3.service');
jest.mock('uuid', () => ({ v4: () => 'fixed-uuid' }));

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { getPresignedUploadUrl } from '../../../../src/services/s3.service';
import { handler } from '../../../../src/functions/transcriptions/getUploadUrl';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockGetPresignedUploadUrl = getPresignedUploadUrl as jest.Mock;

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    headers: { Authorization: 'Bearer valido' },
    body: JSON.stringify({ contentType: 'audio/mpeg' }),
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUploadUrl.handler', () => {
  it('devuelve una url prefirmada bajo el prefijo del usuario autenticado', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetPresignedUploadUrl.mockResolvedValue('https://s3.example.com/put');

    const result = await handler(buildEvent());

    expect(mockGetPresignedUploadUrl).toHaveBeenCalledWith('audio/user-1/fixed-uuid', 'audio/mpeg');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ uploadUrl: 'https://s3.example.com/put', key: 'audio/user-1/fixed-uuid' });
  });

  it('usa audio/mpeg por defecto si no se manda contentType', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetPresignedUploadUrl.mockResolvedValue('https://s3.example.com/put');

    await handler(buildEvent({ body: '{}' }));

    expect(mockGetPresignedUploadUrl).toHaveBeenCalledWith('audio/user-1/fixed-uuid', 'audio/mpeg');
  });

  it('devuelve 400 si el token no es valido', async () => {
    mockGetUserIdFromToken.mockRejectedValue(new Error('Token expired'));

    const result = await handler(buildEvent());

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Token expired' });
    expect(mockGetPresignedUploadUrl).not.toHaveBeenCalled();
  });
});
