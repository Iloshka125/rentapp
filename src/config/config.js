// Конфигурация приложения
export const config = {
  // URL сервера - используем домен
  serverUrl: 'https://iloosip.online',
  
  // API endpoints - используем домен
  api: {
    baseUrl: 'https://iloosip.online/api',
    uploads: 'https://iloosip.online/uploads'
  },
  
  // Настройки приложения
  app: {
    name: 'RentApp',
    version: '1.0.0'
  }
};

// Отладочная информация
console.log('🔧 Config loaded:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  apiBaseUrl: config.api.baseUrl,
  serverUrl: config.serverUrl,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
});

// Функция для получения полного URL API
export const getApiUrl = (endpoint) => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Функция для получения URL загруженных файлов
export const getUploadUrl = (filename) => {
  return `${config.api.uploads}/${filename}`;
};

export default config;
