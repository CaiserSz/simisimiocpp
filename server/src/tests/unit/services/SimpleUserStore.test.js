import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import SimpleUserStore from '../../../services/SimpleUserStore.js';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
// CRITICAL: These tests are now enabled by default for production readiness
// Set SKIP_FUNCTIONAL_TESTS=true to skip them (for quick checks only)
const skipFunctionalTests = process.env.SKIP_FUNCTIONAL_TESTS === 'true';
const describeOrSkip = skipFunctionalTests ? describe.skip : describe;

describeOrSkip('SimpleUserStore', () => {
    let userStore;
    let testDataDir;

    beforeAll(async() => {
        // Create test data directory
        testDataDir = path.join(__dirname, '../../../test-data');
        await fs.mkdir(testDataDir, { recursive: true });
    });

    beforeEach(async() => {
        // Create fresh instance for each test
        userStore = new SimpleUserStore();
        userStore.usersFile = path.join(testDataDir, 'test-users.json');
        userStore.users = new Map();
        userStore.initialized = false;

        // Clean up test file
        try {
            await fs.unlink(userStore.usersFile);
        } catch (error) {
            // File doesn't exist, ignore
        }
    });

    afterEach(async() => {
        // Clean up test files
        try {
            await fs.unlink(userStore.usersFile);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    afterAll(async() => {
        // Clean up test directory
        try {
            await fs.rmdir(testDataDir);
        } catch (error) {
            // Ignore if directory doesn't exist
        }
    });

    describe('Initialization', () => {
        test('should initialize with default users when no file exists', async() => {
            await userStore.initialize();

            expect(userStore.initialized).toBe(true);
            expect(userStore.users.size).toBe(3);
            expect(userStore.users.has('admin')).toBe(true);
            expect(userStore.users.has('operator')).toBe(true);
            expect(userStore.users.has('viewer')).toBe(true);
        });

        test('should load existing users from file', async() => {
            // Create test users file
            const testUsers = [{
                id: 'test1',
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'user'
            }];

            await fs.writeFile(userStore.usersFile, JSON.stringify(testUsers));
            await userStore.initialize();

            expect(userStore.users.size).toBe(1);
            expect(userStore.users.get('test1')).toEqual(testUsers[0]);
        });

        test('should handle corrupted users file gracefully', async() => {
            // Create corrupted file
            await fs.writeFile(userStore.usersFile, 'invalid json');

            await userStore.initialize();

            // Should initialize with default users
            expect(userStore.users.size).toBe(3);
        });
    });

    describe('User Management', () => {
        beforeEach(async() => {
            await userStore.initialize();
        });

        test('should create new user', async() => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123',
                role: 'user'
            };

            const user = await userStore.create(userData);

            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.role).toBe(userData.role);
            expect(user.password).toBeUndefined(); // Should not return password
            expect(user.id).toBeDefined();
            expect(user.createdAt).toBeDefined();
        });

        test('should prevent duplicate email registration', async() => {
            const userData = {
                username: 'user1',
                email: 'admin@simulator.local', // Same as default admin
                password: 'password123'
            };

            await expect(userStore.create(userData)).rejects.toThrow('User already exists');
        });

        test('should prevent duplicate username registration', async() => {
            const userData = {
                username: 'admin', // Same as default admin
                email: 'different@example.com',
                password: 'password123'
            };

            await expect(userStore.create(userData)).rejects.toThrow('User already exists');
        });

        test('should find user by email', async() => {
            const user = await userStore.findByEmail('admin@simulator.local');

            expect(user).toBeDefined();
            expect(user.email).toBe('admin@simulator.local');
            expect(user.role).toBe('admin');
        });

        test('should find user by ID', async() => {
            const user = await userStore.findById('admin');

            expect(user).toBeDefined();
            expect(user.id).toBe('admin');
            expect(user.username).toBe('admin');
        });

        test('should find user by username', async() => {
            const user = await userStore.findByUsername('admin');

            expect(user).toBeDefined();
            expect(user.username).toBe('admin');
        });

        test('should update user by ID', async() => {
            const updates = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const updatedUser = await userStore.updateById('admin', updates);

            expect(updatedUser.firstName).toBe('Updated');
            expect(updatedUser.lastName).toBe('Name');
            expect(updatedUser.updatedAt).toBeDefined();
        });

        test('should update user password and hash it', async() => {
            const newPassword = 'newpassword123';

            const updatedUser = await userStore.updateById('admin', { password: newPassword });

            // Password should be hashed
            expect(updatedUser.password).not.toBe(newPassword);
            expect(updatedUser.password).toBeDefined();

            // Should be able to compare password
            const user = await userStore.findById('admin');
            const isMatch = await userStore.comparePassword(user, newPassword);
            expect(isMatch).toBe(true);
        });

        test('should update last login timestamp', async() => {
            await userStore.updateLastLogin('admin');

            const user = await userStore.findById('admin');
            expect(user.lastLogin).toBeDefined();
        });

        test('should get all users without passwords', async() => {
            const users = await userStore.getAllUsers();

            expect(users).toHaveLength(3);
            users.forEach(user => {
                expect(user.password).toBeUndefined();
            });
        });
    });

    describe('Authentication', () => {
        beforeEach(async() => {
            await userStore.initialize();
        });

        test('should compare passwords correctly', async() => {
            const user = await userStore.findById('admin');

            const correctMatch = await userStore.comparePassword(user, 'admin123');
            const incorrectMatch = await userStore.comparePassword(user, 'wrongpassword');

            expect(correctMatch).toBe(true);
            expect(incorrectMatch).toBe(false);
        });

        test('should generate valid JWT token', () => {
            const user = { id: 'test', username: 'test', email: 'test@example.com', role: 'user' };

            const token = userStore.generateAuthToken(user);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format
        });

        test('should check user permissions', () => {
            const adminUser = { role: 'admin', permissions: ['*'] };
            const operatorUser = { role: 'operator', permissions: ['stations:read', 'stations:write'] };
            const regularUser = { role: 'user', permissions: ['stations:read'] };

            expect(userStore.hasPermission(adminUser, 'anything')).toBe(true);
            expect(userStore.hasPermission(operatorUser, 'stations:write')).toBe(true);
            expect(userStore.hasPermission(operatorUser, 'admin:delete')).toBe(false);
            expect(userStore.hasPermission(regularUser, 'stations:read')).toBe(true);
            expect(userStore.hasPermission(regularUser, 'stations:write')).toBe(false);
        });

        test('should get default permissions for roles', () => {
            const adminPerms = userStore.getDefaultPermissions('admin');
            const operatorPerms = userStore.getDefaultPermissions('operator');
            const userPerms = userStore.getDefaultPermissions('user');

            expect(adminPerms).toContain('*');
            expect(operatorPerms).toContain('stations:read');
            expect(operatorPerms).toContain('stations:write');
            expect(userPerms).toContain('stations:read');
            expect(userPerms).not.toContain('stations:write');
        });
    });

    describe('File Operations', () => {
        beforeEach(async() => {
            await userStore.initialize();
        });

        test('should save users to file', async() => {
            await userStore.saveUsers();

            const fileContent = await fs.readFile(userStore.usersFile, 'utf8');
            const users = JSON.parse(fileContent);

            expect(Array.isArray(users)).toBe(true);
            expect(users).toHaveLength(3);
        });

        test('should create backup file', async() => {
            const backupFile = await userStore.createBackup();

            expect(backupFile).toBeDefined();
            expect(backupFile).toContain('backup');

            // Verify backup file exists
            const backupExists = await fs.access(backupFile).then(() => true).catch(() => false);
            expect(backupExists).toBe(true);

            // Clean up backup
            await fs.unlink(backupFile);
        });

        test('should perform health check', async() => {
            const health = await userStore.healthCheck();

            expect(health.status).toBe('healthy');
            expect(health.userCount).toBe(3);
            expect(health.storageType).toBe('json-file');
            expect(health.dataFile).toBe(userStore.usersFile);
        });

        test('should handle file system errors in health check', async() => {
            // Make users file unreadable
            userStore.usersFile = '/invalid/path/users.json';

            const health = await userStore.healthCheck();

            expect(health.status).toBe('unhealthy');
            expect(health.error).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        beforeEach(async() => {
            await userStore.initialize();
        });

        test('should handle missing user in findById', async() => {
            const user = await userStore.findById('nonexistent');
            expect(user).toBeUndefined();
        });

        test('should handle missing user in findByEmail', async() => {
            const user = await userStore.findByEmail('nonexistent@example.com');
            expect(user).toBeUndefined();
        });

        test('should handle missing user in updateById', async() => {
            await expect(userStore.updateById('nonexistent', { firstName: 'Test' }))
                .rejects.toThrow('User not found');
        });

        test('should handle invalid user data in create', async() => {
            const invalidData = {
                // Missing required fields
                role: 'user'
            };

            await expect(userStore.create(invalidData)).rejects.toThrow();
        });
    });
});
