import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/repositories/transcription.repository');

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { listByUser } from '../../../../src/repositories/transcription.repository';
import { handler } from '../../../../src/functions/transcriptions/listHistory';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockListByUser = listByUser as jest.Mock;

function buildEvent(cursor?: string): APIGatewayProxyEvent {
  return {
    headers: { Authorization: 'Bearer valido' },
    queryStringParameters: cursor ? { cursor } : null,
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listHistory.handler', () => {
  it('pide 10 elementos del usuario autenticado sin cursor', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockListByUser.mockResolvedValue({ items: [{ transcriptionId: 'tx-1' }], lastKey: undefined });

    const result = await handler(buildEvent());

    expect(mockListByUser).toHaveBeenCalledWith('user-1', 10, undefined);
    expect(JSON.parse(result.body)).toEqual({ items: [{ transcriptionId: 'tx-1' }], nextCursor: null });
  });

  it('decodifica el cursor recibido y lo pasa al repositorio', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockListByUser.mockResolvedValue({ items: [], lastKey: undefined });
    const cursor = { userId: 'user-1', createdAt: '2026-08-01T00:00:00.000Z' };

    await handler(buildEvent(encodeURIComponent(JSON.stringify(cursor))));

    expect(mockListByUser).toHaveBeenCalledWith('user-1', 10, cursor);
  });

  it('codifica el lastKey devuelto como nextCursor para la siguiente pagina', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    const lastKey = { userId: 'user-1', createdAt: '2026-08-01T00:00:00.000Z' };
    mockListByUser.mockResolvedValue({ items: [], lastKey });

    const result = await handler(buildEvent());

    expect(JSON.parse(result.body).nextCursor).toBe(encodeURIComponent(JSON.stringify(lastKey)));
  });
});
