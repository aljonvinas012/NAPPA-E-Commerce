import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/reviewController';
import { auth } from '../middleware/auth';

const router = Router();
router.get('/product/:productId', getProductReviews);
router.post('/', auth, createReview);
export default router;
