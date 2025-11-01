import crypto from 'crypto';
import userStore from '../services/SimpleUserStore.js';
import logger from '../utils/logger.js';

/**
 * Lightweight Auth Controller for EV Station Simulator
 * Uses JSON-based user storage instead of MongoDB
 */

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = userStore.generateAuthToken(user);
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(statusCode).json({
    success: true,
    token,
    data: { user }
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register  
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, role, ...userData } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    
    // Create new user
    const user = await userStore.create({
      username,
      email,
      password,
      role: role || 'user',
      ...userData
    });
    
    logger.info(`New user registered: ${username} (${email})`);
    createSendToken(user, 201, res);
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }
    
    // Find user by email
    const user = await userStore.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect email or password'
      });
    }
    
    // Check password
    const isMatch = await userStore.comparePassword(user, password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect email or password'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }
    
    // Update last login
    await userStore.updateLastLogin(user.id);
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    logger.info(`User logged in: ${user.username} (${user.email})`);
    createSendToken(userWithoutPassword, 200, res);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
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
  
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await userStore.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user data'
    });
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
export const updateDetails = async (req, res) => {
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
    
    const user = await userStore.updateById(req.user.id, fieldsToUpdate);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update user details error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating user details'
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }
    
    const user = await userStore.findById(req.user.id);
    
    // Check current password
    const isMatch = await userStore.comparePassword(user, currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    const updatedUser = await userStore.updateById(req.user.id, {
      password: newPassword
    });
    
    createSendToken(updatedUser, 200, res);
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating password'
    });
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const users = await userStore.getAllUsers();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

/**
 * @desc    Create user backup (admin only)
 * @route   POST /api/auth/backup
 * @access  Private (Admin)
 */
export const createBackup = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const backupFile = await userStore.createBackup();
    
    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backupFile
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating backup'
    });
  }
};

/**
 * @desc    Get system info
 * @route   GET /api/auth/info
 * @access  Public
 */
export const getSystemInfo = async (req, res) => {
  try {
    const health = await userStore.healthCheck();
    
    res.status(200).json({
      success: true,
      data: {
        systemType: 'EV Station Simulator',
        userStorage: 'JSON-based (lightweight)',
        ...health,
        defaultCredentials: process.env.NODE_ENV !== 'production' ? {
          admin: 'admin@simulator.local / admin123',
          operator: 'operator@simulator.local / operator123', 
          viewer: 'viewer@simulator.local / viewer123'
        } : 'hidden'
      }
    });
  } catch (error) {
    logger.error('Get system info error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching system info'
    });
  }
};
