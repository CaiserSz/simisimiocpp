import { API_ERROR_CODES, HTTP_STATUS } from '../constants/api.constants.js';
import { PASSWORD_REQUIREMENTS, USER_ROLES } from '../constants/user.constants.js';
import userRepository from '../repositories/user.repository.js';
import logger from '../utils/logger.js';
import { error, forbidden, notFound, success, unauthorized, validationError } from '../utils/response.js';

/**
 * Lightweight Auth Controller for EV Station Simulator
 * Uses JSON-based user storage instead of MongoDB
 */

// Create and send token
const createSendToken = (user, statusCode, res) => {
    const token = userRepository.generateAuthToken(user);

    // Cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);
    return success(res, { user, token }, statusCode);
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register  
 * @access  Public
 */
export const register = async(req, res) => {
    try {
        const { username, email, password, role, ...userData } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return validationError(res, [], 'Username, email and password are required');
        }

        if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
            return validationError(res, [], `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`);
        }

        // Create new user
        const user = await userRepository.create({
            username,
            email,
            password,
            role: role || USER_ROLES.USER,
            ...userData
        });

        logger.info(`New user registered: ${username} (${email})`);
        createSendToken(user, 201, res);
    } catch (err) {
        logger.error('Registration error:', err);

        if (err.message && err.message.includes('already exists')) {
            return error(res, err.message, HTTP_STATUS.BAD_REQUEST, API_ERROR_CODES.CONFLICT_ERROR);
        }

        return error(res, 'Server error during registration', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return validationError(res, [], 'Please provide email and password');
        }

        // Find user by email
        const user = await userRepository.findByEmail(email);

        if (!user) {
            return unauthorized(res, 'Incorrect email or password');
        }

        // Check password
        const isMatch = await userRepository.comparePassword(user, password);
        if (!isMatch) {
            return unauthorized(res, 'Incorrect email or password');
        }

        // Check if user is active
        if (!user.isActive) {
            return forbidden(res, 'Account has been deactivated');
        }

        // Update last login
        await userRepository.updateLastLogin(user.id);

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;

        logger.info(`User logged in: ${user.username} (${user.email})`);
        createSendToken(userWithoutPassword, 200, res);
    } catch (err) {
        logger.error('Login error:', err);
        return error(res, 'Server error during login', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true
    });

    return success(res, { message: 'Successfully logged out' });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async(req, res) => {
    try {
        const user = await userRepository.findById(req.user.id);

        if (!user) {
            return notFound(res, 'User');
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return success(res, userWithoutPassword);
    } catch (err) {
        logger.error('Get current user error:', err);
        return error(res, 'Server error while fetching user data', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
export const updateDetails = async(req, res) => {
    try {
        const fieldsToUpdate = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(key =>
            fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

        const user = await userRepository.updateById(req.user.id, fieldsToUpdate);

        return success(res, user);
    } catch (err) {
        logger.error('Update user details error:', err);

        if (err.message && err.message.includes('already exists')) {
            return error(res, 'Email already exists', HTTP_STATUS.BAD_REQUEST, API_ERROR_CODES.CONFLICT_ERROR);
        }

        return error(res, 'Server error while updating user details', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
export const updatePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return validationError(res, [], 'Current password and new password are required');
        }

        if (newPassword.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
            return validationError(res, [], `New password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`);
        }

        const user = await userRepository.findById(req.user.id);

        // Check current password
        const isMatch = await userRepository.comparePassword(user, currentPassword);
        if (!isMatch) {
            return unauthorized(res, 'Current password is incorrect');
        }

        // Update password
        const updatedUser = await userRepository.updateById(req.user.id, {
            password: newPassword
        });

        createSendToken(updatedUser, HTTP_STATUS.OK, res);
    } catch (err) {
        logger.error('Update password error:', err);
        return error(res, 'Server error while updating password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin)
 */
export const getAllUsers = async(req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== USER_ROLES.ADMIN) {
            return forbidden(res, 'Access denied. Admin role required.');
        }

        const users = await userRepository.getAllUsers();

        return success(res, users, HTTP_STATUS.OK, { count: users.length });
    } catch (err) {
        logger.error('Get all users error:', err);
        return error(res, 'Server error while fetching users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Create user backup (admin only)
 * @route   POST /api/auth/backup
 * @access  Private (Admin)
 */
export const createBackup = async(req, res) => {
    try {
        if (req.user.role !== USER_ROLES.ADMIN) {
            return forbidden(res, 'Access denied. Admin role required.');
        }

        const backupFile = await userRepository.createBackup();

        return success(res, { backupFile, message: 'Backup created successfully' });
    } catch (err) {
        logger.error('Create backup error:', err);
        return error(res, 'Server error while creating backup', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Get system info
 * @route   GET /api/auth/info
 * @access  Public
 */
export const getSystemInfo = async(req, res) => {
    try {
        const health = await userRepository.healthCheck();

        return success(res, {
            systemType: 'EV Station Simulator',
            userStorage: 'JSON-based (lightweight)',
            ...health,
            defaultCredentials: process.env.NODE_ENV !== 'production' ? {
                admin: 'admin@simulator.local / admin123',
                operator: 'operator@simulator.local / operator123',
                viewer: 'viewer@simulator.local / viewer123'
            } : 'hidden'
        });
    } catch (err) {
        logger.error('Get system info error:', err);
        return error(res, 'Server error while fetching system info', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};