import { apiService } from './api';

class AuthService {
  // Регистрация пользователя
  async register(userData) {
    try {
      console.log('🔍 AuthService: регистрация пользователя:', userData);
      const response = await apiService.post('/user/registration', {
        name: userData.name,
        secondName: userData.secondName,
        middleName: userData.middleName,
        phone: userData.phone,
        birthday: userData.birthday,
        password: userData.password,
        email: userData.email || null
      });
      
      console.log('🔍 AuthService: ответ от сервера:', response);
      
      // Сохраняем токен и данные пользователя
      this.setAuthData(response.token, response.user);
      return response;
    } catch (error) {
      console.error('🔍 AuthService: ошибка при регистрации:', error);
      throw error;
    }
  }

  // Вход пользователя
  async login(credentials) {
    try {
      console.log('🔍 AuthService: вход пользователя:', credentials);
      const response = await apiService.post('/user/login', {
        phone: credentials.phone || null,
        email: credentials.email || null,
        password: credentials.password
      });
      
      console.log('🔍 AuthService: ответ от сервера:', response);
      
      // Сохраняем токен и данные пользователя
      this.setAuthData(response.token, response.user);
      return response;
    } catch (error) {
      console.error('🔍 AuthService: ошибка при входе:', error);
      throw error;
    }
  }

  // Проверка авторизации
  async checkAuth() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await apiService.get('/user/auth');
      // Обновляем токен
      this.setAuthData(response.token, this.getUser());
      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  // Получение профиля пользователя
  async getProfile() {
    try {
      const response = await apiService.get('/user/profile');
      // Обновляем данные пользователя
      this.setUser(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Обновление профиля
  async updateProfile(userData) {
    try {
      const response = await apiService.put('/user/updateProfile', userData);
      // Обновляем данные пользователя
      this.setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Смена пароля
  async updatePassword(passwordData) {
    try {
      const response = await apiService.put('/user/updatePassword', passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Выход
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // Проверка авторизован ли пользователь
  isAuthenticated() {
    return !!this.getToken();
  }

  // Получение токена
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Получение данных пользователя
  getUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Сохранение данных аутентификации
  setAuthData(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  // Обновление данных пользователя
  setUser(user) {
    localStorage.setItem('userData', JSON.stringify(user));
  }
}

export const authService = new AuthService();
