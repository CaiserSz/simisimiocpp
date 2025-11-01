import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.security.jwtSecret);
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Please authenticate again.'
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated. Please contact support.'
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please authenticate again.'
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication.'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Convert roles to array if it's a string
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has required role
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during authorization.'
      });
    }
  };
};

/**
 * Middleware to check if user has required permissions
 */
export const hasPermission = (permissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Convert permissions to array if it's a string
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        req.user.permissions && req.user.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: 'You do not have sufficient permissions to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during permission check.'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const hasAnyPermission = (permissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Convert permissions to array if it's a string
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        req.user.permissions && req.user.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'You do not have sufficient permissions to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during permission check.'
      });
    }
  };
};

/**
 * Middleware to check if the request is from an authenticated socket connection
 */
export const socketAuthenticate = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || 
                 socket.handshake.query?.token ||
                 (socket.handshake.headers.authorization || '').split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    // Attach user to socket for later use
    socket.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    return next(new Error('Authentication error: Invalid token'));
  }
};
