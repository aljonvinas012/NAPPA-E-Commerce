import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);
export default router;
