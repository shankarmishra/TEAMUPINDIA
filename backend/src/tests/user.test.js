const request = require('supertest');
const app = require('../app');
const dbHandler = require('./setup');

beforeAll(async () => {
  await dbHandler.connect();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();
});

describe('User API', () => {
  let authToken;
  let adminToken;

  beforeEach(async () => {
    // Create a regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        phone: '+1234567890',
        role: 'user'
      });

    authToken = userRes.body.token;

    // Create an admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123',
        phone: '+1234567891',
        role: 'admin'
      });

    adminToken = adminRes.body.token;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not get profile without auth token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Not authorized to access this route');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+1234567892'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('email', 'updated@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not update profile without auth token', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+1234567892'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Not authorized to access this route');
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password', async () => {
      await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test@123',
          newPassword: 'NewTest@123'
        })
        .expect(200);
    });

    it('should fail with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest@123'
        })
        .expect(400);

      expect(res.body.message).toBe('Current password is incorrect');
    });
  });

  describe('Admin Routes', () => {
    it('should get all users (admin only)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2); // Admin + Test User
    });

    it('should update user role (admin only)', async () => {
      const res = await request(app)
        .put('/api/users/undefined/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'coach' })
        .expect(200);

      expect(res.body.role).toBe('coach');
    });

    it('should not allow non-admin to update roles', async () => {
      await request(app)
        .put('/api/users/undefined/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });
  });
}); 