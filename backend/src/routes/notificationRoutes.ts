import { Router } from 'express';
import { getNotifications, markAllRead, markOneRead } from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = Router();
router.use(auth);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);
export default router;
