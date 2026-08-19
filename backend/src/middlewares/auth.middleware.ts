import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID as string,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID as string,
});

export async function getUserIdFromToken(authHeader?: string): Promise<string> {
  if (!authHeader) throw new Error('Missing Authorization header');
  const token = authHeader.replace('Bearer ', '');
  const payload = await verifier.verify(token);
  return payload.sub as string;
}