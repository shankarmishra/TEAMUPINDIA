const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Tournament = require('../models/tournament.model');
const Team = require('../models/team.model');
const User = require('../models/user.model');
const dbHandler = require('./setup');

let adminToken;
let userToken;
let teamId;
let tournamentId;
let userId;

beforeAll(async () => {
  await dbHandler.connect();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();

  // Create admin user
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      phone: '+1234567890',
      role: 'admin'
    });

  adminToken = adminRes.body.token;

  // Create regular user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'user@example.com',
      password: 'User@123',
      phone: '+9876543210',
      role: 'user'
    });

  userToken = userRes.body.token;
  userId = userRes.body.user._id;

  // Create a team
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Test Team',
      sport: 'cricket',
      maxPlayers: 11,
      description: 'Test team description'
    });

  teamId = teamRes.body.data._id;

  // Create a tournament
  const tournamentRes = await request(app)
    .post('/api/tournaments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Tournament',
      sport: 'cricket',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      venue: 'Test Venue',
      maxTeams: 8,
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });

  tournamentId = tournamentRes.body.data._id;
});

describe('Tournament API', () => {
  describe('POST /api/tournaments', () => {
    test('should create tournament when user is organizer', async () => {
      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Tournament',
          sport: 'football',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          venue: 'New Venue',
          maxTeams: 16,
          registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'New Tournament');
      expect(res.body.data).toHaveProperty('sport', 'football');
    });

    test('should not create tournament when user is not organizer', async () => {
      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Tournament',
          sport: 'football',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          venue: 'New Venue',
          maxTeams: 16,
          registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/tournaments', () => {
    test('should get all tournaments', async () => {
      const res = await request(app)
        .get('/api/tournaments');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    test('should filter tournaments by sport', async () => {
      // Create another tournament with different sport
      await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Football Tournament',
          sport: 'football',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          venue: 'Football Venue',
          maxTeams: 16,
          registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });

      const res = await request(app)
        .get('/api/tournaments')
        .query({ sport: 'cricket' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].sport).toBe('cricket');
    });
  });

  describe('POST /api/tournaments/:id/register', () => {
    test('should register team for tournament when user is team captain', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${tournamentId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamId: teamId
        });

      expect(res.status).toBe(200);
      expect(res.body.data.teams).toContain(teamId);
    });

    test('should not register team after registration deadline', async () => {
      // Create tournament with past registration deadline
      const pastTournamentRes = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Past Tournament',
          sport: 'cricket',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          venue: 'Test Venue',
          maxTeams: 8,
          registrationDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Past deadline
        });

      const pastTournamentId = pastTournamentRes.body.data._id;

      const res = await request(app)
        .post(`/api/tournaments/${pastTournamentId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamId: teamId
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/registration deadline/i);
    });
  });
}); 