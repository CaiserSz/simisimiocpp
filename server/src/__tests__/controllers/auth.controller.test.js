import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { register, login, logout, getMe, forgotPassword, resetPassword } from '../../controllers/auth.controller.js';
import config from '../../config/config.js';

// Create test app
const app = express();
app.use(express.json());

// Mount auth routes
app.post('/register', register);
app.post('/login', login);
app.get('/logout', logout);
app.get('/me', getMe);
app.post('/forgot-password', forgotPassword);
app.put('/reset-password/:resettoken', resetPassword);

describe('Auth Controller', () => {
  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      const userData = global.testUtils.createTestUser();
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      
      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
    });

    test('should not register user with existing email', async () => {
      const userData = global.testUtils.createTestUser();
      
      // Create user first
      await User.create(userData);
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    test('should not register user with invalid data', async () => {
      const invalidData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123' // Too weak
      };
      
      const response = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    let testUser;

    beforeEach(async () => {
      const userData = global.testUtils.createTestUser();
      testUser = await User.create(userData);
    });

    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      // Verify JWT token
      const decoded = jwt.verify(response.body.token, config.security.jwtSecret);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Incorrect');
    });

    test('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should not login inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('deactivated');
    });

    test('should update last login timestamp', async () => {
      const oldLastLogin = testUser.lastLogin;
      
      await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
      if (oldLastLogin) {
        expect(updatedUser.lastLogin.getTime()).toBeGreaterThan(oldLastLogin.getTime());
      }
    });
  });

  describe('GET /logout', () => {
    test('should logout user', async () => {
      const response = await request(app)
        .get('/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });
  });

  describe('POST /forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      const userData = global.testUtils.createTestUser();
      testUser = await User.create(userData);
    });

    test('should generate password reset token', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Token sent');

      // Verify reset token was set
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpire).toBeDefined();
    });

    test('should not generate token for non-existent user', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No user found');
    });
  });

  describe('PUT /reset-password/:resettoken', () => {
    let testUser, resetToken;

    beforeEach(async () => {
      const userData = global.testUtils.createTestUser();
      testUser = await User.create(userData);
      
      // Generate reset token
      resetToken = testUser.generatePasswordResetToken();
      await testUser.save();
    });

    test('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .put(`/reset-password/${resetToken}`)
        .send({ password: newPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id);
      const isMatch = await updatedUser.comparePassword(newPassword);
      expect(isMatch).toBe(true);

      // Verify reset token was cleared
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpire).toBeUndefined();
    });

    test('should not reset password with invalid token', async () => {
      const response = await request(app)
        .put('/reset-password/invalid-token')
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    test('should not reset password with expired token', async () => {
      // Set token to expired
      testUser.resetPasswordExpire = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await testUser.save();

      const response = await request(app)
        .put(`/reset-password/${resetToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expired');
    });
  });
});
