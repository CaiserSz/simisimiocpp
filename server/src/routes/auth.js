import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Validation middleware
const validateRegistration = [
    body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
    body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
    body('role')
    .optional()
    .isIn(['admin', 'operator', 'user', 'guest'])
    .withMessage('Invalid role')
];

const validateLogin = [
    body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordUpdate = [
    body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Creates a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, operator, user, guest]
 *                 example: user
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/register', validateRegistration, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/login', validateLogin, authController.login);
router.get('/logout', authController.logout);
router.get('/info', authController.getSystemInfo);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Returns information about the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, authController.getMe);
router.put('/updatedetails', authenticate, authController.updateDetails);
router.put('/updatepassword', authenticate, validatePasswordUpdate, authController.updatePassword);

// Admin only routes
router.get('/users', authenticate, authorize(['admin']), authController.getAllUsers);
router.post('/backup', authenticate, authorize(['admin']), authController.createBackup);

export default router;