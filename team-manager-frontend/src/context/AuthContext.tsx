import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperviseur: boolean;
  isOperateur: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] useEffect triggered, token:', token ? 'exists' : 'none');
    if (token) {
      console.log('[Auth] Attempting to restore session...');
      authAPI.me()
        .then((res) => {
          console.log('[Auth] Session restored, user:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.error('[Auth] Session restoration failed:', err.message);
          localStorage.removeItem('token'); 
          setToken(null); 
        })
        .finally(() => {
          console.log('[Auth] Loading complete');
          setLoading(false);
        });
    } else {
      console.log('[Auth] No token, not loading user');
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    console.log('[Auth] Login attempt for:', email);
    try {
      const res = await authAPI.login(email, password);
      console.log('[Auth] Login response:', res.data);
      
      // Backend returns access_token (not just token)
      const token = res.data.access_token || res.data.token;
      const user = res.data.user;
      
      console.log('[Auth] Token extracted:', token ? 'yes' : 'no');
      console.log('[Auth] User:', user);
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      console.log('[Auth] Login successful, user set:', user?.name);
    } catch (error: any) {
      console.error('[Auth] Login error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAdmin: user?.role === 'admin',
      isSuperviseur: user?.role === 'superviseur',
      isOperateur: user?.role === 'operateur',
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
