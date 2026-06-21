import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { Tenant, TenantUser } from '../types/saas';
import api from '../api/axios';
import { loginSaas, signup, SignupData } from '../api/saas';

interface AuthContextType {
  user: User | TenantUser | null;
  token: string | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (usuario: string, senha: string, recaptchaToken?: string) => Promise<void>;
  loginEmail: (email: string, senha: string, recaptchaToken?: string) => Promise<void>;
  signupTenant: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loginDev: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | TenantUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
      if (storedTenant) {
        try { setTenant(JSON.parse(storedTenant)); } catch { localStorage.removeItem('tenant'); }
      }
    }
    setLoading(false);
  }, []);

  const loginDev = () => {
    if (import.meta.env.PROD) return;
    const devUser: User = {
      id: 1,
      nome: 'Admin Dev',
      usuario: 'admin',
      cargo: 'Desenvolvedor',
      permissao: 'superadmin',
    };
    const devToken = 'dev-admin-token';
    localStorage.setItem('token', devToken);
    localStorage.setItem('user', JSON.stringify(devUser));
    setToken(devToken);
    setUser(devUser);
  };

  const login = async (usuario: string, senha: string, recaptchaToken?: string) => {
    const response = await api.post('/auth/login', { usuario, senha, recaptcha_token: recaptchaToken });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const loginEmail = async (email: string, senha: string, recaptchaToken?: string) => {
    const result = await loginSaas({ email, senha, recaptcha_token: recaptchaToken || '' });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('tenant', JSON.stringify(result.tenant));
    setToken(result.token);
    setUser(result.user);
    setTenant(result.tenant);
  };

  const signupTenant = async (data: SignupData) => {
    const result = await signup(data);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('tenant', JSON.stringify(result.tenant));
    setToken(result.token);
    setUser(result.user);
    setTenant(result.tenant);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, tenant, loading,
      login, loginEmail, signupTenant, logout,
      isAuthenticated: !!token, loginDev,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
