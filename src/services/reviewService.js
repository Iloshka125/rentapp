import { apiService } from './api';

class ReviewService {
  // Получить все отзывы пользователя
  async getUserReviews(userId) {
    try {
      const response = await apiService.get(`/review/getUserReviews/${userId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении отзывов пользователя:', error);
      throw error;
    }
  }

  // Получить отзывы о пользователе (кто писал отзывы о его продуктах)
  async getReviewsAboutUser(userId) {
    try {
      const response = await apiService.get(`/review/getReviewsAboutUser/${userId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении отзывов о пользователе:', error);
      throw error;
    }
  }

  // Получить все отзывы на продукт
  async getAllByProduct(productData) {
    try {
      const response = await apiService.get(`/review/getAllByProduct?idProduct=${productData.idProduct}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении отзывов на продукт:', error);
      throw error;
    }
  }

  // Получить статистику текущего пользователя
  async getUserStats() {
    try {
      const response = await apiService.get('/review/getStatsByUser');
      return response;
    } catch (error) {
      console.error('Ошибка при получении статистики пользователя:', error);
      throw error;
    }
  }

  // Получить статистику любого пользователя по ID (для уведомлений)
  async getUserStatsById(userId) {
    try {
      const response = await apiService.get(`/review/getUserStatsById/${userId}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении статистики пользователя по ID:', error);
      throw error;
    }
  }

  // Создать отзыв
  async createReview(reviewData) {
    try {
      const response = await apiService.post('/review/create', reviewData);
      return response;
    } catch (error) {
      console.error('Ошибка при создании отзыва:', error);
      throw error;
    }
  }

  // Обновить отзыв
  async updateReview(id, reviewData) {
    try {
      const response = await apiService.put('/review/update', { idReview: id, ...reviewData });
      return response;
    } catch (error) {
      console.error('Ошибка при обновлении отзыва:', error);
      throw error;
    }
  }

  // Удалить отзыв
  async deleteReview(id) {
    try {
      const response = await apiService.delete('/review/delete', { idReview: id });
      return response;
    } catch (error) {
      console.error('Ошибка при удалении отзыва:', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
