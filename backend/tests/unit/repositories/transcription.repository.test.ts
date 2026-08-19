import { mockClient } from 'aws-sdk-client-mock';
import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../../../src/services/dynamo.service';
import { saveTranscription, getById, updateStatus, listByUser } from '../../../src/repositories/transcription.repository';
import { Transcription } from '../../../src/models/transcription.model';

const ddbMock = mockClient(ddbDocClient);

beforeEach(() => {
  ddbMock.reset();
});

const baseItem: Transcription = {
  userId: 'user-1',
  transcriptionId: 'tx-1',
  type: 'FILE',
  status: 'PENDING',
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
};

describe('transcription.repository', () => {
  it('saveTranscription guarda el item tal cual en la tabla configurada', async () => {
    ddbMock.on(PutCommand).resolves({});

    await saveTranscription(baseItem);

    const call = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(call.TableName).toBe(process.env.TRANSCRIPTIONS_TABLE);
    expect(call.Item).toEqual(baseItem);
  });

  it('getById devuelve el item cuando existe', async () => {
    ddbMock.on(GetCommand).resolves({ Item: baseItem });

    const result = await getById('user-1', 'tx-1');

    expect(result).toEqual(baseItem);
    expect(ddbMock.commandCalls(GetCommand)[0].args[0].input.Key).toEqual({
      userId: 'user-1',
      transcriptionId: 'tx-1',
    });
  });

  it('getById devuelve undefined cuando no hay fila (evita leaks entre usuarios)', async () => {
    ddbMock.on(GetCommand).resolves({});

    const result = await getById('user-1', 'tx-de-otro-usuario');

    expect(result).toBeUndefined();
  });

  it('updateStatus incluye transcriptS3Key en la UpdateExpression cuando se pasa', async () => {
    ddbMock.on(UpdateCommand).resolves({});

    await updateStatus('user-1', 'tx-1', 'COMPLETED', 'transcripts/user-1/tx-1.txt');

    const call = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
    expect(call.UpdateExpression).toContain('transcriptS3Key = :transcriptS3Key');
    expect(call.ExpressionAttributeNames).toEqual({ '#status': 'status' });
    expect(call.ExpressionAttributeValues).toMatchObject({
      ':status': 'COMPLETED',
      ':transcriptS3Key': 'transcripts/user-1/tx-1.txt',
    });
  });

  it('updateStatus no toca transcriptS3Key cuando no se pasa (caso FAILED)', async () => {
    ddbMock.on(UpdateCommand).resolves({});

    await updateStatus('user-1', 'tx-1', 'FAILED');

    const call = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
    expect(call.UpdateExpression).not.toContain('transcriptS3Key');
    expect(call.ExpressionAttributeValues).not.toHaveProperty(':transcriptS3Key');
  });

  it('listByUser consulta el GSI de fecha, mas reciente primero, con el limite dado', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [baseItem], LastEvaluatedKey: undefined });

    const { items, lastKey } = await listByUser('user-1', 10);

    expect(items).toEqual([baseItem]);
    expect(lastKey).toBeUndefined();
    const call = ddbMock.commandCalls(QueryCommand)[0].args[0].input;
    expect(call.IndexName).toBe('userId-createdAt-index');
    expect(call.ScanIndexForward).toBe(false);
    expect(call.Limit).toBe(10);
    expect(call.KeyConditionExpression).toBe('userId = :userId');
  });

  it('listByUser propaga el cursor de paginacion (ExclusiveStartKey)', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [], LastEvaluatedKey: { userId: 'user-1', createdAt: 'x' } });

    const cursor = { userId: 'user-1', createdAt: '2026-08-01T00:00:00.000Z' };
    const { lastKey } = await listByUser('user-1', 10, cursor);

    expect(lastKey).toEqual({ userId: 'user-1', createdAt: 'x' });
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.ExclusiveStartKey).toEqual(cursor);
  });
});
