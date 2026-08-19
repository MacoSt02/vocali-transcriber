import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../../src/services/speechmatics.service');
jest.mock('../../../../src/services/s3.service');
jest.mock('../../../../src/repositories/transcription.repository');

import { getTranscript } from '../../../../src/services/speechmatics.service';
import { uploadText } from '../../../../src/services/s3.service';
import { updateStatus } from '../../../../src/repositories/transcription.repository';
import { handler } from '../../../../src/functions/transcriptions/speechmaticsWebhook';

const mockGetTranscript = getTranscript as jest.Mock;
const mockUploadText = uploadText as jest.Mock;
const mockUpdateStatus = updateStatus as jest.Mock;

function buildEvent(query: Record<string, string> | null): APIGatewayProxyEvent {
  return { queryStringParameters: query } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('speechmaticsWebhook.handler', () => {
  it('devuelve 400 si faltan los parametros de correlacion', async () => {
    const result = await handler(buildEvent({ userId: 'user-1' }));

    expect(result.statusCode).toBe(400);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('marca la transcripcion como FAILED si Speechmatics notifica rejected, sin descargar nada', async () => {
    const result = await handler(buildEvent({ userId: 'user-1', transcriptionId: 'tx-1', id: 'job-1', status: 'rejected' }));

    expect(mockUpdateStatus).toHaveBeenCalledWith('user-1', 'tx-1', 'FAILED');
    expect(mockGetTranscript).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(200);
  });

  it('descarga el transcript, lo sube a S3 y marca COMPLETED cuando el job termino bien', async () => {
    mockGetTranscript.mockResolvedValue('texto transcrito');

    const result = await handler(buildEvent({ userId: 'user-1', transcriptionId: 'tx-1', id: 'job-1', status: 'success' }));

    expect(mockGetTranscript).toHaveBeenCalledWith('job-1');
    expect(mockUploadText).toHaveBeenCalledWith('transcripts/user-1/tx-1.txt', 'texto transcrito');
    expect(mockUpdateStatus).toHaveBeenCalledWith('user-1', 'tx-1', 'COMPLETED', 'transcripts/user-1/tx-1.txt');
    expect(result.statusCode).toBe(200);
  });

  it('marca FAILED (sin tumbar la respuesta) si algo falla al procesar el transcript', async () => {
    mockGetTranscript.mockRejectedValue(new Error('speechmatics down'));
    mockUpdateStatus.mockResolvedValue(undefined);

    const result = await handler(buildEvent({ userId: 'user-1', transcriptionId: 'tx-1', id: 'job-1', status: 'success' }));

    expect(mockUpdateStatus).toHaveBeenCalledWith('user-1', 'tx-1', 'FAILED');
    expect(result.statusCode).toBe(500);
  });
});
