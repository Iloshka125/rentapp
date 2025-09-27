import { apiService } from './api';

class RentService {
  // Создать новую аренду
  async createRent(rentData) {
    try {
      const response = await apiService.post('/rent/create', rentData);
      return response;
    } catch (error) {
      console.error('Ошибка при создании аренды:', error);
      throw error;
    }
  }

  // Получить все аренды пользователя
  async getUserRents() {
    try {
      const response = await apiService.get('/rent/user');
      return response;
    } catch (error) {
      console.error('Ошибка при получении аренд пользователя:', error);
      throw error;
    }
  }

  // Получить все аренды товара (для владельца)
  async getProductRents(productId) {
    try {
      const response = await apiService.get(`/rent/product/${productId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении аренд товара:', error);
      throw error;
    }
  }

  // Обновить статус аренды
  async updateRentStatus(rentId, status) {
    try {
      const response = await apiService.patch(`/rent/status/${rentId}`, { status });
      return response;
    } catch (error) {
      console.error('Ошибка при обновлении статуса аренды:', error);
      throw error;
    }
  }

  // Отменить аренду
  async cancelRent(rentId) {
    try {
      const response = await apiService.delete(`/rent/cancel/${rentId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при отмене аренды:', error);
      throw error;
    }
  }

  // Получить объявления готовые для отзыва
  async getReadyForReview() {
    try {
      const response = await apiService.get('/rent/ready-for-review');
      return response;
    } catch (error) {
      console.error('Ошибка при получении объявлений готовых для отзыва:', error);
      throw error;
    }
  }
}

export const rentService = new RentService();
