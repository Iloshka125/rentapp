import { config } from '../config/config';

const API_BASE_URL = config.api.baseUrl;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Общий метод для https запросов
  async request(endpoint, options = {}) {
    // Используем baseURL из конфигурации
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('🔧 API Request:', {
      baseURL: this.baseURL,
      endpoint: endpoint,
      fullUrl: url
    });
    
    const config = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    console.log('🔧 Request config:', {
      method: config.method,
      url: url,
      headers: config.headers,
      body: config.body ? (typeof config.body === 'string' ? config.body.substring(0, 100) + '...' : 'FormData') : 'undefined'
    });

    // Добавляем Content-Type только если это не FormData
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Добавляем токен авторизации если он есть
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('🔧 Fetching URL:', url);
      const response = await fetch(url, config);
      
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const responseText = await response.text();
        console.log('🔧 Error response text:', responseText.substring(0, 200));
        
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.log('🔧 Response is not JSON, treating as HTML');
        }
        
        // Создаем ошибку с дополнительной информацией
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.response = { status: response.status, data: errorData };
        throw error;
      }
      
      const responseText = await response.text();
      console.log('🔧 Response text preview:', responseText.substring(0, 200));
      
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.log('🔧 Fetch error:', error);
      throw error;
    }
  }

  // GET запрос
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST запрос
  async post(endpoint, data) {
    console.log('🔧 POST запрос:', { endpoint, data });
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PUT запрос
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // DELETE запрос
  async delete(endpoint, data) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // PATCH запрос
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
