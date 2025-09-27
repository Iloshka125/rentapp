import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем авторизацию при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUser();
          setUser(userData);
          setIsAuthenticated(true);
          
          // Проверяем валидность токена
          await authService.checkAuth();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Регистрация
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Вход
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Обновление профиля
  const updateProfile = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Смена пароля
  const updatePassword = async (passwordData) => {
    try {
      setIsLoading(true);
      const response = await authService.updatePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
