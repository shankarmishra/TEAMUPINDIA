const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addPlayer,
  removePlayer,
  updatePlayerRole
} = require('../controllers/team.controller');

// Public routes
router.get('/', getTeams);
router.get('/:id', getTeam);

// Protected routes
router.use(protect);

// Team routes
router.post('/', authorize(['player', 'organizer', 'admin']), createTeam);
router.put('/:id', authorize(['player', 'organizer', 'admin']), updateTeam);
router.delete('/:id', authorize(['player', 'organizer', 'admin']), deleteTeam);

// Player management routes
router.post('/:id/players', authorize(['player', 'organizer', 'admin']), addPlayer);
router.delete('/:id/players/:playerId', authorize(['player', 'organizer', 'admin']), removePlayer);
router.put('/:id/players/:playerId', authorize(['player', 'organizer', 'admin']), updatePlayerRole);

module.exports = router; 