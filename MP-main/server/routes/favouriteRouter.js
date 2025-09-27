const Router = require('express')
const router = new Router()
const favouriteController = require('../controllers/favouriteController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/create', authMiddleware, favouriteController.create)
router.delete('/delete', authMiddleware, favouriteController.remove)
router.get('/user', authMiddleware, favouriteController.getOne)

module.exports = router