import { apiService } from './api';

class ProductService {
  // Получить все объявления
  async getAllProducts() {
    try {
      const response = await apiService.get('/product/getAll');
      return response;
    } catch (error) {
      console.error('Ошибка при получении объявлений:', error);
      throw error;
    }
  }

  // Получить объявление по ID
  async getProductById(id) {
    try {
      const response = await apiService.get(`/product/getOne/${id}`);
      return response;
    } catch (error) {
      console.error('Ошибка при получении объявления:', error);
      
      // Проверяем, нужно ли сделать редирект
      if (error.response && error.response.data && error.response.data.redirect) {
        const redirectError = new Error('redirect');
        redirectError.response = error.response;
        throw redirectError;
      }
      
      throw error;
    }
  }

  // Создать новое объявление
  async createProduct(productData) {
    try {
      const response = await apiService.post('/product/create', productData);
      return response;
    } catch (error) {
      console.error('Ошибка при создании объявления:', error);
      throw error;
    }
  }

  // Обновить объявление
  async updateProduct(id, productData) {
    try {
      const response = await apiService.put(`/product/update/${id}`, productData);
      return response;
    } catch (error) {
      console.error('Ошибка при обновлении объявления:', error);
      throw error;
    }
  }

  // Удалить объявление
  async deleteProduct(id) {
    try {
      const response = await apiService.delete(`/product/delete/${id}`);
      return response;
    } catch (error) {
      console.error('Ошибка при удалении объявления:', error);
      throw error;
    }
  }

  // Получить объявления пользователя
  async getUserProducts() {
    try {
      const response = await apiService.get('/product/getUserProducts');
      return response;
    } catch (error) {
      console.error('Ошибка при получении объявлений пользователя:', error);
      throw error;
    }
  }

  // Поиск объявлений
  async searchProducts(query, category = null, minPrice = null, maxPrice = null) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await apiService.get(`/product/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Ошибка при поиске объявлений:', error);
      throw error;
    }
  }

  // Обновить статус объявления
  async updateProductStatus(id, status) {
    try {
      const response = await apiService.patch(`/product/status/${id}`, { status });
      return response;
    } catch (error) {
      console.error('Ошибка при обновлении статуса объявления:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();
