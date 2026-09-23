import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder,
} from '../controllers/orderController';
import { auth, adminOnly } from '../middleware/auth';

const router = Router();
router.use(auth);
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/all', adminOnly, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
export default router;
