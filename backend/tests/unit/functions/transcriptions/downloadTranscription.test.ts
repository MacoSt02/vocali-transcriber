import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/repositories/transcription.repository');
jest.mock('../../../../src/services/s3.service');

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { getById } from '../../../../src/repositories/transcription.repository';
import { getPresignedDownloadUrl } from '../../../../src/services/s3.service';
import { handler } from '../../../../src/functions/transcriptions/downloadTranscription';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockGetById = getById as jest.Mock;
const mockGetPresignedDownloadUrl = getPresignedDownloadUrl as jest.Mock;

function buildEvent(id?: string): APIGatewayProxyEvent {
  return {
    headers: { Authorization: 'Bearer valido' },
    pathParameters: id ? { id } : null,
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('downloadTranscription.handler', () => {
  it('devuelve la url prefirmada cuando la transcripcion esta lista', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetById.mockResolvedValue({ transcriptS3Key: 'transcripts/user-1/tx-1.txt' });
    mockGetPresignedDownloadUrl.mockResolvedValue('https://s3.example.com/get');

    const result = await handler(buildEvent('tx-1'));

    expect(mockGetById).toHaveBeenCalledWith('user-1', 'tx-1');
    expect(mockGetPresignedDownloadUrl).toHaveBeenCalledWith('transcripts/user-1/tx-1.txt');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ downloadUrl: 'https://s3.example.com/get' });
  });

  it('devuelve 404 si la transcripcion no existe', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetById.mockResolvedValue(undefined);

    const result = await handler(buildEvent('tx-de-otro-usuario'));

    expect(result.statusCode).toBe(404);
    expect(mockGetPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('devuelve 404 si la transcripcion aun no tiene transcriptS3Key (no esta lista)', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetById.mockResolvedValue({ status: 'PROCESSING' });

    const result = await handler(buildEvent('tx-1'));

    expect(result.statusCode).toBe(404);
  });

  it('devuelve 400 si no se manda id en la ruta', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');

    const result = await handler(buildEvent(undefined));

    expect(result.statusCode).toBe(400);
    expect(mockGetById).not.toHaveBeenCalled();
  });
});
