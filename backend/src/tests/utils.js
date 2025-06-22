const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Team = require('../models/team.model');
const Tournament = require('../models/tournament.model');

// Generate test JWT token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

// Create test user
const createTestUser = async (role = 'player') => {
  const user = await User.create({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role
  });
  const token = generateToken(user);
  return { user, token };
};

// Create test team
const createTestTeam = async (captain) => {
  return await Team.create({
    name: `Test Team ${Date.now()}`,
    sport: 'football',
    captain: captain._id,
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    players: [{
      player: captain._id,
      role: 'captain'
    }]
  });
};

// Create test tournament
const createTestTournament = async (organizer) => {
  return await Tournament.create({
    name: `Test Tournament ${Date.now()}`,
    sport: 'football',
    organizer: organizer._id,
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 172800000), // Day after tomorrow
    registrationDeadline: new Date(Date.now() + 43200000), // 12 hours from now
    maxTeams: 8,
    minTeams: 4,
    teamSize: {
      min: 5,
      max: 11
    },
    venue: {
      name: 'Test Venue',
      address: 'Test Address',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    },
    prizeMoney: {
      first: 5000,
      second: 3000,
      third: 1000
    },
    status: 'published',
    description: 'Test tournament description',
    rules: 'Test tournament rules'
  });
};

module.exports = {
  generateToken,
  createTestUser,
  createTestTeam,
  createTestTournament
}; 