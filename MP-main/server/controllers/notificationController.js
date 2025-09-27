const { Notification, Rent, Product, User, Review } = require('../models/models');
const { Op } = require('sequelize');
const ApiError = require('../error/ApiError');

class NotificationController {
    // Получить все уведомления для владельца товара
    async getNotificationsForOwner(req, res, next) {
        try {
            const productOwnerId = req.user.id;
            console.log('🔍 getNotificationsForOwner: productOwnerId:', productOwnerId);

            // Получаем уведомления о запросах на аренду
            const notifications = await Notification.findAll({
                where: { 
                    userId: productOwnerId,
                    type: 'rent_request',
                    isRead: false
                },
                order: [['createdAt', 'DESC']]
            });

            console.log('🔍 getNotificationsForOwner: найдено уведомлений до фильтрации:', notifications.length);

            console.log('🔍 getNotificationsForOwner: найдено уведомлений:', notifications.length);

            // Для каждого уведомления получаем данные об аренде и арендаторе
            const notificationsWithFullData = await Promise.all(notifications.map(async (notification) => {
                try {
                    // Получаем аренду по relatedId
                    const rent = await Rent.findByPk(notification.relatedId, {
                        include: [
                            {
                                model: Product,
                                attributes: ['idProduct', 'name', 'photo', 'price', 'category']
                            },
                            {
                                model: User,
                                as: 'user',
                                attributes: ['idUser', 'name', 'secondName', 'middleName', 'phone']
                            }
                        ]
                    });

                    if (!rent) {
                        console.error('🔍 getNotificationsForOwner: аренда не найдена для уведомления:', notification.idNotification);
                        return null;
                    }

                    // Проверяем, что аренда не отменена, не отклонена и не завершена
                    // Показываем только активные запросы на аренду (status: 'pending')
                    if (rent.status === 'cancelled' || rent.status === 'declined' || rent.status === 'completed') {
                        console.log('🔍 getNotificationsForOwner: аренда имеет статус "' + rent.status + '", пропускаем уведомление:', notification.idNotification);
                        return null;
                    }

                    const renterId = rent.user.idUser;
                    console.log('🔍 getNotificationsForOwner: ID арендатора:', renterId);
                    console.log('🔍 getNotificationsForOwner: структура rent.user:', {
                        userKeys: Object.keys(rent.user),
                        idUser: rent.user.idUser,
                        id: rent.user.id
                    });
                    
                    // Используем упрощенную логику для получения рейтинга арендатора
                    // Вместо сложного поиска отзывов о товарах, используем простой подход
                    
                    // Находим все товары арендатора
                    const renterProducts = await Product.findAll({ 
                        where: { 
                            userId: renterId,
                            status: { [Op.notIn]: ['deleted'] }
                        }
                    });
                    const renterProductIds = renterProducts.map(p => p.idProduct);
                    
                    console.log('🔍 getNotificationsForOwner: товары арендатора:', {
                        renterId,
                        foundProducts: renterProducts.length,
                        productIds: renterProductIds
                    });
                    
                    let renterRating = 4.0; // По умолчанию 4 звезды
                    let renterReviewsCount = 0;
                    
                    if (renterProductIds.length > 0) {
                        // Находим все отзывы о товарах арендатора
                        const renterReviews = await Review.findAll({ 
                            where: { 
                                idProduct: { [Op.in]: renterProductIds }
                            }
                        });
                        
                        console.log('🔍 getNotificationsForOwner: найдены отзывы о товарах арендатора:', {
                            renterId,
                            renterProductIds,
                            totalReviews: renterReviews.length,
                            reviews: renterReviews.map(r => ({ idUser: r.idUser, rate: r.rate, idProduct: r.idProduct }))
                        });
                        
                        if (renterReviews.length > 0) {
                            // Фильтруем только отзывы, где idUser НЕ равен idUser арендатора
                            // (т.е. отзывы НЕ от самого арендатора о своих товарах)
                            const validReviews = renterReviews.filter(review => review.idUser !== renterId);
                            renterReviewsCount = validReviews.length;
                            
                            console.log('🔍 getNotificationsForOwner: фильтрация отзывов:', {
                                renterId,
                                totalReviews: renterReviews.length,
                                validReviews: validReviews.length,
                                filteredOut: renterReviews.length - validReviews.length,
                                validReviewDetails: validReviews.map(r => ({ idUser: r.idUser, rate: r.rate, idProduct: r.idProduct }))
                            });
                            
                            if (validReviews.length > 0) {
                                const totalRating = validReviews.reduce((sum, review) => sum + review.rate, 0);
                                renterRating = parseFloat((totalRating / validReviews.length).toFixed(1));
                            }
                        }
                    } else {
                        console.log('🔍 getNotificationsForOwner: у арендатора нет товаров, используем рейтинг по умолчанию');
                    }
                    
                    console.log('🔍 getNotificationsForOwner: итоговый рейтинг арендатора:', {
                        renterId,
                        totalReviews: renterReviewsCount,
                        calculatedRating: renterRating
                    });

                    // Проверяем, что значения не undefined
                    if (renterRating === undefined) {
                        console.error('🔍 getNotificationsForOwner: ОШИБКА! renterRating is undefined');
                        renterRating = 4.0; // Устанавливаем значение по умолчанию
                    }
                    
                    if (renterReviewsCount === undefined) {
                        console.error('🔍 getNotificationsForOwner: ОШИБКА! renterReviewsCount is undefined');
                        renterReviewsCount = 0; // Устанавливаем значение по умолчанию
                    }
                    
                    const renterData = {
                        ...rent.user.toJSON(),
                        rating: renterRating,
                        reviewsCount: renterReviewsCount
                    };
                    
                    console.log('🔍 getNotificationsForOwner: формируем объект renter:', {
                        renterId,
                        renterData,
                        rating: renterData.rating,
                        reviewsCount: renterData.reviewsCount
                    });
                    
                    // Дополнительная проверка
                    console.log('🔍 getNotificationsForOwner: проверка значений:', {
                        renterRating,
                        renterReviewsCount,
                        renterDataRating: renterData.rating,
                        renterDataReviewsCount: renterData.reviewsCount
                    });
                    
                    // Создаем объект rent с включенными данными renter
                    const rentWithRenter = {
                        ...rent.toJSON(),
                        renter: renterData
                    };
                    
                    return {
                        ...notification.toJSON(),
                        rent: rentWithRenter
                    };
                } catch (error) {
                    console.error('🔍 getNotificationsForOwner: ошибка при обработке уведомления:', error);
                    return null;
                }
            }));

            // Фильтруем null значения
            const validNotifications = notificationsWithFullData.filter(n => n !== null);
            console.log('🔍 getNotificationsForOwner: валидных уведомлений:', validNotifications.length);
            console.log('🔍 getNotificationsForOwner: отфильтровано уведомлений:', notificationsWithFullData.length - validNotifications.length);
            
            // Логируем структуру первого уведомления для диагностики
            if (validNotifications.length > 0) {
                console.log('🔍 getNotificationsForOwner: структура первого уведомления:', JSON.stringify(validNotifications[0], null, 2));
            }

            return res.json({ notifications: validNotifications });
        } catch (e) {
            console.error('🔍 getNotificationsForOwner: ошибка:', e);
            return next(ApiError.internal(e.message));
        }
    }

