const Router = require('express');
const router = new Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Публичные маршруты (не требуют аутентификации)
router.get('/getAllByProduct', reviewController.getAllByProduct);
router.get('/getStatsByProduct', reviewController.getStatsByProduct);

// Защищенные маршруты (требуют аутентификации)
router.use(authMiddleware);
router.post('/create', reviewController.create);
router.get('/getAllByUser', reviewController.getAllByUser);
router.get('/getStatsByUser', reviewController.getStatsByUser);
router.get('/getUserStatsById/:userId', reviewController.getUserStatsById);
router.get('/getOne/:idReview', reviewController.getOne);
router.get('/getUserReviews/:userId', reviewController.getUserReviews);
router.get('/getReviewsAboutUser/:userId', reviewController.getReviewsAboutUser);
router.put('/update', reviewController.update);
router.delete('/delete', reviewController.delete);


module.exports = router;