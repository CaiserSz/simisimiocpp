import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

/**
 * User Repository - JSON-based User Storage
 * Repository pattern implementation for user data management
 * 
 * Created: 2025-01-11
 * Refactored from: services/SimpleUserStore.js
 * Purpose: Separate data access layer (Repository pattern)
 */
class UserRepository {
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
            logger.info(`✅ User Repository initialized with ${this.users.size} users`);
        } catch (error) {
            logger.error('Failed to initialize user repository:', error);
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

            logger.debug(`Loaded ${this.users.size} users from file`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('Users file not found, will create default users');
                this.users.clear();
            } else {
                throw error;
            }
        }
    }

    async saveUsers() {
        try {
            const usersArray = Array.from(this.users.values());
            await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2), 'utf8');
            logger.debug(`Saved ${this.users.size} users to file`);
        } catch (error) {
            logger.error('Failed to save users:', error);
            throw error;
        }
    }

    async createDefaultUsers() {
        const defaultUsers = [{
                id: 'admin',
                username: 'admin',
                email: 'admin@simulator.local',
                password: await bcrypt.hash('admin123', 10),
                role: 'admin',
                isActive: true,
                firstName: 'System',
                lastName: 'Administrator',
                permissions: ['*'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        for (const user of defaultUsers) {
            this.users.set(user.id, user);
        }

        await this.saveUsers();
        logger.info('🔑 Default users created: admin/admin123, operator/operator123, viewer/viewer123');
    }

    async findById(id) {
        await this.initialize();
        return this.users.get(id) || null;
    }

    async findByEmail(email) {
        await this.initialize();
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    async findByUsername(username) {
        await this.initialize();
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }

    async findAll() {
        await this.initialize();
        return Array.from(this.users.values());
    }

    async count() {
        await this.initialize();
        return this.users.size;
    }

    async comparePassword(user, candidatePassword) {
        return await bcrypt.compare(candidatePassword, user.password);
    }

    async updateLastLogin(id) {
        await this.initialize();
        const user = this.users.get(id);
        if (user) {
            user.lastLogin = new Date().toISOString();
            await this.saveUsers();
        }
    }

    async getAllUsers() {
        await this.initialize();
        return Array.from(this.users.values()).map(({ password: _password, ...user }) => user);
    }

    async updateById(id, updateData) {
        return this.update(id, updateData);
    }

    async createBackup() {
        await this.initialize();
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

    hasPermission(user, permission) {
        if (!user.permissions) return false;
        if (user.role === 'admin' || user.permissions.includes('*')) return true;
        return user.permissions.includes(permission);
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

    async create(userData) {
        await this.initialize();

        // Check if user exists
        const existingUser = await this.findByEmail(userData.email) || await this.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('User already exists with this email or username');
        }

        const id = userData.username || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const user = {
            id,
            username: userData.username,
            email: userData.email,
            password: await bcrypt.hash(userData.password, 10),
            role: userData.role || 'user',
            isActive: true,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            permissions: userData.permissions || this.getDefaultPermissions(userData.role || 'user'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.set(id, user);
        await this.saveUsers();

        // Return user without password
        const { password: _password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async update(id, updates) {
        await this.initialize();

        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Hash password if provided
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.users.set(id, updatedUser);
        await this.saveUsers();

        // Return user without password
        const { password: _password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    async delete(id) {
        await this.initialize();
        if (!this.users.has(id)) {
            throw new Error('User not found');
        }

        this.users.delete(id);
        await this.saveUsers();
        return true;
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
}

// Singleton instance
const userRepository = new UserRepository();

export default userRepository;
