import { Router } from 'express';
import {
  updatePhone, changePassword, addAddress, updateAddress, deleteAddress,
} from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);
router.put('/phone', updatePhone);
router.put('/password', changePassword);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
export default router;
