const Router = require('express')
const router = new Router()
const productController = require('../controllers/productController')
const authMiddleware = require('../middleware/authMiddleware')
const uploadMiddleware = require('../middleware/uploadMiddleware')

router.post('/create', authMiddleware, uploadMiddleware, productController.create)
router.get('/getAll', productController.getAll)
router.get('/search', productController.sort)
router.get('/getUserProducts', authMiddleware, productController.getUserProducts)
router.get('/getOne/:id', productController.getOne)
router.put('/update/:id', authMiddleware, uploadMiddleware, productController.update)
router.patch('/status/:id', authMiddleware, productController.updateStatus)
router.delete('/delete/:id', authMiddleware, productController.remove)
router.post('/test-dates', authMiddleware, productController.testDates)


module.exports = router