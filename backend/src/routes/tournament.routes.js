const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  registerTeam,
  updateTeamStatus,
  searchTournaments
} = require('../controllers/tournament.controller');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/search', searchTournaments);

// Protected routes
router.use(protect);

// Tournament organizer and admin routes
router.post('/', authorize(['organizer', 'admin']), createTournament);
router.put('/:id', authorize(['organizer', 'admin']), updateTournament);
router.delete('/:id', authorize(['organizer', 'admin']), deleteTournament);
router.put('/:id/teams/:teamId', authorize(['organizer', 'admin']), updateTeamStatus);

// Team routes
router.post('/:id/register', authorize('captain'), registerTeam);

module.exports = router; 