import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock configuration and repositories BEFORE importing controller
const mockConfig = {
    security: {
        enableAuth: true,
        jwtSecret: 'test-secret',
        passwordSaltRounds: 10,
        jwtExpiresIn: '24h',
        jwtCookieExpiresIn: 1
    }
};

const mockUserRepository = {
    initialize: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    updateLastLogin: jest.fn(),
    comparePassword: jest.fn(),
    generateAuthToken: jest.fn(),
    getAllUsers: jest.fn(),
    createBackup: jest.fn(),
    healthCheck: jest.fn()
};

jest.unstable_mockModule('../../../config/config.js', () => ({
    default: mockConfig
}));

jest.unstable_mockModule('../../../repositories/user.repository.js', () => ({
    default: mockUserRepository
}));

// Import controller after mocks are defined
const authController = await import('../../../controllers/auth.controller.js');

const app = express();
app.use(express.json());

// Setup routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.get('/logout', authController.logout);
app.get('/me', authController.getMe);
app.put('/updatedetails', authController.updateDetails);
app.put('/updatepassword', authController.updatePassword);
app.get('/users', authController.getAllUsers);
app.post('/backup', authController.createBackup);
app.get('/info', authController.getSystemInfo);
app.get('/session', (req, res, next) => {
    if (req.headers['x-test-user']) {
        try {
            req.user = JSON.parse(req.headers['x-test-user']);
        } catch {
            // ignore malformed test payloads
        }
    }
    next();
}, authController.getSession);

