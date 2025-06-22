const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Team = require('../models/team.model');
const User = require('../models/user.model');
const dbHandler = require('./setup');

let token;
let teamId;
let userId;

beforeAll(async () => {
  await dbHandler.connect();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();

  // Create a test user and get token
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@123',
      phone: '+1234567890',
      role: 'user'
    });

  token = userRes.body.token;
  userId = userRes.body.user._id;

  // Create a test team
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Team',
      sport: 'cricket',
      maxPlayers: 11,
      description: 'Test team description'
    });

  teamId = teamRes.body.data._id;
});

describe('Team API', () => {
  describe('POST /api/teams', () => {
    test('should create a new team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Team',
          sport: 'football',
          maxPlayers: 11,
          description: 'New team description'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'New Team');
      expect(res.body.data).toHaveProperty('sport', 'football');
      expect(res.body.data.captain).toBe(userId);
    });

    test('should not create team without auth token', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          name: 'New Team',
          sport: 'football',
          maxPlayers: 11,
          description: 'New team description'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/teams', () => {
    test('should get all teams', async () => {
      const res = await request(app)
        .get('/api/teams');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    test('should filter teams by sport', async () => {
      // Create another team with different sport
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Football Team',
          sport: 'football',
          maxPlayers: 11,
          description: 'Football team description'
        });

      const res = await request(app)
        .get('/api/teams')
        .query({ sport: 'cricket' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].sport).toBe('cricket');
    });
  });

  describe('POST /api/teams/:id/players', () => {
    test('should add player to team', async () => {
      // Create another user to add as player
      const playerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Player User',
          email: 'player@example.com',
          password: 'Player@123',
          phone: '+9876543210',
          role: 'user'
        });

      const playerId = playerRes.body.user._id;

      const res = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: playerId,
          role: 'batsman'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.players).toContainEqual(expect.objectContaining({
        user: playerId,
        role: 'batsman'
      }));
    });

    test('should not add player if team is full', async () => {
      // Create a team with maxPlayers = 1 (captain only)
      const smallTeamRes = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Small Team',
          sport: 'cricket',
          maxPlayers: 1,
          description: 'Small team description'
        });

      const smallTeamId = smallTeamRes.body.data._id;

      // Create another user to add as player
      const playerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Player User',
          email: 'player@example.com',
          password: 'Player@123',
          phone: '+9876543210',
          role: 'user'
        });

      const playerId = playerRes.body.user._id;

      const res = await request(app)
        .post(`/api/teams/${smallTeamId}/players`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: playerId,
          role: 'batsman'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/team is full/i);
    });
  });
}); 