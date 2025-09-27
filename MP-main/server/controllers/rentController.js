const { User, Rent, Product, Notification } = require('../models/models');
const ApiError = require('../error/ApiError');
const { Op } = require('sequelize');

// Функция для автоматического обновления статуса аренды
async function updateRentStatuses() {
    try {
        const now = new Date();
        
        // Находим все активные аренды, у которых дата окончания прошла
        const expiredRents = await Rent.findAll({
            where: {
                status: 'active',
                dataEnd: {
                    [Op.lt]: now
                }
            }
        });

        console.log('🔍 updateRentStatuses - найдено просроченных аренд:', expiredRents.length);

        // Обновляем статус на 'completed' для всех просроченных аренд
        for (const rent of expiredRents) {
            await rent.update({ status: 'completed' });
            
            // Возвращаем товар в доступные
            await Product.update(
                { status: 'available' },
                { where: { idProduct: rent.idProduct } }
            );

            console.log(`🔍 updateRentStatuses - аренда ${rent.idRent} завершена автоматически`);
        }

        return expiredRents.length;
    } catch (error) {
        console.error('🔍 updateRentStatuses - ошибка:', error);
        throw error;
    }
}

class RentController {
    // Создать новую аренду
    async create(req, res, next) {
        try {
            console.log('🔍 Rent create - req.body:', req.body);
            console.log('🔍 Rent create - req.user:', req.user);
            
            const userId = req.user.id; // Получаем ID из JWT токена
            const { productId, startDate, endDate } = req.body;

            if (!productId || !startDate || !endDate) {
                return next(ApiError.badRequest('Не указаны обязательные поля: productId, startDate, endDate'));
            }

            // Проверяем, что пользователь существует
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`));
            }

            // Проверяем, что товар существует и доступен
            const product = await Product.findByPk(productId);
            if (!product) {
                return next(ApiError.badRequest(`Товар с id=${productId} не найден`));
            }

            // Проверяем только базовую доступность товара
            console.log('🔍 Проверяем статус товара:', product.status);
            
            if (product.status === 'deleted' || product.status === 'unavailable') {
                return next(ApiError.badRequest('Товар недоступен для аренды'));
            }

            // Проверяем, что пользователь не арендует свой собственный товар
            if (product.userId === userId) {
                return next(ApiError.badRequest('Нельзя арендовать свой собственный товар'));
            }

            // Проверяем только базовую корректность дат
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end <= start) {
                return next(ApiError.badRequest('Дата окончания должна быть позже даты начала'));
            }

            // Убираем проверку конфликтов дат - можно арендовать на любые даты

            // Создаем аренду
            const rent = await Rent.create({
                idUser: userId,
                idProduct: productId,
                status: 'pending',
                dataStart: start,
                dataEnd: end
            });

            // Создаем уведомление для владельца товара
            try {
                console.log('🔍 Rent create: создаем уведомление для владельца товара:', product.userId);
                console.log('🔍 Rent create: данные для уведомления:', {
                    userId: product.userId,
                    type: 'rent_request',
                    title: 'Новый запрос на аренду',
                    message: `Пользователь хочет арендовать ваш товар "${product.name}" с ${start.toLocaleDateString('ru-RU')} по ${end.toLocaleDateString('ru-RU')}`,
                    relatedId: rent.idRent
                });
                
                const notification = await Notification.create({
                    userId: product.userId,
                    type: 'rent_request',
                    title: 'Новый запрос на аренду',
                    message: `Пользователь хочет арендовать ваш товар "${product.name}" с ${start.toLocaleDateString('ru-RU')} по ${end.toLocaleDateString('ru-RU')}`,
                    relatedId: rent.idRent,
                    isRead: false
                });
                console.log('🔍 Rent create: уведомление создано успешно:', notification.toJSON());
            } catch (notificationError) {
                console.error('🔍 Rent create: ошибка при создании уведомления:', notificationError);
                console.error('🔍 Rent create: детали ошибки:', {
                    message: notificationError.message,
                    code: notificationError.code,
                    sql: notificationError.sql
                });
                // Не прерываем создание аренды, если уведомление не создалось
            }

            // Товар остается доступным до подтверждения аренды
            // Статус изменится на "rented" только после подтверждения владельцем

            return res.json({
                message: 'Запрос на аренду отправлен и ожидает подтверждения владельца',
                rent: {
                    idRent: rent.idRent,
                    idUser: rent.idUser,
                    idProduct: rent.idProduct,
                    status: rent.status,
                    dataStart: rent.dataStart,
                    dataEnd: rent.dataEnd
                }
            });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }

    // Получить все аренды пользователя
    async getUserRents(req, res, next) {
        try {
            const userId = req.user.id;
            
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`));
            }

            const rents = await Rent.findAll({
                where: { idUser: userId },
                include: [
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'photo', 'price', 'category']
                    }
                ],
                order: [['dataStart', 'DESC']]
            });

            return res.json({ userId, rents });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }

    // Получить все аренды товара (для владельца)
    async getProductRents(req, res, next) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;

            const product = await Product.findByPk(productId);
            if (!product) {
                return next(ApiError.badRequest(`Товар с id=${productId} не найден`));
            }

            // Проверяем, что пользователь является владельцем товара
            if (product.userId !== userId) {
                return next(ApiError.forbidden('Доступ запрещен'));
            }

            const rents = await Rent.findAll({
                where: { idProduct: productId },
                include: [
                    {
                        model: User,
                        attributes: ['idUser', 'name', 'secondName', 'phone']
                    }
                ],
                order: [['dataStart', 'DESC']]
            });

            return res.json({ productId, rents });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }

    // Получить все аренды (для поиска аренд товаров пользователя)
    async getAllRents(req, res, next) {
        try {
            const rents = await Rent.findAll({
                include: [
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'photo', 'price', 'category', 'userId']
                    },
                    {
                        model: User,
                        attributes: ['idUser', 'name', 'secondName', 'phone']
                    }
                ],
                order: [['dataStart', 'DESC']]
            });

            return res.json({ rents });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }

    // Обновить статус аренды
    async updateStatus(req, res, next) {
        try {
            const { rentId } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            if (!status) {
                return next(ApiError.badRequest('Не указан статус'));
            }

            const rent = await Rent.findByPk(rentId);
            if (!rent) {
                return next(ApiError.badRequest(`Аренда с id=${rentId} не найдена`));
            }

            // Проверяем права доступа
            if (rent.idUser !== userId) {
                // Если не арендатор, проверяем, является ли пользователь владельцем товара
                const product = await Product.findByPk(rent.idProduct);
                if (!product || product.userId !== userId) {
                    return next(ApiError.forbidden('Доступ запрещен'));
                }
            }

            // Обновляем статус и устанавливаем isreview в true при подтверждении
            const updateData = { status };
            if (status === 'active') {
                updateData.isreview = true;
                console.log(`🔍 updateStatus: аренда ${rentId} подтверждена, isreview установлен в true`);
            }
            
            await rent.update(updateData);

            // Если аренда завершена, возвращаем товар в доступные
            if (status === 'completed' || status === 'cancelled') {
                await Product.update(
                    { status: 'available' },
                    { where: { idProduct: rent.idProduct } }
                );
            }

            return res.json({
                message: 'Статус аренды обновлен',
                rent: {
                    idRent: rent.idRent,
                    status: rent.status
                }
            });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }

    // Получить объявления готовые для отзыва
    async getReadyForReview(req, res, next) {
        try {
            const userId = req.user.id;
            
            console.log(`🔍 getReadyForReview - userId:`, userId);

            // Проверяем, что пользователь существует
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.notFound('Пользователь не найден'));
            }

            // Находим все аренды пользователя с isreview = true
            console.log(`🔍 getReadyForReview - ищем аренды для userId: ${userId}, isreview: true, status: ['active', 'completed']`);
            
            const readyForReview = await Rent.findAll({
                where: {
                    idUser: userId,
                    isreview: true,
                    status: {
                        [Op.in]: ['active', 'completed']
                    }
                },
                include: [{
                    model: Product,
                    attributes: ['idProduct', 'name', 'photo', 'description']
                }],
                raw: false, // Убеждаемся, что возвращаются экземпляры Sequelize
                nest: true // Включаем вложенность для ассоциаций
            });

            console.log(`🔍 getReadyForReview - найдено объявлений готовых для отзыва:`, readyForReview.length);
            
            // Логируем структуру первого элемента для диагностики
            if (readyForReview.length > 0) {
                console.log('🔍 getReadyForReview - структура первого элемента:', JSON.stringify(readyForReview[0], null, 2));
                console.log('🔍 getReadyForReview - rent.Product:', readyForReview[0].Product);
            }

            // Преобразуем данные для фронтенда
            let adaptedData = [];
            
            if (readyForReview.length > 0 && readyForReview[0].Product) {
                // Ассоциация работает, используем её
                adaptedData = readyForReview.map(rent => ({
                    id: rent.Product.idProduct,
                    image: rent.Product.photo ? `http://localhost:7000/uploads/${rent.Product.photo}` : '/default-image.jpg',
                    title: rent.Product.name,
                    description: rent.Product.description,
                    rentId: rent.idRent
                }));
            } else {
                // Ассоциация не работает, получаем данные отдельно
                console.log('🔍 getReadyForReview - ассоциация не работает, получаем данные отдельно');
                
                const productIds = readyForReview.map(rent => rent.idProduct);
                const products = await Product.findAll({
                    where: { idProduct: productIds },
                    attributes: ['idProduct', 'name', 'photo', 'description']
                });
                
                const productsMap = {};
                products.forEach(product => {
                    productsMap[product.idProduct] = product;
                });
                
                adaptedData = readyForReview.map(rent => {
                    const product = productsMap[rent.idProduct];
                    if (!product) {
                        console.error('🔍 getReadyForReview - продукт не найден для аренды:', rent.idRent);
                        return null;
                    }
                    
                    return {
                        id: product.idProduct,
                        image: product.photo ? `http://localhost:7000/uploads/${product.photo}` : '/default-image.jpg',
                        title: product.name,
                        description: product.description,
                        rentId: rent.idRent
                    };
                }).filter(item => item !== null);
            }
            
            console.log(`🔍 getReadyForReview - итоговое количество объявлений:`, adaptedData.length);

            return res.json({ products: adaptedData });
        } catch (e) {
            console.error('🔍 getReadyForReview - ошибка:', e);
            next(ApiError.internal(e.message));
        }
    }

    // Отменить аренду
    async cancel(req, res, next) {
        try {
            const { rentId } = req.params;
            const userId = req.user.id;

            const rent = await Rent.findByPk(rentId);
            if (!rent) {
                return next(ApiError.badRequest(`Аренда с id=${rentId} не найдена`));
            }

            // Проверяем права доступа
            if (rent.idUser !== userId) {
                return next(ApiError.forbidden('Доступ запрещен'));
            }

            // Проверяем, что аренда еще не началась
            const now = new Date();
            if (rent.dataStart <= now) {
                return next(ApiError.badRequest('Нельзя отменить начавшуюся аренду'));
            }

            // Отменяем аренду
            await rent.update({ status: 'cancelled' });

            // Возвращаем товар в доступные
            await Product.update(
                { status: 'available' },
                { where: { idProduct: rent.idProduct } }
            );

            return res.json({
                message: 'Аренда отменена',
                rent: {
                    idRent: rent.idRent,
                    status: rent.status
                }
            });
        } catch (e) {
            next(ApiError.internal(e));
        }
    }
}

module.exports = { 
    rentController: new RentController(),
    updateRentStatuses 
};
