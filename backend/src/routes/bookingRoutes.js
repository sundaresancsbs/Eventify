import { Router } from 'express';
import { body } from 'express-validator';
import { cancelBooking, createBooking, getBooking, listMyBookings, submitUpiPayment } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', [
  body('eventId').isMongoId().withMessage('Valid event is required.'),
  body('ticketTypeId').isMongoId().withMessage('Valid ticket type is required.'),
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20.')
], createBooking);

router.post('/payments/upi', submitUpiPayment);
router.get('/my-bookings', listMyBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
