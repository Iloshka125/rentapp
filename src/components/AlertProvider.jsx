import React, { useState, useEffect } from 'react';
import { Alert } from './Alert';

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = 'info', duration = 2500) => {

    const id = Date.now();
    const newAlert = { id, message, type, duration };
    
    setAlerts(prev => [...prev, newAlert]);
    
    // НЕ удаляем автоматически - это делает компонент Alert
    // Таймер для удаления из массива будет установлен после завершения анимации
    
    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Добавляем функции в глобальный объект window для доступа из компонентов
  useEffect(() => {
    window.showAlert = showAlert;
    window.removeAlert = removeAlert;
    window.clearAlerts = clearAlerts;
    
    return () => {
      delete window.showAlert;
      delete window.removeAlert;
      delete window.clearAlerts;
    };
  }, []);

  return (
    <>
      {children}
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          duration={alert.duration}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </>
  );
};
