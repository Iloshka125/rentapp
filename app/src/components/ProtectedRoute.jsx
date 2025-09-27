import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем загрузку, пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#53515E] text-xl">Загрузка...</div>
      </div>
    );
  }

  // Если пользователь не авторизован, перенаправляем на главную
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Если авторизован, показываем защищенный контент
  return children;
};
