import { Router } from 'express';
import { body } from 'express-validator';
import { createEvent, deleteEvent, featuredEvents, getAvailabilityForEvent, getEvent, listEvents, listManagedEvents, updateEvent, updateEventStatus } from '../controllers/eventController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const eventValidation = [
  body('title').trim().isLength({ min: 3, max: 160 }).withMessage('Title must be between 3 and 160 characters.'),
  body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('venue').trim().notEmpty().withMessage('Venue is required.'),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('totalCapacity').isInt({ min: 1 }).withMessage('Capacity must be a positive whole number.'),
  body('ticketTypes').isArray({ min: 1 }).withMessage('At least one ticket type is required.'),
  body('ticketTypes.*.name').trim().notEmpty().withMessage('Each ticket type needs a name.'),
  body('ticketTypes.*.price').isFloat({ min: 0 }).withMessage('Ticket prices cannot be negative.'),
  body('ticketTypes.*.quantity').isInt({ min: 1 }).withMessage('Ticket quantities must be positive.'),
  body('ticketTypes.*.perUserLimit').isInt({ min: 1 }).withMessage('Booking limits must be positive.')
];

router.get('/', listEvents);
router.get('/featured', featuredEvents);
router.get('/manage', requireAuth, requireRole('admin'), listManagedEvents);
router.get('/:id/availability', getAvailabilityForEvent);
router.get('/:id', getEvent);
router.post('/', requireAuth, requireRole('admin'), eventValidation, createEvent);
router.put('/:id', requireAuth, requireRole('admin'), eventValidation, updateEvent);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateEventStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteEvent);

export default router;
