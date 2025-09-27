import React, { useState, useEffect } from 'react';
import './Alert.css';

const Alert = ({ message, type = 'info', duration = 2000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose && onClose();
        }, 300); // Задержка для анимации исчезновения
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`alert alert-${type} ${isVisible ? 'alert-visible' : 'alert-hidden'}` }>
      <div className="alert-content">
        
        <div className="alert-message">{message}</div>
        
      </div>
    </div>
  );
};

export default Alert;
