import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../api/axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loginDev: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

  /* eslint-disable react-refresh/only-export-components */
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }
    setLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loginDev = () => {
    const devUser: User = {
      id: 1,
      nome: 'Admin Dev',
      usuario: 'admin',
      cargo: 'Desenvolvedor',
      permissao: 'admin',
    };
    const devToken = 'dev-admin-token';
    localStorage.setItem('token', devToken);
    localStorage.setItem('user', JSON.stringify(devUser));
    setToken(devToken);
    setUser(devUser);
  };

  const login = async (usuario: string, senha: string) => {
    const response = await api.post('/auth/login', { usuario, senha });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token, loginDev }}>
      {children}
    </AuthContext.Provider>
  );
};
