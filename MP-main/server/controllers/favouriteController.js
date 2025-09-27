const { User, Favourite, Product, Review } = require('../models/models');
const ApiError = require('../error/ApiError');
const { Op } = require('sequelize');

class FavouriteController {
    async create(req, res, next) {
        try {
            const userId = req.user.id; // Получаем ID из JWT токена
            const {productId} = req.body;

            if (!productId) {
                return next(ApiError.badRequest('Не указан productId'))
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`))
            }

            const product = await Product.findByPk(productId);
            if (!product) {
                return next(ApiError.badRequest(`Товар с id=${productId} не найден`))
            }

            const exists = await Favourite.findOne({
                where: {
                    userId,
                    idProduct: productId,
                }
            })

            if (exists) {
                return next(ApiError.conflict('Этот товар уже находится в избранном у данного пользователя'))
            }

            const favourite = await Favourite.create({
                userId,
                idProduct: productId
            })

            return res.json({message: 'Товар успешоно добавлен в избранное', favourite})
        } catch (e) {
            next(ApiError.internal(e))
        }
    }

    async remove(req, res, next) {
        try {
            const userId = req.user.id; // Получаем ID из JWT токена
            const {productId} = req.body

            if (!productId) {
                return next(ApiError.badRequest('Не указан productId'))
            }

            const deletedCount = await Favourite.destroy({
                where: {
                    userId,
                    idProduct: productId
                }
            })

            if (deletedCount === 0) {
                return next(ApiError.badRequest('Запись не найдена в избранном'))
            }

            return res.json({message: 'Товар удалён из избранного'})
        } catch (e) {
            next(ApiError.internal(e))
        }
    }

    async getOne(req, res, next) {
        try {
            const userId = req.user.id; // Получаем ID из JWT токена
            
            const user = await User.findByPk(userId)
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`))
            }

            const favRecords = await Favourite.findAll({
                where: { userId },
                attributes: ['idProduct'],
            });

            if (!favRecords || favRecords.length === 0) {
                return res.json({ userId, products: [] });
            }

            const productIds = favRecords.map(r => r.idProduct);
            
            const products = await Product.findAll({
                where: { 
                    idProduct: productIds,
                    status: { [Op.notIn]: ['deleted'] }
                },
                attributes: ['idProduct', 'name', 'description', 'price', 'category', 'rating', 'photo', 'userId'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['idUser', 'name', 'secondName']
                    }
                ]
            });

            // Рассчитываем актуальный рейтинг для каждого продукта
            const productsWithRating = await Promise.all(products.map(async (product) => {
                // Находим отзывы для конкретного продукта
                const productReviews = await Review.findAll({
                    where: { idProduct: product.idProduct }
                });

                // Находим отзывы о продуктах пользователя (для расчета userRating)
                const userProducts = await Product.findAll({
                    where: { userId: product.userId }
                });
                
                const userProductIds = userProducts.map(p => p.idProduct);
                const userReviews = await Review.findAll({
                    where: { idProduct: userProductIds }
                });

                // Рассчитываем рейтинг продукта
                let finalRating = 4.0; // По умолчанию
                if (productReviews.length > 0) {
                    const avgProductRating = productReviews.reduce((sum, review) => sum + review.rate, 0) / productReviews.length;
                    finalRating = avgProductRating;
                } else if (userReviews.length > 0) {
                    // Если нет отзывов о продукте, используем рейтинг пользователя
                    const avgUserRating = userReviews.reduce((sum, review) => sum + review.rate, 0) / userReviews.length;
                    finalRating = avgUserRating;
                }

                // Возвращаем продукт с обновленным рейтингом
                return {
                    ...product.toJSON(),
                    rating: finalRating,
                    userRating: finalRating,
                    reviewsCount: productReviews.length
                };
            }));

            return res.json({userId, products: productsWithRating})
        } catch(e) {
            next(ApiError.internal(e))
        }
    }
}

module.exports = new FavouriteController()