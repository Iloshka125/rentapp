const Router = require('express')
const router = new Router()
const notificationController = require('../controllers/notificationController')
const authMiddleware = require('../middleware/authMiddleware')

// Получить уведомления для владельца товара
router.get('/owner', authMiddleware, notificationController.getNotificationsForOwner)

// Принять запрос на аренду
router.post('/accept/:notificationId', authMiddleware, notificationController.acceptRent)

// Отклонить запрос на аренду
router.post('/decline/:notificationId', authMiddleware, notificationController.declineRent)

module.exports = router
