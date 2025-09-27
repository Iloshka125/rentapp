const Router = require('express');
const { rentController } = require('../controllers/rentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = new Router();

// Создать новую аренду
router.post('/create', authMiddleware, rentController.create);

// Получить все аренды пользователя
router.get('/user', authMiddleware, rentController.getUserRents);

// Получить все аренды товара (для владельца)
router.get('/product/:productId', authMiddleware, rentController.getProductRents);

// Получить все аренды (для поиска аренд товаров пользователя)
router.get('/all', rentController.getAllRents);

// Обновить статус аренды
router.patch('/status/:rentId', authMiddleware, rentController.updateStatus);

// Получить объявления готовые для отзыва
router.get('/ready-for-review', authMiddleware, rentController.getReadyForReview);

// Отменить аренду
router.delete('/cancel/:rentId', authMiddleware, rentController.cancel);

module.exports = router;
