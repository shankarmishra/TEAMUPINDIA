const axios = require('axios');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const logger = require('../utils/logger');
const dbHandler = require('./setup');

let mongod;
let api;
let adminToken;
let userToken;
let coachToken;
let teamId;
let tournamentId;
let bookingId;
let coachId;
let userId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);

  api = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true
  });
  logger.info('Test server started on port 5000');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  logger.info('Test server and MongoDB Memory Server stopped');
});

beforeEach(async () => {
  await dbHandler.clearDatabase();
  logger.info('Cleared all collections in MongoDB Memory Server');
  
  // Setup test users before each test
  const adminRes = await api.post('/auth/register', {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    phone: '+1234567890',
    role: 'admin'
  });
  adminToken = adminRes.data.data.token;
  
  const coachRes = await api.post('/auth/register', {
    name: 'Test Coach',
    email: 'coach@example.com',
    password: 'Coach@123',
    phone: '+9876543210',
    role: 'coach'
  });
  coachToken = coachRes.data.data.token;
  coachId = coachRes.data.data._id;
  
  const userRes = await api.post('/auth/register', {
    name: 'Test User',
    email: 'user@example.com',
    password: 'User@123',
    phone: '+1122334455',
    role: 'user'
  });
  userToken = userRes.data.data.token;
  userId = userRes.data.data._id;
});

describe('Authentication APIs', () => {
  test('Login with valid credentials should return token', async () => {
    const loginRes = await api.post('/auth/login', {
      email: 'coach@example.com',
      password: 'Coach@123'
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.data.data.token).toBeTruthy();
  });

  test('Login with invalid credentials should fail', async () => {
    const loginRes = await api.post('/auth/login', {
      email: 'coach@example.com',
      password: 'wrongpassword'
    });
    expect(loginRes.status).toBe(401);
  });
});

describe('Coach APIs', () => {
  beforeEach(async () => {
    // Create coach profile before each test in this block
    const res = await api.post('/coaches', {
      specializations: ['cricket', 'football'],
      experience: 5,
      hourlyRate: 1000,
      availability: [
        {
          day: 'monday',
          slots: [{ startTime: '09:00', endTime: '17:00' }]
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    coachId = res.data.data._id;
  });

  test('Get all coaches should be accessible without token', async () => {
    const res = await api.get('/coaches');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('Update coach profile should require coach token', async () => {
    // Try with user token (should fail)
    const userUpdateRes = await api.put(`/coaches/${coachId}`, {
      hourlyRate: 1200
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    expect(userUpdateRes.status).toBe(403);

    // Try with coach token (should succeed)
    const coachUpdateRes = await api.put(`/coaches/${coachId}`, {
      hourlyRate: 1200
    }, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    expect(coachUpdateRes.status).toBe(200);
    expect(coachUpdateRes.data.data.hourlyRate).toBe(1200);
  });
});

describe('Team APIs', () => {
  beforeEach(async () => {
    // Create team before each test in this block
    const res = await api.post('/teams', {
      name: 'Test Team',
      sport: 'cricket',
      maxPlayers: 11,
      description: 'Test team description'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    teamId = res.data.data._id;
  });

  test('Get all teams should be accessible without token', async () => {
    const res = await api.get('/teams');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('Add player to team should require team owner token', async () => {
    const res = await api.post(`/teams/${teamId}/players`, {
      userId: userId,
      role: 'batsman'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    expect(res.status).toBe(200);
    
    // Verify player was added
    const teamRes = await api.get(`/teams/${teamId}`);
    expect(teamRes.data.data.players).toContainEqual(expect.objectContaining({
      user: userId,
      role: 'batsman'
    }));
  });
});

describe('Tournament APIs', () => {
  beforeEach(async () => {
    // Create tournament before each test in this block
    const res = await api.post('/tournaments', {
      name: 'Test Tournament',
      sport: 'cricket',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      venue: 'Test Venue',
      maxTeams: 8
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    tournamentId = res.data.data._id;
  });

  test('Get all tournaments should be accessible without token', async () => {
    const res = await api.get('/tournaments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('Register team for tournament should require team owner token', async () => {
    const res = await api.post(`/tournaments/${tournamentId}/register`, {
      teamId: teamId
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    expect(res.status).toBe(200);
    
    // Verify team was registered
    const tournamentRes = await api.get(`/tournaments/${tournamentId}`);
    expect(tournamentRes.data.data.teams).toContainEqual(expect.objectContaining({
      team: teamId
    }));
  });
});

describe('Booking APIs', () => {
  test('Create booking should require user token', async () => {
    // Try without token (should fail)
    const noTokenRes = await api.post('/bookings', {
      coachId: coachId,
      sport: 'cricket',
      date: new Date('2025-06-24').toISOString(),
      slot: '09:00-10:00'
    });
    expect(noTokenRes.status).toBe(401);

    // Try with valid user token (should succeed)
    const res = await api.post('/bookings', {
      coachId: coachId,
      sport: 'cricket',
      date: new Date('2025-06-24').toISOString(),
      slot: '09:00-10:00'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    expect(res.status).toBe(201);
    bookingId = res.data.data._id;
  });
}); 