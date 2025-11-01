import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required'),
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Please include a valid email'),
];

const validateResetPassword = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const validateUpdatePassword = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgotpassword', validateForgotPassword, forgotPassword);
router.put('/resetpassword/:resettoken', validateResetPassword, resetPassword);
router.get('/verifyemail/:token', verifyEmail);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', validateUpdatePassword, updatePassword);
router.get('/logout', logout);

export default router;
