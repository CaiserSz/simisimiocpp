import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository.js';
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
    // Skip authentication if disabled (for simple simulator usage)
    if (!config.security.enableAuth) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('🚨 SECURITY CRITICAL: Authentication disabled in production!');
        return res.status(500).json({
          success: false,
          error: 'Authentication cannot be disabled in production. Please enable authentication.'
        });
      }
      logger.warn('⚠️ Authentication disabled - development mode only');
      return next();
    }

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
      const user = await userRepository.findById(decoded.id);
      
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
      const { password: _password, ...userWithoutPassword } = user;
      
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
    // Skip authorization if authentication is disabled
    if (!config.security.enableAuth) {
      logger.debug('Authentication disabled - bypassing authorization check');
      return next();
    }

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
    if (!userRepository.hasPermission(req.user, permission)) {
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
        const user = await userRepository.findById(decoded.id);
        
        if (user && user.isActive) {
        const { password: _password, ...userWithoutPassword } = user;
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

/**
 * WebSocket authentication middleware
 */
export const socketAuthenticate = (socket, next) => {
  try {
    // Skip authentication if disabled
    if (!config.security.enableAuth) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('🚨 SECURITY CRITICAL: Authentication disabled in production!');
        return next(new Error('Authentication cannot be disabled in production'));
      }
      logger.warn('⚠️ Authentication disabled - development mode only');
      // Create a dummy user with limited permissions for development
      socket.user = { id: 'anonymous', username: 'anonymous', role: 'user' }; // Changed from 'admin' to 'user'
      return next();
    }

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
