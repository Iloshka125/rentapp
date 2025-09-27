const { User, Product, Review, Rent } = require("../models/models");
const sequelize = require('../db');
const { Op, fn, col } = require('sequelize');
const ApiError = require('../error/ApiError');

// Пользователь может оставить отзыв, если у него есть подтвержденный заказ для этого товара
async function canUserLeaveReview(userId, idProduct) {
  if (!userId || !idProduct) return false;

  console.log('🔍 canUserLeaveReview - userId:', userId, 'idProduct:', idProduct);

  // Сначала найдем все аренды для этого пользователя и товара
  const allRents = await Rent.findAll({
    where: {
      idUser: userId,
      idProduct
    }
  });

  console.log('🔍 canUserLeaveReview - все найденные аренды:', allRents);
  console.log('🔍 canUserLeaveReview - детали аренд:', allRents.map(r => ({
    idRent: r.idRent,
    status: r.status,
    dataStart: r.dataStart,
    dataEnd: r.dataEnd,
    isreview: r.isreview
  })));

  // Найдем аренду со статусом 'active' или 'completed' И с isreview = true
  const rent = await Rent.findOne({
    where: {
      idUser: userId,
      idProduct,
      status: {
        [Op.in]: ['active', 'completed']
      },
      isreview: true
    }
  });

  console.log('🔍 canUserLeaveReview - найденная аренда со статусом active/completed и isreview=true:', rent);
  console.log('🔍 canUserLeaveReview - результат:', !!rent);

  return !!rent;
}

