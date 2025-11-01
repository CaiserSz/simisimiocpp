import jwt from 'jsonwebtoken';
import userStore from '../services/SimpleUserStore.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Lightweight Auth Middleware for EV Station Simulator
 * Uses SimpleUserStore instead of MongoDB
 */

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
      const user = await userStore.findById(decoded.id);
      
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
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      // Add user to request object
      req.user = userWithoutPassword;
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
 * Middleware to check user permissions
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this resource.'
      });
    }

    // Check if user has required role
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check specific permissions
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this resource.'
      });
    }

    // Check if user has required permission
    if (!userStore.hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, config.security.jwtSecret);
        const user = await userStore.findById(decoded.id);
        
        if (user && user.isActive) {
          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        logger.debug('Optional auth failed:', error.message);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next(); // Continue anyway for optional auth
  }
};
