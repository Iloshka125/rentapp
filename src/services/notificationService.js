import { apiService } from './api';

class NotificationService {
  // Получить уведомления для владельца товара
  async getOwnerNotifications() {
    try {
      const response = await apiService.get('/notification/owner');
      return response;
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      throw error;
    }
  }

  // Принять запрос на аренду
  async acceptRent(notificationId) {
    try {
      const response = await apiService.post(`/notification/accept/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при принятии аренды:', error);
      throw error;
    }
  }

  // Отклонить запрос на аренду
  async declineRent(notificationId) {
    try {
      const response = await apiService.post(`/notification/decline/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при отклонении аренды:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
