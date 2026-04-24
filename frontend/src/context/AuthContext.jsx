import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi, logout as logoutApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (userId, password, role) => {
    const res = await loginApi(userId, password, role);
    const meRes = await getMe();
    setUser(meRes.data);
    return res.data;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await getMe();
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
