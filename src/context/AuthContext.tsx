import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginApi, me, type LoginInput } from '../api/auth';
import { setAccessToken } from '../api/client';
import type { AuthData, User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(input) {
        const result: AuthData = await loginApi(input);
        setUser(result.user);
      },
      logout() {
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider belum dipasang');
  return value;
}
