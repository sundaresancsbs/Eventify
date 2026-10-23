import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me, register, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const emailValidator = body('email').isEmail().withMessage('A valid email is required.').normalizeEmail();
const passwordValidator = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.');

// Public routes
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  emailValidator,
  passwordValidator,
  body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number is too long.')
], register);

router.post('/login', [emailValidator, passwordValidator], login);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, me);

router.put('/profile', requireAuth, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number is too long.')
], updateProfile);

router.put('/password', requireAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
], changePassword);

export default router;
