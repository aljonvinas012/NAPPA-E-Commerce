import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { IUser } from '../types';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfa: (mfaToken: string, code: string) => Promise<IUser>;
  register: (data: any) => Promise<IUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface LoginResult {
  mfaRequired: boolean;
  mfaSetup?: boolean;
  mfaToken?: string;
  qrCode?: string;
  manualEntryKey?: string;
  user?: IUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('nappa_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser({
        id: data._id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        addresses: data.addresses,
      });
    } catch {
      localStorage.removeItem('nappa_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const { data } = await api.post('/auth/login', { email, password });
    // Admin accounts come back asking for a second factor (TOTP code)
    // instead of a token — the caller (Login page) is responsible for
    // showing the code-entry step and then calling verifyMfa().
    if (data.mfaRequired) {
      return {
        mfaRequired: true,
        mfaSetup: data.mfaSetup,
        mfaToken: data.mfaToken,
        qrCode: data.qrCode,
        manualEntryKey: data.manualEntryKey,
      };
    }
    localStorage.setItem('nappa_token', data.token);
    setUser(data.user);
    return { mfaRequired: false, user: data.user as IUser };
  };

  const verifyMfa = async (mfaToken: string, code: string) => {
    const { data } = await api.post('/auth/mfa/verify', { mfaToken, code });
    localStorage.setItem('nappa_token', data.token);
    setUser(data.user);
    return data.user as IUser;
  };

  const register = async (payload: any) => {
    // Registering no longer logs the person in automatically — they still
    // need to sign in afterward, same as any normal sign-up flow.
    const { data } = await api.post('/auth/register', payload);
    return data.user as IUser;
  };

  const logout = () => {
    localStorage.removeItem('nappa_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, register, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
