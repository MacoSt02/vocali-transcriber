import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/middlewares/auth.middleware');
jest.mock('../../../../src/repositories/transcription.repository');
jest.mock('../../../../src/services/s3.service');
jest.mock('../../../../src/services/speechmatics.service');
jest.mock('uuid', () => ({ v4: () => 'fixed-tx-id' }));

import { getUserIdFromToken } from '../../../../src/middlewares/auth.middleware';
import { saveTranscription } from '../../../../src/repositories/transcription.repository';
import { getPresignedDownloadUrl } from '../../../../src/services/s3.service';
import { createBatchJob } from '../../../../src/services/speechmatics.service';
import { handler } from '../../../../src/functions/transcriptions/startBatchTranscription';

const mockGetUserIdFromToken = getUserIdFromToken as jest.Mock;
const mockSaveTranscription = saveTranscription as jest.Mock;
const mockGetPresignedDownloadUrl = getPresignedDownloadUrl as jest.Mock;
const mockCreateBatchJob = createBatchJob as jest.Mock;

function buildEvent(body: unknown): APIGatewayProxyEvent {
  return {
    headers: { Authorization: 'Bearer valido' },
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('startBatchTranscription.handler', () => {
  it('lanza el job en Speechmatics y guarda el registro PROCESSING', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');
    mockGetPresignedDownloadUrl.mockResolvedValue('https://s3.example.com/audio-read-url');
    mockCreateBatchJob.mockResolvedValue({ jobId: 'sm-job-1' });

    const result = await handler(buildEvent({ audioKey: 'audio/user-1/abc.mp3' }));

    expect(mockGetPresignedDownloadUrl).toHaveBeenCalledWith('audio/user-1/abc.mp3', 900);
    expect(mockCreateBatchJob).toHaveBeenCalledWith(
      'https://s3.example.com/audio-read-url',
      'https://api.example.com/webhooks/speechmatics?userId=user-1&transcriptionId=fixed-tx-id'
    );
    expect(mockSaveTranscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        transcriptionId: 'fixed-tx-id',
        type: 'FILE',
        status: 'PROCESSING',
        audioS3Key: 'audio/user-1/abc.mp3',
        speechmaticsJobId: 'sm-job-1',
      })
    );
    expect(result.statusCode).toBe(202);
    expect(JSON.parse(result.body)).toEqual({ transcriptionId: 'fixed-tx-id', status: 'PROCESSING' });
  });

  it('devuelve 400 si falta audioKey', async () => {
    mockGetUserIdFromToken.mockResolvedValue('user-1');

    const result = await handler(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Missing audioKey' });
    expect(mockCreateBatchJob).not.toHaveBeenCalled();
  });
});
