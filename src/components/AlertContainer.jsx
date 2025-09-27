import React from 'react';
import Alert from './Alert';

const AlertContainer = ({ alerts, onRemoveAlert }) => {
  return (
    <>
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          duration={alert.duration}
          onClose={() => onRemoveAlert(alert.id)}
        />
      ))}
    </>
  );
};

export default AlertContainer;
