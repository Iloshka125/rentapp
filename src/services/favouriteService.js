import { apiService } from './api';

class FavouriteService {
  // Добавить товар в избранное
  async addToFavourites(productId) {
    try {
      const response = await apiService.post('/favourite/create', { productId });
      return response;
    } catch (error) {
      console.error('Ошибка при добавлении в избранное:', error);
      throw error;
    }
  }

  // Удалить товар из избранного
  async removeFromFavourites(productId) {
    try {
      const response = await apiService.delete('/favourite/delete', { productId });
      return response;
    } catch (error) {
      console.error('Ошибка при удалении из избранного:', error);
      throw error;
    }
  }

  // Получить избранное пользователя
  async getUserFavourites() {
    try {
      const response = await apiService.get('/favourite/user');
      return response;
    } catch (error) {
      console.error('Ошибка при получении избранного:', error);
      throw error;
    }
  }
}

export const favouriteService = new FavouriteService();
