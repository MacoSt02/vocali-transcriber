function base64url(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fakeJwt(payload: Record<string, unknown>): string {
  const header = base64url({ alg: 'none', typ: 'JWT' });
  const body = base64url(payload);
  return `${header}.${body}.signature`;
}

/**
 * Seeds a window with a Cognito session that amazon-cognito-identity-js accepts
 * as valid without any network call (it only checks the `exp` claim locally).
 * Must run in `cy.visit`'s `onBeforeLoad`, before AuthProvider reads localStorage.
 */
export function seedCognitoSession(win: Window, email: string): void {
  const clientId = Cypress.env('cognitoClientId') as string;
  const now = Math.floor(Date.now() / 1000);
  const keyPrefix = `CognitoIdentityServiceProvider.${clientId}`;

  const idToken = fakeJwt({ sub: 'e2e-user', email, exp: now + 3600, iat: now });
  const accessToken = fakeJwt({ sub: 'e2e-user', token_use: 'access', exp: now + 3600, iat: now });

  win.localStorage.setItem(`${keyPrefix}.LastAuthUser`, email);
  win.localStorage.setItem(`${keyPrefix}.${email}.idToken`, idToken);
  win.localStorage.setItem(`${keyPrefix}.${email}.accessToken`, accessToken);
  win.localStorage.setItem(`${keyPrefix}.${email}.refreshToken`, 'fake-refresh-token');
  win.localStorage.setItem(`${keyPrefix}.${email}.clockDrift`, '0');
}
