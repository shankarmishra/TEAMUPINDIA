const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const dbHandler = require('./setup');

let token;

beforeAll(async () => {
  await dbHandler.connect();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+1234567890',
          role: 'user'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).not.toHaveProperty('password');
      token = res.body.data.token;
    });

    test('should not register user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+1234567890',
          role: 'user'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+9876543210',
          role: 'user'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with correct credentials', async () => {
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+1234567890',
          role: 'user'
        });

      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).not.toHaveProperty('password');
      token = res.body.data.token;
    });

    test('should not login with incorrect password', async () => {
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+1234567890',
          role: 'user'
        });

      // Login with wrong password
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user profile', async () => {
      // Register user first
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          phone: '+1234567890',
          role: 'user'
        });

      token = registerRes.body.data.token;

      // Get profile
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).not.toHaveProperty('password');
    });

    test('should not access protected route without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No token, authorization denied');
    });
  });
}); 