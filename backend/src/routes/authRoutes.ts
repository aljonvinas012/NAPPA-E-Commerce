import { Router } from 'express';
import { register, login, getMe, verifyMfa } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/mfa/verify', verifyMfa);
router.get('/me', auth, getMe);
export default router;
