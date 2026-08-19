import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/repositories/transcription.repository');
jest.mock('../../../../src/services/s3.service');
jest.mock('uuid', () => ({ v4: () => 'fixed-rt-id' }));

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { saveTranscription } from '../../../../src/repositories/transcription.repository';
import { uploadText } from '../../../../src/services/s3.service';
import { handler } from '../../../../src/functions/transcriptions/saveRealtimeTranscription';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockSaveTranscription = saveTranscription as jest.Mock;
const mockUploadText = uploadText as jest.Mock;

function buildEvent(body: unknown): APIGatewayProxyEvent {
  return {
    headers: { Authorization: 'Bearer valido' },
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('saveRealtimeTranscription.handler', () => {
  it('sube el texto a S3 y guarda un registro REALTIME ya COMPLETED', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');

    const result = await handler(buildEvent({ transcriptText: 'hola, esto es en directo' }));

    expect(mockUploadText).toHaveBeenCalledWith('transcripts/user-1/fixed-rt-id.txt', 'hola, esto es en directo');
    expect(mockSaveTranscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        transcriptionId: 'fixed-rt-id',
        type: 'REALTIME',
        status: 'COMPLETED',
        transcriptS3Key: 'transcripts/user-1/fixed-rt-id.txt',
      })
    );
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({ transcriptionId: 'fixed-rt-id', status: 'COMPLETED' });
  });

  it('devuelve 400 si no se manda transcriptText, sin tocar S3 ni Dynamo', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');

    const result = await handler(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Missing transcriptText' });
    expect(mockUploadText).not.toHaveBeenCalled();
    expect(mockSaveTranscription).not.toHaveBeenCalled();
  });

  it('devuelve 400 si la sesion no es valida', async () => {
    mockGetUserIdFromToken.mockRejectedValue(new Error('Token expired'));

    const result = await handler(buildEvent({ transcriptText: 'hola' }));

    expect(result.statusCode).toBe(400);
    expect(mockUploadText).not.toHaveBeenCalled();
  });
});
