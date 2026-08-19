import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getPresignedUploadUrl, getPresignedDownloadUrl, uploadText } from '../../../src/services/s3.service';

const s3Mock = mockClient(S3Client);
const getSignedUrlMock = getSignedUrl as jest.Mock;

beforeEach(() => {
  s3Mock.reset();
  getSignedUrlMock.mockClear();
});

describe('s3.service', () => {
  it('getPresignedUploadUrl firma un PutObjectCommand y expira en 300s por defecto', async () => {
    const url = await getPresignedUploadUrl('audio/user-1/abc.mp3', 'audio/mpeg');

    expect(url).toBe('https://signed-url.example.com');
    expect(getSignedUrlMock).toHaveBeenCalledWith(expect.anything(), expect.any(PutObjectCommand), {
      expiresIn: 300,
    });
  });

  it('getPresignedDownloadUrl acepta un expiresIn mayor (Speechmatics necesita mas margen para leer el audio)', async () => {
    await getPresignedDownloadUrl('audio/user-1/abc.mp3', 900);

    expect(getSignedUrlMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 900 });
  });

  it('uploadText sube el texto de la transcripcion como text/plain', async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    await uploadText('transcripts/user-1/tx-1.txt', 'hola mundo');

    const call = s3Mock.commandCalls(PutObjectCommand)[0].args[0].input;
    expect(call.Key).toBe('transcripts/user-1/tx-1.txt');
    expect(call.Body).toBe('hola mundo');
    expect(call.ContentType).toBe('text/plain; charset=utf-8');
  });
});
