import React, { createContext, useContext } from 'react';
import { useAlert } from '../hooks/useAlert';
import AlertContainer from '../components/AlertContainer';

const AlertContext = createContext();

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const alertMethods = useAlert();

  return (
    <AlertContext.Provider value={alertMethods}>
      {children}
      <AlertContainer alerts={alertMethods.alerts} onRemoveAlert={alertMethods.removeAlert} />
    </AlertContext.Provider>
  );
};
