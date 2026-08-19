import { PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../services/dynamo.service';
import { Transcription, TranscriptionStatus } from '../models/transcription.model';

const TABLE = process.env.TRANSCRIPTIONS_TABLE as string;

export async function saveTranscription(item: Transcription): Promise<void> {
  await ddbDocClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function getById(userId: string, transcriptionId: string): Promise<Transcription | undefined> {
  const result = await ddbDocClient.send(new GetCommand({ TableName: TABLE, Key: { userId, transcriptionId } }));
  return result.Item as Transcription | undefined;
}

export async function updateStatus(
  userId: string,
  transcriptionId: string,
  status: TranscriptionStatus,
  transcriptS3Key?: string
): Promise<void> {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId, transcriptionId },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt' + (transcriptS3Key ? ', transcriptS3Key = :transcriptS3Key' : ''),
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
        ...(transcriptS3Key ? { ':transcriptS3Key': transcriptS3Key } : {}),
      },
    })
  );
}

export async function listByUser(userId: string, limit = 10, cursor?: Record<string, unknown>) {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: cursor,
    })
  );
  return { items: result.Items ?? [], lastKey: result.LastEvaluatedKey };
}
