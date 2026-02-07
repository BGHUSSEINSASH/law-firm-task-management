import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();
const AUTH_BYPASS = (process.env.REACT_APP_BYPASS_AUTH || 'true') === 'true';
const DEV_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@lawfirm.com',
  full_name: 'Dev Admin',
  role: 'admin'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (AUTH_BYPASS) {
      localStorage.setItem('token', 'dev-bypass-token');
      setToken('dev-bypass-token');
      setUser(DEV_USER);
      setLoading(false);
      return;
    }

    if (token) {
      authAPI
        .getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data && res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data;
      } else {
        throw new Error('Invalid response from login endpoint');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    if (AUTH_BYPASS) {
      localStorage.setItem('token', 'dev-bypass-token');
      setToken('dev-bypass-token');
      setUser(DEV_USER);
      return;
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isLawyer = user?.role === 'lawyer';
  const isDepartmentHead = user?.role === 'department_head';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isLawyer,
        isDepartmentHead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
