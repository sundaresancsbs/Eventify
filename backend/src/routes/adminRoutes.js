import { Router } from 'express';
import {
  getDashboardStats,
  listAllBookings,
  listAllUsers,
  updateUserStatus,
  getAnalytics
} from '../controllers/adminController.js';
import { confirmUpiPayment } from '../controllers/bookingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/bookings', listAllBookings);
router.patch('/bookings/:id/confirm-payment', confirmUpiPayment);
router.get('/users', listAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/analytics', getAnalytics);

export default router;
