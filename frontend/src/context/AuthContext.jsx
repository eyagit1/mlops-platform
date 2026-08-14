import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY_TOKEN = 'mlops_auth_token';
const STORAGE_KEY_USER = 'mlops_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || sessionStorage.getItem(STORAGE_KEY_TOKEN) || null;
  });

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY_USER) || sessionStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password, rememberMe = true) => {
    // Simulated authentication with demo credentials check
    const normalizedEmail = email.trim().toLowerCase();

    // Valid demo credentials
    const validEmails = ['admin@itgate.tn', 'admin@itgate.local', 'admin@itgate.group', 'admin'];
    const isValidUser = validEmails.includes(normalizedEmail) || normalizedEmail.endsWith('@itgate.tn');
    const isValidPassword = password === 'admin' || password === 'admin123' || password === 'itgate2026';

    if (!isValidUser || !isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password. Please use admin@itgate.tn / admin',
      };
    }

    const userData = {
      email: normalizedEmail.includes('@') ? normalizedEmail : 'admin@itgate.tn',
      name: 'ITGate Admin',
      role: 'Platform Administrator',
      initials: 'IA',
      loginTime: new Date().toISOString(),
    };

    const authToken = `jwt_mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY_TOKEN, authToken);
    storage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);

    return { success: true, user: userData };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
