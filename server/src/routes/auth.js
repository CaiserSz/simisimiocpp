import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    validateLogin,
    validateRegistration,
    validateUpdateDetails,
    validateUpdatePassword
} from '../validators/auth.validator.js';
import { checkValidation } from '../validators/common.validator.js';

const router = Router();

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
router.post('/register', validateRegistration, checkValidation, authController.register);

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
router.post('/login', validateLogin, checkValidation, authController.login);
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
router.put('/updatedetails', authenticate, validateUpdateDetails, checkValidation, authController.updateDetails);
router.put('/updatepassword', authenticate, validateUpdatePassword, checkValidation, authController.updatePassword);

// Admin only routes
router.get('/users', authenticate, authorize([USER_ROLES.ADMIN]), authController.getAllUsers);
router.post('/backup', authenticate, authorize([USER_ROLES.ADMIN]), authController.createBackup);

export default router;