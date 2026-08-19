const verifyMock = jest.fn();

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: jest.fn(() => ({ verify: verifyMock })) },
}));

import { getUserIdFromToken } from '../../../src/middlewares/auth.middleware';

beforeEach(() => {
  verifyMock.mockReset();
});

describe('auth.middleware', () => {
  it('rechaza si no hay header Authorization', async () => {
    await expect(getUserIdFromToken(undefined)).rejects.toThrow('Missing Authorization header');
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('quita el prefijo Bearer antes de verificar el token', async () => {
    verifyMock.mockResolvedValue({ sub: 'user-1' });

    await getUserIdFromToken('Bearer el.jwt.token');

    expect(verifyMock).toHaveBeenCalledWith('el.jwt.token');
  });

  it('devuelve el sub del payload verificado como userId', async () => {
    verifyMock.mockResolvedValue({ sub: 'user-42' });

    const userId = await getUserIdFromToken('Bearer valido');

    expect(userId).toBe('user-42');
  });

  it('propaga el rechazo si el token no es valido', async () => {
    verifyMock.mockRejectedValue(new Error('Token expired'));

    await expect(getUserIdFromToken('Bearer expirado')).rejects.toThrow('Token expired');
  });
});
