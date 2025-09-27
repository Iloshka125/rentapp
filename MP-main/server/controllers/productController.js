const { Product, User, Review } = require('../models/models');
const { Op } = require('sequelize');
const ApiError = require('../error/ApiError');

class ProductController {
  async create(req, res, next) {
    try {
      const { name, description, category, price, city, startdate, enddate } = req.body;
      const userId = req.user.id; // userId obtained from token
      
      // Логируем входящие данные для отладки
      console.log('🔍 ProductController.create - req.body:', req.body);
      console.log('🔍 ProductController.create - startdate:', startdate, typeof startdate);
      console.log('🔍 ProductController.create - enddate:', enddate, typeof enddate);
      
      // Получаем основное изображение
      const photo = req.uploadedFileName || 'default.jpg';
      
      // Получаем дополнительные изображения
      let images = null;
      
      if (req.additionalImages && req.additionalImages.length > 0) {
        images = req.additionalImages;
      }

      if (!name || !description || !category || !price) {
        return next(ApiError.badRequest(
          'Поля name, description, category и price обязательны'
        ));
      }
      
      if (!req.uploadedFileName) {
        return next(ApiError.badRequest('Необходимо загрузить фотографию'));
      }

      // Проверяем корректность дат
      if (startdate && enddate) {
        console.log('🔍 ProductController.create - проверяем даты');
        const startDate = new Date(startdate);
        const endDate = new Date(enddate);
        
        console.log('🔍 ProductController.create - startDate:', startDate);
        console.log('🔍 ProductController.create - endDate:', endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return next(ApiError.badRequest('Неверный формат дат'));
        }
        
        if (startDate >= endDate) {
          return next(ApiError.badRequest('Дата начала должна быть раньше даты окончания'));
        }
        
        if (startDate < new Date()) {
          return next(ApiError.badRequest('Дата начала не может быть в прошлом'));
        }
        
        console.log('🔍 ProductController.create - даты прошли валидацию');
      } else {
        console.log('🔍 ProductController.create - даты не переданы или переданы частично');
        console.log('🔍 ProductController.create - startdate:', startdate);
        console.log('🔍 ProductController.create - enddate:', enddate);
      }

      // Рассчитываем рейтинг пользователя на основе отзывов о его товарах
      
      // Находим все товары этого пользователя (исключаем удаленные)
      const userProducts = await Product.findAll({ 
        where: { 
          userId: userId,
          status: { [Op.notIn]: ['deleted'] }
        }
      });
      const productIds = userProducts.map(p => p.idProduct);
      
      // Находим все отзывы о товарах этого пользователя
      const userReviews = await Review.findAll({ 
        where: { 
          idProduct: { [Op.in]: productIds }
        }
      });
      
      let userRating = 4.0; // По умолчанию 4 звезды
      if (userReviews.length > 0) {
        const totalRating = userReviews.reduce((sum, review) => sum + review.rate, 0);
        userRating = totalRating / userReviews.length;
      }

      const productData = {
        name, description, userId, category, photo, 
        images: images ? JSON.stringify(images) : null, 
        price, rating: userRating, status: 'available',
        city: city || 'Таганрог', // Город товара с дефолтным значением
        startdate: startdate ? new Date(startdate) : null,
        enddate: enddate ? new Date(enddate) : null
      };
      
      // Логируем данные для создания продукта
      console.log('🔍 ProductController.create - productData:', productData);
      console.log('🔍 ProductController.create - productData.startdate:', productData.startdate);
      console.log('🔍 ProductController.create - productData.enddate:', productData.enddate);
      console.log('🔍 ProductController.create - startdate исходный:', startdate);
      console.log('🔍 ProductController.create - enddate исходный:', enddate);
      
      const product = await Product.create(productData);
      
      // Логируем созданный продукт
      console.log('🔍 ProductController.create - созданный продукт:', product.toJSON());
      console.log('🔍 ProductController.create - product.startdate:', product.startdate);
      console.log('🔍 ProductController.create - product.enddate:', product.enddate);

      return res.status(201).json(product);
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res, next) { // New method for /product/getAll
    try {

      
      const products = await Product.findAll({
        where: { 
          status: { [Op.notIn]: ['deleted', 'unavailable'] } // Исключаем удаленные и недоступные объявления
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['idUser', 'name', 'secondName', 'middleName']
        }]
      });

      // Добавляем рейтинг объявления и пользователя к каждому продукту
      const productsWithRating = await Promise.all(products.map(async (product) => {
        // Находим отзывы именно на этот продукт
        const productReviews = await Review.findAll({ 
          where: { 
            idProduct: product.idProduct
          }
        });
        
        // Находим все товары этого пользователя (исключаем удаленные и недоступные)
        const userProducts = await Product.findAll({ 
          where: { 
            userId: product.userId,
            status: { [Op.notIn]: ['deleted', 'unavailable'] }
          }
        });
        const userProductIds = userProducts.map(p => p.idProduct);
        
        // Находим все отзывы о товарах этого пользователя
        const userReviews = await Review.findAll({ 
          where: { 
            idProduct: { [Op.in]: userProductIds }
          }
        });
        
        let userRating = 4.0; // По умолчанию 4 звезды
        if (userReviews.length > 0) {
          const totalRating = userReviews.reduce((sum, review) => sum + review.rate, 0);
          userRating = totalRating / userReviews.length;
        }

        // Логика рейтинга: если есть отзывы на объявление - используем их, иначе рейтинг пользователя
        let finalRating = userRating; // По умолчанию рейтинг пользователя
        let reviewsCount = 0;
        
        if (productReviews.length > 0) {
          // Если есть отзывы на объявление, используем их
          const totalRating = productReviews.reduce((sum, review) => sum + review.rate, 0);
          finalRating = totalRating / productReviews.length;
          reviewsCount = productReviews.length;
        }

        return {
          ...product.toJSON(),
          userRating: userRating,
          rating: finalRating,
          reviewsCount: reviewsCount
        };
      }));

      return res.json(productsWithRating);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async sort(req, res, next) {
    try {
      const {
        category,
        name,
        minPrice,
        maxPrice,
        onlyTopRated,
        userId
      } = req.query;
      const where = { status: { [Op.notIn]: ['deleted', 'unavailable'] } }; // Исключаем удаленные и недоступные объявления

      if (userId) {
        where.userId = userId;
      }
      if (category) {
        where.category = category;
      }
      if (name) {
        where.name = { [Op.iLike]: `%${name}%` };
      }
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
      }

      if (onlyTopRated === "true") {
        where.rating = {
          [Op.gte]: 4,
          [Op.lte]: 5
        };
      }

      const products = await Product.findAll({ 
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['idUser', 'name', 'secondName', 'middleName']
        }]
      });

      // Добавляем рейтинг объявления и пользователя к каждому продукту
      const productsWithRating = await Promise.all(products.map(async (product) => {
        // Находим отзывы именно на этот продукт
        const productReviews = await Review.findAll({ 
          where: { 
            idProduct: product.idProduct
          }
        });
        
        // Находим все товары этого пользователя (исключаем удаленные)
        const userProducts = await Product.findAll({ 
          where: { 
            userId: product.userId,
            status: { [Op.notIn]: ['deleted'] }
          }
        });
        const userProductIds = userProducts.map(p => p.idProduct);
        
        // Находим все отзывы о товарах этого пользователя
        const userReviews = await Review.findAll({ 
          where: { 
            idProduct: { [Op.in]: userProductIds }
          }
        });
        
        let userRating = 4.0; // По умолчанию 4 звезды
        if (userReviews.length > 0) {
          const totalRating = userReviews.reduce((sum, review) => sum + review.rate, 0);
          userRating = totalRating / userReviews.length;
        }

        // Логика рейтинга: если есть отзывы на объявление - используем их, иначе рейтинг пользователя
        let finalRating = userRating; // По умолчанию рейтинг пользователя
        let reviewsCount = 0;
        
        if (productReviews.length > 0) {
          // Если есть отзывы на объявление, используем их
          const totalRating = productReviews.reduce((sum, review) => sum + review.rate, 0);
          finalRating = totalRating / productReviews.length;
          reviewsCount = productReviews.length;
        }

        return {
          ...product.toJSON(),
          userRating: userRating,
          rating: finalRating,
          reviewsCount: reviewsCount
        };
      }));

      return res.json(productsWithRating);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async getUserProducts(req, res, next) {
    try {
      const userId = req.user.id; // Получаем ID пользователя из JWT токена
      console.log('🔍 getUserProducts: userId из токена:', userId);
      
      const products = await Product.findAll({ 
        where: { 
          userId: userId,
          status: { [Op.notIn]: ['deleted'] } // Исключаем только удаленные объявления
        },
        include: [{
          model: User,
          attributes: ['idUser', 'name', 'secondName', 'middleName']
        }]
      });

      console.log('🔍 getUserProducts: найдено товаров:', products.length);

      // Добавляем рейтинг объявления и пользователя к каждому продукту
      const productsWithRating = await Promise.all(products.map(async (product) => {
        // Находим отзывы именно на этот продукт
        const productReviews = await Review.findAll({ 
          where: { 
            idProduct: product.idProduct
          }
        });
        
        // Находим все товары этого пользователя (исключаем удаленные)
        const userProducts = await Product.findAll({ 
          where: { 
            userId: product.userId,
            status: { [Op.notIn]: ['deleted'] }
          }
        });
        const userProductIds = userProducts.map(p => p.idProduct);
        
        // Находим все отзывы о товарах этого пользователя
        const userReviews = await Review.findAll({ 
          where: { 
            idProduct: { [Op.in]: userProductIds }
          }
        });
        
        let userRating = 4.0; // По умолчанию 4 звезды
        if (userReviews.length > 0) {
          const totalRating = userReviews.reduce((sum, review) => sum + review.rate, 0);
          userRating = totalRating / userReviews.length;
        }

        // Логика рейтинга: если есть отзывы на объявление - используем их, иначе рейтинг пользователя
        let finalRating = userRating; // По умолчанию рейтинг пользователя
        let reviewsCount = 0;
        
        if (productReviews.length > 0) {
          // Если есть отзывы на объявление, используем их
          const totalRating = productReviews.reduce((sum, review) => sum + review.rate, 0);
          finalRating = totalRating / productReviews.length;
          reviewsCount = productReviews.length;
        }

        return {
          ...product.toJSON(),
          userRating: userRating,
          rating: finalRating,
          reviewsCount: reviewsCount
        };
      }));

      console.log('🔍 getUserProducts: возвращаем товары с рейтингом:', productsWithRating.length);
      return res.json({ products: productsWithRating });
    } catch (e) {
      console.error('🔍 getUserProducts: ошибка:', e);
      return next(ApiError.internal(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      
      const product = await Product.findOne({ 
        where: { 
          idProduct: id,
          status: { [Op.notIn]: ['deleted'] } // Исключаем только удаленные объявления
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['idUser', 'name', 'secondName', 'middleName']
        }]
      });

      if (!product) {
        // Возвращаем специальный статус для редиректа на главную страницу
        return res.status(404).json({ 
          error: 'Товар не найден или неактивен',
          redirect: true,
          message: 'Товар был удален или остановлен'
        });
      }
      
      // Проверяем, что товар не остановлен
      if (product.status === 'unavailable') {
        return res.status(404).json({ 
          error: 'Товар остановлен',
          redirect: true,
          message: 'Товар временно недоступен'
        });
      }

      // Находим отзывы именно на этот продукт
      const productReviews = await Review.findAll({ 
        where: { 
          idProduct: product.idProduct
        }
      });
      
      // Находим все товары этого пользователя (исключаем удаленные)
      const userProducts = await Product.findAll({ 
        where: { 
          userId: product.userId,
          status: { [Op.notIn]: ['deleted'] }
        }
      });
      const userProductIds = userProducts.map(p => p.idProduct);
      
      // Находим все отзывы о товарах этого пользователя
      const userReviews = await Review.findAll({ 
        where: { 
          idProduct: { [Op.in]: userProductIds }
        }
      });
      
      let userRating = 4.0; // По умолчанию 4 звезды
      if (userReviews.length > 0) {
        const totalRating = userReviews.reduce((sum, review) => sum + review.rate, 0);
        userRating = totalRating / userReviews.length;
      }

      // Логика рейтинга: если есть отзывы на объявление - используем их, иначе рейтинг пользователя
      let finalRating = userRating; // По умолчанию рейтинг пользователя
      let reviewsCount = 0;
      
      if (productReviews.length > 0) {
        // Если есть отзывы на объявление, используем их
        const totalRating = productReviews.reduce((sum, review) => sum + review.rate, 0);
        finalRating = totalRating / productReviews.length;
        reviewsCount = productReviews.length;
      }

      const productWithRating = {
        ...product.toJSON(),
        userRating: userRating,
        rating: finalRating,
        reviewsCount: reviewsCount
      };

      return res.json(productWithRating);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Получаем данные из FormData
      const { name, description, category, price, city, startdate, enddate } = req.body;
      
      // Логируем входящие данные для отладки
      console.log('🔍 ProductController.update - req.body:', req.body);
      console.log('🔍 ProductController.update - startdate:', startdate, typeof startdate);
      console.log('🔍 ProductController.update - enddate:', enddate, typeof enddate);
      
      // Получаем основное изображение (если есть новый файл)
      const photo = req.uploadedFileName;
      
      // Получаем дополнительные изображения
      let images = null;
      
      if (req.additionalImages && req.additionalImages.length > 0) {
        images = req.additionalImages;
      }

      if (!name || !description || !category || !price) {
        return next(ApiError.badRequest(
          'Поля name, description, category и price обязательны'
        ));
      }

      // Проверяем корректность дат, если они переданы
      if (startdate && enddate) {
        const startDate = new Date(startdate);
        const endDate = new Date(enddate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return next(ApiError.badRequest('Неверный формат дат'));
        }
        
        if (startDate >= endDate) {
          return next(ApiError.badRequest('Дата начала должна быть раньше даты окончания'));
        }
        
        if (startDate < new Date()) {
          return next(ApiError.badRequest('Дата начала не может быть в прошлом'));
        }
      }

      // Проверяем, что продукт принадлежит пользователю
      const existingProduct = await Product.findOne({
        where: { 
          idProduct: id,
          userId: userId
        }
      });

      if (!existingProduct) {
        return next(ApiError.notFound('Объявление не найдено или у вас нет прав на его редактирование'));
      }

      // Подготавливаем данные для обновления
      const updateData = {
        name,
        description,
        category,
        price: parseFloat(price),
        city: city || existingProduct.city || 'Таганрог' // Обновляем город или оставляем существующий
      };

      // Добавляем даты, если они переданы
      if (startdate) {
        updateData.startdate = new Date(startdate);
      }
      if (enddate) {
        updateData.enddate = new Date(enddate);
      }

      // Логируем данные для обновления
      console.log('🔍 ProductController.update - updateData:', updateData);
      console.log('🔍 ProductController.update - updateData.startdate:', updateData.startdate);
      console.log('🔍 ProductController.update - updateData.enddate:', updateData.enddate);

      // Добавляем фото только если загружен новый файл
      if (photo) {
        updateData.photo = photo;
      }
      
      // Добавляем дополнительные изображения только если они есть
      if (images) {
        updateData.images = JSON.stringify(images);
      }

      // Обновляем продукт
      await Product.update(updateData, {
        where: { idProduct: id }
      });

      // Получаем обновленный продукт
      const updatedProduct = await Product.findByPk(id);

      return res.json(updatedProduct);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!status || !['available', 'unavailable', 'deleted'].includes(status)) {
        return next(ApiError.badRequest('Статус должен быть "available", "unavailable" или "deleted"'));
      }

      // Проверяем, что продукт принадлежит пользователю
      const existingProduct = await Product.findOne({
        where: { 
          idProduct: id,
          userId: userId
        }
      });

      if (!existingProduct) {
        return next(ApiError.notFound('Объявление не найдено или у вас нет прав на его редактирование'));
      }

      // Обновляем статус
      await Product.update({ status }, {
        where: { idProduct: id }
      });

      // Получаем обновленный продукт
      const updatedProduct = await Product.findByPk(id);

      return res.json(updatedProduct);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  // Тестовый метод для проверки полей дат
  async testDates(req, res, next) {
    try {
      console.log('🔍 ProductController.testDates - тестируем поля дат');
      
      // Создаем тестовый продукт с датами
      const testProductData = {
        name: 'Тестовый товар',
        description: 'Описание тестового товара',
        userId: req.user.id,
        category: 'Test',
        photo: 'test.jpg',
        price: 100.0,
        rating: 4.0,
        status: 'available',
        startdate: new Date('2025-01-01'),
        enddate: new Date('2025-12-31')
      };
      
      console.log('🔍 ProductController.testDates - testProductData:', testProductData);
      
      const testProduct = await Product.create(testProductData);
      
      console.log('🔍 ProductController.testDates - созданный тестовый продукт:', testProduct.toJSON());
      console.log('🔍 ProductController.testDates - testProduct.startdate:', testProduct.startdate);
      console.log('🔍 ProductController.testDates - testProduct.enddate:', testProduct.enddate);
      
      // Удаляем тестовый продукт
      await Product.destroy({ where: { idProduct: testProduct.idProduct } });
      
      return res.json({
        message: 'Тест полей дат прошел успешно',
        startdate: testProduct.startdate,
        enddate: testProduct.enddate
      });
    } catch (e) {
      console.error('🔍 ProductController.testDates - ошибка:', e);
      return next(ApiError.internal(e.message));
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Проверяем, что продукт принадлежит пользователю
      const product = await Product.findOne({
        where: {
          idProduct: id,
          userId: userId
        }
      });

      if (!product) {
        return next(ApiError.notFound('Объявление не найдено или у вас нет прав на его удаление'));
      }

      // Изменяем статус на deleted вместо физического удаления
      await Product.update({ status: 'deleted' }, {
        where: { idProduct: id }
      });

      return res.json({ message: 'Объявление успешно удалено' });
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ProductController();