describe('Auth Controller (JSON Storage)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset all mock functions
        Object.values(mockUserRepository).forEach(fn => {
            if (jest.isMockFunction(fn)) {
                fn.mockClear();
            }
        });
        mockConfig.security.enableAuth = true;
    });

    describe('POST /register', () => {
        test('should register new user successfully', async() => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            const mockUser = {
                id: 'testuser',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                firstName: 'Test',
                lastName: 'User',
                createdAt: '2025-11-01T12:00:00.000Z'
            };

            mockUserRepository.create.mockResolvedValue(mockUser);
            mockUserRepository.generateAuthToken.mockReturnValue('mock.jwt.token');

            const response = await request(app)
                .post('/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBe('mock.jwt.token');
            expect(response.body.data.user).toEqual(mockUser);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: 'user',
                firstName: userData.firstName,
                lastName: userData.lastName
            });
        });

        test('should validate required fields', async() => {
            const invalidData = {
                email: 'test@example.com'
                    // Missing username and password
            };

            const response = await request(app)
                .post('/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Username, email and password are required');
        });

        test('should validate password length', async() => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: '123' // Too short
            };

            const response = await request(app)
                .post('/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Password must be at least 6 characters');
        });

        test('should handle duplicate user error', async() => {
            const userData = {
                username: 'existing',
                email: 'existing@example.com',
                password: 'password123'
            };

            mockUserRepository.create.mockRejectedValue(new Error('User already exists with this email or username'));

            const response = await request(app)
                .post('/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('already exists');
        });
    });

    describe('POST /login', () => {
        test('should login user successfully', async() => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 'testuser',
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'user',
                isActive: true
            };

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockUserRepository.comparePassword.mockResolvedValue(true);
            mockUserRepository.updateLastLogin.mockResolvedValue();
            mockUserRepository.generateAuthToken.mockReturnValue('mock.jwt.token');

            const response = await request(app)
                .post('/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBe('mock.jwt.token');
            expect(response.body.data.user.password).toBeUndefined();
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
            expect(mockUserRepository.comparePassword).toHaveBeenCalledWith(mockUser, loginData.password);
            expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
        });

        test('should validate required fields', async() => {
            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com' }) // Missing password
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Please provide email and password');
        });

        test('should handle non-existent user', async() => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Incorrect email or password');
        });

        test('should handle incorrect password', async() => {
            const mockUser = {
                id: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                isActive: true
            };

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockUserRepository.comparePassword.mockResolvedValue(false);

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Incorrect email or password');
        });

        test('should handle inactive user', async() => {
            const mockUser = {
                id: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                isActive: false
            };

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockUserRepository.comparePassword.mockResolvedValue(true);

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password123' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Account has been deactivated');
        });
    });

    describe('GET /logout', () => {
        test('should logout user successfully', async() => {
            const response = await request(app)
                .get('/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
            const message = (response.body.data && response.body.data.message) || response.body.message || '';
            expect(message).toContain('Successfully logged out');
        });
    });

    describe('GET /me', () => {
        test('should get current user successfully', async() => {
            const mockUser = {
                id: 'testuser',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                password: 'hashedpassword'
            };

            // Mock authenticated request
            const req = { user: { id: 'testuser' } };
            mockUserRepository.findById.mockResolvedValue(mockUser);

            // Create custom app for this test with req.user
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.get('/me', authController.getMe);

            const response = await request(testApp)
                .get('/me')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.password).toBeUndefined();
            expect(response.body.data.username).toBe('testuser');
        });

        test('should handle user not found', async() => {
            mockUserRepository.findById.mockResolvedValue(null);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'nonexistent' };
                next();
            });
            testApp.get('/me', authController.getMe);

            const response = await request(testApp)
                .get('/me')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('User not found');
        });
    });

    describe('PUT /updatedetails', () => {
        test('should update user details successfully', async() => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                email: 'updated@example.com'
            };

            const updatedUser = {
                id: 'testuser',
                ...updateData,
                username: 'testuser'
            };

            mockUserRepository.updateById.mockResolvedValue(updatedUser);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatedetails', authController.updateDetails);

            const response = await request(testApp)
                .put('/updatedetails')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(updatedUser);
            expect(mockUserRepository.updateById).toHaveBeenCalledWith('testuser', updateData);
        });

        test('should handle duplicate email error', async() => {
            mockUserRepository.updateById.mockRejectedValue(new Error('Email already exists'));

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatedetails', authController.updateDetails);

            const response = await request(testApp)
                .put('/updatedetails')
                .send({ email: 'existing@example.com' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Email already exists');
        });
    });

    describe('PUT /updatepassword', () => {
        test('should update password successfully', async() => {
            const passwordData = {
                currentPassword: 'oldpassword',
                newPassword: 'newpassword123'
            };

            const mockUser = {
                id: 'testuser',
                password: 'hashedoldpassword'
            };

            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRepository.comparePassword.mockResolvedValue(true);
            mockUserRepository.updateById.mockResolvedValue({...mockUser, password: 'hashednewpassword' });
            mockUserRepository.generateAuthToken.mockReturnValue('new.jwt.token');

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatepassword', authController.updatePassword);

            const response = await request(testApp)
                .put('/updatepassword')
                .send(passwordData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBe('new.jwt.token');
            expect(mockUserRepository.comparePassword).toHaveBeenCalledWith(mockUser, passwordData.currentPassword);
            expect(mockUserRepository.updateById).toHaveBeenCalledWith('testuser', { password: passwordData.newPassword });
        });

        test('should validate required fields', async() => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatepassword', authController.updatePassword);

            const response = await request(testApp)
                .put('/updatepassword')
                .send({ currentPassword: 'oldpassword' }) // Missing newPassword
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Current password and new password are required');
        });

        test('should validate password length', async() => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatepassword', authController.updatePassword);

            const response = await request(testApp)
                .put('/updatepassword')
                .send({
                    currentPassword: 'oldpassword',
                    newPassword: '123' // Too short
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('New password must be at least 6 characters');
        });

        test('should handle incorrect current password', async() => {
            const mockUser = { id: 'testuser', password: 'hashedpassword' };
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRepository.comparePassword.mockResolvedValue(false);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'testuser' };
                next();
            });
            testApp.put('/updatepassword', authController.updatePassword);

            const response = await request(testApp)
                .put('/updatepassword')
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Current password is incorrect');
        });
    });

    describe('GET /users', () => {
        test('should get all users for admin', async() => {
            const mockUsers = [
                { id: 'user1', username: 'user1', role: 'user' },
                { id: 'user2', username: 'user2', role: 'operator' }
            ];

            mockUserRepository.getAllUsers.mockResolvedValue(mockUsers);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'admin', role: 'admin' };
                next();
            });
            testApp.get('/users', authController.getAllUsers);

            const response = await request(testApp)
                .get('/users')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta.count).toBe(2);
            expect(response.body.data).toEqual(mockUsers);
        });

        test('should deny access to non-admin', async() => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'user', role: 'user' };
                next();
            });
            testApp.get('/users', authController.getAllUsers);

            const response = await request(testApp)
                .get('/users')
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Admin role required');
        });
    });

    describe('POST /backup', () => {
        test('should create backup for admin', async() => {
            const backupFile = '/path/to/backup.json';
            mockUserRepository.createBackup.mockResolvedValue(backupFile);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'admin', role: 'admin' };
                next();
            });
            testApp.post('/backup', authController.createBackup);

            const response = await request(testApp)
                .post('/backup')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.backupFile).toBe(backupFile);
            expect(response.body.data.message).toContain('Backup created successfully');
        });

        test('should deny access to non-admin', async() => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 'user', role: 'user' };
                next();
            });
            testApp.post('/backup', authController.createBackup);

            const response = await request(testApp)
                .post('/backup')
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message || response.body.error).toContain('Admin role required');
        });
    });

    describe('GET /info', () => {
        test('should get system info', async() => {
            const healthData = {
                status: 'healthy',
                userCount: 3,
                storageType: 'json-file'
            };

            mockUserRepository.healthCheck.mockResolvedValue(healthData);

            const response = await request(app)
                .get('/info')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.systemType).toBe('EV Station Simulator');
            expect(response.body.data.userStorage).toBe('JSON-based (lightweight)');
            expect(response.body.data.status).toBe('healthy');
        });

        test('should include default credentials in development', async() => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            mockUserRepository.healthCheck.mockResolvedValue({ status: 'healthy' });

            const response = await request(app)
                .get('/info')
                .expect(200);

            expect(response.body.data.defaultCredentials).toBeDefined();
            expect(response.body.data.defaultCredentials.admin).toContain('admin@simulator.local');

            process.env.NODE_ENV = originalEnv;
        });

        test('should hide default credentials in production', async() => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            mockUserRepository.healthCheck.mockResolvedValue({ status: 'healthy' });

            const response = await request(app)
                .get('/info')
                .expect(200);

            expect(response.body.data.defaultCredentials).toBe('hidden');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('GET /session', () => {
        test('should report authenticated demo session when auth disabled', async() => {
            mockConfig.security.enableAuth = false;

            const response = await request(app)
                .get('/session')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.authEnabled).toBe(false);
            expect(response.body.data.authenticated).toBe(true);
            expect(response.body.data.user).toMatchObject({
                role: 'admin',
                username: 'Development Mode'
            });
        });

        test('should return unauthenticated state when auth enabled without user', async() => {
            mockConfig.security.enableAuth = true;

            const response = await request(app)
                .get('/session')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.authEnabled).toBe(true);
            expect(response.body.data.authenticated).toBe(false);
            expect(response.body.data.user).toBeUndefined();
        });

        test('should sanitize user object when authenticated', async() => {
            mockConfig.security.enableAuth = true;

            const mockUser = {
                id: 'user-123',
                username: 'operator',
                email: 'operator@example.com',
                role: 'operator',
                password: 'secret'
            };

            const response = await request(app)
                .get('/session')
                .set('x-test-user', JSON.stringify(mockUser))
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.authEnabled).toBe(true);
            expect(response.body.data.authenticated).toBe(true);
            expect(response.body.data.user).toMatchObject({
                id: 'user-123',
                username: 'operator',
                email: 'operator@example.com',
                role: 'operator'
            });
            expect(response.body.data.user.password).toBeUndefined();
        });
    });
});