class ReviewController {
  async create(req, res, next) {
    const userId = req.user?.idUser ?? req.user?.id;

    console.log('🔍 ReviewController.create - req.user:', req.user);
    console.log('🔍 ReviewController.create - userId:', userId);

    const { idProduct, rate, comment } = req.body;

    if (!userId) return next(ApiError.unauthorized('Не авторизован'));

    const idProdNum = parseInt(idProduct, 10);
    if (Number.isNaN(idProdNum)) {
      return next(ApiError.badRequest('Неверный idProduct'));
    }

    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum)) {
      return next(ApiError.badRequest('Неверный формат rate'));
    }
    if (rateNum < 1 || rateNum > 5) {
      return next(ApiError.badRequest('rate вне допустимого диапазона (1-5)'));
    }

    try {
      const product = await Product.findByPk(idProdNum);
      if (!product) {
        return next(ApiError.notFound('Товар не найден'));
      }

      console.log('🔍 ReviewController.create - найденный товар:', product);
      console.log('🔍 ReviewController.create - product.idUser:', product.idUser);
      console.log('🔍 ReviewController.create - userId:', userId);
      
      // Проверяем, что товар доступен
      if (product.status === 'deleted' || product.status === 'unavailable') {
        return next(ApiError.forbidden('Товар недоступен для отзывов'));
      }

      // Проверяем, что пользователь не пытается оставить отзыв на свой товар
      if (product.idUser === userId) {
        console.log('🔍 ReviewController.create - пользователь пытается оставить отзыв на свой товар');
        return next(ApiError.forbidden('Нельзя оставлять отзыв на свой собственный товар'));
      }

      console.log('🔍 ReviewController.create - вызываем canUserLeaveReview для userId:', userId, 'idProduct:', idProdNum);
      // Сначала обновляем статусы аренд
      const { updateRentStatuses } = require('./rentController');
      console.log('🔍 ReviewController.create - обновляем статусы аренд...');
      const updatedCount = await updateRentStatuses();
      console.log('🔍 ReviewController.create - обновлено аренд:', updatedCount);

      const canLeave = await canUserLeaveReview(userId, idProdNum);
      console.log('🔍 ReviewController.create - canUserLeaveReview вернул:', canLeave);
      
      if (!canLeave) {
        return next(ApiError.forbidden('Нельзя оставлять отзыв: нет активного или завершенного заказа на этот товар'));
      }

      const t = await sequelize.transaction();
      try {
        const existed = await Review.findOne({
          where: { idUser: userId, idProduct: idProdNum },
          transaction: t
        });
        if (existed) {
          await t.rollback();
          return next(ApiError.badRequest('Вы уже оставили отзыв для этого товара'));
        }

        const created = await Review.create({
          idUser: userId,
          idProduct: idProdNum,
          rate: rateNum,
          comment: comment ?? null,
          uploadDate: new Date()
        }, { transaction: t });

        // пересчёт среднего через агрегат БД
        const avgRes = await Review.findOne({
          where: { idProduct: idProdNum },
          attributes: [[fn('AVG', col('rate')), 'avgRate']],
          transaction: t,
          raw: true
        });
        const avg = parseFloat(Number(avgRes.avgRate || 0).toFixed(1));

        await Product.update({ rating: avg }, { where: { idProduct: idProdNum }, transaction: t });

        // Обновляем isreview на false в таблице Rent
        await Rent.update(
          { isreview: false },
          { 
            where: { 
              idUser: userId,
              idProduct: idProdNum,
              status: {
                [Op.in]: ['active', 'completed']
              }
            },
            transaction: t
          }
        );

        console.log('🔍 ReviewController.create - isreview установлен в false для аренды');

        await t.commit();
        return res.status(201).json(created);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (e) {
      console.error('🔍 ReviewController.create - непредвиденная ошибка:', e);
      console.error('🔍 ReviewController.create - stack trace:', e.stack);
      next(ApiError.internal('Непредвиденная ошибка при создании отзыва: ' + e.message));
    }
  }

      async getAllByProduct(req, res, next) {
        try {
            const idProduct = parseInt(req.query.idProduct, 10);
            if (Number.isNaN(idProduct)) {
            return next(ApiError.badRequest('Неверный idProduct в query параметрах'));
            }

            const product = await Product.findByPk(idProduct);
            if (!product) {
            return next(ApiError.notFound('Товар не найден'));
            }
            
            // Проверяем, что товар доступен
            if (product.status === 'deleted' || product.status === 'unavailable') {
                return next(ApiError.forbidden('Товар недоступен для просмотра отзывов'));
            }

            const rows = await Review.findAll({
            where: { idProduct },
            include: [
                {
                model: User,
                attributes: ['idUser', 'name', 'secondName', 'middleName']
                }
            ],
            order: [['uploadDate', 'DESC']]
            });

            // Считаем агрегаты: средний рейтинг и количество отзывов
            const avgRes = await Review.findOne({
            where: { idProduct },
            attributes: [[fn('AVG', col('rate')), 'avgRate']],
            raw: true
            });

            const avgRating = parseFloat(Number(avgRes?.avgRate || 0).toFixed(1));
            const countReviews = rows.length;

            return res.json({
            productId: idProduct,
            stats: { avgRating, countReviews },
            reviews: rows
            });
        } catch (e) {
            next(e);
        }
    }

    async getAllByUser(req, res, next) {
        try {
            const idUser = req.user?.idUser ?? req.user?.id;

            const user = await User.findByPk(idUser);
            if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
            }

            const rows = await Review.findAll({
            where: { idUser },
            include: [
                {
                model: Product,
                attributes: ['idProduct', 'name', 'description', 'price', 'photo']
                }
            ],
            order: [['uploadDate', 'DESC']]
            });

            return res.json({
            userId: idUser,
            reviews: rows
            });
        } catch (e) {
            console.error('Error in getAllByUser:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзывов пользователя'));
        }
    }

    async getStatsByProduct(req, res, next) {
        try {
            if (!req.body) {
            return next(ApiError.badRequest('Тело запроса отсутствует. Убедитесь, что express.json() подключён.'));
            }

            const rawId = req.body.idProduct;
            if (typeof rawId === 'undefined' || rawId === null) {
            return next(ApiError.badRequest('В теле запроса не найден idProduct.'));
            }

            const idProduct = parseInt(rawId, 10);
            if (Number.isNaN(idProduct)) {
            return next(ApiError.badRequest('Неверный idProduct (ожидается число).'));
            }

            const product = await Product.findByPk(idProduct);
            if (!product) {
            return next(ApiError.notFound('Товар не найден'));
            }
            
            // Проверяем, что товар доступен
            if (product.status === 'deleted' || product.status === 'unavailable') {
                return next(ApiError.forbidden('Товар недоступен для просмотра отзывов'));
            }

            // Получаем агрегаты: count и avg
            const statsRaw = await Review.findOne({
            where: { idProduct },
            attributes: [
                [fn('COUNT', col('idReview')), 'countReviews'],
                [fn('AVG', col('rate')), 'avgRate']
            ],
            raw: true
            });

            const countReviews = statsRaw && statsRaw.countReviews !== null ? parseInt(statsRaw.countReviews, 10) : 0;
            const avgRating = statsRaw && statsRaw.avgRate !== null
            ? parseFloat(Number(statsRaw.avgRate).toFixed(1))
            : 0;

            return res.json({
            productId: idProduct,
            countReviews,
            avgRating
            });
        } catch (e) {
            console.error('Error in getStatsByProduct:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Непредвиденная ошибка при получении статистики отзывов.'));
        }
    }

    async getStatsByUser(req, res, next) {
        try {
            const idUser = req.user?.idUser ?? req.user?.id;

            const user = await User.findByPk(idUser);
            if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
            }

            const avgRes = await Review.findOne({
            where: { idUser },
            attributes: [[fn('AVG', col('rate')), 'avgRate']],
            raw: true
            });

            const count = await Review.count({ where: { idUser } });
            const avgRating = parseFloat(Number(avgRes?.avgRate || 0).toFixed(1));

            return res.json({
            userId: idUser,
            avgRating,
            totalReviews: count
            });
        } catch (e) {
            console.error('Error in getStatsByUser:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении статистики отзывов пользователя'));
        }
    }

    // Получить статистику любого пользователя по ID (для уведомлений)
    async getUserStatsById(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            
            if (Number.isNaN(userId)) {
                return next(ApiError.badRequest('Некорректный userId'));
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.notFound('Пользователь не найден'));
            }

            // Находим все продукты пользователя
            const userProducts = await Product.findAll({
                where: { userId: userId },
                attributes: ['idProduct']
            });

            let avgRating = 4.0; // По умолчанию
            let totalReviews = 0;

            if (userProducts.length > 0) {
                const productIds = userProducts.map(product => product.idProduct);
                
                // Находим все отзывы о продуктах пользователя
                const reviews = await Review.findAll({
                    where: { idProduct: { [Op.in]: productIds } }
                });

                totalReviews = reviews.length;
                
                if (reviews.length > 0) {
                    const sumRating = reviews.reduce((sum, review) => sum + review.rate, 0);
                    avgRating = parseFloat((sumRating / reviews.length).toFixed(1));
                }
            }

            return res.json({
                userId: userId,
                avgRating,
                totalReviews
            });
        } catch (e) {
            console.error('Error in getUserStatsById:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении статистики пользователя'));
        }
    }

    async getOne(req, res, next) {
        try {
            const { idReview } = req.params;
            const reviewId = parseInt(idReview, 10);

            if (Number.isNaN(reviewId)) {
                return next(ApiError.badRequest('Некорректный idReview'));
            }

            const review = await Review.findByPk(reviewId, {
                include: [
                    {
                        model: User,
                        attributes: ['idUser', 'name', 'secondName', 'middleName']
                    },
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'description', 'price']
                    }
                ]
            });

            if (!review) {
                return next(ApiError.notFound('Отзыв не найден'));
            }

            const userId = req.user?.idUser ?? req.user?.id;

            if (review.idUser !== userId) {
                return next(ApiError.forbidden('Вы не можете просматривать чужой отзыв'));
            }

            return res.json(review);
        } catch (e) {
            console.error('Error in getOne review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзыва'));
        }
    }

    async update(req, res, next) {
        try {
            const { idReview, rate, comment } = req.body;
            const userId = req.user?.idUser ?? req.user?.id;

            if (!idReview) {
            return next(ApiError.badRequest('Не передан idReview'));
            }

            const review = await Review.findByPk(idReview);
            if (!review) {
            return next(ApiError.notFound('Отзыв не найден'));
            }

            if (review.idUser !== userId) {
            return next(ApiError.forbidden('Вы не можете изменять чужой отзыв'));
            }

            if (typeof rate !== 'undefined') review.rate = rate;
            if (typeof comment !== 'undefined') review.comment = comment;

            review.uploadDate = new Date();

            await review.save();

            return res.json({
            message: 'Отзыв успешно обновлён',
            review
            });
        } catch (e) {
            console.error('Error in update review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при обновлении отзыва'));
        }
    }

    async delete(req, res, next) {
        try {
            const { idReview } = req.body;
            const userId = req.user?.idUser ?? req.user?.id;

            if (!idReview) {
            return next(ApiError.badRequest('Не передан idReview'));
            }

            const review = await Review.findByPk(idReview);
            if (!review) {
            return next(ApiError.notFound('Отзыв не найден'));
            }

            if (review.idUser !== userId) {
            return next(ApiError.forbidden('Вы не можете удалять чужой отзыв'));
            }

            const productId = review.idProduct;
            const reviewUserId = review.idUser;

            // Удаляем отзыв
            await review.destroy();

            // Устанавливаем isreview в true для аренды между этим пользователем и товаром
            await Rent.update(
                { isreview: true },
                { 
                    where: { 
                        idUser: reviewUserId,
                        idProduct: productId,
                        status: {
                            [Op.in]: ['active', 'completed']
                        }
                    }
                }
            );

            console.log(`🔍 ReviewController.delete - isreview установлен в true для аренды userId: ${reviewUserId}, productId: ${productId}`);

            // Пересчитываем средний рейтинг продукта
            const remainingReviews = await Review.findAll({
                where: { idProduct: productId }
            });

            let avgRating = 0;
            if (remainingReviews.length > 0) {
                const totalRating = remainingReviews.reduce((sum, r) => sum + r.rate, 0);
                avgRating = parseFloat(Number(totalRating / remainingReviews.length).toFixed(1));
            }

            // Обновляем рейтинг продукта
            await Product.update(
                { rating: avgRating },
                { where: { idProduct: productId } }
            );

            return res.json({ message: 'Отзыв успешно удалён' });
        } catch (e) {
            console.error('Error in delete review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при удалении отзыва'));
        }
    }

    // Получить все отзывы пользователя
    async getUserReviews(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            console.log('🔍 getUserReviews - userId from params:', userId);
            console.log('🔍 getUserReviews - req.user:', req.user);
            console.log('🔍 getUserReviews - req.user?.idUser:', req.user?.idUser);
            console.log('🔍 getUserReviews - req.user?.id:', req.user?.id);
            
            if (Number.isNaN(userId)) {
                return next(ApiError.badRequest('Некорректный userId'));
            }

            // Проверяем, что пользователь запрашивает свои отзывы
            const currentUserId = req.user?.idUser ?? req.user?.id;
            console.log('🔍 getUserReviews - currentUserId:', currentUserId);
            console.log('🔍 getUserReviews - currentUserId !== userId:', currentUserId !== userId);
            
            if (currentUserId !== userId) {
                return next(ApiError.forbidden('Вы не можете просматривать чужие отзывы'));
            }

            const reviews = await Review.findAll({
                where: { idUser: userId },
                include: [
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'description', 'price', 'photo']
                    }
                ],
                order: [['uploadDate', 'DESC']]
            });

            console.log('🔍 getUserReviews - found reviews:', reviews.length);
            console.log('🔍 getUserReviews - reviews:', reviews);

            return res.json(reviews);
        } catch (e) {
            console.error('Error in getUserReviews:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзывов пользователя'));
        }
    }

    // Получить отзывы о пользователе (кто писал отзывы о его продуктах)
    // Используется в уведомлениях для просмотра репутации арендатора
    async getReviewsAboutUser(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            console.log('🔍 getReviewsAboutUser - userId from params:', userId);
            console.log('🔍 getReviewsAboutUser - req.user:', req.user);
            console.log('🔍 getReviewsAboutUser - req.user?.idUser:', req.user?.idUser);
            console.log('🔍 getReviewsAboutUser - req.user?.id:', req.user?.id);
            
            if (Number.isNaN(userId)) {
                return next(ApiError.badRequest('Некорректный userId'));
            }

            // Проверяем, что пользователь запрашивает отзывы о себе
            const currentUserId = req.user?.idUser ?? req.user?.id;
            console.log('🔍 getReviewsAboutUser - currentUserId:', currentUserId);
            console.log('🔍 getReviewsAboutUser - userId:', userId);
            console.log('🔍 getReviewsAboutUser - currentUserId !== userId:', currentUserId !== userId);
            
            // Убираем ограничение - пользователь может просматривать отзывы о любом пользователе
            // Это нужно для уведомлений, где владелец товара хочет посмотреть репутацию арендатора
            // if (currentUserId !== userId) {
            //     return next(ApiError.forbidden('Вы не можете просматривать чужие отзывы'));
            // }

            // Находим все продукты пользователя
            const userProducts = await Product.findAll({
                where: { userId: userId },
                attributes: ['idProduct']
            });

            console.log('🔍 getReviewsAboutUser - userProducts found:', userProducts.length);
            console.log('🔍 getReviewsAboutUser - userProducts:', userProducts);

            if (userProducts.length === 0) {
                return res.json([]);
            }

            const productIds = userProducts.map(product => product.idProduct);
            console.log('🔍 getReviewsAboutUser - productIds:', productIds);

            // Находим все отзывы о продуктах пользователя
            const reviews = await Review.findAll({
                where: { idProduct: { [Op.in]: productIds } },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['idUser', 'name', 'secondName', 'middleName']
                    },
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'description', 'price', 'photo']
                    }
                ],
                order: [['uploadDate', 'DESC']]
            });

            console.log('🔍 getReviewsAboutUser - reviews found:', reviews.length);
            console.log('🔍 getReviewsAboutUser - reviews:', reviews);

            return res.json(reviews);
        } catch (e) {
            console.error('Error in getReviewsAboutUser:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзывов о пользователе'));
        }
    }
}

module.exports = new ReviewController();