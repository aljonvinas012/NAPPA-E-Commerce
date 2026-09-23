import { Router } from 'express';
import {
  getSalesAnalytics,
  getMonthlySales,
  getBestSellers,
  getCustomers,
  updateUserStatus,
  updateUserDetails,
  resetUserPassword,
  getDashboardOverview,
} from '../controllers/adminController';
import { getAllReviewsAdmin, deleteReviewAdmin } from '../controllers/reviewController';
import { auth, adminOnly } from '../middleware/auth';

const router = Router();
router.use(auth, adminOnly);
router.get('/overview', getDashboardOverview);
router.get('/analytics', getSalesAnalytics);
router.get('/sales', getMonthlySales);
router.get('/best-sellers', getBestSellers);
router.get('/customers', getCustomers);

// User management
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id', updateUserDetails);
router.put('/users/:id/password', resetUserPassword);

// Feedback moderation
router.get('/reviews', getAllReviewsAdmin);
router.delete('/reviews/:id', deleteReviewAdmin);

export default router;
