import express from 'express';
import { body, param } from 'express-validator';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  getUserTransactions,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(authenticate, authorize('admin'));

// Validation middleware
const validateUserCreate = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'operator', 'customer']).withMessage('Invalid role'),
];

const validateUserUpdate = [
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'operator', 'customer']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

// Routes
router
  .route('/')
  .get(getUsers)
  .post(validateUserCreate, createUser);

router
  .route('/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid user ID'),
    getUser
  )
  .put(
    param('id').isMongoId().withMessage('Invalid user ID'),
    ...validateUserUpdate,
    updateUser
  )
  .delete(
    param('id').isMongoId().withMessage('Invalid user ID'),
    deleteUser
  );

// Update user role
router.put(
  '/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['admin', 'operator', 'customer']).withMessage('Invalid role'),
  ],
  updateUserRole
);

// Update user status
router.put(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  updateUserStatus
);

// Get user transactions
router.get(
  '/:id/transactions',
  param('id').isMongoId().withMessage('Invalid user ID'),
  getUserTransactions
);

export default router;