    // Принять запрос на аренду
    async acceptRent(req, res, next) {
        try {
            const { notificationId } = req.params;
            const productOwnerId = req.user.id;

            console.log('🔍 acceptRent: notificationId:', notificationId, 'productOwnerId:', productOwnerId);

            // Находим уведомление
            const notification = await Notification.findOne({
                where: { 
                    idNotification: notificationId,
                    userId: productOwnerId,
                    type: 'rent_request',
                    isRead: false
                }
            });

            if (!notification) {
                return next(ApiError.notFound('Уведомление не найдено'));
            }

            // Получаем аренду
            const rent = await Rent.findByPk(notification.relatedId);
            if (!rent) {
                return next(ApiError.notFound('Аренда не найдена'));
            }

            // Обновляем статус уведомления
            await notification.update({ 
                type: 'rent_accepted',
                isRead: true 
            });

            // Обновляем статус аренды и устанавливаем isreview в true
            await rent.update({ 
                status: 'active',
                isreview: true
            });

            // Обновляем статус товара
            await Product.update(
                { status: 'rented' },
                { where: { idProduct: rent.idProduct } }
            );

            console.log('🔍 acceptRent: аренда принята успешно, isreview установлен в true');

            return res.json({ message: 'Аренда принята успешно' });
        } catch (e) {
            console.error('🔍 acceptRent: ошибка:', e);
            return next(ApiError.internal(e.message));
        }
    }

    // Отклонить запрос на аренду
    async declineRent(req, res, next) {
        try {
            const { notificationId } = req.params;
            const productOwnerId = req.user.id;

            console.log('🔍 declineRent: notificationId:', notificationId, 'productOwnerId:', productOwnerId);

            // Находим уведомление
            const notification = await Notification.findOne({
                where: { 
                    idNotification: notificationId,
                    userId: productOwnerId,
                    type: 'rent_request',
                    isRead: false
                }
            });

            if (!notification) {
                return next(ApiError.notFound('Уведомление не найдено'));
            }

            // Получаем аренду
            const rent = await Rent.findByPk(notification.relatedId);
            if (!rent) {
                return next(ApiError.notFound('Аренда не найдена'));
            }

            // Обновляем статус уведомления
            await notification.update({ 
                type: 'rent_declined',
                isRead: true 
            });

            // Обновляем статус аренды
            await rent.update({ status: 'cancelled' });

            console.log('🔍 declineRent: аренда отклонена успешно');

            return res.json({ message: 'Аренда отклонена успешно' });
        } catch (e) {
            console.error('🔍 declineRent: ошибка:', e);
            return next(ApiError.internal(e.message));
        }
    }
}

module.exports = new NotificationController();
