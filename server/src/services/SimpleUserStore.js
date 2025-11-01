import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple JSON-based User Store for EV Station Simulator
 * Perfect for lightweight testing and development - no MongoDB needed!
 */
class SimpleUserStore {
  constructor() {
    this.usersFile = path.join(__dirname, '../data/users.json');
    this.users = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.usersFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing users or create default
      await this.loadUsers();
      
      // Create default admin if no users exist
      if (this.users.size === 0) {
        await this.createDefaultUsers();
      }

      this.initialized = true;
      logger.info(`✅ Simple User Store initialized with ${this.users.size} users`);
    } catch (error) {
      logger.error('Failed to initialize user store:', error);
      throw error;
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf8');
      const usersArray = JSON.parse(data);
      
      this.users.clear();
      usersArray.forEach(user => {
        this.users.set(user.id, user);
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error loading users:', error);
      }
      // File doesn't exist, start with empty users
    }
  }

  async saveUsers() {
    try {
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      logger.error('Error saving users:', error);
      throw error;
    }
  }

  async createDefaultUsers() {
    const defaultUsers = [
      {
        id: 'admin',
        username: 'admin',
        email: 'admin@simulator.local',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isActive: true,
        firstName: 'System',
        lastName: 'Administrator',
        permissions: ['*'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'operator',
        username: 'operator',
        email: 'operator@simulator.local',
        password: await bcrypt.hash('operator123', 10),
        role: 'operator',
        isActive: true,
        firstName: 'Operator',
        lastName: 'User',
        permissions: ['stations:read', 'stations:write', 'transactions:read'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'viewer',
        username: 'viewer',
        email: 'viewer@simulator.local',
        password: await bcrypt.hash('viewer123', 10),
        role: 'user',
        isActive: true,
        firstName: 'Viewer',
        lastName: 'User',
        permissions: ['stations:read', 'transactions:read'],
        createdAt: new Date().toISOString()
      }
    ];

    for (const user of defaultUsers) {
      this.users.set(user.id, user);
    }

    await this.saveUsers();
    logger.info('🔑 Default users created: admin/admin123, operator/operator123, viewer/viewer123');
  }

  // User CRUD operations
  async findByEmail(email) {
    await this.initialize();
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async findById(id) {
    await this.initialize();
    return this.users.get(id);
  }

  async findByUsername(username) {
    await this.initialize();
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async create(userData) {
    await this.initialize();
    
    // Check if user exists
    const existingUser = await this.findByEmail(userData.email) || await this.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    const user = {
      id: userData.username || `user_${Date.now()}`,
      username: userData.username,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 10),
      role: userData.role || 'user',
      isActive: true,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      permissions: userData.permissions || this.getDefaultPermissions(userData.role || 'user'),
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    this.users.set(user.id, user);
    await this.saveUsers();
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateById(id, updateData) {
    await this.initialize();
    
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update user
    const updatedUser = { ...user, ...updateData, updatedAt: new Date().toISOString() };
    this.users.set(id, updatedUser);
    await this.saveUsers();

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateLastLogin(id) {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date().toISOString();
      await this.saveUsers();
    }
  }

  async comparePassword(user, candidatePassword) {
    return await bcrypt.compare(candidatePassword, user.password);
  }

  generateAuthToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };
    
    return jwt.sign(payload, config.security.jwtSecret, {
      expiresIn: config.security.jwtExpiresIn || '24h'
    });
  }

  getDefaultPermissions(role) {
    const permissions = {
      admin: ['*'],
      operator: ['stations:read', 'stations:write', 'transactions:read', 'settings:read'],
      user: ['stations:read', 'transactions:read'],
      guest: ['stations:read']
    };
    return permissions[role] || permissions.guest;
  }

  hasPermission(user, permission) {
    if (!user.permissions) return false;
    if (user.role === 'admin' || user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }

  // Get all users (without passwords)
  async getAllUsers() {
    await this.initialize();
    return Array.from(this.users.values()).map(({ password, ...user }) => user);
  }

  // Health check
  async healthCheck() {
    try {
      await this.initialize();
      return {
        status: 'healthy',
        userCount: this.users.size,
        storageType: 'json-file',
        dataFile: this.usersFile
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Backup users
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = this.usersFile.replace('.json', `_backup_${timestamp}.json`);
    
    try {
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(backupFile, JSON.stringify(usersArray, null, 2));
      logger.info(`✅ User backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      logger.error('Error creating user backup:', error);
      throw error;
    }
  }
}

export default new SimpleUserStore();
