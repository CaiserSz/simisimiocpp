/**
 * Authentication Validation Schemas
 * 
 * Created: 2025-01-11
 * Purpose: Centralized validation for authentication endpoints
 */

import { body } from 'express-validator';
import { PASSWORD_REQUIREMENTS, USER_ROLES } from '../constants/user.constants.js';

/**
 * Registration validation schema
 */
export const validateRegistration = [
    body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),

    body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

    body('password')
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .withMessage('Password should contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),

    body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),

    body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
];

/**
 * Login validation schema
 */
export const validateLogin = [
    body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

    body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Update password validation schema
 */
export const validateUpdatePassword = [
    body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

    body('newPassword')
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`New password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .withMessage('New password should contain at least one uppercase letter, one lowercase letter, and one number')
];

/**
 * Update user details validation schema
 */
export const validateUpdateDetails = [
    body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

    body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),

    body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),

    body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number')
];

export default {
    validateRegistration,
    validateLogin,
    validateUpdatePassword,
    validateUpdateDetails
};