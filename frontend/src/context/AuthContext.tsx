import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { setAuthToken, setUnauthorizedHandler } from '../services/api';

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

interface AuthContextValue {
  email: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    userPool.getCurrentUser()?.signOut();
    setAuthToken(null);
    setEmail(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);

    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setLoading(false);
        return;
      }
      setAuthToken(session.getIdToken().getJwtToken());
      setEmail(session.getIdToken().decodePayload().email as string);
      setLoading(false);
    });
  }, [logout]);

  const login = (loginEmail: string, password: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: loginEmail, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: loginEmail, Password: password });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setAuthToken(session.getIdToken().getJwtToken());
          setEmail(loginEmail);
          resolve();
        },
        onFailure: (err) => reject(err),
      });
    });

  const register = (registerEmail: string, password: string) =>
    new Promise<void>((resolve, reject) => {
      const attributeList = [new CognitoUserAttribute({ Name: 'email', Value: registerEmail })];
      userPool.signUp(registerEmail, password, attributeList, [], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  const confirmRegistration = (confirmEmail: string, code: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: confirmEmail, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  const forgotPassword = (forgotEmail: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: forgotEmail, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });

  const confirmForgotPassword = (forgotEmail: string, code: string, newPassword: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: forgotEmail, Pool: userPool });
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });

  return (
    <AuthContext.Provider
      value={{
        email,
        isAuthenticated: email !== null,
        loading,
        login,
        register,
        confirmRegistration,
        forgotPassword,
        confirmForgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
