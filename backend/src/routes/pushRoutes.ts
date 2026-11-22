import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getPublicKey, subscribe, unsubscribe } from '../controllers/pushController';

const router = Router();

router.get('/public-key', getPublicKey);
router.post('/subscribe', auth, subscribe);
router.post('/unsubscribe', auth, unsubscribe);

export default router;
